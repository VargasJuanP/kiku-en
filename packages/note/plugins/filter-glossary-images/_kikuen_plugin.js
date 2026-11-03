/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  glossaryImagesFilter: (img) => {
    return (
      !img.closest('li[data-dictionary="使い方の分かる 類語例解辞典"]') &&
      !img.closest('li[data-dictionary="新選国語辞典　第十版"]')
    );
  },
};
