import { defaultConfig } from "./default-config";
import { objectToCss } from "./dom";
import type { Logger } from "./logger";
import { colorBase100Map, type DaisyUITheme, daisyUIThemes } from "./theme";

export type KikuConfig = {
  theme: DaisyUITheme;
  themeDark: DaisyUITheme;
  systemFontPrimary: string;
  systemFontSecondary: string;
  blurNsfw: boolean;
  muteNsfw: boolean;
  pictureOnFront: boolean;
  showTheme: boolean;
  showStartupTime: boolean;
  ankiConnectAddress: string;
  ankiDroidEnableIntegration: boolean;
  ankiDroidReverseSwipeDirection: boolean;
  swapSentenceAndDefinitionOnMobile: boolean;
  preferAnkiConnect: boolean;
  modHidden: boolean;
  modHiddenDuration: number;
  modVertical: boolean;
  definitionStyle: DefinitionStyle;
  definitionPictureFromGlossary: boolean;
  relatedExpressionExcludeNewCards: boolean;
  relatedExpressionFallback: boolean;
  fontSizeBaseExpression: TailwindSize;
  fontSizeBasePitch: TailwindSize;
  fontSizeBaseSentence: TailwindSize;
  fontSizeBaseMiscInfo: TailwindSize;
  fontSizeBaseHint: TailwindSize;
  fontSizeSmExpression: TailwindSize;
  fontSizeSmPitch: TailwindSize;
  fontSizeSmSentence: TailwindSize;
  fontSizeSmMiscInfo: TailwindSize;
  fontSizeSmHint: TailwindSize;
  layoutMaxWidth: TailwindContainerSize;
  keybindDefinitionPrev: string;
  keybindDefinitionNext: string;
  keybindFieldGroupPrev: string;
  keybindFieldGroupNext: string;
};

// oxfmt-ignore
export const tailwindSize = [ "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", ] as const;
export type TailwindSize = (typeof tailwindSize)[number];

export const definitionStyle = ["normal", "single-page", "glossary-split"] as const;
export type DefinitionStyle = (typeof definitionStyle)[number];
export const tailwindFontSizeVar = {
  xs: { fontSize: "var(--text-xs)", lineHeight: "var(--text-xs--line-height)" },
  sm: { fontSize: "var(--text-sm)", lineHeight: "var(--text-sm--line-height)" },
  md: { fontSize: "var(--text-base)", lineHeight: "var(--text-base--line-height)" },
  lg: { fontSize: "var(--text-lg)", lineHeight: "var(--text-lg--line-height)" },
  xl: { fontSize: "var(--text-xl)", lineHeight: "var(--text-xl--line-height)" },
  "2xl": { fontSize: "var(--text-2xl)", lineHeight: "var(--text-2xl--line-height)" },
  "3xl": { fontSize: "var(--text-3xl)", lineHeight: "var(--text-3xl--line-height)" },
  "4xl": { fontSize: "var(--text-4xl)", lineHeight: "var(--text-4xl--line-height)" },
  "5xl": { fontSize: "var(--text-5xl)", lineHeight: "var(--text-5xl--line-height)" },
  "6xl": { fontSize: "var(--text-6xl)", lineHeight: "var(--text-6xl--line-height)" },
  "7xl": { fontSize: "var(--text-7xl)", lineHeight: "var(--text-7xl--line-height)" },
  "8xl": { fontSize: "var(--text-8xl)", lineHeight: "var(--text-8xl--line-height)" },
  "9xl": { fontSize: "var(--text-9xl)", lineHeight: "var(--text-9xl--line-height)" },
} as const;

export const tailwindContainerSize = ["4xl", "5xl", "6xl", "7xl"] as const;
export type TailwindContainerSize = (typeof tailwindContainerSize)[number];
export const tailwindContainerSizeVar = {
  "4xl": { maxWidth: "var(--container-4xl)" },
  "5xl": { maxWidth: "var(--container-5xl)" },
  "6xl": { maxWidth: "var(--container-6xl)" },
  "7xl": { maxWidth: "var(--container-7xl)" },
};

const rootDatasetArray = [
  "theme",
  "themeDark",
  "blurNsfw",
  "pictureOnFront",
  "modVertical",
] as const;
export type RootDatasetKey = (typeof rootDatasetArray)[number];
export type RootDataset = Partial<Record<RootDatasetKey, string>>;
export const rootDatasetConfigWhitelist = new Set<RootDatasetKey>(rootDatasetArray);

export function validateConfig(config: KikuConfig, logger?: Logger): KikuConfig {
  try {
    if (typeof config !== "object" || config === null) throw new Error();

    // oxfmt-ignore
    const valid: KikuConfig = {
      theme: daisyUIThemes.includes(config.theme) ? config.theme : defaultConfig.theme,
      themeDark: daisyUIThemes.includes(config.themeDark) ? config.themeDark : defaultConfig.themeDark,
      systemFontPrimary: typeof config.systemFontPrimary === "string" ? config.systemFontPrimary : defaultConfig.systemFontPrimary,
      systemFontSecondary: typeof config.systemFontSecondary === "string" ? config.systemFontSecondary : defaultConfig.systemFontSecondary,

      blurNsfw: typeof config.blurNsfw === "boolean" ? config.blurNsfw : defaultConfig.blurNsfw,
      muteNsfw: typeof config.muteNsfw === "boolean" ? config.muteNsfw : defaultConfig.muteNsfw,
      pictureOnFront: typeof config.pictureOnFront === "boolean" ? config.pictureOnFront : defaultConfig.pictureOnFront,
      showTheme: typeof config.showTheme === "boolean" ? config.showTheme : defaultConfig.showTheme,
      showStartupTime: typeof config.showStartupTime === "boolean" ? config.showStartupTime : defaultConfig.showStartupTime,
      ankiConnectAddress: typeof config.ankiConnectAddress === "string" ? config.ankiConnectAddress : defaultConfig.ankiConnectAddress,
      ankiDroidEnableIntegration: typeof config.ankiDroidEnableIntegration === "boolean" ? config.ankiDroidEnableIntegration : defaultConfig.ankiDroidEnableIntegration,
      ankiDroidReverseSwipeDirection: typeof config.ankiDroidReverseSwipeDirection === "boolean" ? config.ankiDroidReverseSwipeDirection : defaultConfig.ankiDroidReverseSwipeDirection,
      swapSentenceAndDefinitionOnMobile: typeof config.swapSentenceAndDefinitionOnMobile === "boolean" ? config.swapSentenceAndDefinitionOnMobile : defaultConfig.swapSentenceAndDefinitionOnMobile,
      preferAnkiConnect: typeof config.preferAnkiConnect === "boolean" ? config.preferAnkiConnect : defaultConfig.preferAnkiConnect,

      modHidden: typeof config.modHidden === "boolean" ? config.modHidden : defaultConfig.modHidden,
      modHiddenDuration: typeof config.modHiddenDuration === "number" && config.modHiddenDuration > 0 ? config.modHiddenDuration : defaultConfig.modHiddenDuration,
      modVertical: typeof config.modVertical === "boolean" ? config.modVertical : defaultConfig.modVertical,
      definitionStyle: definitionStyle.includes(config.definitionStyle) ? config.definitionStyle : defaultConfig.definitionStyle,
      definitionPictureFromGlossary: typeof config.definitionPictureFromGlossary === "boolean" ? config.definitionPictureFromGlossary : defaultConfig.definitionPictureFromGlossary,
      relatedExpressionExcludeNewCards: typeof config.relatedExpressionExcludeNewCards === "boolean" ? config.relatedExpressionExcludeNewCards : defaultConfig.relatedExpressionExcludeNewCards,
      relatedExpressionFallback: typeof config.relatedExpressionFallback === "boolean" ? config.relatedExpressionFallback : defaultConfig.relatedExpressionFallback,

      fontSizeBaseExpression: tailwindSize.includes(config.fontSizeBaseExpression) ? config.fontSizeBaseExpression : defaultConfig.fontSizeBaseExpression,
      fontSizeBasePitch: tailwindSize.includes(config.fontSizeBasePitch) ? config.fontSizeBasePitch : defaultConfig.fontSizeBasePitch,
      fontSizeBaseSentence: tailwindSize.includes(config.fontSizeBaseSentence) ? config.fontSizeBaseSentence : defaultConfig.fontSizeBaseSentence,
      fontSizeBaseMiscInfo: tailwindSize.includes(config.fontSizeBaseMiscInfo) ? config.fontSizeBaseMiscInfo : defaultConfig.fontSizeBaseMiscInfo,
      fontSizeBaseHint: tailwindSize.includes(config.fontSizeBaseHint) ? config.fontSizeBaseHint : defaultConfig.fontSizeBaseHint,
      fontSizeSmExpression: tailwindSize.includes(config.fontSizeSmExpression) ? config.fontSizeSmExpression : defaultConfig.fontSizeSmExpression,
      fontSizeSmPitch: tailwindSize.includes(config.fontSizeSmPitch) ? config.fontSizeSmPitch : defaultConfig.fontSizeSmPitch,
      fontSizeSmSentence: tailwindSize.includes(config.fontSizeSmSentence) ? config.fontSizeSmSentence : defaultConfig.fontSizeSmSentence,
      fontSizeSmMiscInfo: tailwindSize.includes(config.fontSizeSmMiscInfo) ? config.fontSizeSmMiscInfo : defaultConfig.fontSizeSmMiscInfo,
      fontSizeSmHint: tailwindSize.includes(config.fontSizeSmHint) ? config.fontSizeSmHint : defaultConfig.fontSizeSmHint,

      layoutMaxWidth: tailwindContainerSize.includes(config.layoutMaxWidth) ? config.layoutMaxWidth : defaultConfig.layoutMaxWidth,
      keybindDefinitionPrev: typeof config.keybindDefinitionPrev === "string" ? config.keybindDefinitionPrev : defaultConfig.keybindDefinitionPrev,
      keybindDefinitionNext: typeof config.keybindDefinitionNext === "string" ? config.keybindDefinitionNext : defaultConfig.keybindDefinitionNext,
      keybindFieldGroupPrev: typeof config.keybindFieldGroupPrev === "string" ? config.keybindFieldGroupPrev : defaultConfig.keybindFieldGroupPrev,
      keybindFieldGroupNext: typeof config.keybindFieldGroupNext === "string" ? config.keybindFieldGroupNext : defaultConfig.keybindFieldGroupNext,
    };

    return valid;
  } catch (e) {
    logger?.warn("[validateConfig] validation failed, using defaults:", e);
    return defaultConfig;
  }
}

export type CssVar = {
  "--font-primary": string;
  "--font-secondary": string;

  "--font-size-base-expression": string;
  "--line-height-base-expression": string;
  "--font-size-base-pitch": string;
  "--line-height-base-pitch": string;
  "--font-size-base-sentence": string;
  "--line-height-base-sentence": string;
  "--font-size-base-misc-info": string;
  "--line-height-base-misc-info": string;
  "--font-size-base-hint": string;
  "--line-height-base-hint": string;

  "--font-size-sm-expression": string;
  "--line-height-sm-expression": string;
  "--font-size-sm-pitch": string;
  "--line-height-sm-pitch": string;
  "--font-size-sm-sentence": string;
  "--line-height-sm-sentence": string;
  "--font-size-sm-misc-info": string;
  "--line-height-sm-misc-info": string;
  "--font-size-sm-hint": string;
  "--line-height-sm-hint": string;

  "--layout-max-width": string;

  "--color-base-100": string;
};

export type CssVarDark = {
  "--color-base-100": string;
};

export type Dataset = {
  "data-theme": string;
  "data-theme-dark": string;
  //
  "data-field": string;
  "data-transition": "true" | "false";
  "data-tags": string;
  "data-nsfw": "true" | "false";
  "data-blur-nsfw": "true" | "false";
  "data-pitch-type": string;
  "data-has-pitch": string;
  "data-has-hint": string;
  "data-has-picture": string;
  "data-dictionary": string;
};

export type DatasetProp = Partial<Dataset>;

export function getRootDatasetConfig(config: KikuConfig): RootDataset {
  return {
    theme: config.theme,
    themeDark: config.themeDark,
    blurNsfw: config.blurNsfw ? "true" : "false",
    pictureOnFront: config.pictureOnFront ? "true" : "false",
    modVertical: config.modVertical ? "true" : "false",
  };
}

export function getCssVar(config: KikuConfig) {
  // oxfmt-ignore
  const cssVar: CssVar = {
    "--font-primary": config.systemFontPrimary,
    "--font-secondary": config.systemFontSecondary,

    "--font-size-base-expression": tailwindFontSizeVar[config.fontSizeBaseExpression].fontSize,
    "--line-height-base-expression": tailwindFontSizeVar[config.fontSizeBaseExpression].lineHeight,
    "--font-size-base-pitch": tailwindFontSizeVar[config.fontSizeBasePitch].fontSize,
    "--line-height-base-pitch": tailwindFontSizeVar[config.fontSizeBasePitch].lineHeight,
    "--font-size-base-sentence": tailwindFontSizeVar[config.fontSizeBaseSentence].fontSize,
    "--line-height-base-sentence": tailwindFontSizeVar[config.fontSizeBaseSentence].lineHeight,
    "--font-size-base-misc-info": tailwindFontSizeVar[config.fontSizeBaseMiscInfo].fontSize,
    "--line-height-base-misc-info": tailwindFontSizeVar[config.fontSizeBaseMiscInfo].lineHeight,
    "--font-size-base-hint": tailwindFontSizeVar[config.fontSizeBaseHint].fontSize,
    "--line-height-base-hint": tailwindFontSizeVar[config.fontSizeBaseHint].lineHeight,

    "--font-size-sm-expression": tailwindFontSizeVar[config.fontSizeSmExpression].fontSize,
    "--line-height-sm-expression": tailwindFontSizeVar[config.fontSizeSmExpression].lineHeight,
    "--font-size-sm-pitch": tailwindFontSizeVar[config.fontSizeSmPitch].fontSize,
    "--line-height-sm-pitch": tailwindFontSizeVar[config.fontSizeSmPitch].lineHeight,
    "--font-size-sm-sentence": tailwindFontSizeVar[config.fontSizeSmSentence].fontSize,
    "--line-height-sm-sentence": tailwindFontSizeVar[config.fontSizeSmSentence].lineHeight,
    "--font-size-sm-misc-info": tailwindFontSizeVar[config.fontSizeSmMiscInfo].fontSize,
    "--line-height-sm-misc-info": tailwindFontSizeVar[config.fontSizeSmMiscInfo].lineHeight,
    "--font-size-sm-hint": tailwindFontSizeVar[config.fontSizeSmHint].fontSize,
    "--line-height-sm-hint": tailwindFontSizeVar[config.fontSizeSmHint].lineHeight,

    "--layout-max-width": tailwindContainerSizeVar[config.layoutMaxWidth].maxWidth,
    "--color-base-100": colorBase100Map[config.theme],
  };

  return cssVar;
}

export function getCssVarDark(config: KikuConfig) {
  // oxfmt-ignore
  const cssVar: CssVarDark = {
    "--color-base-100": colorBase100Map[config.themeDark],
  }

  return cssVar;
}

export function updateConfigState({
  root,
  host,
  config,
  styleTags = [],
}: {
  root: HTMLElement;
  host: HTMLElement;
  config: KikuConfig;
  styleTags?: HTMLStyleElement[];
}) {
  const dataset = getRootDatasetConfig(config);

  host.dataset.theme = dataset.theme;
  host.dataset.themeDark = dataset.themeDark;

  root.dataset.theme = dataset.theme;
  root.dataset.themeDark = dataset.themeDark;
  root.dataset.blurNsfw = dataset.blurNsfw;
  root.dataset.pictureOnFront = dataset.pictureOnFront;
  root.dataset.modVertical = dataset.modVertical;

  if (styleTags.length > 0) {
    const lightTemplate = generateCssVars(getCssVar(config));
    const darkTemplate = generateCssVarsDark(getCssVarDark(config));
    for (const tag of styleTags) {
      if (!tag?.textContent) continue;
      tag.textContent = tag.textContent
        .replace(LIGHT_VARS_REGEX, lightTemplate)
        .replace(DARK_VARS_REGEX, darkTemplate);
    }
  }
}

export const LIGHT_VARS_REGEX =
  /\.card:has\(> #qa, #content > #qa\), #kikuen-host::part\(root\), #kikuen-root \{[^]*?\}/;
export const DARK_VARS_REGEX =
  /\.card:has\(> #qa, #content > #qa\)\.nightMode, \.nightMode #kikuen-host::part\(root\), \.nightMode #kikuen-root, :host\(\[data-dark-mode\]\) #kikuen-root \{[^]*?\}/;

export function generateCssVars(vars: Record<string, string>): string {
  return objectToCss(".card:has(> #qa, #content > #qa), #kikuen-host::part(root), #kikuen-root", vars);
}

export function generateCssVarsDark(vars: Record<string, string>): string {
  return objectToCss(
    ".card:has(> #qa, #content > #qa).nightMode, .nightMode #kikuen-host::part(root), .nightMode #kikuen-root, :host([data-dark-mode]) #kikuen-root",
    vars,
  );
}
