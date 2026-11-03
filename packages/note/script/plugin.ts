import { cp, lstat, mkdir, readdir, rm, symlink } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { env } from "#/tools/env.ts";
import { paths } from "#/tools/paths.ts";

type Mode = "copy" | "symlink";

const USAGE = `
Usage:
  plugin:symlink <plugin-name>
  plugin:copy <plugin-name>

Available plugins:
`;

class Script {
  async resolvePluginDir(name: string) {
    const dir = join(paths["@/plugins/"], name);
    const st = await lstat(dir);
    if (!st.isDirectory()) {
      throw new Error(`Plugin "${name}" is not a directory: ${dir}`);
    }
    return dir;
  }

  async listFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const walk = async (current: string) => {
      const entries = await readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile()) files.push(relative(dir, full));
      }
    };
    await walk(dir);
    return files;
  }

  async listPlugins(): Promise<string[]> {
    const entries = await readdir(paths["@/plugins/"], { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }

  async run(mode: Mode, name: string) {
    const srcDir = await this.resolvePluginDir(name);
    const files = await this.listFiles(srcDir);

    console.log(
      `\n🔍 ${mode === "symlink" ? "Symlinking" : "Copying"} plugin "${name}" (${files.length} file(s)) to: ${env.ANKI_COLLECTION_MEDIA_PATH}`,
    );

    for (const file of files) {
      const src = join(srcDir, file);
      const dest = join(env.ANKI_COLLECTION_MEDIA_PATH, file);

      if (mode === "symlink") {
        await rm(dest, { force: true });
        await mkdir(dirname(dest), { recursive: true });
        await symlink(src, dest, "file");
        console.log(`🔗 Linked ${file}`);
      } else {
        await cp(src, dest);
        console.log(`✅ Copied ${file}`);
      }
    }

    console.log(`\n🎉 Done! ${files.length} file(s) ${mode === "symlink" ? "linked" : "copied"}.`);
  }
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  const name = process.argv[3];

  if (mode !== "copy" && mode !== "symlink") {
    console.error(`Unknown or missing mode: "${mode}". Must be one of: copy, symlink.` + USAGE);
    for (const p of await new Script().listPlugins()) console.error(`  - ${p}`);
    process.exit(1);
  }

  if (!name) {
    console.error(`Missing plugin name.${USAGE}`);
    for (const p of await new Script().listPlugins()) console.error(`  - ${p}`);
    process.exit(1);
  }

  await new Script().run(mode, name);
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
