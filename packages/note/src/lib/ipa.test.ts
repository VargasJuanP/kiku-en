import { describe, expect, it } from "vitest";
import { orderForDisplay, parseIpa } from "./ipa";

const transcriptions = (html: string) => parseIpa(html).map((v) => v.transcription);

describe("parseIpa", () => {
  it("returns nothing for an empty field", () => {
    expect(parseIpa("")).toEqual([]);
    expect(parseIpa("  ")).toEqual([]);
  });

  it("keeps phonemic and phonetic delimiters, and adds slashes to bare transcriptions", () => {
    expect(transcriptions("/ˈwɔːtə/")).toEqual(["/ˈwɔːtə/"]);
    expect(transcriptions("[ˈwɑːɾɚ]")).toEqual(["[ˈwɑːɾɚ]"]);
    expect(transcriptions("ˈwɔːtə")).toEqual(["/ˈwɔːtə/"]);
  });

  it("splits variants on commas, semicolons and line breaks, but not inside transcriptions", () => {
    expect(transcriptions("/ˈwɔːtə/, /ˈwɑːtər/")).toEqual(["/ˈwɔːtə/", "/ˈwɑːtər/"]);
    expect(transcriptions("/ˈwɔːtə/; [ˈwɑːɾɚ]")).toEqual(["/ˈwɔːtə/", "[ˈwɑːɾɚ]"]);
    expect(transcriptions("/ˈwɔːtə/<br>/ˈwɑːtər/")).toEqual(["/ˈwɔːtə/", "/ˈwɑːtər/"]);
    expect(transcriptions("<div>/ˈwɔːtə/</div><div>/ˈwɑːtər/</div>")).toEqual([
      "/ˈwɔːtə/",
      "/ˈwɑːtər/",
    ]);
    expect(transcriptions("/a, b/")).toEqual(["/a, b/"]);
  });

  it("takes one variant per list item", () => {
    expect(transcriptions("<ul><li>/ˈwɔːtə/</li><li>/ˈwɑːtər/</li></ul>")).toEqual([
      "/ˈwɔːtə/",
      "/ˈwɑːtər/",
    ]);
  });

  it("reads accent labels written before or after the transcription", () => {
    expect(parseIpa("UK: /ˈwɔːtə/, US: /ˈwɑːtər/")).toEqual([
      { transcription: "/ˈwɔːtə/", label: "UK" },
      { transcription: "/ˈwɑːtər/", label: "US" },
    ]);
    expect(parseIpa("/ˈwɔːtə/ (UK)")).toEqual([{ transcription: "/ˈwɔːtə/", label: "UK" }]);
  });

  it("reads Yomitan's {phonetic-transcriptions} markup, where labels come first", () => {
    const yomitan =
      '<ul><li class="pronunciation" data-pronunciation-type="phonetic-transcription">' +
      '<i>(<span class="tag" data-details="UK">UK</span>, <span class="tag" data-details="RP">RP</span>)</i> /ˈwɔːtə/</li>' +
      '<li class="pronunciation" data-pronunciation-type="phonetic-transcription">' +
      '<i>(<span class="tag" data-details="US">US</span>)</i> [ˈwɑɾɚ]</li>' +
      '<li class="pronunciation" data-pronunciation-type="phonetic-transcription">/ˈwɔtər/</li></ul>';
    expect(parseIpa(yomitan)).toEqual([
      { transcription: "/ˈwɔːtə/", label: "UK, RP" },
      { transcription: "[ˈwɑɾɚ]", label: "US" },
      { transcription: "/ˈwɔtər/", label: "" },
    ]);
  });

  it("treats parentheses inside a transcription as optional sounds, not labels", () => {
    expect(parseIpa("/ˈɡɑː(r)dn/")).toEqual([{ transcription: "/ˈɡɑː(r)dn/", label: "" }]);
  });

  it("drops duplicate variants", () => {
    expect(transcriptions("/ˈwɔːtə/, /ˈwɔːtə/")).toEqual(["/ˈwɔːtə/"]);
  });

  it("drops repeated labels", () => {
    // As Wiktionary data produces for "water"
    expect(
      parseIpa("<ul><li>(Baltimore, Philadelphia) [ˈwʊ.ɾɚ] (Philadelphia, Baltimore)</li></ul>"),
    ).toEqual([{ transcription: "[ˈwʊ.ɾɚ]", label: "Baltimore, Philadelphia" }]);
  });

  it("writes flag labels as text", () => {
    const england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
    expect(
      parseIpa(
        `<ul><li>(🇺🇸) /ber/</li><li>(🇬🇧) /beə(r)/</li><li>(${england}, General-American) /bɛə/</li></ul>`,
      ).map((v) => v.label),
    ).toEqual(["US", "UK", "England, General American"]);
  });

  it("merges a transcription repeated for the next accent", () => {
    // As Oxford's IPA dictionary gives "read"
    expect(
      parseIpa("<ul><li>(🇺🇸) /riːd/</li><li>(🇬🇧) /riːd/</li><li>(🇦🇺) /ɹiːd/</li></ul>"),
    ).toEqual([
      { transcription: "/riːd/", label: "US, UK" },
      { transcription: "/ɹiːd/", label: "AU" },
    ]);
  });
});

describe("orderForDisplay", () => {
  const variant = (transcription: string) => ({ transcription, label: "" });

  it("puts phonemic /…/ transcriptions before phonetic […] ones, keeping dictionary order", () => {
    const ordered = orderForDisplay([
      variant("/ˈwɔ.tɚ/"),
      variant("[ˈwɔ.ɾɚ]"),
      variant("/ˈwɑ.tɚ/"),
      variant("[ˈwɑ.ɾɚ]"),
    ]);
    expect(ordered.map((v) => v.transcription)).toEqual([
      "/ˈwɔ.tɚ/",
      "/ˈwɑ.tɚ/",
      "[ˈwɔ.ɾɚ]",
      "[ˈwɑ.ɾɚ]",
    ]);
  });
});
