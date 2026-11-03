import type { KikuConfig } from "#/src/lib/config.ts";
import type { Constants } from "#/src/lib/contants.ts";
import type { Logger } from "#/src/lib/logger.ts";
import { MainThreadApi } from "./MainThreadApi.ts";
import { NexMain, type NexRemote } from "./nex";
import type { WorkerThreadApi } from "./WorkerThreadApi.ts";

export type WorkerApi = NexRemote<WorkerThreadApi>;

export async function createWorkerApi(
  opts: {
    constants: Constants;
    assetsPath: string;
    config: KikuConfig;
    preferAnkiConnect: boolean;
    workerPath?: string;
  },
  logger: Logger,
  existingWorkerApi?: WorkerApi,
) {
  if (existingWorkerApi) {
    await existingWorkerApi.init(opts);
    return existingWorkerApi;
  }

  let worker: Worker;
  if (opts.assetsPath !== window.location.origin && !import.meta.env.DEV) {
    worker = new Worker(`${opts.assetsPath}/_kikuen_worker.js`, {
      type: "module",
    });
  } else if (opts.workerPath) {
    worker = new Worker(opts.workerPath, { type: "module" });
  } else {
    worker = new Worker(new URL("./_kikuen_worker.ts", import.meta.url), {
      type: "module",
    });
  }

  const mainThreadApi = new MainThreadApi(logger);
  const workerApi: WorkerApi = new NexMain<WorkerThreadApi>(worker).wrap(mainThreadApi);
  await workerApi.init(opts);
  return workerApi;
}
