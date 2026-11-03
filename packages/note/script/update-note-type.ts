import { readFile } from "node:fs/promises";
import {
  generateCssVars,
  generateCssVarsDark,
  getCssVar,
  getCssVarDark,
} from "#/src/lib/config.js";
import { defaultConfig } from "#/src/lib/default-config.js";
import { noteFieldNames } from "#/src/lib/types.js";
import { paths } from "#/tools/paths.ts";
import { AnkiConnect, log } from "#/tools/util.js";

/**
 * Creates the "Kiku EN" note type, or updates its templates and styling.
 * Fields of an existing note type are never changed, since that could lose data.
 */
class Script {
  NOTE_TYPE = "Kiku EN";
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
    return {
      front: this.applyDataAttributes(front),
      back: this.applyDataAttributes(back),
      style: this.buildStyleTemplate(style),
    };
  }

  applyDataAttributes(template: string) {
    return template
      .replaceAll("__DATA_THEME__", defaultConfig.theme)
      .replaceAll("__DATA_THEME_DARK__", defaultConfig.themeDark)
      .replace("__DATA_BLUR_NSFW__", defaultConfig.blurNsfw.toString())
      .replace("__DATA_PICTURE_ON_FRONT__", defaultConfig.pictureOnFront.toString());
  }

  buildStyleTemplate(styleSrc: string) {
    const cssVars = generateCssVars(getCssVar(defaultConfig));
    const cssVarsDark = generateCssVarsDark(getCssVarDark(defaultConfig));
    return styleSrc
      .replace("/* __CSS_VARIABLE__ */", cssVars)
      .replace("/* __CSS_VARIABLE_DARK__ */", cssVarsDark);
  }

  async noteTypeExists() {
    const { result } = await AnkiConnect.call("modelNames");
    return (result as string[]).includes(this.NOTE_TYPE);
  }

  async createNoteType(templates: { front: string; back: string; style: string }) {
    await AnkiConnect.call("createModel", {
      modelName: this.NOTE_TYPE,
      inOrderFields: noteFieldNames,
      css: templates.style,
      isCloze: false,
      cardTemplates: [{ Name: this.CARD_TYPE, Front: templates.front, Back: templates.back }],
    });
    console.log(`✅ Created note type "${this.NOTE_TYPE}" with ${noteFieldNames.length} fields`);
  }

  async updateNoteType(templates: { front: string; back: string; style: string }) {
    await AnkiConnect.call("updateModelTemplates", {
      model: {
        name: this.NOTE_TYPE,
        templates: { [this.CARD_TYPE]: { Front: templates.front, Back: templates.back } },
      },
    });
    await AnkiConnect.call("updateModelStyling", {
      model: { name: this.NOTE_TYPE, css: templates.style },
    });
    console.log(`✅ Updated "${this.NOTE_TYPE}" templates and styling`);

    const { result } = await AnkiConnect.call("modelFieldNames", { modelName: this.NOTE_TYPE });
    const missing = noteFieldNames.filter((field) => !(result as string[]).includes(field));
    if (missing.length > 0) {
      log.yellow(
        `⚠️  "${this.NOTE_TYPE}" is missing fields the templates use: ${missing.join(", ")}. ` +
          "Add them in Anki (Tools → Manage Note Types → Fields).",
      );
    }
  }

  async run() {
    const templates = await this.readTemplates();
    if (await this.noteTypeExists()) {
      await this.updateNoteType(templates);
    } else {
      await this.createNoteType(templates);
    }
  }
}

const script = new Script();
script.run().catch((err) => {
  console.error("❌ Failed to install note type (is Anki open, with AnkiConnect installed?):", err);
  process.exit(1);
});
