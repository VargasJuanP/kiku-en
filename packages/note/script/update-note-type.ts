import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  generateCssVars,
  generateCssVarsDark,
  getCssVar,
  getCssVarDark,
} from "#/src/lib/config.js";
import { defaultConfig } from "#/src/lib/default-config.js";
import { paths } from "#/tools/paths.ts";
import { AnkiConnect, log } from "#/tools/util.js";

class Script {
  NOTE_TYPE = "Kiku";
  CARD_TYPE = "Mining";
  FRONT_PATH = paths["@/.anki-build/_kikuen_front.html"];
  BACK_PATH = paths["@/.anki-build/_kikuen_back.html"];
  STYLE_PATH = paths["@/.anki-build/_kikuen_style.css"];

  async readTemplates() {
    const [front, back, style] = await Promise.all([
      readFile(this.FRONT_PATH, "utf8"),
      readFile(this.BACK_PATH, "utf8"),
      readFile(this.STYLE_PATH, "utf8"),
    ]);

    return { front, back, style };
  }

  applyDataAttributes(template: string) {
    return template
      .replaceAll("__DATA_THEME__", defaultConfig.theme)
      .replaceAll("__DATA_THEME_DARK__", defaultConfig.themeDark)
      .replace("__DATA_BLUR_NSFW__", defaultConfig.blurNsfw.toString())
      .replace("__DATA_PICTURE_ON_FRONT__", defaultConfig.pictureOnFront.toString())
      .replace("__DATA_MOD_VERTICAL__", defaultConfig.modVertical.toString());
  }

  buildStyleTemplate(styleSrc: string) {
    const cssVars = generateCssVars(getCssVar(defaultConfig));
    const cssVarsDark = generateCssVarsDark(getCssVarDark(defaultConfig));
    return styleSrc
      .replace("/* __CSS_VARIABLE__ */", cssVars)
      .replace("/* __CSS_VARIABLE_DARK__ */", cssVarsDark);
  }

  async updateTemplates(frontSrc: string, backSrc: string) {
    const result = await AnkiConnect.call("updateModelTemplates", {
      model: {
        name: this.NOTE_TYPE,
        templates: {
          [this.CARD_TYPE]: {
            Front: frontSrc,
            Back: backSrc,
          },
        },
      },
    });

    log.gray(`updateModelTemplates: ${JSON.stringify(result)}`);
    console.log(
      `✅ Updated "${this.NOTE_TYPE}" Front/Back from ${basename(this.FRONT_PATH)} and ${basename(this.BACK_PATH)}`,
    );
  }

  async updateStyling(styleSrc: string) {
    const result = await AnkiConnect.call("updateModelStyling", {
      model: {
        name: this.NOTE_TYPE,
        css: styleSrc,
      },
    });

    log.gray(`updateModelStyling: ${JSON.stringify(result)}`);
    console.log(`✅ Updated "${this.NOTE_TYPE}" style from ${basename(this.STYLE_PATH)}`);
  }

  async run() {
    const { front, back, style } = await this.readTemplates();
    const frontTemplate = this.applyDataAttributes(front);
    const backTemplate = this.applyDataAttributes(back);
    const styleTemplate = this.buildStyleTemplate(style);
    await this.updateTemplates(frontTemplate, backTemplate);
    await this.updateStyling(styleTemplate);
  }
}

const script = new Script();
script.run().catch((err) => {
  console.error("❌ Failed to update note type:", err);
  process.exit(1);
});
