import type { MainThreadApi } from "./MainThreadApi";
import { NexWorker } from "./nex";
import { WorkerThreadApi } from "./WorkerThreadApi";

const workerThreadApi = new WorkerThreadApi();
const nexWorker = new NexWorker<MainThreadApi>();
workerThreadApi.main = nexWorker.wrap(workerThreadApi);
