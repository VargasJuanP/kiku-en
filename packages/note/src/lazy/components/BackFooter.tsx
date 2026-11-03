import { createMemo, ErrorBoundary, Show } from "solid-js";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { isYomitanPageTitle } from "#/src/lib/misc-info";
import { InfoIcon } from "./Icons";
import { Tag } from "./Tag";

export function BackFooter() {
  const { $general } = useGeneralContext();
  const { $group } = useFieldGroupContext();
  const ctx = useCtxContext();
  // Words looked up in Yomitan's own pages have no real source to show.
  const $miscInfo = createMemo(() =>
    isYomitanPageTitle($group().miscInfoField) ? "" : $group().miscInfoField,
  );

  function DefaultFooter() {
    return (
      <>
        {$miscInfo() && (
          <div
            class={`flex gap-2 items-center justify-center bg-base-200 p-2 rounded-lg animate-fade-in misc-info`}
          >
            <div class="min-w-4">
              <InfoIcon class="size-4 text-base-content-calm" />
            </div>
            <div class="text-base-content-calm" innerHTML={$miscInfo()}></div>
          </div>
        )}
        <Tag />
      </>
    );
  }

  return (
    <ErrorBoundary fallback={<DefaultFooter />}>
      <Show when={$general.plugin?.Footer} fallback={<DefaultFooter />}>
        {(get) => {
          const Footer = get();
          return <Footer ctx={ctx} DefaultFooter={DefaultFooter} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}
