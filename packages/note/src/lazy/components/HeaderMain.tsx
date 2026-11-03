import { createMemo, createUniqueId, ErrorBoundary, Match, Show, Suspense, Switch } from "solid-js";
import { useNavigationTransition, useThemeTransition } from "#/src/hooks/transition";
import { capitalize } from "#/src/lib/text";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { HeaderLayout } from "./HeaderLayout";
import { ArrowLeftIcon, BoltIcon, PaintbrushIcon } from "./Icons";
import { MergeContextModal } from "./MergeContextModal";

export function HeaderMain(props: { onExitNested?: () => void }) {
  const { $initialSide, $$card, nested, isMergePreview } = useCardContext();
  const { $config, $isConfigOutOfSync } = useConfigContext();
  const { initialDarkMode, $preStartupTime, $startupTime, isAnkiDroidNewStudyScreen } =
    useGeneralContext();
  const { navigate } = useNavigationTransition();
  const { $changeThemeNext } = useThemeTransition();

  return (
    <HeaderLayout>
      <div class="flex gap-1 sm:gap-2 items-center animate-fade-in-sm">
        <Switch>
          <Match when={nested}>
            <button on:click={props.onExitNested} on:touchend={(e) => e.stopPropagation()}>
              <ArrowLeftIcon class="size-5 cursor-pointer text-base-content-soft" />
            </button>
            <Show when={!isMergePreview}>
              <MergeContextModal />
            </Show>
          </Match>
          <Match when={!nested}>
            <div class="relative">
              <div class="flex items-center">
                <button
                  on:click={() => {
                    navigate("settings", "forward", () => navigate("main", "back"));
                  }}
                  on:touchend={(e) => e.stopPropagation()}
                >
                  <BoltIcon class="size-5 text-base-content-soft cursor-pointer"></BoltIcon>
                </button>
              </div>

              <Show when={$isConfigOutOfSync()}>
                <div class="status status-warning absolute top-0 right-0 translate-x-0.5 -translate-y-0.5"></div>
              </Show>
            </div>
            <Show when={$config.showTheme}>
              <button
                class="flex gap-1 sm:gap-2 items-center cursor-pointer"
                on:click={() => $changeThemeNext()}
                on:touchend={(e) => e.stopPropagation()}
              >
                <PaintbrushIcon class="size-5 cursor-pointer text-base-content-soft"></PaintbrushIcon>
                <span class="text-base-content-soft text-xs sm:text-sm">
                  {capitalize(initialDarkMode ? $config.themeDark : $config.theme)}
                </span>
              </button>
            </Show>
            <Show when={$config.showStartupTime}>
              <div class="text-base-content-soft bg-warning/10 rounded-sm px-px sm:px-1 text-xs sm:text-sm">
                {Math.round($preStartupTime() + $startupTime())}
                {$preStartupTime() + $startupTime() !== 0 && "ms"}
              </div>
            </Show>
          </Match>
        </Switch>
      </div>
      <div class="flex gap-1 sm:gap-2 items-center">
        <Show when={!isMergePreview}>
          <Switch>
            <Match when={$$card.state === "pending" || $$card.state === "unresolved"}>
              <span
                class="loading loading-dots loading-xs text-base-content-faint animate-fade-in-sm"
                classList={{
                  "me-4": $initialSide() === "front" && isAnkiDroidNewStudyScreen,
                }}
              ></span>
            </Match>
            <Match when={$$card.state === "errored"}>
              <div class="status status-error animate-ping"></div>
            </Match>
          </Switch>
        </Show>
      </div>
    </HeaderLayout>
  );
}
