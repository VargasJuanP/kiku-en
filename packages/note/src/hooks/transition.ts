import { useBreakpointContext } from "#/src/contexts/BreakpointContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { daisyUIThemes, type DaisyUITheme } from "#/src/lib/theme";

export function useViewTransition() {
  function startViewTransition(callback: () => void, opts: { beforeCallback?: () => void } = {}) {
    if (document.startViewTransition) {
      opts.beforeCallback?.();
      return document.startViewTransition(callback);
    } else {
      callback();
    }
  }
  return startViewTransition;
}

export function useNavigationTransition() {
  const { $card, $setCard } = useCardContext();
  const bp = useBreakpointContext();
  const startViewTransition = useViewTransition();

  function navigate(
    destination: "main" | "settings" | "nested" | "word" | (() => void),
    direction: "back" | "forward",
    navigateBack?: () => void,
  ) {
    if (navigateBack) $setCard("navigateBack", (old) => [...old, navigateBack]);
    const start = () => {
      if (typeof destination === "function") {
        destination();
      } else {
        $setCard("page", destination);
      }
    };

    if (!bp.isAtLeast("sm")) {
      startViewTransition(start, {
        beforeCallback() {
          document.documentElement.dataset.transitionDirection = direction;
        },
      })
        ?.finished.then(() => {
          document.documentElement.removeAttribute("data-transition-direction");
        })
        .catch(() => {});
    } else {
      start();
    }
  }
  function navigateBack() {
    const last = $card.navigateBack[$card.navigateBack.length - 1];
    $setCard("navigateBack", (list) => list.slice(0, -1));
    last?.();
  }

  return { navigate, navigateBack };
}

export function useThemeTransition() {
  const { isAnkiDesktop, initialDarkMode } = useGeneralContext();
  const { $config, $setConfig } = useConfigContext();
  const startViewTransition = useViewTransition();
  const { $$card } = useCardContext();

  function $changeTheme(theme: DaisyUITheme, mode: "light" | "dark") {
    const key = mode === "dark" ? "themeDark" : "theme";
    if ($$card.loading || isAnkiDesktop) {
      $setConfig(key, theme);
    } else {
      startViewTransition(() => $setConfig(key, theme), {
        beforeCallback() {
          document.documentElement.dataset.themeTransition = "true";
        },
      })
        ?.finished.then(() => {
          document.documentElement.removeAttribute("data-theme-transition");
        })
        .catch(() => {});
    }
  }

  function $changeThemeNext() {
    const current = initialDarkMode ? $config.themeDark : $config.theme;
    const index = daisyUIThemes.indexOf(current);
    const nextTheme = daisyUIThemes[(index + 1) % daisyUIThemes.length];
    $changeTheme(nextTheme, initialDarkMode ? "dark" : "light");
  }

  return { $changeTheme, $changeThemeNext };
}

export function usePictureModalTransition() {
  const { $setCard } = useCardContext();
  const startViewTransition = useViewTransition();

  function $setPictureModal(img: string | undefined) {
    startViewTransition(() => $setCard("pictureModal", img));
  }

  return { $setPictureModal };
}
