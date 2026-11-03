import { describe, expect, it } from "vitest";
import { parseIpa } from "./ipa";

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

  it("treats parentheses inside a transcription as optional sounds, not labels", () => {
    expect(parseIpa("/ˈɡɑː(r)dn/")).toEqual([{ transcription: "/ˈɡɑː(r)dn/", label: "" }]);
  });

  it("drops duplicate variants", () => {
    expect(transcriptions("/ˈwɔːtə/, /ˈwɔːtə/")).toEqual(["/ˈwɔːtə/"]);
  });
});
