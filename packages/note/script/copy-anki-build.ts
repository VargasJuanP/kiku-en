import { cp, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { paths } from "#/tools/paths.ts";
import { AnkiConnect } from "#/tools/util.js";

/**
 * Copies the built note files into Anki's media folder through AnkiConnect,
 * so it works with any profile and Anki registers the files.
 */
class Script {
  /** Rebuilt on every install. */
  BUILD_FILES = [
    "_kikuen_front.html",
    "_kikuen_back.html",
    "_kikuen_style.css",
    "_kikuen.css",
    "_kikuen.js",
    "_kikuen_lazy.js",
    "_kikuen_libs.js",
    "_kikuen_shared.js",
    "_kikuen_worker.js",
  ];
  /** Users customize these, so they are only added when missing. */
  PLUGIN_FILES = ["_kikuen_plugin.js", "_kikuen_plugin.css"];

  async copyAssetsFromDistToAnkiBuild() {
    const ASSETS = [
      [paths["@/dist/_kikuen.js"], paths["@/.anki-build/_kikuen.js"]],
      [paths["@/dist/_kikuen_lazy.js"], paths["@/.anki-build/_kikuen_lazy.js"]],
      [paths["@/dist/_kikuen_libs.js"], paths["@/.anki-build/_kikuen_libs.js"]],
      [paths["@/dist/_kikuen_shared.js"], paths["@/.anki-build/_kikuen_shared.js"]],
      [paths["@/dist/_kikuen_worker.js"], paths["@/.anki-build/_kikuen_worker.js"]],
      [paths["@/dist/_kikuen.css"], paths["@/.anki-build/_kikuen.css"]],
    ] as const;

    console.log("\n📁 Copying assets from dist to .anki-build...");
    for (const [src, dest] of ASSETS) {
      await cp(src, dest);
      console.log(`✅ Copied ${basename(src)} to .anki-build`);
    }
  }

  async storeMediaFile(file: string) {
    const path = resolve(join(paths["@/.anki-build/"], file));
    await stat(path);
    await AnkiConnect.call("storeMediaFile", { filename: file, path });
    console.log(`✅ Stored ${file}`);
  }

  async existingMediaFiles(pattern: string) {
    const { result } = await AnkiConnect.call("getMediaFilesNames", { pattern });
    return new Set(result as string[]);
  }

  async run() {
    await this.copyAssetsFromDistToAnkiBuild();

    console.log("\n📁 Storing note files in Anki's media folder...");
    for (const file of this.BUILD_FILES) await this.storeMediaFile(file);

    const existing = await this.existingMediaFiles("_kikuen_plugin.*");
    for (const file of this.PLUGIN_FILES) {
      if (existing.has(file)) {
        console.log(`⏭️  Kept your ${file}`);
      } else {
        await this.storeMediaFile(file);
      }
    }
    console.log("\n🎉 Done!");
  }
}

const script = new Script();
script.run().catch((e) => {
  console.error("Script failed (is Anki open, with AnkiConnect installed?):", e);
  process.exit(1);
});
