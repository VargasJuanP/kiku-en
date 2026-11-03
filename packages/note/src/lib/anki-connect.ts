import {
  generateCssVars,
  generateCssVarsDark,
  getCssVar,
  getCssVarDark,
  type KikuConfig,
} from "#/src/lib/config";
import { constants } from "#/src/lib/contants";

export const base64 = {
  decode: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  encode: (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))),
  decodeToString: (s: string) => new TextDecoder().decode(base64.decode(s)),
  encodeString: (s: string) => base64.encode(new TextEncoder().encode(s).buffer),
};

export const AnkiConnect = {
  address: "",
  changeAddress: (address: string) => {
    AnkiConnect.address = address;
  },

  invoke: async (action: string, params: Record<string, unknown> = {}) => {
    const res = await fetch(AnkiConnect.address, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });

    const result = await res.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  },

  getVersion: async () => {
    return await AnkiConnect.invoke("version");
  },

  saveConfig: async (config: KikuConfig) => {
    await AnkiConnect.invoke("storeMediaFile", {
      filename: constants.assets["_kikuen_config.json"],
      data: base64.encodeString(JSON.stringify(config)),
    });

    const [frontRes, backRes, styleRes] = await Promise.all([
      fetch(constants.assets["_kikuen_front.html"], { cache: "no-store" }),
      fetch(constants.assets["_kikuen_back.html"], { cache: "no-store" }),
      fetch(constants.assets["_kikuen_style.css"], { cache: "no-store" }),
    ]);

    if (!frontRes.ok || !backRes.ok || !styleRes.ok) {
      throw new Error(
        `Failed to load template files: ${[
          !frontRes.ok && constants.assets["_kikuen_front.html"],
          !backRes.ok && constants.assets["_kikuen_back.html"],
          !styleRes.ok && constants.assets["_kikuen_style.css"],
        ]
          .filter(Boolean)
          .join(", ")}`,
      );
    }

    const [frontSrc, backSrc, styleSrc] = await Promise.all([
      frontRes.text(),
      backRes.text(),
      styleRes.text(),
    ]);

    const frontTemplate = frontSrc
      .replaceAll("__DATA_THEME__", config.theme)
      .replaceAll("__DATA_THEME_DARK__", config.themeDark)
      .replace("__DATA_BLUR_NSFW__", config.blurNsfw.toString())
      .replace("__DATA_PICTURE_ON_FRONT__", config.pictureOnFront.toString())
      .replace("__DATA_MOD_VERTICAL__", config.modVertical.toString());
    const backTemplate = backSrc
      .replaceAll("__DATA_THEME__", config.theme)
      .replaceAll("__DATA_THEME_DARK__", config.themeDark)
      .replace("__DATA_BLUR_NSFW__", config.blurNsfw.toString())
      .replace("__DATA_PICTURE_ON_FRONT__", config.pictureOnFront.toString())
      .replace("__DATA_MOD_VERTICAL__", config.modVertical.toString());
    const cssVar = getCssVar(config);
    const cssVarDark = getCssVarDark(config);
    const cssVarTemplate = generateCssVars(cssVar);
    const cssVarDarkTemplate = generateCssVarsDark(cssVarDark);
    const styleTemplate = styleSrc
      .replace("/* __CSS_VARIABLE__ */", cssVarTemplate)
      .replace("/* __CSS_VARIABLE_DARK__ */", cssVarDarkTemplate);

    await AnkiConnect.invoke("updateModelTemplates", {
      model: {
        name: constants.NOTE_TYPE,
        templates: {
          [constants.CARD_TYPE]: {
            Front: frontTemplate,
            Back: backTemplate,
          },
        },
      },
    });

    await AnkiConnect.invoke("updateModelStyling", {
      model: {
        name: constants.NOTE_TYPE,
        css: styleTemplate,
      },
    });
  },

  getKikuFiles: async () => {
    const res = (await AnkiConnect.invoke("getMediaFilesNames", {
      pattern: "_kikuen*",
    })) as { result: string[] };
    const sorted = res.result
      .filter((v) => !v.startsWith("_kikuen-plugin"))
      .sort((a: string, b: string) => {
        // Extract the last extension (e.g. "json", "js", "gz")
        const extA = a.split(".").pop();
        const extB = b.split(".").pop();

        if (extA !== extB) {
          return (extA ?? "").localeCompare(extB ?? "");
        }

        // Compare alphabetically by full name
        return a.localeCompare(b);
      });
    return sorted as string[];
  },
};

export type AnkiConnectClient = typeof AnkiConnect;
