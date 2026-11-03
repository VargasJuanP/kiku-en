/**
 * @fileoverview A Kiku plugin that displays extended Kanji information including
 * stroke order diagrams, metadata (levels, radicals), multiple meanings with
 * supplementary info, and historical origins (Naritachi).
 *
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * Minimized representation of Kanji data to reduce JSON size.
 * @typedef {[
 *   string,                   // 0: kanji
 *   number | string,          // 1: level
 *   number | string,          // 2: stroke
 *   string | null,            // 3: strokeImage (HTML string)
 *   string,                   // 4: radical
 *   string,                   // 5: radicalName
 *   string[],                 // 6: on (On-readings)
 *   string[],                 // 7: onGai (Extra On-readings)
 *   string[],                 // 8: kun (Kun-readings)
 *   string[],                 // 9: kunGai (Extra Kun-readings)
 *   number,                   // 10: joyo (0 or 1)
 *   number,                   // 11: kyoiku (0 or 1)
 *   number,                   // 12: kokuji (0 or 1)
 *   [string, string] | null,  // 13: kyujitai [type, value]
 *   [string, string] | null,  // 14: itaiji [type, value]
 *   [string, [string, string][]][], // 15: meaning [[text, [[tag, content], ...]], ...]
 *   [string | null, string],  // 16: naritachi [type, html]
 *   string | null,            // 17: kadokawaNaritachi (HTML string)
 * ]} MinimizedKanjiData
 */

/**
 * A supplementary note for a kanji meaning.
 * @typedef {Object} SupplementaryItem
 * @property {string} tag - The category or label for the note (e.g., "Reference").
 * @property {string} content - The actual text content of the note.
 */

/**
 * A single definition/meaning entry for a kanji.
 * @typedef {Object} MeaningItem
 * @property {string} meaning - The primary definition text.
 * @property {SupplementaryItem[]} supplementary - Additional notes or context for this meaning.
 */

/**
 * The structured representation of a Kanji's extended data after inflation.
 * @typedef {Object} KanjiObject
 * @property {string} kanji - The kanji character.
 * @property {number | string} level - The proficiency level (e.g., JLPT or school grade).
 * @property {number | string} stroke - Total stroke count.
 * @property {string | null} strokeImage - HTML string for the stroke order SVG.
 * @property {string} radical - The radical character.
 * @property {string} radicalName - The name/reading of the radical.
 * @property {string[]} on - Standard On-readings.
 * @property {string[]} onGai - Out-of-joyo On-readings.
 * @property {string[]} kun - Standard Kun-readings.
 * @property {string[]} kunGai - Out-of-joyo Kun-readings.
 * @property {boolean} joyo - Whether it is a Joyo kanji.
 * @property {boolean} kyoiku - Whether it is a Kyoiku kanji.
 * @property {boolean} kokuji - Whether it is a Kokuji (native Japanese kanji).
 * @property {{ type: "TRUE" | "IS"; value: string } | null} kyujitai - Traditional form information.
 * @property {{ type: "TRUE" | "IS"; value: string } | null} itaiji - Variant form information.
 * @property {MeaningItem[]} meaning - List of definitions.
 * @property {{ type: string | null; html: string }} naritachi - Standard etymology info.
 * @property {string} [kadokawaNaritachi] - Historical origin info from Kadokawa.
 */

/**
 * Inflates a minimized Kanji array into a structured object for easier consumption.
 * @param {MinimizedKanjiData} data
 * @returns {KanjiObject}
 */
function inflateKanjiData(data) {
  /** @type {KanjiObject} */
  const obj = {
    kanji: data[0],
    level: data[1],
    stroke: data[2],
    strokeImage: data[3],
    radical: data[4],
    radicalName: data[5],
    on: data[6],
    onGai: data[7],
    kun: data[8],
    kunGai: data[9],
    joyo: data[10] === 1,
    kyoiku: data[11] === 1,
    kokuji: data[12] === 1,
    kyujitai: data[13]
      ? { type: /** @type {"TRUE" | "IS"} */ (data[13][0]), value: data[13][1] }
      : null,
    itaiji: data[14]
      ? { type: /** @type {"TRUE" | "IS"} */ (data[14][0]), value: data[14][1] }
      : null,
    meaning: data[15].map(([meaning, supplementary]) => ({
      meaning,
      supplementary: supplementary.map(([tag, content]) => ({ tag, content })),
    })),
    naritachi: {
      type: data[16][0],
      html: data[16][1],
    },
  };

  if (data[17]) {
    obj.kadokawaNaritachi = data[17];
  }

  return obj;
}

/**
 * Cache for the kanji data fetch promise.
 * @type {Promise<Record<string, MinimizedKanjiData>> | null}
 */
let kanjiDataPromise = null;

/**
 * Fetches and processes the kanji data JSON file.
 * Uses a singleton promise to ensure the file is only loaded once.
 * @returns {Promise<Record<string, MinimizedKanjiData>>}
 */
const fetchKanjiData = async () => {
  if (kanjiDataPromise) return kanjiDataPromise;
  kanjiDataPromise = fetch("_kikuen-plugin-kanji-data.json")
    .then((res) => res.json())
    .then((data) => {
      /** @type {Record<string, MinimizedKanjiData>} */
      const record = {};
      for (const item of data) {
        record[item[0]] = item;
      }
      return record;
    });
  return kanjiDataPromise;
};

/** @type {Object.<"会意" | "形声" | "指事" | "象形" | "会意形声" | "転注" | "仮借" | "象形指事", string>} */
const naritachiTypeBadge = {
  会意形声: "badge-kaii-keisei",
  象形: "badge-shokei",
  指事: "badge-shiji",
  会意: "badge-kaii",
  形声: "badge-keisei",
  転注: "badge-tenchu",
  仮借: "badge-kasha",
  象形指事: "badge-shokei-shiji",
};

/** @type {Object.<string, string>} */
const naritachiTypeBg = {
  会意形声: "bg-kaii-keisei-soft",
  象形: "bg-shokei-soft",
  指事: "bg-shiji-soft",
  会意: "bg-kaii-soft",
  形声: "bg-keisei-soft",
  転注: "bg-tenchu-soft",
  仮借: "bg-kasha-soft",
  象形指事: "bg-shokei-shiji-soft",
};

/** @type {Object.<"参考" | "対" | "類", string>} */
const meaningSupplementaryTagBadge = {
  参考: "badge-sanko",
  類: "badge-rui",
  対: "badge-tai",
};

/** @type {Object.<"参考" | "対" | "類", string>} */
const meaningSupplementaryTagBg = {
  参考: "bg-sanko-soft",
  類: "bg-rui-soft",
  対: "bg-tai-soft",
};

/** @type {Object.<string, string>} */
const kankenLevelBadge = {
  10: "badge-kanken-10",
  9: "badge-kanken-9",
  8: "badge-kanken-8",
  7: "badge-kanken-7",
  6: "badge-kanken-6",
  5: "badge-kanken-5",
  4: "badge-kanken-4",
  3: "badge-kanken-3",
  準2: "badge-kanken-j2",
  2: "badge-kanken-2",
  準1: "badge-kanken-j1",
  1: "badge-kanken-1",
};

const CIRCLED_NUMBERS = [
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
  "⑪",
  "⑫",
  "⑬",
  "⑭",
  "⑮",
  "⑯",
  "⑰",
  "⑱",
  "⑲",
  "⑳",
];

/**
 * @typedef {Object} Options
 * @property {boolean} [defaultOpen = true]
 * @property {string} [collapseTitle = "Extra Info"]
 * @property {boolean} [showVisuallySimilar = true]
 * @property {boolean} [showComposedOf = true]
 * @property {boolean} [showUsedIn = true]
 * @property {boolean} [showMeanings = true]
 * @property {boolean} [showRelated = true]
 */

/**
 * The Kiku plugin exported object.
 * @param {Options | undefined | null} options
 */
export default (options) => {
  const defaultOpen = options?.defaultOpen ?? true;
  const collapseTitle = options?.collapseTitle ?? "Extra Info";
  const showVisuallySimilar = options?.showVisuallySimilar ?? true;
  const showComposedOf = options?.showComposedOf ?? true;
  const showUsedIn = options?.showUsedIn ?? true;
  const showMeanings = options?.showMeanings ?? true;
  const showRelated = options?.showRelated ?? true;

  /**
   * The Kiku plugin exported object.
   * @type { KikuPlugin }
   */
  const plugin = {
    /**
     * Component that injects additional kanji information into the card view.
     */
    KanjiInfoExtra: (props) => {
      const { h, createResource, Show, For } = props.ctx;
      const { $kanji } = props.useKanjiContext();

      /** @type {string} Set to a kanji to override for testing. */
      const TEST_KANJI = "";

      /**
       * Resource that resolves to the inflated data for the current kanji.
       */
      const [data] = createResource(
        () => TEST_KANJI || $kanji.kanji,
        async (kanji) => {
          const record = await fetchKanjiData();
          const item = record[kanji];
          return item ? inflateKanjiData(item) : null;
        },
      );

      /**
       * Internal component to render the metadata (levels, strokes, radical).
       * @param {{ data: KanjiObject }} props
       */
      function MetadataSection({ data: k }) {
        return h("div", { class: "metadata-section" }, [
          h(Show, { when: k.strokeImage }, () =>
            h("div", { class: "stroke-image", innerHTML: k.strokeImage }),
          ),
          h(Show, { when: !k.strokeImage }, () =>
            h(
              "div",
              { class: "stroke-image" },
              h(
                "div",
                {
                  class: "empty-img flex border border-base-content-subtle-100",
                },
                k.kanji,
              ),
            ),
          ),
          h("div", { class: "flex flex-col gap-2 items-start" }, [
            h(ReadingsSection, { data: k }),
            h("div", { class: "flex flex-row gap-1 items-start" }, [
              h("div", { class: "misc-badge text-base-content-calm" }, [
                h("span", {}, "部首: "),
                h("span", {}, `${k.radical} (${k.radicalName})`),
              ]),
              h("div", { class: "misc-badge text-base-content-calm" }, [
                h("span", {}, k.stroke),
                h("span", {}, "画"),
              ]),
            ]),
            h("div", { class: "flex flex-row gap-2 items-start" }, [
              h("div", { class: `badge-origin ${kankenLevelBadge[k.level]}` }, [
                h("span", {}, "漢検"),
                h("span", {}, k.level),
              ]),
              h(Show, { when: k.joyo }, () =>
                h("div", { class: "badge-origin badge-joyo" }, "常用"),
              ),
              h(Show, { when: k.kyoiku }, () =>
                h("div", { class: "badge-origin badge-kyoiku" }, "教育"),
              ),
              h(Show, { when: k.kokuji }, () =>
                h("div", { class: "badge-origin badge-kokuji" }, "国字"),
              ),
            ]),
          ]),
        ]);
      }

      /**
       * Internal component to render the standard Naritachi (etymology).
       * @param {{ data: KanjiObject }} props
       */
      function NaritachiSection({ data: k }) {
        return h(Show, { when: k.naritachi.html }, () =>
          h("div", { class: "info-section" }, [
            h(
              "div",
              { class: "info-header pb-1" },
              h("div", { class: "flex gap-2 items-center" }, ["成り立ち"]),
            ),
            h(
              "div",
              {
                class: `naritachi-content ${naritachiTypeBg[k.naritachi.type ?? "会意形声"]}`,
              },
              [
                h(Show, { when: k.naritachi.type }, () =>
                  h(
                    "div",
                    {
                      class: `badge-origin ${naritachiTypeBadge[k.naritachi.type ?? "会意形声"]}`,
                    },
                    k.naritachi.type,
                  ),
                ),
                h("div", {
                  class: "origin-text",
                  innerHTML: k.naritachi.html,
                }),
              ],
            ),
          ]),
        );
      }

      /**
       * Internal component to render the meanings and supplementary notes.
       * @param {{ data: KanjiObject }} props
       */
      function MeaningsSection({ data: k }) {
        return h("div", { class: "info-section" }, [
          h("div", { class: "info-header" }, "意味"),
          h(
            "div",
            { class: "flex flex-col gap-1" },
            h(
              For,
              { each: k.meaning },
              (/** @type {MeaningItem} */ m, /** @type {() => number} */ index) =>
                h("div", { class: "flex flex-col gap-2" }, [
                  h("div", { class: "meaning-item" }, [
                    h("div", { style: "flex-shrink: 0" }, CIRCLED_NUMBERS[index()] || "•"),
                    h("div", {}, m.meaning),
                  ]),
                  h(For, { each: m.supplementary }, (/** @type {SupplementaryItem} */ s) =>
                    h(
                      "div",
                      {
                        class: `ms-6 p-2 flex rounded-lg items-center gap-2 ${meaningSupplementaryTagBg[s.tag]}`,
                      },
                      [
                        h(
                          "div",
                          {
                            class: `badge-origin ${meaningSupplementaryTagBadge[s.tag]}`,
                          },
                          s.tag,
                        ),
                        h("span", { class: "text-base" }, s.content),
                      ],
                    ),
                  ),
                ]),
            ),
          ),
        ]);
      }

      /**
       * Internal component to render On and Kun readings.
       * @param {{ data: KanjiObject }} props
       */
      function ReadingsSection({ data: k }) {
        return h("div", { class: "info-section text-base" }, [
          h("div", { class: "flex flex-col gap-2" }, [
            h(Show, { when: k.on.length > 0 || k.onGai.length > 0 }, () =>
              h("div", { class: "reading-row" }, [
                h("span", { class: "font-bold" }, "音"),
                h("div", { class: "reading-container" }, [
                  h(For, { each: k.on }, (/** @type {string} */ r) =>
                    h(
                      "div",
                      {
                        class: "px-0.5 border border-base-content-subtle-100",
                      },
                      r,
                    ),
                  ),
                  h(For, { each: k.onGai }, (/** @type {string} */ r) =>
                    h(
                      "div",
                      {
                        class:
                          "px-0.5 text-base-content-faint border border-base-content-subtle-100",
                      },
                      r,
                    ),
                  ),
                ]),
              ]),
            ),
            h(Show, { when: k.kun.length > 0 || k.kunGai.length > 0 }, () =>
              h("div", { class: "reading-row" }, [
                h("span", { class: "font-bold" }, "訓"),
                h("div", { class: "reading-container" }, [
                  h(For, { each: k.kun }, (/** @type {string} */ r) =>
                    h(
                      "div",
                      {
                        class: "px-0.5 border border-base-content-subtle-100",
                      },
                      r,
                    ),
                  ),
                  h(For, { each: k.kunGai }, (/** @type {string} */ r) =>
                    h(
                      "div",
                      {
                        class:
                          "px-0.5 text-base-content-faint border border-base-content-subtle-100",
                      },
                      r,
                    ),
                  ),
                ]),
              ]),
            ),
          ]),
        ]);
      }

      /**
       * @typedef {Object} BigKanjiProps
       * @property {string} header - The title of the section (e.g., "Readings", "Origin")
       * @property {string} kanji - The object containing the kanji value
       */

      /**
       * A reusable component to display a large Kanji with a descriptive header.
       * @param {BigKanjiProps} p
       */
      function BigKanji(p) {
        return h("div", { class: "flex flex-col gap-1 items-center" }, [
          h("div", { class: "" }, p.header),
          h("div", { style: "font-size: 3.5rem; line-height: 4rem" }, p.kanji),
        ]);
      }

      /**
       * Internal component to render the Kadokawa ancient character origins.
       * @param {{ data: KanjiObject }} props
       */
      function KadokawaSection({ data: k }) {
        return h(Show, { when: k.kadokawaNaritachi }, () =>
          h("div", { class: "info-section flex-1" }, [
            h("div", { class: "info-header" }, "古代文字"),
            h("div", { class: "flex gap-2 justify-between" }, [
              h("div", {
                class: "kadokawa-origin-text",
                innerHTML: k.kadokawaNaritachi,
              }),
            ]),
          ]),
        );
      }

      /**
       * Internal component to render the Kadokawa ancient character origins.
       * @param {{ data: KanjiObject }} props
       */
      function BigKanjiSection({ data: k }) {
        return h(Show, { when: k.kyujitai || k.itaiji }, () =>
          h("div", { class: "info-section flex-1" }, [
            h("div", { class: "info-header" }, "別字体"),
            h("div", { class: "flex gap-2" }, [
              h("div", { class: "flex gap-2" }, [
                h(Show, { when: k.kyujitai }, (/** @type {() => {value: string}} */ v) => {
                  return BigKanji({ header: "旧字体", kanji: v().value });
                }),
                h(Show, { when: k.itaiji }, (/** @type {() => {value: string}} */ v) => {
                  return BigKanji({ header: "異体字", kanji: v().value });
                }),
              ]),
            ]),
          ]),
        );
      }

      /**
       * Internal component to render the actual inflated data.
       * @param {Object} props
       * @param {KanjiObject} props.data - The inflated kanji data.
       */
      function KanjiData(props) {
        const k = props.data;

        return h("div", { class: "collapse collapse-arrow rounded-none" }, [
          h("input", { type: "checkbox", class: "p-0", checked: defaultOpen }),
          h(
            "div",
            {
              class: "collapse-title p-0 mb-1 after:text-base-content-calm text-start",
            },
            [h("div", { class: "font-bold text-base-content-calm" }, collapseTitle)],
          ),
          h("div", { class: "collapse-content p-0" }, [
            h("div", { class: "kikuen-plugin-kanji-data" }, [
              h("div", { class: "extra-info-container" }, [
                h(MetadataSection, { data: k }),
                h(MeaningsSection, { data: k }),
                h(NaritachiSection, { data: k }),
                h(
                  "div",
                  {
                    class: "bottom-sections",
                  },
                  [h(KadokawaSection, { data: k }), h(BigKanjiSection, { data: k })],
                ),
              ]),
            ]),
          ]),
        ]);
      }

      function KanjiDataSection() {
        return h(Show, { when: data() }, (/** @type {KanjiObject} */ k) =>
          h(KanjiData, { data: k }),
        );
      }

      function Style() {
        return h("link", {
          rel: "stylesheet",
          href: "_kikuen-plugin-kanji-data.css",
        });
      }

      /** @type{any} */
      const component = [
        Style,
        showVisuallySimilar ? props.sections.VisuallySimilar : null,
        showComposedOf ? props.sections.ComposedOf : null,
        showUsedIn ? props.sections.UsedIn : null,
        showMeanings ? props.sections.Meanings : null,
        showRelated ? props.sections.Related : null,
        KanjiDataSection,
      ];
      return component;
    },
  };

  return plugin;
};
