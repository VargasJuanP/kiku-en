import kanjiDataPlugin from "./_kikuen-plugin-kanji-data.js";

export const plugin = {
  ...kanjiDataPlugin({
    defaultOpen: true,
    collapseTitle: "Extra Info",
    showVisuallySimilar: false,
    showComposedOf: false,
    showUsedIn: false,
    showMeanings: false,
    showRelated: false,
  }),
};
