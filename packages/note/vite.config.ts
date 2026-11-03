import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import circularDpendency from "vite-plugin-circular-dependency";
import dts from "vite-plugin-dts";
import solid from "vite-plugin-solid";
import { paths } from "./tools/paths.js";
import { getVersion } from "./tools/util.js";
import { serveAnkiCollectionMedia } from "./tools/vite-plugin-serve-anki-collection.media.js";

const fastBuild = process.env.FAST_BUILD === "true";
const plugins: PluginOption[] = [solid({ ssr: true }), tailwindcss()];
if (!fastBuild) {
  plugins.push(serveAnkiCollectionMedia());
  plugins.push(circularDpendency({ outputFilePath: "./.circularDependency.json" }));
  plugins.push(dts({ tsconfigPath: "./tsconfig.app.json", outDirs: "./dist/types" }));
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "#": paths["@/"],
    },
  },
  define: {
    __VERSION__: JSON.stringify(await getVersion()),
    __COMMIT_SHA__: JSON.stringify(process.env.COMMIT_SHA ?? "dev"),
  },
  build: {
    lib: {
      entry: paths["@/src/index.tsx"],
      fileName: "_kikuen",
      formats: ["es"],
    },
    copyPublicDir: false,
    cssCodeSplit: false,
    cssMinify: false,
    minify: false,
    rolldownOptions: {
      external: [],
      output: {
        codeSplitting: {
          groups: [
            {
              test: (id) => {
                const result = /node_modules/.test(id);
                return result;
              },
              // _kikuen_libs contains modules that is imported from node_modules
              name: "_kikuen_libs",
            },
            {
              test: (id) => {
                const result =
                  /src\/lib/.test(id) || /src\/hooks/.test(id) || /src\/contexts/.test(id);
                return result;
              },
              // _kikuen_shared is module that is used by _kikuen.js and _kikuen_lazy.js
              name: "_kikuen_shared",
            },
            {
              test: (id) => {
                const result = /src\/lazy/.test(id);
                return result;
              },
              // _kikuen_lazy contains modules that is imported from src/lazy
              name: "_kikuen_lazy",
            },
          ],
        },
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        minify: false,
      },
    },
  },
  worker: {
    format: "es",
    rolldownOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
