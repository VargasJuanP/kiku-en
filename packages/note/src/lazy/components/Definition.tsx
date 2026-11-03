import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { DatasetProp } from "#/src/lib/config";
import { isHtmlEffectivelyEmpty, removeBrInsideStyleTag } from "#/src/lib/dom";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import {
  decorateGlossary,
  dictionaryLabel,
  glossaryContains,
  splitByDictionary,
} from "#/src/lib/glossary";
import { DefinitionPictureSection } from "./DefinitionPictureSection";
import { ExternalLinks } from "./ExternalLinks";

export function Definition() {
  const { $ankiFields } = useAnkiFieldContext();
  const { $config } = useConfigContext();

  const $glossary = createMemo(() => {
    // empty glossary if it's the same as main definition
    if ($ankiFields.MainDefinition === $ankiFields.Glossary) return "";
    const glossary = removeMainDefinitionFromGlossary(
      $ankiFields.Glossary,
      $ankiFields.MainDefinition,
    );
    return !isHtmlEffectivelyEmpty(glossary) ? removeBrInsideStyleTag(glossary) : "";
  });

  const $selection = createMemo(() => {
    return !isHtmlEffectivelyEmpty($ankiFields.SelectionText)
      ? removeBrInsideStyleTag($ankiFields.SelectionText)
      : "";
  });

  const $main = createMemo(() => {
    return !isHtmlEffectivelyEmpty($ankiFields.MainDefinition)
      ? removeBrInsideStyleTag($ankiFields.MainDefinition)
      : "";
  });

  const $pages = createMemo(() => {
    const p: { name: string; dictionary?: string; html: string }[] = [];
    const selection = $selection();
    const main = $main();
    const glossary = $glossary();
    const split = $config.definitionStyle === "glossary-split";
    const decorate = (html: string) => decorateGlossary(html, { showDictionary: !split });

    if ($config.definitionStyle === "single-page") {
      const combined = [selection, main, glossary].filter(Boolean).map(decorate);
      if (combined.length > 0) {
        const html = combined.join('<div class="divider my-4"></div>');
        p.push({ name: "Definition", html });
      }
      return p;
    }

    if (selection) {
      p.push({ name: "Selection Text", html: selection });
    }

    const fullGlossary = removeBrInsideStyleTag($ankiFields.Glossary);
    const dictionaries = split ? splitByDictionary(fullGlossary) : [];
    // Split by dictionary, Yomitan's main definition is already on its dictionary's page.
    if (main && !(dictionaries.length > 0 && glossaryContains(fullGlossary, main))) {
      p.push({ name: "Main Definition", html: decorate(main) });
    }

    if (dictionaries.length > 0) {
      for (const { dictionary, html } of dictionaries) {
        p.push({ name: dictionaryLabel(dictionary), dictionary, html: decorate(html) });
      }
    } else if (glossary) {
      p.push({ name: "Glossary", html: decorate(glossary) });
    }

    return p;
  });

  const [$definitionIndex, $setDefinitionIndex] = createSignal(0);
  const currentPage = () => $pages()[$definitionIndex()];

  function changePage(direction: 1 | -1) {
    if ($pages().length === 0) return;
    $setDefinitionIndex((prev) => (prev + direction + $pages().length) % $pages().length);
  }

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === $config.keybindDefinitionPrev) changePage(-1);
      if (e.key === $config.keybindDefinitionNext) changePage(1);
    };

    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  const $definitionDataset = createMemo<DatasetProp>(() => ({
    "data-dictionary": currentPage()?.dictionary ?? currentPage()?.name,
  }));

  return (
    <>
      <Show when={$pages().length > 0}>
        <div class="animate-fade-in" {...$definitionDataset()}>
          {$pages().length > 1 && (
            <div class="flex gap-1 overflow-x-auto mb-2 definition-tabs" role="tablist">
              <For each={$pages()}>
                {(page, i) => (
                  <button
                    type="button"
                    role="tab"
                    class="definition-tab"
                    aria-selected={i() === $definitionIndex()}
                    on:click={() => $setDefinitionIndex(i())}
                    on:touchend={(e) => e.stopPropagation()}
                  >
                    {page.name}
                  </button>
                )}
              </For>
            </div>
          )}
          <div
            class="relative bg-base-200 p-3 sm:p-5 border-s-4 text-base sm:text-xl rounded-lg definition-field"
            style={{
              "border-color": "var(--dictionary-color, var(--color-primary)",
            }}
            data-definition-style={$config.definitionStyle}
          >
            <div class="overflow-auto">
              <DefinitionPictureSection currentHtml={currentPage()?.html} />
              <div class="contents" innerHTML={currentPage()?.html}></div>
            </div>
            {$pages().length > 1 && (
              <div class="absolute inset-y-0 left-0 right-0 flex justify-between pointer-events-none">
                <button
                  type="button"
                  class="h-full w-4 sm:w-6 hover:bg-base-content/10 cursor-pointer pointer-events-auto transition-colors rounded-l-lg"
                  on:click={() => changePage(-1)}
                  on:touchend={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  class="h-full w-4 sm:w-6 hover:bg-base-content/10 cursor-pointer pointer-events-auto transition-colors rounded-r-lg"
                  on:click={() => changePage(1)}
                  on:touchend={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
          <div class="flex justify-end mt-2 gap-2">
            <ExternalLinks />
          </div>
        </div>
      </Show>
    </>
  );
}

function removeMainDefinitionFromGlossary(glossary: string, mainDefinition: string) {
  const parser = new DOMParser();
  const glossaryDoc = parser.parseFromString(glossary, "text/html");
  const mainDefinitionDoc = parser.parseFromString(mainDefinition, "text/html");

  const mainDefinitionLis = mainDefinitionDoc.querySelectorAll(
    'div[class="yomitan-glossary"] > ol > li[data-dictionary]',
  );
  const mainDefinitionDicts = Array.from(mainDefinitionLis)
    .map((li) => li.getAttribute("data-dictionary"))
    .filter(Boolean) as string[];
  if (mainDefinitionDicts.length === 0) return glossary;

  const glossaries = glossaryDoc.querySelectorAll(
    `div[class="yomitan-glossary"] > ol > li[data-dictionary]`,
  );
  for (const glossaryLi of glossaries) {
    const dictName = glossaryLi.getAttribute("data-dictionary");
    if (!dictName) continue;
    if (mainDefinitionDicts.includes(dictName)) {
      glossaryLi.remove();
    }
  }
  return glossaryDoc.body.innerHTML;
}
