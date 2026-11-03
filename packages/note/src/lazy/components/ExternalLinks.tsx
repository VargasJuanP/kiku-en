import { createMemo, ErrorBoundary, For, Show } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseHtml } from "#/src/lib/dom";

export function ExternalLinks() {
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  return (
    <ErrorBoundary fallback={<DefaultExternalLinks />}>
      <Show when={$general.plugin?.ExternalLinks} fallback={<DefaultExternalLinks />}>
        {(get) => {
          const ExternalLinks = get();
          return <ExternalLinks ctx={ctx} DefaultExternalLinks={DefaultExternalLinks} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}

type ExternalLink = {
  name: string;
  /** Short text shown as the link's icon. */
  badge: string;
  url: (word: string) => string;
};

/** English learning resources, opened with the card's word. */
const EXTERNAL_LINKS: ExternalLink[] = [
  {
    name: "Cambridge Dictionary",
    badge: "C",
    url: (word) =>
      `https://dictionary.cambridge.org/search/direct/?datasetsearch=english&q=${encodeURIComponent(word)}`,
  },
  {
    name: "Merriam-Webster",
    badge: "MW",
    url: (word) => `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`,
  },
  {
    name: "Wiktionary",
    badge: "W",
    url: (word) => `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#English`,
  },
  {
    name: "YouGlish: hear it in real videos",
    badge: "YG",
    url: (word) => `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
  },
  {
    name: "Google Images",
    badge: "G",
    url: (word) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word)}`,
  },
];

function DefaultExternalLinks() {
  const { $ankiFields } = useAnkiFieldContext();
  // The field may contain formatting; links need the plain word.
  const $word = createMemo(() => parseHtml($ankiFields.Expression).body.textContent?.trim() ?? "");

  return (
    <For each={EXTERNAL_LINKS}>
      {(link) => (
        <a href={link.url($word())} target="_blank" rel="noopener" title={link.name}>
          <span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-xs text-[0.625rem] font-bold leading-none bg-base-300 text-base-content-calm">
            {link.badge}
          </span>
        </a>
      )}
    </For>
  );
}
