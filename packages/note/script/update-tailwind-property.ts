import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "#/tools/paths.ts";

const DIST_CSS = paths["@/dist/_kikuen.css"];
const SOURCE_CSS = join(paths["@/src/"], "styles/tailwind-property.css");

async function run() {
  const [distCss, sourceCss] = await Promise.all([
    readFile(DIST_CSS, "utf-8"),
    readFile(SOURCE_CSS, "utf-8").catch(() => ""),
  ]);

  const currentValues = new Map<string, string>();
  for (const m of sourceCss.matchAll(/--tw-([\w-]+)\s*:\s*([^;]+);/g)) {
    currentValues.set(m[1], m[2].trim());
  }

  const properties: Array<{ name: string; value: string }> = [];

  for (const m of distCss.matchAll(/@property\s+--tw-([a-z-]+)\s*\{([^}]+)\}/g)) {
    const name = m[1];
    const body = m[2];
    const iv = body.match(/initial-value:\s*(.*?)\s*;?\s*$/m);
    const value = iv ? iv[1].trim() : (currentValues.get(name) ?? "initial");
    properties.push({ name, value });
  }

  properties.sort((a, b) => a.name.localeCompare(b.name));

  const css = [
    "/*https://github.com/tailwindlabs/tailwindcss/issues/15005#issuecomment-3257589151*/",
    ":host {",
    ...properties.map((p) => `  --tw-${p.name}: ${p.value};`),
    "}",
    "",
  ].join("\n");

  await writeFile(SOURCE_CSS, css);
  console.log(`✅ Updated tailwind-property.css (${properties.length} properties)`);
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
