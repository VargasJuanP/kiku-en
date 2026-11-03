/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  Sentence: (props) => {
    const { html, useAnkiFieldContext, createMemo } = props.ctx;
    const { $ankiFields } = useAnkiFieldContext();

    function MiscInfo() {
      const $miscInfo = createMemo(() => $ankiFields.MiscInfo);
      if (!$miscInfo()) return null;
      return html`<div
        class="bg-base-200 p-2 rounded-lg animate-fade-in misc-info text-base-content-calm"
        innerHTML=${$miscInfo}
      ></div>`;
    }

    return [props.DefaultSentence(), MiscInfo()];
  },

  Footer: (props) => {
    const { html, useGeneralContext, onMount } = props.ctx;
    const DefaultFooter = props.DefaultFooter;
    const { $general } = useGeneralContext();
    const shadow = $general.host?.shadowRoot;

    /**
     * Converts an object of styles into a CSS rule string.
     *
     * @param {string} selector - The CSS selector (e.g., '.btn', '#header').
     * @param {Object.<string, string|number>} styles - The key-value pairs of CSS properties and values.
     * @returns {string} The formatted CSS block.
     */
    function objectToCss(selector, styles) {
      const body = Object.entries(styles)
        .map(([key, val]) => `  ${key}: ${val};`)
        .join("\n");

      return `${selector} {\n${body}\n}`;
    }

    function Footer() {
      onMount(() => {
        if (!shadow) return;
        const css = new CSSStyleSheet();
        css.insertRule(objectToCss(".custom-footer .misc-info", { display: "none" }));
        shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, css];
      });

      return html`<div class="custom-footer">${DefaultFooter}</div>`;
    }

    return [Footer()];
  },
};
