/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  onPluginLoad: ({ ctx }) => {
    const { $general } = ctx.useGeneralContext();
    const root = $general.root;
    const layout = $general.layoutRef;
    const fontsPool = [
      "'Georgia', serif",
      "'Times New Roman', serif",
      "'Palatino Linotype', 'Palatino', serif",
      "'Verdana', sans-serif",
      "'Trebuchet MS', sans-serif",
      "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      "'Comic Sans MS', 'Chalkboard SE', cursive",
    ];

    const randomFont = fontsPool[Math.floor(Math.random() * fontsPool.length)];

    const { $initialSide } = ctx.useCardContext();
    let font = sessionStorage.getItem("random-font") ?? randomFont;
    if ($initialSide() === "front") {
      font = randomFont;
      sessionStorage.setItem("random-font", font);
    }

    if (layout) layout.style.setProperty("--font-secondary", font);

    // wait until the font is loaded
    document.fonts.onloadingdone = () => {
      if (root) root.dataset.hideSecondary = "false";
    };
    // safe guard when fonts.onloadingdone event fails
    const delay = 100; // ms
    setTimeout(() => {
      if (root) root.dataset.hideSecondary = "false";
    }, delay);
  },
};
