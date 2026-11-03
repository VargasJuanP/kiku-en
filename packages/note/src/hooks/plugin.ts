import { getOwner, runWithOwner } from "solid-js";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { constants } from "#/src/lib/contants";
import type { KikuPlugin } from "#/plugins/plugin-types";

export function useLoadPlugin() {
  const { $setGeneral, assetsPath, logger } = useGeneralContext();
  const ctx = useCtxContext();
  const owner = getOwner();

  async function getPlugin(assetsPath: string) {
    const mod = await import(
      /* @vite-ignore */
      `${assetsPath}/${constants.assets["_kikuen_plugin.js"]}`
    );
    return mod.plugin as KikuPlugin;
  }

  function loadPlugin() {
    getPlugin(assetsPath)
      .then((plugin) => {
        try {
          runWithOwner(owner, () => {
            plugin?.onPluginLoad?.({ ctx });
          });
        } catch (e) {
          logger.warn("[plugin] onPluginLoad failed:", e);
        }
        $setGeneral("plugin", plugin);
      })
      .catch((e) => {
        logger.warn("[plugin] failed to load plugin:", e);
      });
  }

  return loadPlugin;
}
