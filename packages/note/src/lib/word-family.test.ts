import { describe, expect, it } from "vitest";
import {
  areHomophones,
  familyRoots,
  familySearchStems,
  homophoneKeys,
  homophoneSearchPattern,
  isWordFamily,
} from "./word-family";

describe("isWordFamily", () => {
  it.each([
    ["bear", "unbearable"],
    ["bearable", "unbearable"],
    ["happy", "happiness"],
    ["run", "running"],
    ["make", "making"],
    ["care", "carelessness"],
    ["read", "reader"],
    ["lead", "mislead"],
    ["universe", "university"],
    ["bear", "bear with"],
    ["get", "get over"],
    ["bear with sb", "unbearable"],
  ])("relates %s and %s", (a, b) => {
    expect(isWordFamily(a, b)).toBe(true);
    expect(isWordFamily(b, a)).toBe(true);
  });

  it.each([
    ["bear", "beard"],
    ["bus", "business"],
    ["get over", "take over"],
    ["come", "income"],
    ["read", "trading"],
    ["get", "together"],
  ])("keeps %s and %s apart", (a, b) => {
    expect(isWordFamily(a, b)).toBe(false);
  });

  it("doesn't relate a word to itself", () => {
    expect(isWordFamily("bear", "Bear")).toBe(false);
  });

  it("reads the word out of formatting", () => {
    expect(familyRoots("<b>unbearable</b>").has("bear")).toBe(true);
  });
});

describe("familySearchStems", () => {
  it("searches by the roots, without the final e or y that suffixes drop", () => {
    expect(familySearchStems("happy")).toContain("happ");
    expect(familySearchStems("make")).toEqual(["mak"]);
    expect(familySearchStems("bear with")).toEqual(["bear"]);
  });
});

describe("homophones", () => {
  // As Oxford's IPA dictionary gives them
  const bear = "<ul><li>(🇺🇸) /ber/</li><li>(🇬🇧) /beə(r)/</li></ul>";
  const bare = "<ul><li>(🇺🇸) /ber/</li><li>(🇬🇧) /beə(r)/</li></ul>";
  const beer = "<ul><li>(🇺🇸) /bɪr/</li><li>(🇬🇧) /bɪə(r)/</li></ul>";

  it("matches words pronounced the same", () => {
    expect(
      areHomophones({ expression: "bear", ipa: bear }, { expression: "bare", ipa: bare }),
    ).toBe(true);
    expect(
      areHomophones({ expression: "bear", ipa: bear }, { expression: "beer", ipa: beer }),
    ).toBe(false);
  });

  it("isn't fooled by notation", () => {
    expect(homophoneKeys("[ˈɹɛd]")).toEqual(homophoneKeys("/rɛd/"));
  });

  it("only compares the pronunciations shown on the card", () => {
    const many = "<ul><li>/a/</li><li>/b/</li><li>/c/</li></ul>";
    expect(homophoneKeys(many)).toEqual(["a", "b"]);
  });

  it("searches raw fields whatever their notation", () => {
    const pattern = new RegExp(homophoneSearchPattern(homophoneKeys("/red/")[0]));
    expect(pattern.test("<li>(US) [ˈɹɛd]</li>")).toBe(false); // ɛ is not e
    expect(pattern.test("<li>(US) /ˈred/</li>")).toBe(true);
    expect(pattern.test("<li>(US) /ɹed/</li>")).toBe(true);
    expect(new RegExp(homophoneSearchPattern("beə(r)")).test("/beə(r)/")).toBe(true);
  });

  it("ignores the same word", () => {
    expect(
      areHomophones({ expression: "bear", ipa: bear }, { expression: "bear", ipa: bear }),
    ).toBe(false);
  });
});
