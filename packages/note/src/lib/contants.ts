const VERSION: string =
  // @ts-expect-error: injected by vite
  typeof __VERSION__ !== "undefined" ? __VERSION__ : "unknown";

const COMMIT_SHA: string =
  // @ts-expect-error: injected by vite
  typeof __COMMIT_SHA__ !== "undefined" ? __COMMIT_SHA__ : "unknown";

const assets = {
  "_kikuen_config.json": "_kikuen_config.json",
  "_kikuen_front.html": "_kikuen_front.html",
  "_kikuen_back.html": "_kikuen_back.html",
  "_kikuen_style.css": "_kikuen_style.css",
  "_kikuen_notes_manifest.json": "_kikuen_notes_manifest.json",
  "_kikuen_plugin.js": "_kikuen_plugin.js",

  "_kikuen.js": "_kikuen.js",
  "_kikuen_libs.js": "_kikuen_libs.js",
  "_kikuen_shared.js": "_kikuen_shared.js",
  "_kikuen_lazy.js": "_kikuen_lazy.js",
  "_kikuen_worker.js": "_kikuen_worker.js",
  "_kikuen_plugin.css": "_kikuen_plugin.css",
  "_kikuen.css": "_kikuen.css",
};

export const constants = {
  VERSION: VERSION,
  COMMIT_SHA: COMMIT_SHA,
  NOTE_TYPE: "Kiku EN",
  CARD_TYPE: "Mining",
  key: {
    "kikuen-config": "kikuen-config",
    "kikuen-latest-version": "kikuen-latest-version",
    "kikuen-latest-version-checked": "kikuen-latest-version-checked",
  },
  assets,
  IMPORTANT_FILES: [
    assets["_kikuen.js"],
    assets["_kikuen_libs.js"],
    assets["_kikuen_shared.js"],
    assets["_kikuen_lazy.js"],
    assets["_kikuen_worker.js"],
    assets["_kikuen_plugin.js"],
    assets["_kikuen_plugin.css"],

    assets["_kikuen_front.html"],
    assets["_kikuen_back.html"],
    assets["_kikuen_style.css"],
    assets["_kikuen.css"],

    assets["_kikuen_notes_manifest.json"],
  ],
};

export type Constants = typeof constants;
