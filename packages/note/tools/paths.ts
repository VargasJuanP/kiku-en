import { join } from "node:path";

const TOOLS_DIR = import.meta.dirname;
const ROOT = join(TOOLS_DIR, "..");

const p = (path: string) => join(ROOT, path);

/**
 * Common paths used in the note package.
 * Keys starting with "@" represent the package root.
 * Directories end with "/", files do not.
 */
// oxfmt-ignore
export const paths = {
  "@/":                                        `${ROOT}/`,
  "@/.env":                                    p(".env"),
  "@/package.json":                            p("package.json"),

  "@/src/":                                    p("src/"),
  "@/plugins/":                                p("plugins/"),
  "@/dist/":                                   p("dist/"),
  "@/script/":                                 p("script/"),
  "@/tools/":                                  p("tools/"),
  "@/.anki-build/":                            p(".anki-build/"),

  "@/src/index.tsx":                           p("src/index.tsx"),

  "@/template/":                               p("template/"),
  "@/template/front.html":                     p("template/front.html"),
  "@/template/back.html":                      p("template/back.html"),
  "@/template/error.html":                     p("template/error.html"),
  "@/template/style.css":                      p("template/style.css"),
  "@/template/_kikuen_plugin.js":                p("template/_kikuen_plugin.js"),
  "@/template/_kikuen_plugin.css":               p("template/_kikuen_plugin.css"),

  "@/dist/_kikuen.js":                           p("dist/_kikuen.js"),
  "@/dist/_kikuen_lazy.js":                      p("dist/_kikuen_lazy.js"),
  "@/dist/_kikuen_libs.js":                      p("dist/_kikuen_libs.js"),
  "@/dist/_kikuen_shared.js":                    p("dist/_kikuen_shared.js"),
  "@/dist/_kikuen_worker.js":                    p("dist/_kikuen_worker.js"),
  "@/dist/_kikuen.css":                          p("dist/_kikuen.css"),

  "@/.anki-build/_kikuen_front.html":            p(".anki-build/_kikuen_front.html"),
  "@/.anki-build/_kikuen_back.html":             p(".anki-build/_kikuen_back.html"),
  "@/.anki-build/_kikuen_style.css":             p(".anki-build/_kikuen_style.css"),
  "@/.anki-build/_kikuen.css":                   p(".anki-build/_kikuen.css"),
  "@/.anki-build/_kikuen_plugin.js":             p(".anki-build/_kikuen_plugin.js"),
  "@/.anki-build/_kikuen_plugin.css":            p(".anki-build/_kikuen_plugin.css"),

  "@/.anki-build/_kikuen.js":                    p(".anki-build/_kikuen.js"),
  "@/.anki-build/_kikuen_lazy.js":               p(".anki-build/_kikuen_lazy.js"),
  "@/.anki-build/_kikuen_libs.js":               p(".anki-build/_kikuen_libs.js"),
  "@/.anki-build/_kikuen_shared.js":             p(".anki-build/_kikuen_shared.js"),
  "@/.anki-build/_kikuen_worker.js":             p(".anki-build/_kikuen_worker.js"),

  "@/.collection.media/":                      p(".collection.media/"),

  "@/.dicts/":                                 p(".dicts/"),
  "@/.release/":                               p(".release/"),

 

} as const;
