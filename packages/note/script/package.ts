import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "#/tools/paths.ts";
import { AnkiConnect, getVersion } from "#/tools/util.js";

class Script {
  DECK_NAME = "Kiku EN"; // change if needed

  async ensureReleaseDir() {
    await mkdir(paths["@/.release/"], { recursive: true });
  }

  buildOutputPath(version: string) {
    return join(paths["@/.release/"], `${this.DECK_NAME}_v${version}.apkg`);
  }

  async exportDeck(outputPath: string) {
    console.log(`📦 Exporting deck "${this.DECK_NAME}" to ${outputPath}...`);
    const result = await AnkiConnect.call("exportPackage", {
      deck: this.DECK_NAME,
      path: outputPath,
      includeSched: false,
    });
    if (!result) throw new Error(`Failed to export deck "${this.DECK_NAME}"`);
    console.log(`✅ Successfully exported deck "${this.DECK_NAME}" to: ${outputPath}`);
  }

  async run() {
    const version = await getVersion();
    await this.ensureReleaseDir();
    const outputPath = this.buildOutputPath(version);
    await this.exportDeck(outputPath);
  }
}

const script = new Script();
script.run().catch((err) => {
  console.error("❌ Error exporting deck:", err);
  process.exit(1);
});
