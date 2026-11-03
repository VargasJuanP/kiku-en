/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  ExternalLinks: (props) => {
    const { html, useGeneralContext } = props.ctx;
    const { ankiDroidAPI } = useGeneralContext();

    function TatoebaLink() {
      const url = new URL("https://tatoeba.org/en/sentences/search");
      url.searchParams.set("from", "eng");
      url.searchParams.set("query", props.ctx.$ankiFields.Expression);
      return html`<a href=${url.toString()} title="Tatoeba: example sentences">
        <span
          class="inline-flex items-center justify-center size-6 rounded-md ring-1 ring-base-content/10 text-xs font-bold bg-base-300 text-base-content-calm"
          >T</span
        >
      </a>`;
    }

    function AnkiDroidBrowseButton() {
      const onclick = () => {
        void ankiDroidAPI?.ankiSearchCard(
          `"note:Kiku EN" AND "Expression:*${props.ctx.$ankiFields.Expression}*"`,
        );
      };
      return html`<button class="text-xs btn btn-xs" on:click=${onclick}>Browse</button>`;
    }

    return [
      // includes the default ExternalLinks
      props.DefaultExternalLinks(),
      TatoebaLink(),
      AnkiDroidBrowseButton(),
      // you can create as many links as you want
    ];
  },
};
