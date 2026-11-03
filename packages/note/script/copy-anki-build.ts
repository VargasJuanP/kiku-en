import { cp, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { env } from "#/tools/env.ts";
import { paths } from "#/tools/paths.ts";

class Script {
  async ensureAnkiDir() {
    await stat(env.ANKI_COLLECTION_MEDIA_PATH);
  }

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

  async copyFiles(files: string[], srcDir: string) {
    for (const file of files) {
      const src = join(srcDir, file);
      await stat(src);
      const dest = join(env.ANKI_COLLECTION_MEDIA_PATH, file);
      await cp(src, dest);
      console.log(`✅ Copied ${basename(src)}`);
    }
  }

  async copyAnkiBuild() {
    const FILES = [
      "_kikuen_front.html",
      "_kikuen_back.html",
      "_kikuen_style.css",
      "_kikuen.css",
      "_kikuen.js",
      "_kikuen_lazy.js",
      "_kikuen_libs.js",
      "_kikuen_shared.js",
      "_kikuen_worker.js",
      "_kikuen_plugin.js",
      "_kikuen_plugin.css",
    ];

    console.log("\n📁 Copying ANKI BUILD files...");
    await this.copyFiles(FILES, paths["@/.anki-build/"]);
  }

  async copyDatabases() {
    const DBS = ["_kikuen_db_main.tar", "_kikuen_db_main_manifest.json"];

    console.log("\n📁 Copying DATABASES...");
    await this.copyFiles(DBS, paths["@/.db/"]);
  }

  async run() {
    console.log(`🔍 Checking Anki collection at: ${env.ANKI_COLLECTION_MEDIA_PATH}`);
    await this.ensureAnkiDir();
    await this.copyAssetsFromDistToAnkiBuild();
    await this.copyAnkiBuild();
    await this.copyDatabases();
    console.log("\n🎉 Done!");
  }
}

const script = new Script();
script.run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
