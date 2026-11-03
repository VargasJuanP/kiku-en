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
 * variant per item, as Yomitan's {phonetic-transcriptions} produces), line
 * breaks, or "," / ";" between variants, and accent labels written as
 * "(US) /…/", "/…/ (US)" or "US: /…/". Bare transcriptions are wrapped in slashes:
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
    // "(US) /riːd/", "(UK) /riːd/" → "(US, UK) /riːd/"
    const previous = variants.at(-1);
    if (previous?.transcription === variant.transcription) {
      previous.label = joinLabels([previous.label, variant.label]);
      continue;
    }
    variants.push(variant);
  }
  return variants;
}

function parseVariant(text: string): IpaVariant | undefined {
  let rest = text.replace(/\s+/g, " ").trim();
  const labels: string[] = [];

  // "(UK, RP) /ˈwɔːtə/", as Yomitan's {phonetic-transcriptions} writes it
  const leading = /^\(([^()/[\]]+)\)\s*/.exec(rest);
  if (leading) {
    labels.push(leading[1].trim());
    rest = rest.slice(leading[0].length);
  }
  // "UK: /ˈwɔːtə/"
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
    label: joinLabels(labels),
  };
}

/** Splits, normalizes and dedupes comma-separated labels. */
function joinLabels(labels: string[]) {
  const parts = labels.flatMap((label) => label.split(/\s*,\s*/)).map(normalizeLabel);
  return [...new Set(parts.filter(Boolean))].join(", ");
}

const SUBDIVISIONS: Record<string, string> = {
  gbeng: "England",
  gbsct: "Scotland",
  gbwls: "Wales",
  gbnir: "Northern Ireland",
};

/**
 * Flag emoji to text, since Windows doesn't draw flags: "🇺🇸" → "US",
 * "🇬🇧" → "UK", England's flag → "England". Also "General-American" → "General American".
 */
function normalizeLabel(label: string) {
  const text = label
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, (flag) =>
      String.fromCharCode(...Array.from(flag, (char) => (char.codePointAt(0) ?? 0) - 0x1f1e6 + 65)),
    )
    .replace(/\u{1F3F4}([\u{E0061}-\u{E007A}]+)\u{E007F}/gu, (_, tags: string) => {
      const code = String.fromCharCode(
        ...Array.from(tags, (char) => (char.codePointAt(0) ?? 0) - 0xe0000),
      );
      return SUBDIVISIONS[code] ?? code.toUpperCase();
    })
    .replace(/(?<=\p{L})-(?=\p{L})/gu, " ")
    .trim();
  return text === "GB" ? "UK" : text;
}

/**
 * Phonemic /…/ transcriptions first, then phonetic […] ones, each in the
 * dictionary's order. Phonemic transcriptions are what learner dictionaries
 * use; Wiktionary lists the main accents first.
 */
export function orderForDisplay(variants: IpaVariant[]): IpaVariant[] {
  const isPhonemic = (variant: IpaVariant) => variant.transcription.startsWith("/");
  return [...variants.filter(isPhonemic), ...variants.filter((variant) => !isPhonemic(variant))];
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
