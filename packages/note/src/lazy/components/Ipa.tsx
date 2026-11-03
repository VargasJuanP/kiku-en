import { createMemo, ErrorBoundary, For, Show } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseIpa, type IpaVariant } from "#/src/lib/ipa";

/** The word's pronunciations in IPA, one chip per variant (e.g. UK and US). */
export function Ipa() {
  const { $ankiFields } = useAnkiFieldContext();
  const $variants = createMemo(() => parseIpa($ankiFields.ExpressionIPA));

  return (
    <For each={$variants()}>
      {(variant, index) => <IpaVariantView variant={variant} index={index()} />}
    </For>
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
