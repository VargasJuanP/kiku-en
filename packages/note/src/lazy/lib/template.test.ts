import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTemplatePreview } from "./template";

const __dirname = import.meta.dirname;

function getTemplateSnippet(html: string): string {
  const lines = html.split("\n");
  const start = lines.findIndex((l) => l.trim().startsWith("<kikuen-host-anki"));
  const end = lines.findIndex((l) => l.includes("<!-- Do not modify"));
  return lines.slice(start, end).join("\n");
}

describe("getTemplatePreview", () => {
  it("matches front.html for front side", async () => {
    const frontHtml = await readFile(join(__dirname, "../../../template/front.html"), "utf-8");
    expect(
      getTemplatePreview({
        side: "front",
        theme: "__DATA_THEME__",
        themeDark: "__DATA_THEME_DARK__",
        blurNsfw: "__DATA_BLUR_NSFW__",
        pictureOnFront: "__DATA_PICTURE_ON_FRONT__",
        modVertical: "__DATA_MOD_VERTICAL__",
      }),
    ).toBe(getTemplateSnippet(frontHtml));
  });

  it("matches back.html for back side", async () => {
    const backHtml = await readFile(join(__dirname, "../../../template/back.html"), "utf-8");
    expect(
      getTemplatePreview({
        side: "back",
        theme: "__DATA_THEME__",
        themeDark: "__DATA_THEME_DARK__",
        blurNsfw: "__DATA_BLUR_NSFW__",
        pictureOnFront: "__DATA_PICTURE_ON_FRONT__",
        modVertical: "__DATA_MOD_VERTICAL__",
      }),
    ).toBe(getTemplateSnippet(backHtml));
  });
});
