import { parseHtml } from "./dom";
import { orderForDisplay, parseIpa } from "./ipa";

/**
 * Word families and homophones among the user's notes, for English.
 *
 * A word family is found by stripping common affixes: "unbearable" → "bear",
 * "happiness" → "happy". Two expressions are in the same family when they share
 * a root, so stripping only has to be good enough to meet in the middle, and
 * both words must be in the collection, which keeps false friends rare: "early"
 * only meets "ear" if the user has a card for "ear".
 */

const MIN_ROOT_LENGTH = 3;

// Longest first, so "-ability" is tried before "-ity"
const SUFFIXES = [
  "abilities",
  "ability",
  "ibility",
  "ations",
  "ation",
  "itions",
  "ition",
  "nesses",
  "ness",
  "ments",
  "ment",
  "ables",
  "able",
  "ibly",
  "ible",
  "ably",
  "lessly",
  "less",
  "fully",
  "ful",
  "ships",
  "ship",
  "hoods",
  "hood",
  "ingly",
  "ings",
  "ing",
  "ities",
  "ity",
  "ously",
  "ous",
  "ively",
  "ive",
  "izes",
  "ized",
  "ize",
  "ises",
  "ised",
  "ise",
  "isms",
  "ism",
  "ists",
  "ist",
  "ally",
  "ily",
  "ly",
  "ers",
  "er",
  "est",
  "ied",
  "ies",
  "ed",
  "es",
  "al",
  "en",
  "s",
  "y",
].sort((a, b) => b.length - a.length);

// Productive prefixes only: "in-"/"im-" would turn "income" into "come".
const PREFIXES = ["under", "over", "out", "non", "dis", "mis", "un", "re"];

/**
 * Words that don't carry a phrasal verb's meaning: "get over" is in the family
 * of "get", but not of "take over".
 */
const PARTICLES = new Set([
  "a",
  "about",
  "across",
  "after",
  "against",
  "along",
  "an",
  "and",
  "around",
  "as",
  "at",
  "away",
  "back",
  "by",
  "down",
  "for",
  "from",
  "in",
  "into",
  "it",
  "of",
  "off",
  "on",
  "one's",
  "onto",
  "or",
  "out",
  "over",
  "round",
  "sb",
  "somebody",
  "someone",
  "something",
  "sth",
  "the",
  "through",
  "to",
  "together",
  "up",
  "upon",
  "with",
  "without",
]);

/** The roots an expression may come from, the words themselves included. */
export function familyRoots(expression: string): Set<string> {
  const words = plainText(expression)
    .toLowerCase()
    .split(/[\s\-–—/]+/)
    .map((word) => word.replace(/^[^a-z]+|[^a-z']+$/g, ""))
    .filter(Boolean);
  const content = words.length > 1 ? words.filter((word) => !PARTICLES.has(word)) : words;

  const roots = new Set<string>();
  for (const word of content) {
    for (const root of stripAffixes(word)) roots.add(root);
  }
  return roots;
}

/** Whether two expressions are different members of the same word family. */
export function isWordFamily(a: string, b: string) {
  if (normalize(a) === normalize(b)) return false;
  const roots = familyRoots(a);
  for (const root of familyRoots(b)) if (roots.has(root)) return true;
  return false;
}

/**
 * The pronunciations a homophone must share: the ones shown on the card
 * (Oxford's US and UK when present). Compared without delimiters, stress,
 * syllable dots or tie bars, and with Wiktionary's "ɹ" as Oxford's "r", so
 * "[ˈɹɛd]" and "/red/" match.
 */
export function homophoneKeys(ipaHtml: string, count = 2): string[] {
  return orderForDisplay(parseIpa(ipaHtml))
    .slice(0, count)
    .map((variant) =>
      variant.transcription
        .replace(/[/[\].ˈˌ]/g, "")
        .replaceAll("͡", "") // tie bar, as in "d͡ʒ"
        .replace(/ɹ/g, "r")
        .replace(/ɡ/g, "g")
        .trim(),
    )
    .filter(Boolean);
}

/** Whether two words with different spellings are pronounced the same. */
export function areHomophones(
  a: { expression: string; ipa: string },
  b: { expression: string; ipa: string },
) {
  if (normalize(a.expression) === normalize(b.expression)) return false;
  const keys = new Set(homophoneKeys(a.ipa));
  return homophoneKeys(b.ipa).some((key) => keys.has(key));
}

/**
 * Text to search the collection with, for each root: the root without a final
 * "e" or "y", which spelling drops before suffixes ("make" → "making",
 * "happy" → "happiness").
 */
export function familySearchStems(expression: string): string[] {
  const stems = new Set<string>();
  for (const root of familyRoots(expression)) {
    const stem = root.length > MIN_ROOT_LENGTH ? root.replace(/[ey]$/, "") : root;
    stems.add(stem);
  }
  return [...stems];
}

/**
 * A regular expression that finds the expressions a word's family can be in:
 * one of its stems at the start of a word, or right after a prefix: "get"
 * finds "getaway", but not "together" or "budget".
 */
export function familySearchPattern(expression: string) {
  const stems = familySearchStems(expression).map(escapeRegex);
  if (stems.length === 0) return "";
  return `(?:^|[^a-z]|${PREFIXES.join("|")})(?:${stems.join("|")})`;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A regular expression that finds a homophone key in a raw ExpressionIPA
 * field, whatever its notation: stress marks and syllable dots may come
 * between sounds, and "r" may be written "ɹ".
 */
export function homophoneSearchPattern(key: string) {
  return Array.from(key, (char) => {
    if (char === "r") return "[rɹ]";
    if (char === "g") return "[gɡ]";
    return escapeRegex(char);
  }).join("[ˈˌ.]?");
}

function stripAffixes(word: string): Set<string> {
  const roots = new Set([word]);
  const queue = [word];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    const { stems, respelled } = strippedOnce(current);
    for (const stem of stems) {
      if (stem.length < MIN_ROOT_LENGTH || roots.has(stem)) continue;
      roots.add(stem);
      queue.push(stem);
    }
    // Respelled roots are words already; stripping them again goes astray
    // ("business" → "busy" → "bus").
    for (const root of respelled) roots.add(root);
  }
  return roots;
}

function strippedOnce(word: string) {
  const stems: string[] = [];
  const respelled: string[] = [];
  for (const prefix of PREFIXES) {
    // The rest must look like a word of its own: "reading" is not "re" + "ading"
    if (word.startsWith(prefix) && word.length - prefix.length >= 4) {
      stems.push(word.slice(prefix.length));
    }
  }
  for (const suffix of SUFFIXES) {
    if (!word.endsWith(suffix)) continue;
    const stem = word.slice(0, -suffix.length);
    if (stem.length < MIN_ROOT_LENGTH) continue;
    stems.push(stem);
    // Spelling changes before suffixes: "making" ← "make", "happiness" ← "happy",
    // "running" ← "run"
    if (/[^aeiou]$/.test(stem)) respelled.push(`${stem}e`);
    if (stem.endsWith("i")) respelled.push(`${stem.slice(0, -1)}y`);
    if (/([^aeiou])\1$/.test(stem)) respelled.push(stem.slice(0, -1));
  }
  return { stems, respelled };
}

function plainText(html: string) {
  return parseHtml(html).body.textContent ?? "";
}

function normalize(expression: string) {
  return plainText(expression).trim().toLowerCase();
}
