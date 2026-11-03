import { createEffect, createMemo, lazy, Match, on, onMount, Switch } from "solid-js";
import { isServer } from "solid-js/web";
import { CardStoreContextProvider, useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { isNsfw } from "#/src/lib/util";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { useNavigationTransition } from "#/src/hooks/transition";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { AnkiFieldContextProvider, useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { CtxContextProvider } from "#/src/contexts/CtxContext";
import { FieldGroupContextProvider } from "#/src/contexts/FieldGroupContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { ExpressionSection } from "./ExpressionSection";

// oxfmt-ignore
const Lazy = {
  Settings: lazy(async () => ({ default: (await import("#/src/lazy")).Settings })),
  CardEnd: lazy(async () => ({ default: (await import("#/src/lazy")).CardEnd })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  BackFooter: lazy(async () => ({ default: (await import("#/src/lazy")).BackFooter })),
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  AudioElements: lazy(async () => ({ default: (await import("#/src/lazy")).AudioElements })),
  PictureModal: lazy(async () => ({ default: (await import("#/src/lazy")).PictureModal })),
  BackBody: lazy(async () => ({ default: (await import("#/src/lazy")).BackBody })),
  Ipa: lazy(async () => ({ default: (await import("#/src/lazy")).Ipa })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
  AnkiMobileDebug: lazy(async () => ({ default: (await import("#/src/lazy")).AnkiMobileDebug })),
  RelatedExpression: lazy(async () => ({ default: (await import("#/src/lazy")).RelatedExpression, })),
  Frequency: lazy(async () => ({ default: (await import("#/src/lazy")).Frequency })),
};

export function Back(props: { onExitNested?: () => void }) {
  const { navigateBack } = useNavigationTransition();
  const { $card, $setCard, nested } = useCardContext();
  const { $ankiFields, $isInitialAnkiFields } = useAnkiFieldContext();
  const loadPlugin = useLoadPlugin();
  const { logger } = useGeneralContext();

  onMount(() => {
    setTimeout(() => {
      $setCard("ready", true);
      logger.info("[Back] ready, expression:", $ankiFields.Expression);
      loadPlugin();
    }, 0);
  });

  createEffect(
    on(
      () => $card.page,
      () => $setCard("fadeInTopSection", true),
      { defer: true },
    ),
  );

  const $ipaFieldDataset = createMemo<DatasetProp>(() => ({
    "data-has-ipa": isServer
      ? "{{#ExpressionIPA}}true{{/ExpressionIPA}}"
      : $card.ready
        ? $ankiFields.ExpressionIPA
          ? "true"
          : ""
        : "",
  }));

  return (
    <>
      {$card.ready && !nested && <Lazy.UseAnkiDroid />}
      <Switch>
        <Match when={$card.page === "settings" && $card.ready}>
          <Lazy.Settings />
        </Match>
        <Match when={$card.page === "nested" && $card.ready}>
          <AnkiFieldContextProvider
            initialAnkiFields={$card.nestedAnkiFields}
            noteId={$card.nestedNoteId}
          >
            <CardStoreContextProvider
              nested
              initialSide="back"
              isMergePreview={$card.nestedIsMergePreview}
              initialNsfw={isNsfw($card.nestedAnkiFields.Tags)}
            >
              <FieldGroupContextProvider>
                <CtxContextProvider>
                  <Back onExitNested={navigateBack} />
                </CtxContextProvider>
              </FieldGroupContextProvider>
            </CardStoreContextProvider>
          </AnkiFieldContextProvider>
        </Match>
        <Match when={$card.page === "main"}>
          {$card.ready && <Lazy.HeaderMain onExitNested={props.onExitNested} />}
          <div class="flex flex-col">
            <div class="flex justify-between gap-2 items-start mb-0.5 sm:mb-2">
              <div
                class="text-xl sm:text-2xl min-h-lh hover:h-auto overflow-hidden transition-[height] [interpolate-size:allow-keywords] w-full"
                classList={{
                  "h-lh": $isInitialAnkiFields(),
                  "h-auto": !$isInitialAnkiFields(),
                }}
              >
                {$card.ready && <Lazy.RelatedExpression />}
              </div>
              <div class="mt-1 min-w-20 flex justify-end">{$card.ready && <Lazy.Frequency />}</div>
            </div>
            <div
              class="expression-picture-box"
              classList={{
                "animate-fade-in": $card.fadeInTopSection,
              }}
            >
              <div class="expression-audio-box">
                <ExpressionSection />
                <div
                  class="mt-2 sm:mt-4 gap-4 flex-wrap justify-center items-center ipa ipa-field min-h-lh"
                  {...$ipaFieldDataset()}
                >
                  {$ankiFields.ExpressionIPA && $card.ready && <Lazy.Ipa />}
                </div>
                <div class="hidden sm:block sm:h-8 sm:mt-2">
                  {$card.ready && (
                    <div class="animate-fade-in-sm flex gap-2">
                      <Lazy.AudioButtons position={1} />
                    </div>
                  )}
                </div>
              </div>
              <PictureSection />
            </div>
            {$card.ready && <FieldGroupPaginationSection />}
          </div>
          {$card.ready && <Lazy.BackBody />}
          {$card.ready && (
            <>
              <Lazy.BackFooter />
              <Lazy.AudioButtons position={2} />
            </>
          )}
          {$card.ready && <Lazy.CardEnd />}
        </Match>
      </Switch>
      {$card.ready && <Lazy.PictureModal />}
      {$card.ready && <Lazy.AudioElements />}
    </>
  );
}
