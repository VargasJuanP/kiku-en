import { describe, expect, it } from "vitest";
import { parseHtml } from "./dom";
import { decorateGlossary, dictionaryLabel, glossaryContains, splitByDictionary } from "./glossary";

// Shaped like Yomitan's {glossary} with the dictionaries recommended for Kiku EN
const glossary =
  '<div style="text-align: left;" class="yomitan-glossary"><ol>' +
  '<li data-dictionary="seth-oald-extra"><i>(3K, verb, seth-oald-extra)</i> <ul><li><span>to look at and understand written words' +
  '<ul data-sc-custom-attr="examples"><li>She is learning to read.</li><li>Can you read music?</li><li>I can\'t read your writing.</li><li>Read the map.</li></ul></span></li></ul></li>' +
  '<li data-dictionary="wty-en-es-gloss"><i>(v, wty-en-es-gloss)</i> <span><div><div data-sc-content="sense-label">to interpret</div><ul data-sc-content="glossary"><li>leer</li></ul></div></span></li>' +
  '<li data-dictionary="seth-oald-extra"><i>(noun, seth-oald-extra)</i> <ul><li><span>an act of reading</span></li></ul></li>' +
  "</ol></div>";

const text = (html: string) => parseHtml(html).body.textContent ?? "";

describe("splitByDictionary", () => {
  it("groups entries by dictionary, in order of first appearance", () => {
    const pages = splitByDictionary(glossary);
    expect(pages.map((page) => page.dictionary)).toEqual(["seth-oald-extra", "wty-en-es-gloss"]);
    expect(text(pages[0].html)).toContain("an act of reading");
    expect(text(pages[0].html)).not.toContain("leer");
    expect(text(pages[1].html)).toContain("leer");
  });

  it("keeps each page in Yomitan's markup, with the glossary's styles", () => {
    const [page] = splitByDictionary(`<style>.x{}</style>${glossary}`);
    const doc = parseHtml(page.html);
    expect(doc.querySelector(".yomitan-glossary > ol > style")).not.toBeNull();
    expect(doc.querySelectorAll(".yomitan-glossary > ol > li[data-dictionary]")).toHaveLength(2);
  });

  it("names pages by the dictionary's alias in Yomitan, or a known name", () => {
    expect(splitByDictionary(glossary).map((page) => page.label)).toEqual([
      "Oxford Learner's",
      "Wiktionary EN → ES",
    ]);
    const aliased = glossary.replaceAll("seth-oald-extra)</i>", "Oxford)</i>");
    expect(splitByDictionary(aliased)[0]).toMatchObject({
      dictionary: "seth-oald-extra",
      label: "Oxford",
    });
  });

  it("returns nothing for fields not in Yomitan's format", () => {
    expect(splitByDictionary("<b>a definition</b>")).toEqual([]);
  });
});

describe("decorateGlossary", () => {
  const tags = (html: string) =>
    Array.from(parseHtml(html).querySelectorAll(".definition-tag"), (tag) => tag.textContent);

  it("turns the tag line into chips, spelling out abbreviations", () => {
    const html = decorateGlossary(glossary, { showDictionary: false });
    expect(tags(html)).toEqual(["Oxford 3000", "verb", "verb", "noun"]);
    expect(parseHtml(html).querySelector("li[data-dictionary] > i")).toBeNull();
  });

  it("names the dictionary when asked to", () => {
    const html = decorateGlossary(glossary, { showDictionary: true });
    expect(tags(html)).toContain("Oxford Learner's");
    expect(tags(html)).toContain("Wiktionary EN → ES");
  });

  it("drops the dictionary's alias from the tags", () => {
    const aliased = glossary.replaceAll("seth-oald-extra)</i>", "Oxford)</i>");
    expect(tags(decorateGlossary(aliased, { showDictionary: false }))).toEqual([
      "Oxford 3000",
      "verb",
      "verb",
      "noun",
    ]);
    expect(tags(decorateGlossary(aliased, { showDictionary: true }))).toContain("Oxford");
  });

  it("reads {glossary-first}, where the dictionary is the last tag", () => {
    const main =
      '<div class="yomitan-glossary"><i>(5K, adjective, seth-oald-extra)</i> <ul><li>done completely</li></ul></div>';
    expect(tags(decorateGlossary(main, { showDictionary: false }))).toEqual([
      "Oxford 5000",
      "adjective",
    ]);
  });

  it("leaves italics inside definitions alone", () => {
    const html = '<div class="yomitan-glossary"><ul><li>see <i>(rare)</i> usage</li></ul></div>';
    expect(decorateGlossary(html, { showDictionary: false })).toContain("<i>(rare)</i>");
  });

  it("moves Oxford's idioms out of the last sense, to the end of the entry", () => {
    const html =
      '<div class="yomitan-glossary"><ol><li data-dictionary="seth-oald-extra"><i>(verb, seth-oald-extra)</i> <ul>' +
      "<li><span>to carry</span></li>" +
      '<li><span>to turn<div data-sc-custom-attr="idiom-box"><div data-sc-custom-attr="idiom-header">Idioms</div>' +
      '<div data-sc-custom-attr="idiom-text">bear fruit</div></div></span></li>' +
      "</ul></li></ol></div>";
    const doc = parseHtml(decorateGlossary(html, { showDictionary: false }));
    const idioms = doc.querySelector('[data-sc-custom-attr="idiom-box"]');
    expect(idioms?.closest("li ul > li")).toBeNull();
    expect(idioms?.parentElement?.matches("li[data-dictionary]")).toBe(true);
    expect(idioms?.previousElementSibling?.tagName).toBe("UL");
  });

  it("folds translations after the first four", () => {
    const words = ["renuente", "reacio", "reluctante", "reticente", "renitente", "rezongón"];
    const html =
      '<div class="yomitan-glossary"><ol><li data-dictionary="wty-en-es-gloss"><i>(adj, wty-en-es-gloss)</i> <span><div>' +
      '<div data-sc-content="sense-label">not wanting to take some action</div>' +
      `<ul data-sc-content="glossary">${words.map((w) => `<li>${w}</li>`).join("")}</ul>` +
      "</div></span></li></ol></div>";
    const doc = parseHtml(decorateGlossary(html, { showDictionary: false }));
    const [visible, rest] = doc.querySelectorAll('ul[data-sc-content="glossary"]');
    expect(Array.from(visible.children, (li) => li.textContent)).toEqual(words.slice(0, 4));
    expect(
      rest.closest(".definition-more-translations")?.querySelector("summary")?.textContent,
    ).toBe("+2");
    expect(rest.children).toHaveLength(2);
  });

  it("folds examples after the first two", () => {
    const doc = parseHtml(decorateGlossary(glossary, { showDictionary: false }));
    const [visible] = doc.querySelectorAll('ul[data-sc-custom-attr="examples"]');
    expect(visible.children).toHaveLength(2);
    const more = doc.querySelector(".definition-more-examples");
    expect(more?.querySelector("summary")?.textContent).toBe("+2 examples");
    expect(more?.querySelectorAll("li")).toHaveLength(2);
  });
});

describe("glossaryContains", () => {
  it("finds a main definition mined from the same lookup", () => {
    const main =
      '<div class="yomitan-glossary"><i>(noun, seth-oald-extra)</i> <ul><li><span>an act of reading</span></li></ul></div>';
    expect(glossaryContains(glossary, main)).toBe(true);
    expect(glossaryContains(glossary, "my own definition")).toBe(false);
    expect(glossaryContains(glossary, "")).toBe(false);
  });
});

describe("dictionaryLabel", () => {
  it("names known dictionaries and passes others through", () => {
    expect(dictionaryLabel("wty-en-en")).toBe("Wiktionary");
    expect(dictionaryLabel("My Dictionary")).toBe("My Dictionary");
  });
});
