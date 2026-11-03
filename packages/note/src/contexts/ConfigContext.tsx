import { createContext, createEffect, createMemo, on, useContext, type Accessor } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { createStore, type SetStoreFunction, type Store, unwrap } from "solid-js/store";
import { AnkiConnect } from "#/src/lib/anki-connect";
import { getRootDatasetConfig, type KikuConfig, updateConfigState } from "#/src/lib/config";
import { constants } from "#/src/lib/contants";
import { createCompatPair } from "#/src/lib/context-compat";
import { useGeneralContext } from "./GeneralContext";

type ConfigContextValue = {
  $config: Store<KikuConfig>;
  $setConfig: SetStoreFunction<KikuConfig>;
  $isConfigOutOfSync: Accessor<boolean>;
};

const ConfigContext = createContext<ConfigContextValue>();

export function ConfigContextProvider(props: { children: JSX.Element; initialConfig: KikuConfig }) {
  const [$config, $setConfig] = createStore({ ...props.initialConfig });
  const { $general, logger, styleTags, assetsPath, isAnkiDesktop, workerApi, templateDataset } =
    useGeneralContext();

  createEffect(() => {
    const config = unwrap({ ...$config });
    const { root, host } = $general;
    logger.debug("Updating config:", config);
    if (!root || !host) throw new Error("Missing root or host");
    updateConfigState({ root, host, config, styleTags });
    AnkiConnect.changeAddress(config.ankiConnectAddress);
    sessionStorage.setItem(constants.key["kikuen-config"], JSON.stringify(config));
  });

  createEffect(
    on(
      () => ({
        config: unwrap({ ...$config }),
        assetsPath,
        isAnkiDesktop,
      }),
      ({ config, assetsPath, isAnkiDesktop }) => {
        void workerApi.promise.then((workerApi) =>
          workerApi.init({
            constants,
            config,
            assetsPath: import.meta.env.DEV ? "" : assetsPath,
            preferAnkiConnect: config.preferAnkiConnect && isAnkiDesktop,
          }),
        );
      },
      { defer: true },
    ),
  );

  const $isConfigOutOfSync = createMemo(() => {
    const config = unwrap({ ...$config });
    const rootDataset = getRootDatasetConfig(config);
    return Object.entries(rootDataset).some(([key, value]) => {
      return templateDataset[key as keyof typeof rootDataset] !== value;
    });
  });

  return (
    <ConfigContext.Provider value={{ $config, $setConfig, $isConfigOutOfSync }}>
      {props.children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext() {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("Missing ConfigContext");
  return Object.assign(
    createCompatPair("$config", "$setConfig", config.$config, config.$setConfig),
    { ...config },
  );
}

export type UseConfigContext = typeof useConfigContext;
