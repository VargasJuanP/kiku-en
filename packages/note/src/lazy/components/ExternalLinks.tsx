import { createMemo, ErrorBoundary, For, Show } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseHtml } from "#/src/lib/dom";
import { linkIcons } from "#/src/lib/link-icons";

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
  icon: string;
  url: (word: string) => string;
};

/** English learning resources, opened with the card's word. */
const EXTERNAL_LINKS: ExternalLink[] = [
  {
    name: "Cambridge Dictionary",
    icon: linkIcons.cambridge,
    url: (word) =>
      `https://dictionary.cambridge.org/search/direct/?datasetsearch=english&q=${encodeURIComponent(word)}`,
  },
  {
    name: "Merriam-Webster",
    icon: linkIcons.merriamWebster,
    url: (word) => `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`,
  },
  {
    name: "Wiktionary",
    icon: linkIcons.wiktionary,
    url: (word) => `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#English`,
  },
  {
    name: "YouGlish: hear it in real videos",
    icon: linkIcons.youglish,
    url: (word) => `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
  },
  {
    name: "Google Images",
    icon: linkIcons.google,
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
          <img
            class="size-6 rounded-md ring-1 ring-base-content/10 hover:scale-110 transition-transform"
            src={link.icon}
            alt={link.name}
          />
        </a>
      )}
    </For>
  );
}
