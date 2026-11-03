import { JapaneseMap } from "./_kikuen-plugin-japanese-prefectures.js";

/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  Sentence: (props) => {
    const { ctx, DefaultSentence } = props;
    const { h } = ctx;

    return [h(JapaneseMap, { ctx })(), DefaultSentence()];
  },
};
