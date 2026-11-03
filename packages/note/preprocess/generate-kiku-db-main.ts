import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import * as tar from "tar";
import { paths } from "#/tools/paths.ts";
import { gzipFile } from "#/tools/util.ts";
import { jmdictParser, type JmdictTerm } from "./parse-jmdict.ts";
import { kanjiVgParser } from "./parse-kanji-vg.ts";
import { jpdbScraper } from "./scrap-jpdb.ts";
import { wkScraper } from "./scrap-wk.ts";

type KikuKanji = {
  composedOf: string[];
  usedIn: string[];
  wkMeaning: string;
  meanings: string[];
  keyword: string;
  readings: { reading: string; percentage: string }[];
  frequency: string;
  kind: string;
  visuallySimilar: string[];
  related: string[];
};

type KikuKanjiCompact = [
  string[], // composedOf
  string[], // usedIn
  string, // wkMeaning
  string[], // meanings
  string, // keyword
  { reading: string; percentage: string }[], // readings
  string, // frequency
  string, // kind
  string[], // visuallySimilar
  string[], // related
];

type KikuDbKanji = Record<string, KikuKanji>;
type KikuDbKanjiCompact = Record<string, KikuKanjiCompact>;

type KikuTerm = {
  forms: string[];
  antonym: string[];
  referenced: string[];
};

type KikuTermCompact = [
  string[], // forms
  string[], // antonym
  string[], // referenced
];

type KikuDbMainManifest = {
  files: Record<string, { start: number; end: number; size: number }>;
};

function toCompact(entry: KikuKanji): KikuKanjiCompact {
  return [
    entry.composedOf,
    entry.usedIn,
    entry.wkMeaning,
    entry.meanings,
    entry.keyword,
    entry.readings,
    entry.frequency,
    entry.kind,
    entry.visuallySimilar,
    entry.related,
  ];
}

class Script {
  async compareKanjiVgAndJpdb() {
    const kanjiVgJson = await kanjiVgParser.readKanjiVgJson();
    const jpdbJson = await jpdbScraper.readKanjiJson();

    const diff: Record<
      string,
      {
        onlyInKanjiVg: string[];
        onlyInJpdb: string[];
        vg: string[];
        jpdb: string[];
      }
    > = {};

    for (const kanji of Object.keys(kanjiVgJson)) {
      const vg = kanjiVgJson[kanji]?.composedOf ?? [];
      const jpdb = (jpdbJson[kanji]?.composedOf ?? []).map((c) => c.kanji);

      const onlyInKanjiVg = vg.filter((x) => !jpdb.includes(x));
      const onlyInJpdb = jpdb.filter((x) => !vg.includes(x));

      if (onlyInKanjiVg.length > 0 || onlyInJpdb.length > 0) {
        diff[kanji] = { onlyInKanjiVg, onlyInJpdb, vg, jpdb };
      }
    }

    Object.keys(diff).forEach((kanji) => {
      const item = diff[kanji];
      if (item.jpdb.length > item.vg.length) {
        console.log(kanji, item);
      }
    });
    return diff;
  }

  async writeKikuDbKanji() {
    const kanjiVgJson = await kanjiVgParser.readKanjiVgJson();
    const jpdbJson = await jpdbScraper.readKanjiJson();
    const wkJson = await wkScraper.readWkKanjiInfoJson();

    const extraKeywordMap: Record<string, string> = {};
    for (const kanji of Object.keys(jpdbJson)) {
      for (const keyword of jpdbJson[kanji].composedOf) {
        extraKeywordMap[keyword.kanji] = keyword.keyword;
      }
      for (const keyword of jpdbJson[kanji].usedInKanji) {
        extraKeywordMap[keyword.kanji] = keyword.keyword;
      }
    }

    const tempKikuDbKanji: KikuDbKanji = {};
    const meaningIndex: Record<string, Set<string>> = {};

    for (const kanji of Object.keys(kanjiVgJson)) {
      const { composedOf, usedIn } = kanjiVgJson[kanji];
      const wkMeaning = wkJson[kanji]?.primaryMeaning ?? "";
      const visuallySimilar = wkJson[kanji]?.visuallySimilar ?? [];
      const keyword = jpdbJson[kanji]?.keyword ?? extraKeywordMap[kanji] ?? "???";
      const readings = jpdbJson[kanji]?.readings ?? [];
      const frequency = jpdbJson[kanji]?.frequency ?? "Unknown";
      const kind = jpdbJson[kanji]?.kind ?? "Unknown";

      tempKikuDbKanji[kanji] = {
        composedOf,
        usedIn,
        wkMeaning,
        meanings: [],
        keyword,
        readings,
        frequency,
        kind,
        visuallySimilar,
        related: [],
      };

      const entry = await jmdictParser.lookup(kanji);
      if (!entry) {
        console.log("term not found", kanji);
        continue;
      }

      const meanings = entry.meanings ?? [];
      tempKikuDbKanji[kanji].meanings = meanings;

      for (const m of meanings) {
        if (!meaningIndex[m]) meaningIndex[m] = new Set();
        meaningIndex[m].add(kanji);
      }
    }

    const kikuDbKanji: KikuDbKanji = {};
    for (const kanji of Object.keys(tempKikuDbKanji)) {
      const entry = tempKikuDbKanji[kanji];
      const meaningSet = new Set<string>();

      for (const meaning of entry.meanings) {
        for (const otherKanji of meaningIndex[meaning] ?? []) {
          if (otherKanji !== kanji) meaningSet.add(otherKanji);
        }
      }

      const related = [...meaningSet];
      kikuDbKanji[kanji] = {
        ...entry,
        related: related,
      };
    }

    console.log(kikuDbKanji);

    const kikuDbKanjiCompact: KikuDbKanjiCompact = {};
    for (const kanji of Object.keys(kikuDbKanji)) {
      kikuDbKanjiCompact[kanji] = toCompact(kikuDbKanji[kanji]);
    }

    await writeFile(paths["@/.db/kiku_db_kanji_compact.json"], JSON.stringify(kikuDbKanjiCompact));
  }

  async gzipKikuDbKanjiCompactJson() {
    await gzipFile(
      paths["@/.db/kiku_db_kanji_compact.json"],
      paths["@/.db/kiku_db_kanji_compact.json.gz"],
      false,
    );
  }

  async writeKikuDbTerms() {
    const termMap = JSON.parse(await readFile(paths["@/.jmdict/termMap.json"], "utf8")) as Record<
      string,
      JmdictTerm
    >;

    const kikuDbTerms: Record<string, KikuTermCompact> = {};
    for (const [term, entry] of Object.entries(termMap)) {
      kikuDbTerms[term] = [entry.forms, entry.antonym, entry.referenced];
    }

    await writeFile(paths["@/.db/kiku_db_terms_compact.json"], JSON.stringify(kikuDbTerms));
  }

  async gzipKikuDbTermsCompactJson() {
    await gzipFile(
      paths["@/.db/kiku_db_terms_compact.json"],
      paths["@/.db/kiku_db_terms_compact.json.gz"],
      false,
    );
  }

  async generateDbMainTar() {
    const filesToInclude = [
      paths["@/.db/kiku_db_kanji_compact.json.gz"],
      paths["@/.db/kiku_db_terms_compact.json.gz"],
    ].map((file) => basename(file));

    await tar.create(
      {
        cwd: paths["@/.db/"],
        portable: true,
        file: paths["@/.db/_kikuen_db_main.tar"],
      },
      filesToInclude,
    );
  }

  async writeDbMainManifest() {
    let offset = 0; // current byte offset in the tar
    const manifest: KikuDbMainManifest = {
      files: {},
    };

    await tar.t({
      file: paths["@/.db/_kikuen_db_main.tar"],
      onReadEntry(entry) {
        const headerSize = 512;
        const fileSize = entry.size;

        // actual file content inside the tar
        const contentStart = offset + headerSize;
        const contentEnd = contentStart + fileSize - 1;

        console.log({
          path: entry.path,
          contentStart,
          contentEnd,
          fileSize,
        });

        manifest.files[entry.path] = {
          start: contentStart,
          end: contentEnd,
          size: fileSize,
        };

        offset += headerSize + entry.startBlockSize; // skip header + padded data
      },
    });

    await writeFile(paths["@/.db/_kikuen_db_main_manifest.json"], JSON.stringify(manifest, null, 2));
  }
}

export const kikuDbMainScript = new Script();

// await kikuDbMainScript.compareKanjiVgAndJpdb();
// await kikuDbMainScript.writeKikuDbKanji();
// await kikuDbMainScript.gzipKikuDbKanjiCompactJson();
// await kikuDbMainScript.writeKikuDbTerms();
// await kikuDbMainScript.gzipKikuDbTermsCompactJson();
// await kikuDbMainScript.generateDbMainTar();
await kikuDbMainScript.writeDbMainManifest();
