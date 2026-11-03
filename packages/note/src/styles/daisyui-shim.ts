import type { PluginAPI } from "tailwindcss/plugin";
import daisyui from "daisyui";
// https://github.com/tailwindlabs/tailwindcss-intellisense/issues/1596
/* oxlint-disable  */
import { daisyUIThemes, type DaisyUITheme } from "../../src/lib/theme";
type CssInJs = Parameters<PluginAPI["addBase"]>[0];

const themeSelectorPattern = /\[data-theme=([^\]\s,]+)\]/g;

function getThemeNames(selector: string): string[] {
  const names: string[] = [];
  for (const match of selector.matchAll(themeSelectorPattern)) {
    const name = match[1].replace(/^["']|["']$/g, "");
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

const createThemeSelector = (theme: DaisyUITheme) => {
  const selectorList = [
    `#kikuen-root[data-theme="${theme}"]`,
    `:host([data-dark-mode]) #kikuen-root[data-theme-dark="${theme}"]`,
    `.nightMode #kikuen-root[data-theme-dark="${theme}"]`,
    // with #kikuen-host::part(root)
    `#kikuen-host[data-theme="${theme}"]::part(root)`,
    `.nightMode #kikuen-host[data-theme-dark="${theme}"]::part(root)`,
    // preview
    `[data-theme-preview="${theme}"]`,
  ];
  return selectorList;
};

function adjustThemeSelectors(rules: CssInJs): CssInJs {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) return rules;

  const output: CssInJs = { ...rules };

  for (const [selector, value] of Object.entries(rules)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;

    if (selector.startsWith("@")) {
      output[selector] = adjustThemeSelectors(value as CssInJs);
      continue;
    }

    if (!selector.includes("[data-theme=") || selector.includes("[data-theme-dark=")) continue;

    let newSelector: string = selector;
    for (const theme of getThemeNames(selector)) {
      const selectorList = createThemeSelector(theme as DaisyUITheme);
      newSelector = selectorList.join(", ");
    }

    if (newSelector !== selector) {
      delete output[selector];
      output[newSelector] = value;
    }
  }

  return output;
}

function addColorBaseContentPrimary(addBase: PluginAPI["addBase"]) {
  const themeWithDarkerValue: DaisyUITheme[] = [
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "synthwave",
    "retro",
    "cyberpunk",
    "garden",
    "pastel",
    "wireframe",
    "black",
    "business",
    "acid",
  ];

  const darkerValueSelectorList = [];
  for (const theme of daisyUIThemes) {
    if (themeWithDarkerValue.includes(theme)) {
      const selector = createThemeSelector(theme);
      darkerValueSelectorList.push(...selector);
    }
  }

  const darkerValueSelector = darkerValueSelectorList.join(", ");

  addBase({
    [darkerValueSelector]: {
      "--color-base-content-primary":
        "color-mix(in srgb, var(--color-primary) 50%, var(--color-base-content))",
    },
  });
}

function daisyuiShim(options: Record<string, unknown> = {}) {
  const { handler, config } = daisyui(options);
  return {
    handler: (api: PluginAPI) => {
      const shimmedAddBase = (rules: CssInJs) => {
        const modifiedRules = adjustThemeSelectors(rules);
        api.addBase(modifiedRules);
      };
      handler({ ...api, addBase: shimmedAddBase });
      addColorBaseContentPrimary(api.addBase);
    },
    config,
  };
}
daisyuiShim.__isOptionsFunction = true;
export default daisyuiShim;
