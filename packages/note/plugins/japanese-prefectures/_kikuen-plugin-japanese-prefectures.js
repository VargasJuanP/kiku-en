/**
 * Renders a map of Japan's prefectures and highlights the one that matches
 * the current card's expression.
 */

const CONFIG = {
  defaultFill: "#EEEEEE",
  boundaryStroke: "#888888",
  matchFill: "#f97316",
};

/** @type {Record<string, string>} region class -> fill color */
const REGION_COLORS = {
  hokkaido: "#bfdbfe",
  tohoku: "#c4b5fd",
  kanto: "#fbcfe8",
  chubu: "#fde68a",
  kinki: "#bbf7d0",
  chugoku: "#a5f3fc",
  shikoku: "#d9f99d",
  kyushu: "#fed7aa",
  "kyushu-okinawa": "#fed7aa",
};

/** @type {Record<string, [string, string]>} region class -> [name, reading] */
const REGIONS = {
  hokkaido: ["北海道", "ほっかいどう"],
  tohoku: ["東北", "とうほく"],
  kanto: ["関東", "かんとう"],
  chubu: ["中部", "ちゅうぶ"],
  kinki: ["近畿", "きんき"],
  chugoku: ["中国", "ちゅうごく"],
  shikoku: ["四国", "しこく"],
  kyushu: ["九州", "きゅうしゅう"],
  "kyushu-okinawa": ["九州・沖縄", "きゅうしゅう・おきなわ"],
};

/**
 * @param {Element} el
 * @returns {string | null}
 */
function regionKeyOf(el) {
  return Object.keys(REGIONS).find((r) => el.classList.contains(r)) ?? null;
}

/**
 * @typedef {[string, string, string, string]} Prefecture [code, kanji, kana, romaji]
 */

/**
 * @type {Prefecture[]}
 */
const PREFECTURES = [
  ["01", "北海道", "ほっかいどう", "hokkaido"],
  ["02", "青森県", "あおもり", "aomori"],
  ["03", "岩手県", "いわて", "iwate"],
  ["04", "宮城県", "みやぎ", "miyagi"],
  ["05", "秋田県", "あきた", "akita"],
  ["06", "山形県", "やまがた", "yamagata"],
  ["07", "福島県", "ふくしま", "fukushima"],
  ["08", "茨城県", "いばらき", "ibaraki"],
  ["09", "栃木県", "とちぎ", "tochigi"],
  ["10", "群馬県", "ぐんま", "gunma"],
  ["11", "埼玉県", "さいたま", "saitama"],
  ["12", "千葉県", "ちば", "chiba"],
  ["13", "東京都", "とうきょう", "tokyo"],
  ["14", "神奈川県", "かながわ", "kanagawa"],
  ["15", "新潟県", "にいがた", "niigata"],
  ["16", "富山県", "とやま", "toyama"],
  ["17", "石川県", "いしかわ", "ishikawa"],
  ["18", "福井県", "ふくい", "fukui"],
  ["19", "山梨県", "やまなし", "yamanashi"],
  ["20", "長野県", "ながの", "nagano"],
  ["21", "岐阜県", "ぎふ", "gifu"],
  ["22", "静岡県", "しずおか", "shizuoka"],
  ["23", "愛知県", "あいち", "aichi"],
  ["24", "三重県", "みえ", "mie"],
  ["25", "滋賀県", "しが", "shiga"],
  ["26", "京都府", "きょうと", "kyoto"],
  ["27", "大阪府", "おおさか", "osaka"],
  ["28", "兵庫県", "ひょうご", "hyogo"],
  ["29", "奈良県", "なら", "nara"],
  ["30", "和歌山県", "わかやま", "wakayama"],
  ["31", "鳥取県", "とっとり", "tottori"],
  ["32", "島根県", "しまね", "shimane"],
  ["33", "岡山県", "おかやま", "okayama"],
  ["34", "広島県", "ひろしま", "hiroshima"],
  ["35", "山口県", "やまぐち", "yamaguchi"],
  ["36", "徳島県", "とくしま", "tokushima"],
  ["37", "香川県", "かがわ", "kagawa"],
  ["38", "愛媛県", "えひめ", "ehime"],
  ["39", "高知県", "こうち", "kochi"],
  ["40", "福岡県", "ふくおか", "fukuoka"],
  ["41", "佐賀県", "さが", "saga"],
  ["42", "長崎県", "ながさき", "nagasaki"],
  ["43", "熊本県", "くまもと", "kumamoto"],
  ["44", "大分県", "おおいた", "oita"],
  ["45", "宮崎県", "みやざき", "miyazaki"],
  ["46", "鹿児島県", "かごしま", "kagoshima"],
  ["47", "沖縄県", "おきなわ", "okinawa"],
];

/** @type {Map<string, string>} lowercased form -> prefecture code */
const CODE_BY_NAME = new Map();
for (const [code, kanji, kana, romaji] of PREFECTURES) {
  CODE_BY_NAME.set(kanji.toLowerCase(), code);
  CODE_BY_NAME.set(kanji.replace(/[都道府県]$/, "").toLowerCase(), code);
  CODE_BY_NAME.set(kana, code);
  CODE_BY_NAME.set(romaji, code);
}

/** @type {Map<string, [string, string, string, string]>} */
const PREFECTURE_BY_CODE = new Map(PREFECTURES.map((p) => [p[0], p]));

/**
 * @param {string} text
 */
function findPrefectureCode(text) {
  return CODE_BY_NAME.get(text.toLowerCase()) ?? null;
}

/**
 * @param {string | null} code
 */
function findPrefectureByCode(code) {
  return code ? (PREFECTURE_BY_CODE.get(code) ?? null) : null;
}

/**
 * @param {Record<string, string | number | boolean | null | undefined>} obj
 * @returns {string}
 */
function objToStyle(obj) {
  let s = "";
  for (const key in obj) {
    const v = obj[key];
    if (v == null || v === false) continue;
    s += `${key}: ${v}; `;
  }
  return s.trim();
}

/**
 * @param {string} svgText
 */
function processSvg(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  for (const el of doc.querySelectorAll(".prefecture")) {
    const region = Object.keys(REGION_COLORS).find((r) => el.classList.contains(r));
    el.setAttribute("fill", region ? REGION_COLORS[region] : CONFIG.defaultFill);
    el.setAttribute("stroke", CONFIG.boundaryStroke);
  }
  for (const el of doc.querySelectorAll(".boundary-line")) {
    el.setAttribute("stroke", CONFIG.boundaryStroke);
  }
  return new XMLSerializer().serializeToString(doc);
}

const g = /** @type {{
  __japanesePrefecturesMapSvg?: Promise<string>;
  __japanesePrefecturesProcessedSvg?: string;
}} */ (globalThis);

async function fetchSvg() {
  g.__japanesePrefecturesMapSvg ??= fetch("_japanese-prefectures-map-mobile.svg").then((res) =>
    res.text(),
  );
  return g.__japanesePrefecturesMapSvg;
}

/**
 * @param {{
 *   ctx: import("#/plugins/plugin-types").Ctx;
 * }} props
 */
export function JapaneseMap(props) {
  const { ctx } = props;
  const { h, createMemo, Suspense, Show, useAnkiFieldContext, useCardContext } = ctx;
  const { $initialSide } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext();

  const $code = createMemo(
    () =>
      findPrefectureCode($ankiFields.Expression) ??
      findPrefectureCode($ankiFields.ExpressionReading),
  );

  return h(
    Show,
    { when: () => $initialSide() === "back" && $code() },
    h(
      Suspense,
      {
        fallback: h("div", { class: "flex flex-col items-center gap-1" }, [
          h("span", { class: "loading loading-dots text-base-content-calm" }),
        ]),
      },
      h($JapaneseMap, { ctx, code: $code })(),
    )(),
  )();
}

/**
 * @param {{
 *   ctx: import("#/plugins/plugin-types").Ctx;
 *   code: string | null;
 * }} props
 */
function $JapaneseMap(props) {
  const {
    h,
    createMemo,
    createEffect,
    createSignal,
    createResource,
    onCleanup,
    Portal,
    Show,
    useGeneralContext,
  } = props.ctx;
  const { $general } = useGeneralContext();

  const [svgText] = createResource(() => (props.code ? true : false), fetchSvg);

  const $svg = createMemo(() => {
    const text = svgText();
    if (!text) return null;
    g.__japanesePrefecturesProcessedSvg ??= processSvg(text);
    return g.__japanesePrefecturesProcessedSvg;
  });

  const [$svgContainerRef, $setSvgContainerRef] = createSignal(
    /** @type {HTMLDivElement | null} */ (null),
  );

  createEffect(() => {
    const root = $svgContainerRef()?.querySelector("svg");
    if (!root) return;
    root.setAttribute("width", "100%");
    root.setAttribute("style", objToStyle({ height: "auto", display: "block" }));
  });

  const [$hoverCode, $setHoverCode] = createSignal(/** @type {string | null} */ (null));
  const $hoverPrefecture = createMemo(() => findPrefectureByCode($hoverCode()));
  const [$hoverRegion, $setHoverRegion] = createSignal(/** @type {string | null} */ (null));

  const [$activeCode, $setActiveCode] = createSignal(/** @type {string | null} */ (null));
  const $activePrefecture = createMemo(() => findPrefectureByCode($activeCode()));

  const [$dialogRef, $setDialogRef] = createSignal(/** @type {HTMLDialogElement | null} */ (null));

  createEffect(() => {
    const svgContainerRef = $svgContainerRef();
    const svg = $svg();
    if (!svgContainerRef || !svg) return;
    const root = svgContainerRef?.querySelector("svg");
    if (!root) return;
    const onEnter = (/** @type {Event} */ e) => {
      const el = /** @type {SVGGElement} */ (e.currentTarget);
      el.classList.add("hover");
      $setHoverCode(el.dataset.code ?? null);
      $setHoverRegion(regionKeyOf(el));
    };
    const onLeave = (/** @type {Event} */ e) => {
      const el = /** @type {SVGGElement} */ (e.currentTarget);
      el.classList.remove("hover");
      $setHoverCode(null);
      $setHoverRegion(null);
    };
    const onClick = (/** @type {Event} */ e) => {
      const el = /** @type {SVGGElement} */ (e.currentTarget);
      $setActiveCode(el.dataset.code ?? null);
      $dialogRef()?.showModal();
    };
    const prefectures = root.querySelectorAll(".prefecture");
    for (const el of prefectures) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("click", onClick);
    }
    onCleanup(() => {
      for (const el of prefectures) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("click", onClick);
      }
    });
  });

  createEffect(() => {
    const svgContainerRef = $svgContainerRef();
    const svg = $svg();
    if (!svgContainerRef || !svg) return;
    const root = svgContainerRef?.querySelector("svg");
    const code = props.code;
    if (!root || !code) return;
    const gEl = root.querySelector(`[data-code="${code}"]`);
    let /** @type string | null | undefined */ originalFill;
    if (gEl) {
      gEl.classList.toggle("match", true);
      if (CONFIG.matchFill) {
        originalFill = gEl?.getAttribute("fill");
        gEl.setAttribute("fill", CONFIG.matchFill);
      }
    }
    onCleanup(() => {
      gEl?.classList.toggle("match", false);
      if (CONFIG.matchFill && typeof originalFill === "string")
        gEl?.setAttribute("fill", originalFill);
      if (CONFIG.matchFill && originalFill === null) gEl?.removeAttribute("fill");
    });
  });

  const [$large, $setLarge] = createSignal(false);
  const $largeLabel = createMemo(() => ($large() ? "Shrink" : "Expand"));

  const ExternalLink = (/** @type {{url: string}} */ props) => {
    return h(
      "a",
      { href: () => props.url, target: "_blank", class: "text-base-content-primary" },
      () => props.url,
    );
  };

  return h(
    Show,
    { when: () => props.code },
    h("div", { class: "japanese-prefectures-map" }, [
      h("div", {
        innerHTML: $svg,
        ref: $setSvgContainerRef,
        style: () => objToStyle({ width: "100%", "max-width": $large() ? "48rem" : "24rem" }),
      }),
      h("div", { class: "japanese-prefectures-side" }, [
        h(
          "button",
          { class: "btn btn-sm text-base-content-calm", onClick: () => $setLarge((v) => !v) },
          () => $largeLabel(),
        ),
        h("div", { class: "flex flex-col gap-1 items-center" }, [
          h(Show, { when: $hoverPrefecture }, (/** @type {() => Prefecture} */ name) =>
            h("div", { class: "text-2xl text-base-content-calm" }, [
              h("ruby", [name()[1], h("rt", name()[2])]),
            ]),
          ),
          h(Show, { when: $hoverRegion }, (/** @type {() => string} */ region) =>
            h("div", { class: "text-xl text-base-content-soft" }, [
              h("ruby", [REGIONS[region()][0], h("rt", REGIONS[region()][1])]),
            ]),
          ),
        ]),
      ]),
      h(
        Portal,
        { mount: () => $general.layoutRef },
        h("dialog", { class: "modal", ref: $setDialogRef }, [
          h("div", { class: "modal-box" }, [
            h("div", { class: "flex flex-col gap-1" }, [
              h("div", { class: "text-lg font-bold" }, () => $activePrefecture()?.[1]),
              h(ExternalLink, {
                url: () => `https://ja.wikipedia.org/wiki/${$activePrefecture()?.[1]}`,
              }),
              h(ExternalLink, {
                url: () => `https://www.google.com/maps/search/${$activePrefecture()?.[1]}`,
              }),
              h(ExternalLink, {
                url: () => `https://fudoki.app/prefecture/${$activePrefecture()?.[3]}`,
              }),
            ]),
            h("div", { class: "modal-action" }, [
              h("form", { method: "dialog" }, [h("button", { class: "btn" }, "Close")]),
            ]),
          ]),
          h("form", { method: "dialog", class: "modal-backdrop" }, [h("button", "Close")]),
        ]),
      ),
    ])(),
  )();
}
