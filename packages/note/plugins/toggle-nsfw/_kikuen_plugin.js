/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  ExternalLinks: (props) => {
    const {
      html,
      createSignal,
      createMemo,
      useGeneralContext,
      useCardContext,
      useConfigContext,
      useAnkiFieldContext,
    } = props.ctx;
    const [$pressed, $setPressed] = createSignal(false);
    const { $general } = useGeneralContext();
    const { initialAnkiFields } = useAnkiFieldContext();
    const { $card, $setCard } = useCardContext();
    const { $config: config } = useConfigContext();

    const $cardId = createMemo(() => initialAnkiFields.CardID);

    function ToggleNsfwButton() {
      const onclick = async () => {
        const address = config.ankiConnectAddress;

        const invoke = async (action = "", params = {}) => {
          const res = await fetch(address, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, version: 6, params }),
          });
          return (await res.json()).result;
        };

        try {
          const noteIds = await invoke("findNotes", {
            query: `cid:${$cardId()}`,
          });
          const noteId = noteIds?.[0];
          if (!noteId) return;

          const noteInfos = await invoke("notesInfo", { notes: [noteId] });
          const tags = noteInfos?.[0]?.tags || [];
          const isNsfw = tags.some((/**@type {string}*/ t) => t.toLowerCase() === "nsfw");

          //TODO: update Tags instead
          if (isNsfw) {
            await invoke("removeTags", { notes: [noteId], tags: "NSFW" });
            $setCard("isNsfw", false);
            $general.toast.success("NSFW has been removed!");
          } else {
            await invoke("addTags", { notes: [noteId], tags: "NSFW" });
            $setCard("isNsfw", true);
            $general.toast.success("NSFW has been added!");
          }
          $setPressed(true);
        } catch (e) {
          console.error("Failed to toggle NSFW:", e);
          $general.toast.error("Failed to toggle NSFW");
        }
      };

      const $classList = createMemo(() => ({
        "btn-error": $card.isNsfw,
      }));

      return html`<button
        disabled=${$pressed}
        class="text-sm btn btn-xs"
        classList=${$classList}
        on:click=${onclick}
      >
        NSFW2
      </button>`;
    }

    /** @type{any} */
    const component = [props.DefaultExternalLinks(), ToggleNsfwButton()];
    return component;
  },
};
