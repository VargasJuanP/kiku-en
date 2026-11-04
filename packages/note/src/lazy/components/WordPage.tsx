import { createMemo, createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext, type WordTab } from "#/src/contexts/CardContext";
import { useNavigationTransition } from "#/src/hooks/transition";
import { parseHtml } from "#/src/lib/dom";
import { orderForDisplay, parseIpa } from "#/src/lib/ipa";
import { type AnkiFields, type AnkiNote, ankiFieldsSkeleton } from "#/src/lib/types";
import { HeaderLayout } from "./HeaderLayout";
import { ArrowLeftIcon } from "./Icons";

const TABS: { id: WordTab; label: string; description: string }[] = [
  { id: "family", label: "Family", description: "Words sharing a root" },
  { id: "homophones", label: "Sounds like", description: "Different words, same pronunciation" },
  { id: "same", label: "Same word", description: "Your other cards for this word" },
  { id: "related", label: "Related", description: "Linked through RelatedExpression" },
];

/**
 * The word's page: every card of the user's related to it, by kind, as the
 * Japanese Kiku's kanji page lists the cards sharing a kanji.
 */
export function WordPage() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <$WordPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function $WordPage() {
  const { $card, $setCard, $$card } = useCardContext();
  const { initialAnkiFields } = useAnkiFieldContext();
  const { navigateBack } = useNavigationTransition();
  const [$search, $setSearch] = createSignal("");

  const notesOf = (tab: WordTab): AnkiNote[] => {
    const query = $$card();
    if (tab === "family") return query?.family ?? [];
    if (tab === "homophones") return query?.homophones ?? [];
    if (tab === "same") return query?.sameExpression ?? [];
    return query?.relatedExpression ?? [];
  };

  const $notes = createMemo(() => {
    const search = $search().trim().toLowerCase();
    const notes = notesOf($card.wordTab);
    if (!search) return notes;
    return notes.filter((note) =>
      plainText(note.fields.Expression.value).toLowerCase().includes(search),
    );
  });

  const $ipa = createMemo(
    () => orderForDisplay(parseIpa(initialAnkiFields.ExpressionIPA))[0]?.transcription,
  );

  return (
    <>
      <HeaderLayout>
        <button on:click={navigateBack} on:touchend={(e) => e.stopPropagation()}>
          <ArrowLeftIcon class="size-5 cursor-pointer text-base-content-soft" />
        </button>
      </HeaderLayout>
      <div class="flex flex-col gap-2 sm:gap-4">
        <div class="flex gap-2 flex-wrap items-center">
          <div role="tablist" class="tabs tabs-box tabs-sm sm:tabs-md animate-fade-in">
            <For each={TABS}>
              {(tab) => {
                const count = () => notesOf(tab.id).length;
                return (
                  <button
                    role="tab"
                    class="tab gap-1"
                    classList={{
                      "tab-active": $card.wordTab === tab.id,
                      "opacity-50 cursor-not-allowed": count() === 0,
                    }}
                    title={tab.description}
                    on:click={() => count() > 0 && $setCard("wordTab", tab.id)}
                    on:touchend={(e) => e.stopPropagation()}
                  >
                    {tab.label}
                    <span class="text-base-content-soft bg-base-300 px-1 rounded-xs text-xs">
                      {count()}
                    </span>
                  </button>
                );
              }}
            </For>
          </div>
          <input
            type="text"
            class="input input-sm sm:input-md flex-1 min-w-32"
            placeholder="Search"
            value={$search()}
            on:keydown={(e) => e.stopPropagation()}
            on:input={(e) => $setSearch(e.currentTarget.value)}
          />
        </div>

        <div class="flex flex-col items-center gap-1 animate-fade-in">
          <div
            class="font-secondary text-5xl sm:text-6xl text-base-content-primary"
            innerHTML={initialAnkiFields.Expression}
          />
          <Show when={$ipa()}>
            <div class="ipa text-base-content-calm text-lg">{$ipa()}</div>
          </Show>
          <div class="text-base-content-soft text-sm sm:text-base">
            {TABS.find((tab) => tab.id === $card.wordTab)?.description}
          </div>
        </div>

        <Show
          when={$notes().length > 0}
          fallback={
            <div class="text-center text-base-content-soft py-8 animate-fade-in">
              {$search() ? "No matches" : "No cards here yet"}
            </div>
          }
        >
          <ul class="list bg-base-100 rounded-box shadow-md animate-fade-in">
            <For each={$notes()}>{(note) => <NoteItem note={note} />}</For>
          </ul>
        </Show>
      </div>
    </>
  );
}

function NoteItem(props: { note: AnkiNote }) {
  const { $setCard, $$card } = useCardContext();
  const { navigate } = useNavigationTransition();
  const note = props.note;
  const $isNew = createMemo(
    () => $$card()?.newNotes.some((n) => n.noteId === note.noteId) ?? false,
  );
  const ipa = orderForDisplay(parseIpa(note.fields.ExpressionIPA?.value ?? ""))[0]?.transcription;

  const open = () => {
    const fields: AnkiFields = {
      ...ankiFieldsSkeleton,
      ...Object.fromEntries(Object.entries(note.fields).map(([key, value]) => [key, value.value])),
      CardID: note.cards[0]?.toString() ?? "",
      Tags: note.tags.join(" "),
    };
    $setCard({ nestedAnkiFields: fields, nestedNoteId: note.noteId });
    navigate("nested", "forward", () => navigate("word", "back"));
  };

  return (
    <li
      class="list-row cursor-pointer hover:bg-base-200 transition-colors"
      on:click={open}
      on:touchend={(e) => e.stopPropagation()}
    >
      <div class="list-col-grow flex flex-col gap-1 min-w-0">
        <div class="flex gap-2 items-baseline flex-wrap">
          <span
            class="font-secondary text-2xl sm:text-3xl"
            innerHTML={note.fields.Expression.value}
          />
          <Show when={ipa}>
            <span class="ipa text-base-content-calm">{ipa}</span>
          </Show>
          <Show when={$isNew()}>
            <span class="status status-info" title="New card"></span>
          </Show>
        </div>
        <Show when={firstSentence(note.fields.Sentence?.value ?? "")}>
          {(sentence) => (
            <div class="text-base-content-calm text-sm sm:text-base" innerHTML={sentence()} />
          )}
        </Show>
      </div>
    </li>
  );
}

/** The first of the note's sentences (Kiku keeps several, one per group). */
function firstSentence(html: string) {
  const doc = parseHtml(html);
  const groups = doc.querySelectorAll("[data-group-id]");
  return (groups.length > 0 ? groups[0].innerHTML : doc.body.innerHTML).trim();
}

function plainText(html: string) {
  return parseHtml(html).body.textContent ?? "";
}
