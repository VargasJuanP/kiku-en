import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { paths } from "#/tools/paths.ts";
import { gzipFile } from "#/tools/util.ts";

type Kanji = {
  position: string;
  kind: string;
  svg: string;
  keyword: string;
  frequency: string;
  type: string;
  kanken: string;
  heisig: string;
  readings: {
    reading: string;
    percentage: string;
  }[];
  composedOf: {
    kanji: string;
    keyword: string;
  }[];
  usedInKanji: {
    kanji: string;
    keyword: string;
  }[];
};

type KanjiFreqKind = {
  position: string;
  kanji: string;
  kind: string;
};

class JpdbScraper {
  KYOIKU_URL = "https://jpdb.io/kanji-by-frequency?show_only=kyouiku";
  JOYO_URL = "https://jpdb.io/kanji-by-frequency?show_only=jouyou";
  JINMEIYO_URL = "https://jpdb.io/kanji-by-frequency?show_only=jinmeiyou";
  HYOGAI_URL = "https://jpdb.io/kanji-by-frequency?show_only=hyougai";

  async ensureDir() {
    await mkdir(paths["@/.jpdb/kanji-by-frequency/"], { recursive: true });
    await mkdir(paths["@/.jpdb/kanji/"], { recursive: true });
  }

  async writeKanjiByFrequencyHtml() {
    const kyoikuRes = await fetch(this.KYOIKU_URL);
    const kyoikuHtml = await kyoikuRes.text();
    await writeFile(paths["@/.jpdb/kanji-by-frequency/kyoiku.html"], kyoikuHtml);

    const joyoRes = await fetch(this.JOYO_URL);
    const joyoHtml = await joyoRes.text();
    await writeFile(paths["@/.jpdb/kanji-by-frequency/joyo.html"], joyoHtml);

    const jinmeiyoRes = await fetch(this.JINMEIYO_URL);
    const jinmeiyoHtml = await jinmeiyoRes.text();
    await writeFile(paths["@/.jpdb/kanji-by-frequency/jinmeiyo.html"], jinmeiyoHtml);

    const hyogaiRes = await fetch(this.HYOGAI_URL);
    const hyogaiHtml = await hyogaiRes.text();
    await writeFile(paths["@/.jpdb/kanji-by-frequency/hyogai.html"], hyogaiHtml);
  }

  async writeKanjiByFrequencyJson() {
    const category = [
      {
        src: paths["@/.jpdb/kanji-by-frequency/kyoiku.html"],
        dest: paths["@/.jpdb/kanji-by-frequency/kyoiku.json"],
      },
      {
        src: paths["@/.jpdb/kanji-by-frequency/joyo.html"],
        dest: paths["@/.jpdb/kanji-by-frequency/joyo.json"],
      },
      {
        src: paths["@/.jpdb/kanji-by-frequency/jinmeiyo.html"],
        dest: paths["@/.jpdb/kanji-by-frequency/jinmeiyo.json"],
      },
      {
        src: paths["@/.jpdb/kanji-by-frequency/hyogai.html"],
        dest: paths["@/.jpdb/kanji-by-frequency/hyogai.json"],
      },
    ];

    for (const { src, dest } of category) {
      const $ = cheerio.load(await readFile(src, "utf8"));
      const rows = $("tbody tr");
      const json: { position: string; kanji: string; kind: string }[] = [];

      rows.each((i, row) => {
        if (i === 0) return;
        const position = $(row).children("td").first().text().replace(/\.$/, "");
        const kanji = $(row).children("td").first().next().text();
        const kind = $(row).children("td").first().next().next().text();
        json.push({ position, kanji, kind });
      });
      await writeFile(dest, JSON.stringify(json, null, 2));
    }
  }

  async getKanjiByType() {
    const kyoiku = JSON.parse(
      await readFile(paths["@/.jpdb/kanji-by-frequency/kyoiku.json"], "utf8"),
    ) as KanjiFreqKind[];
    const joyo = JSON.parse(
      await readFile(paths["@/.jpdb/kanji-by-frequency/joyo.json"], "utf8"),
    ) as KanjiFreqKind[];
    const jinmeiyo = JSON.parse(
      await readFile(paths["@/.jpdb/kanji-by-frequency/jinmeiyo.json"], "utf8"),
    ) as KanjiFreqKind[];
    const hyogai = JSON.parse(
      await readFile(paths["@/.jpdb/kanji-by-frequency/hyogai.json"], "utf8"),
    ) as KanjiFreqKind[];
    return { kyoiku, joyo, jinmeiyo, hyogai };
  }

  async writeKanjiHtml(someKanjis?: string[]) {
    const { kyoiku, joyo, jinmeiyo, hyogai } = await this.getKanjiByType();

    const merged = [...kyoiku, ...joyo, ...jinmeiyo, ...hyogai];
    const kanjis = someKanjis ?? [...new Set(merged.map((k) => k.kanji))];

    console.log(`Total kanji to fetch: ${kanjis.length}`);
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let kanjiError: string[] = [];

    for (let i = 0; i < kanjis.length; i++) {
      const kanji = kanjis[i];
      const url = `https://jpdb.io/kanji/${encodeURIComponent(kanji)}?expand=k`;

      console.log(`[${i + 1}/${kanjis.length}] Fetching ${kanji} (${url})`);

      try {
        const res = await fetch(url);
        const html = await res.text();

        const dest = join(paths["@/.jpdb/kanji/"], `${kanji}.html`);
        await writeFile(dest, html);

        console.log(`Saved → ${dest}`);
      } catch (err) {
        kanjiError.push(kanji);
        console.error(`Failed to fetch ${kanji}:`, err);
      }

      await sleep(250);
    }

    try {
      const kanjiErrorJson = JSON.parse(await readFile(paths["@/.jpdb/kanji-error.json"], "utf8"));
      kanjiError = Array.from(new Set([...kanjiError, ...kanjiErrorJson]));
    } catch {
      console.log("Error reading kanjiErrorJson");
    }
    await writeFile(paths["@/.jpdb/kanji-error.json"], JSON.stringify(kanjiError, null, 2));
  }

  async writeKanjiJson() {
    const { kyoiku, joyo, jinmeiyo, hyogai } = await this.getKanjiByType();
    const allKanjiByType = [...kyoiku, ...joyo, ...jinmeiyo, ...hyogai];
    const kanjiJson: Record<string, Kanji> = {};
    const kanjis = (await readdir(paths["@/.jpdb/kanji/"]))
      .map((file) => file.replace(".html", ""))
      .filter((kanji) => kanji);

    for (const kanji of kanjis) {
      const kanjiHtml = await readFile(join(paths["@/.jpdb/kanji/"], `${kanji}.html`), "utf8");
      const $ = cheerio.load(kanjiHtml);
      const svg = $("svg.kanji").prop("outerHTML") ?? "";
      const keyword = $('h6.subsection-label:contains("Keyword")')
        .next(".subsection")
        .text()
        .trim();

      const infoTable = $('h6.subsection-label:contains("Info")')
        .next(".subsection")
        .find("table.cross-table");

      const frequency = infoTable
        .find('tr:has(td:contains("Frequency")) td:nth-child(2)')
        .text()
        .trim();

      const type = infoTable
        .find('tr:has(td:contains("Type")) td:nth-child(2)')
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .replace("?", "")
        .trim();
      const info = allKanjiByType.find((k) => k.kanji === kanji);
      const position = info?.position ?? "";
      const kind = info?.kind ?? "";

      const kanken = infoTable.find('tr:has(td:contains("Kanken")) td:nth-child(2)').text().trim();

      const heisig = infoTable.find('tr:has(td:contains("Heisig")) td:nth-child(2)').text().trim();

      const commonReadings: { reading: string; percentage: string }[] = [];
      infoTable.find(".kanji-reading-list-common > div").each((_, el) => {
        const reading = $(el).find("a").text().trim();
        const percentage = $(el).find("div").text().replace(/[()]/g, "").trim();
        commonReadings.push({ reading, percentage });
      });

      const rareReadings: { reading: string; percentage: string }[] = [];
      infoTable.find(".kanji-reading-list > div").each((_, el) => {
        const reading = $(el).find("a").text().trim();
        rareReadings.push({ reading, percentage: "" });
      });

      const composedOf: { kanji: string; keyword: string }[] = [];
      $(".subsection-composed-of-kanji").each((_, el) => {
        const header = $(el).find("h6.subsection-label").text().trim();
        if (header === "Composed of") {
          $(el)
            .find(".subsection > div")
            .each((_, d) => {
              const kanji = $(d).find(".spelling a").text().trim();
              const keyword = $(d).find(".description").text().trim();
              if (kanji) composedOf.push({ kanji, keyword });
            });
        }
      });

      const usedInKanji: { kanji: string; keyword: string }[] = [];
      $(".subsection-composed-of-kanji").each((_, el) => {
        const headerId = $(el).find("h6.subsection-label").attr("id") || "";
        if (headerId.startsWith("used_in_")) {
          $(el)
            .find(".subsection .used-in")
            .each((_, d) => {
              const kanji = $(d).find(".spelling a").text().trim();
              const keyword = $(d).find(".description").text().trim();
              usedInKanji.push({ kanji, keyword });
            });
        }
      });

      const kanjiInfo: Kanji = {
        position,
        svg,
        keyword,
        frequency,
        kind,
        type,
        kanken,
        heisig,
        readings: [...commonReadings, ...rareReadings],
        composedOf,
        usedInKanji,
      };

      console.log("Kanji:", kanji);
      kanjiJson[kanji] = kanjiInfo;
    }

    await writeFile(paths["@/.jpdb/kanji.json"], JSON.stringify(kanjiJson, null, 2));
  }

  async gzipKanjiJson() {
    const dest = join(paths["@/.jpdb/"], "_kikuen_db_jpdb_kanji.json.gz");
    await gzipFile(paths["@/.jpdb/kanji.json"], dest, false);
  }

  async readKanjiJson() {
    return JSON.parse(await readFile(paths["@/.jpdb/kanji.json"], "utf8")) as Record<string, Kanji>;
  }
}

export const jpdbScraper = new JpdbScraper();
await jpdbScraper.ensureDir();

// jpdbScraper.writeKanjiByFrequencyHtml();
// await jpdbScraper.writeKanjiByFrequencyJson();
// await jpdbScraper.writeKanjiHtml();
// await jpdbScraper.writeKanjiJson();
// await jpdbScraper.gzipKanjiJson();
