import { parseHtml } from "./dom";

export type IpaVariant = {
  /** The transcription, delimited as phonemic /…/ or phonetic […]. */
  transcription: string;
  /** Accent or region the dictionary gave for this variant, e.g. "UK" or "US". */
  label: string;
};

/**
 * Splits the ExpressionIPA field into pronunciation variants.
 *
 * Dictionaries format IPA in many ways, so this accepts list markup (one
 * variant per item), line breaks, or "," / ";" between variants, and labels
 * written as "(US)" or "US:". Bare transcriptions are wrapped in slashes:
 * "ˈwɔːtə" → "/ˈwɔːtə/".
 */
export function parseIpa(html: string): IpaVariant[] {
  if (!html.trim()) return [];
  const doc = parseHtml(html);

  const items = Array.from(doc.querySelectorAll("li"));
  const texts =
    items.length > 0
      ? items.map((item) => item.textContent ?? "")
      : splitVariants(textWithLineBreaks(doc.body));

  const variants: IpaVariant[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    const variant = parseVariant(text);
    if (!variant) continue;
    const key = `${variant.label}\u0000${variant.transcription}`;
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push(variant);
  }
  return variants;
}

function parseVariant(text: string): IpaVariant | undefined {
  let rest = text.replace(/\s+/g, " ").trim();
  const labels: string[] = [];

  // "UK: /ˈwɔːtə/" or "US /ˈwɑːtər/"
  const prefix = /^([A-Za-z][A-Za-z .-]{0,24}?)\s*[:：]\s*/.exec(rest);
  if (prefix) {
    labels.push(prefix[1].trim());
    rest = rest.slice(prefix[0].length);
  }
  // "/ˈwɔːtə/ (UK)"; parentheses inside the transcription mark optional sounds, so only
  // parentheses outside the delimiters count as labels.
  rest = rest.replace(/\(([^()/[\]]+)\)(?=[^/[\]]*$)/g, (_, label: string) => {
    labels.push(label.trim());
    return "";
  });
  rest = rest.trim();
  if (!rest) return undefined;

  const delimited = /^\/.*\/$|^\[.*\]$/.test(rest);
  return {
    transcription: delimited ? rest : `/${rest.replace(/^\/|\/$/g, "")}/`,
    label: labels.join(", "),
  };
}

/** Splits on line breaks, ";" and ",", except inside /…/ or […] transcriptions. */
function splitVariants(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  let closing: string | undefined;
  for (const char of text) {
    if (closing) {
      if (char === closing) closing = undefined;
    } else if (char === "/") {
      closing = "/";
    } else if (char === "[") {
      closing = "]";
    } else if (char === "\n" || char === ";" || char === ",") {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Text content, with <br> and block boundaries turned into line breaks. */
function textWithLineBreaks(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const br of Array.from(clone.querySelectorAll("br"))) br.replaceWith("\n");
  for (const block of Array.from(clone.querySelectorAll("div, p"))) block.append("\n");
  return clone.textContent ?? "";
}
