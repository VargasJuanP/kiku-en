export function isHtmlEffectivelyEmpty(html: string): boolean {
  if (!html || html.trim() === "") return true;
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove elements that never count as content
  doc.querySelectorAll("script, style, template").forEach((el) => {
    el.remove();
  });

  // Check for meaningful text
  const text = doc.body.textContent
    ?.replace(/\u00a0/g, "") // nbsp
    .trim();

  if (text && text.length > 0) return false;

  // Check for meaningful non-text content
  const meaningfulSelectors = ["img", "video", "audio", "svg", "iframe", "canvas"];

  return !meaningfulSelectors.some((sel) => doc.body.querySelector(sel));
}

export function removeBrInsideStyleTag(html: string): string {
  if (!html) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const styles = doc.querySelectorAll("style");

  for (const style of styles) {
    const normalizedContent = (style.textContent ?? "").replace(/<br\s*\/?>/gi, "\n");
    style.textContent = normalizedContent;
  }

  return doc.body.innerHTML;
}

export function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

export function nodesToString(nodes: Node[]) {
  return nodes
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).outerHTML;
      }
      return node.textContent ?? "";
    })
    .join("")
    .trim();
}

export function preloadImages(pictureHtml: string) {
  if (typeof DOMParser === "undefined" || !pictureHtml) return;
  const doc = new DOMParser().parseFromString(pictureHtml, "text/html");
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src) new Image().src = src;
  });
}

export function objectToCss(selector: string, styles: Record<string, string | number>) {
  const body = Object.entries(styles)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join("\n");

  return `${selector} {\n${body}\n}`;
}

function applySingleBold(html: string, boldText: string): string {
  const doc = parseHtml(html);

  // Each segment tracks a text node, its cumulative position in the full text,
  // and whether it's already inside a <b> tag.
  interface Segment {
    node: Text;
    start: number;
    isBolded: boolean;
  }

  const segments: Segment[] = [];
  let pos = 0;

  // Walk the DOM tree collecting text nodes. Skips <rt> elements so furigana
  // readings don't pollute the text we search against (e.g., <ruby>拘<rt>こだわ</rt></ruby>
  // contributes only "拘" to the text).
  function collectTextNodes(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) {
        segments.push({
          node: node as Text,
          start: pos,
          isBolded: !!node.parentElement?.closest("b"),
        });
        pos += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).tagName === "RT") return;
      for (const child of (node as Element).childNodes) {
        collectTextNodes(child);
      }
    }
  }
  collectTextNodes(doc.body);

  if (pos === 0) return html;

  // Concatenate all text node content for a single indexOf search.
  const fullText = segments.map((s) => s.node.textContent).join("");

  let searchFrom = 0;
  let foundSegStart = -1;
  let foundSegEnd = -1;
  let foundIdx = -1;
  let foundEndPos = -1;

  const segLen = (s: Segment) => s.node.textContent?.length ?? 0;

  // Find the first occurrence of boldText that isn't already bolded.
  // If the found range overlaps any segment with isBolded=true, skip it
  // and continue searching from after that match.
  while (searchFrom <= fullText.length - boldText.length) {
    const idx = fullText.indexOf(boldText, searchFrom);
    if (idx === -1) break;

    const endPos = idx + boldText.length;

    const segStartIdx = segments.findIndex((s) => s.start <= idx && idx < s.start + segLen(s));
    const segEndIdx = segments.findIndex((s) => s.start < endPos && endPos <= s.start + segLen(s));

    if (segStartIdx !== -1 && segEndIdx !== -1) {
      const anyBolded = segments.slice(segStartIdx, segEndIdx + 1).some((s) => s.isBolded);
      if (!anyBolded) {
        foundSegStart = segStartIdx;
        foundSegEnd = segEndIdx;
        foundIdx = idx;
        foundEndPos = endPos;
        break;
      }
    }

    searchFrom = endPos;
  }

  if (foundSegStart === -1) return html;

  try {
    const range = doc.createRange();
    const startNode = segments[foundSegStart].node;
    const endNode = segments[foundSegEnd].node;

    // If the matched text is entirely within a single <ruby> but doesn't cover
    // its full text content, bold only the matched portion inside the ruby.
    // Otherwise expand the range to cover the entire <ruby> (including <rt>
    // children) to keep furigana annotations inside the new <b> tag.
    const startRuby = startNode.parentElement?.closest?.("ruby");
    const endRuby = endNode.parentElement?.closest?.("ruby");

    const samePartialRuby =
      startRuby &&
      startRuby === endRuby &&
      !(
        foundIdx === segments[foundSegStart].start &&
        foundEndPos === segments[foundSegEnd].start + segLen(segments[foundSegEnd])
      );

    if (startRuby && !samePartialRuby) {
      range.setStartBefore(startRuby);
    } else {
      range.setStart(startNode, foundIdx - segments[foundSegStart].start);
    }
    if (endRuby && !samePartialRuby) {
      range.setEndAfter(endRuby);
    } else {
      range.setEnd(endNode, foundEndPos - segments[foundSegEnd].start);
    }

    // Remove the matched content from the DOM, wrap it in <b>, then insert it
    // back in the same position. If the range partially covers an element
    // (e.g., splitting a <ruby>), extractContents clones and splits the
    // element automatically.
    const fragment = range.extractContents();
    const b = doc.createElement("b");
    b.appendChild(fragment);
    range.insertNode(b);
  } catch {
    return html;
  }

  return doc.body.innerHTML;
}

export function applyBoldFormatting(
  sourceHtml: string | undefined | null,
  targetHtml: string | undefined | null,
): string {
  if (!sourceHtml || !targetHtml) return targetHtml ?? "";

  const sourceDoc = parseHtml(sourceHtml);
  const boldElements = sourceDoc.querySelectorAll("b");
  if (boldElements.length === 0) return targetHtml;

  let result = targetHtml;
  for (const bEl of boldElements) {
    const boldText = bEl.textContent;
    if (!boldText) continue;
    result = applySingleBold(result, boldText);
  }

  return result;
}
