/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  Sentence: (props) => {
    const { html, createMemo } = props.ctx;

    function ExtraInfo() {
      const $extraInfo = createMemo(() => {
        if ("ExtraInfo" in props.ctx.$ankiFields) {
          return props.ctx.$ankiFields?.ExtraInfo;
        }
        const template = document.getElementById("ExtraInfo");
        return template?.innerHTML;
      });

      if (!$extraInfo()) return null;
      return html`<div class="text-lg text-base-content-calm" innerHTML=${$extraInfo}></div>`;
    }

    return [props.DefaultSentence(), ExtraInfo()];
  },
};
