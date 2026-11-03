export function getTemplatePreview(options: {
  side: string;
  theme: string;
  themeDark: string;
  blurNsfw: string;
  pictureOnFront: string;
  modVertical: string;
}): string {
  let template = `
<kikuen-host-anki
  id="kikuen-host"
  side="__SIDE__"
  ssr
  data-theme="__DATA_THEME__"
  data-theme-dark="__DATA_THEME_DARK__"
></kikuen-host-anki>
<div
  id="kikuen-root"
  part="root"
  data-kikuen-cloak
  data-side="__SIDE__"
  data-theme="__DATA_THEME__"
  data-theme-dark="__DATA_THEME_DARK__"
  data-blur-nsfw="__DATA_BLUR_NSFW__"
  data-picture-on-front="__DATA_PICTURE_ON_FRONT__"
  data-mod-vertical="__DATA_MOD_VERTICAL__"
>
`.trim();
  template = template.replaceAll("__SIDE__", options.side);
  template = template.replaceAll("__DATA_THEME__", options.theme);
  template = template.replaceAll("__DATA_THEME_DARK__", options.themeDark);
  template = template.replaceAll("__DATA_BLUR_NSFW__", options.blurNsfw);
  template = template.replaceAll("__DATA_PICTURE_ON_FRONT__", options.pictureOnFront);
  template = template.replaceAll("__DATA_MOD_VERTICAL__", options.modVertical);
  return template;
}
