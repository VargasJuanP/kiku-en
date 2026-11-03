import { createMemo, createSignal, ErrorBoundary, For, Show } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { orderForDisplay, parseIpa, type IpaVariant } from "#/src/lib/ipa";

/** Dictionaries like Wiktionary list dozens of accents; the rest are one tap away. */
const VISIBLE_VARIANTS = 2;

/** The word's pronunciations in IPA, one chip per variant (e.g. UK and US). */
export function Ipa() {
  const { $ankiFields } = useAnkiFieldContext();
  const $variants = createMemo(() => orderForDisplay(parseIpa($ankiFields.ExpressionIPA)));
  const [$expanded, $setExpanded] = createSignal(false);
  const $visible = createMemo(() =>
    $expanded() ? $variants() : $variants().slice(0, VISIBLE_VARIANTS),
  );
  const $hiddenCount = createMemo(() => $variants().length - $visible().length);

  return (
    <>
      <For each={$visible()}>
        {(variant, index) => <IpaVariantView variant={variant} index={index()} />}
      </For>
      <Show when={$hiddenCount() > 0 || $expanded()}>
        <button
          type="button"
          class="btn btn-xs btn-ghost text-base-content-soft"
          on:click={() => $setExpanded((expanded) => !expanded)}
          on:touchend={(e) => e.stopPropagation()}
        >
          {$expanded() ? "less" : `+${$hiddenCount()}`}
        </button>
      </Show>
    </>
  );
}

function IpaVariantView(props: { variant: IpaVariant; index: number }) {
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  return (
    <ErrorBoundary fallback={<DefaultIpa {...props} />}>
      <Show when={$general.plugin?.Ipa} fallback={<DefaultIpa {...props} />}>
        {(get) => {
          const Ipa = get();
          return (
            <Ipa
              ctx={ctx}
              index={props.index}
              variant={props.variant}
              DefaultIpa={(props) => <DefaultIpa {...props} />}
            />
          );
        }}
      </Show>
    </ErrorBoundary>
  );
}

export function DefaultIpa(props: { variant: IpaVariant; index: number }) {
  return (
    <div class="flex items-baseline gap-1 animate-fade-in-sm">
      <span class="ipa-transcription text-base-content-calm">{props.variant.transcription}</span>
      <Show when={props.variant.label}>
        <span class="text-sm px-1 rounded-sm leading-tight bg-base-200 text-base-content-soft">
          {props.variant.label}
        </span>
      </Show>
    </div>
  );
}
