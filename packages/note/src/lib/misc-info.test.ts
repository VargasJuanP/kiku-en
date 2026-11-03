import { describe, expect, it } from "vitest";
import { isYomitanPageTitle } from "./misc-info";

describe("isYomitanPageTitle", () => {
  it("recognizes Yomitan's search page and settings preview", () => {
    expect(isYomitanPageTitle("Yomitan Popup Preview")).toBe(true);
    expect(isYomitanPageTitle("read - Yomitan Search")).toBe(true);
    expect(isYomitanPageTitle("Yomitan Search")).toBe(true);
  });

  it("keeps real sources", () => {
    expect(isYomitanPageTitle("The Old Man and the Sea")).toBe(false);
    expect(isYomitanPageTitle("Notes on Yomitan Search")).toBe(false);
    expect(isYomitanPageTitle("")).toBe(false);
  });
});
