import { parseHtml } from "./dom";

/** One dictionary's share of a Yomitan glossary. */
export type DictionaryGlossary = { dictionary: string; html: string };

/** Examples shown before the rest fold into a "+N examples" toggle. */
const VISIBLE_EXAMPLES = 2;

/** Readable names for dictionaries commonly used for English. */
const DICTIONARY_LABELS: Record<string, string> = {
  "seth-oald-extra": "Oxford Learner's",
  "wty-en-en": "Wiktionary",
  "wty-en-es-gloss": "Wiktionary EN → ES",
};

/** Wiktionary-style tag abbreviations, spelled out. */
const TAG_LABELS: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  pron: "pronoun",
  conj: "conjunction",
  det: "determiner",
  intj: "interjection",
  num: "numeral",
  vt: "transitive",
  vi: "intransitive",
  arch: "archaic",
  obs: "obsolete",
  uncount: "uncountable",
  "not-comp": "not comparable",
  abbv: "abbreviation",
  col: "colloquial",
  regio: "regional",
};

const PARTS_OF_SPEECH = new Set([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "determiner",
  "determiner-pronoun",
  "interjection",
  "numeral",
  "phrasal",
  "name",
]);

export function dictionaryLabel(dictionary: string) {
  return DICTIONARY_LABELS[dictionary] ?? dictionary;
}

/**
 * Groups the entries of Yomitan's {glossary} by dictionary, in the order they
 * appear. Returns nothing when the field isn't in Yomitan's format.
 */
export function splitByDictionary(html: string): DictionaryGlossary[] {
  const doc = parseHtml(html);
  const styles = Array.from(doc.querySelectorAll("style"), (style) => style.outerHTML).join("");
  const groups = new Map<string, string>();
  for (const entry of doc.querySelectorAll("li[data-dictionary]")) {
    if (entry.parentElement?.closest("li[data-dictionary]")) continue;
    const dictionary = entry.getAttribute("data-dictionary") || "Glossary";
    groups.set(dictionary, (groups.get(dictionary) ?? "") + entry.outerHTML);
  }
  return Array.from(groups, ([dictionary, entries]) => ({
    dictionary,
    html: `<div style="text-align: left;" class="yomitan-glossary"><ol>${styles}${entries}</ol></div>`,
  }));
}

/**
 * Restyles Yomitan definitions: the "(verb, 3K, dictionary)" line becomes tag
 * chips, and long example lists fold after the first few.
 */
export function decorateGlossary(html: string, options: { showDictionary: boolean }): string {
  const doc = parseHtml(html);

  for (const tagLine of doc.querySelectorAll("i")) {
    const entry = tagLine.parentElement;
    const isEntry = entry?.matches("li[data-dictionary], .yomitan-glossary");
    if (!entry || !isEntry || !isFirstContent(tagLine)) continue;
    const match = /^\((.*)\)$/.exec(tagLine.textContent?.trim() ?? "");
    if (!match) continue;

    const tags = match[1].split(/\s*,\s*/).filter(Boolean);
    // {glossary-first} has no data-dictionary; the dictionary is the last tag there.
    const dictionary = entry.getAttribute("data-dictionary") ?? tags.at(-1);
    const chips = doc.createElement("span");
    chips.className = "definition-tags";
    for (const tag of tags) {
      if (tag === dictionary) continue;
      chips.append(tagChip(doc, tag));
    }
    if (options.showDictionary && dictionary) {
      chips.append(chip(doc, dictionaryLabel(dictionary), "definition-tag-dictionary"));
    }
    tagLine.replaceWith(chips);
  }

  for (const examples of doc.querySelectorAll('ul[data-sc-custom-attr="examples"]')) {
    const hidden = Array.from(examples.children).slice(VISIBLE_EXAMPLES);
    if (hidden.length === 0) continue;
    const more = doc.createElement("details");
    more.className = "definition-more-examples";
    const summary = doc.createElement("summary");
    summary.textContent = `+${hidden.length} example${hidden.length === 1 ? "" : "s"}`;
    const list = doc.createElement("ul");
    list.setAttribute("data-sc-custom-attr", "examples");
    list.append(...hidden);
    more.append(summary, list);
    examples.after(more);
  }

  return doc.body.innerHTML;
}

/** Whether every word of the main definition already appears in the glossary. */
export function glossaryContains(glossary: string, main: string) {
  const text = (html: string) =>
    (parseHtml(html).body.textContent ?? "").replace(/\s+/g, " ").trim();
  const mainText = text(main);
  return mainText.length > 0 && text(glossary).includes(mainText);
}

function isFirstContent(element: Element) {
  for (let node = element.previousSibling; node; node = node.previousSibling) {
    if (node.nodeName !== "STYLE" && node.textContent?.trim()) return false;
  }
  return true;
}

function tagChip(doc: Document, tag: string) {
  const label = TAG_LABELS[tag] ?? tag.replace(/-/g, " ");
  if (PARTS_OF_SPEECH.has(TAG_LABELS[tag] ?? tag)) return chip(doc, label, "definition-tag-pos");
  // Oxford 3000 / 5000: the core vocabulary lists
  const oxford = /^(\d)K$/.exec(tag);
  if (oxford) return chip(doc, `Oxford ${oxford[1]}000`, "definition-tag-level");
  return chip(doc, label);
}

function chip(doc: Document, text: string, variant?: string) {
  const element = doc.createElement("span");
  element.className = variant ? `definition-tag ${variant}` : "definition-tag";
  element.textContent = text;
  return element;
}
