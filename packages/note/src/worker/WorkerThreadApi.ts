import "#/src/lib/polyfill";
import type { KikuConfig } from "#/src/lib/config";
import type { Constants } from "#/src/lib/contants";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import type { AnkiFields, AnkiNote, KikuNotesManifest } from "#/src/lib/types";

import { AnkiConnect } from "./AnkiConnect";
import { type NexRemote } from "./nex";
import type { MainThreadApi } from "./MainThreadApi";

type QueryResult = {
  expressionResult: Record<string, AnkiNote[]>;
  newNotes: AnkiNote[];
  isNotesCache: boolean;
};

export class WorkerThreadApi {
  main!: NexRemote<MainThreadApi>;
  assetsPath!: string;
  constants!: Constants;
  config!: KikuConfig;
  preferAnkiConnect!: boolean;
  cache = new Map();
  ankiConnect!: AnkiConnect;
  private readonly log = {
    trace: (...args: unknown[]) => this.main.log("trace", args),
    debug: (...args: unknown[]) => this.main.log("debug", args),
    info: (...args: unknown[]) => this.main.log("info", args),
    warn: (...args: unknown[]) => this.main.log("warn", args),
    error: (...args: unknown[]) => this.main.log("error", args),
  };

  init(payload: {
    assetsPath: string;
    constants: Constants;
    config: KikuConfig;
    preferAnkiConnect: boolean;
  }): void {
    this.assetsPath = payload.assetsPath;
    this.constants = payload.constants;
    this.config = payload.config;
    this.preferAnkiConnect = payload.preferAnkiConnect;
    this.ankiConnect = new AnkiConnect(
      this.main.fetchJson,
      this.config.ankiConnectAddress,
      this.constants.NOTE_TYPE,
    );
  }

  chunkCache = new Map<string, AnkiNote[]>();
  /** Notes whose Expression is one of `expressionList`, or that list one of them as related. */
  async query({
    expressionList,
    withNewNotes = true,
  }: {
    expressionList: string[];
    withNewNotes?: boolean;
  }) {
    const queryWithNotesCache = async () => {
      const expressionListResult: Record<string, AnkiNote[]> = {};
      const newNotes: AnkiNote[] = [];

      const manifest = await this.notesManifest();
      const expressionSet = new Set(expressionList);

      await Promise.all(
        manifest.chunks.map(async (chunk) => {
          if (this.chunkCache.has(chunk.file)) return;
          const buf = await this.main.fetchArrayBuffer(`${this.assetsPath}/${chunk.file}`);
          const text = await gunzipArrayBuffer(buf).text();
          this.chunkCache.set(chunk.file, JSON.parse(text) as AnkiNote[]);
        }),
      );

      for (const chunk of manifest.chunks) {
        const notes = this.chunkCache.get(chunk.file);
        if (!notes) continue;

        for (const note of notes) {
          if (note.modelName !== this.constants.NOTE_TYPE) continue;

          const expr = note.fields.Expression.value;
          const relatedExprValue = note.fields.RelatedExpression?.value ?? "";

          // ------- Expression Search (exact) -------
          if (expressionSet.has(expr)) {
            expressionListResult[expr] ??= [];
            expressionListResult[expr].push(note);
          }

          // ------- Related Expression Search (contains) -------
          if (relatedExprValue) {
            for (const rel of parseRelatedExpression(relatedExprValue)) {
              if (expressionSet.has(rel)) {
                expressionListResult[rel] ??= [];
                if (!expressionListResult[rel].includes(note)) {
                  expressionListResult[rel].push(note);
                }
              }
            }
          }
        }
      }

      return { expressionListResult, newNotes };
    };

    const queryWithAnkiConnect = () =>
      this.ankiConnect.queryFieldContains({ expressionList, withNewNotes });

    let result: { expressionListResult: Record<string, AnkiNote[]>; newNotes: AnkiNote[] };
    let isNotesCache: boolean;

    if (this.preferAnkiConnect) {
      try {
        void this.log.info("Querying with AnkiConnect");
        result = await queryWithAnkiConnect();
        isNotesCache = false;
      } catch {
        void this.log.warn("Failed to query with AnkiConnect, falling back to notes cache");
        result = await queryWithNotesCache();
        isNotesCache = true;
      }
    } else {
      try {
        void this.log.info("Querying with notes cache");
        result = await queryWithNotesCache();
        isNotesCache = true;
      } catch {
        void this.log.warn("Failed to query with notes cache, falling back to AnkiConnect");
        result = await queryWithAnkiConnect();
        isNotesCache = false;
      }
    }

    for (const key in result.expressionListResult) {
      result.expressionListResult[key].sort((a, b) => b.noteId - a.noteId);
    }

    return { ...result, isNotesCache };
  }

  debounceTimer: ReturnType<typeof setTimeout> | null = null;
  debounceMs = 200;
  /** Batches the queries of cards rendered at the same time (e.g. a note and its related notes). */
  async queryShared({
    expressionList,
    ankiFields,
    withNewNotes = true,
  }: {
    expressionList?: string[];
    ankiFields: AnkiFields;
    withNewNotes?: boolean;
  }) {
    return new Promise<QueryResult>((resolve, reject) => {
      this.pendingQueryShared.push({
        expressionList: expressionList ?? [],
        ankiFields,
        withNewNotes,
        resolve,
      });
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(() => {
        this.actualQueryShared().catch((e) => {
          reject(e);
        });
      }, this.debounceMs);
    });
  }

  pendingQueryShared: {
    expressionList: string[];
    ankiFields: AnkiFields;
    withNewNotes: boolean;
    resolve: (v: QueryResult) => void;
  }[] = [];

  async actualQueryShared() {
    const requests = this.pendingQueryShared;
    this.pendingQueryShared = [];

    const batchedExpressionList = [...new Set(requests.flatMap((r) => r.expressionList))];
    const needsNewNotes = requests.some((r) => r.withNewNotes);

    const { expressionListResult, newNotes, isNotesCache } = await this.query({
      expressionList: batchedExpressionList,
      withNewNotes: needsNewNotes,
    });

    for (const { expressionList, ankiFields, resolve } of requests) {
      const isOtherNote = (note: AnkiNote) => !note.cards.includes(Number(ankiFields.CardID));

      const expressionResult: Record<string, AnkiNote[]> = {};
      for (const expression of expressionList) {
        expressionResult[expression] = expressionListResult[expression]?.filter(isOtherNote) ?? [];
      }

      resolve({ expressionResult, newNotes, isNotesCache });
    }
  }

  async notesManifest(): Promise<KikuNotesManifest> {
    const key = this.notesManifest.name;
    if (this.cache.has(key)) return this.cache.get(key);
    let manifest: KikuNotesManifest;
    try {
      manifest = (await this.main.fetchJson(
        `${this.assetsPath}/${this.constants.assets["_kikuen_notes_manifest.json"]}`,
        { cache: "no-store" },
      )) as KikuNotesManifest;
    } catch {
      throw new Error("Failed to load manifest");
    }
    this.cache.set(key, manifest);
    return manifest;
  }
}

function gunzipArrayBuffer(buf: ArrayBuffer) {
  if (buf.byteLength === 0) {
    throw new Error("No body for empty buffer");
  }
  const res = new Response(buf);
  if (!res.body) {
    throw new Error("No body for buffer");
  }
  const ds = new DecompressionStream("gzip");
  const decompressed = res.body.pipeThrough(ds);
  return new Response(decompressed);
}
