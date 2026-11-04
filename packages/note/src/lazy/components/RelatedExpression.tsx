import {
  createEffect,
  createMemo,
  createSignal,
  ErrorBoundary,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import { ankiFieldsSkeleton, type AnkiNote } from "#/src/lib/types";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { MoveDown } from "./Icons";
import { preloadImages } from "#/src/lib/dom";
import { parseIpa } from "#/src/lib/ipa";

const sortNote = (a: AnkiNote, b: AnkiNote) => b.noteId - a.noteId;

const dedupeByCardId = (notes: AnkiNote[]) => {
  const seen = new Set<string>();
  return notes.filter((note) => {
    const cardId = note.cards[0]?.toString() ?? "";
    if (seen.has(cardId)) return false;
    seen.add(cardId);
    return true;
  });
};

function $RelatedExpression() {
  const { logger } = useGeneralContext();
  const { $card, $setCard, $initialSide, $$card } = useCardContext();
  const { $config } = useConfigContext();
  const { $ankiFields, $setAnkiFields, resetAnkiFields, initialAnkiFields, $isInitialAnkiFields } =
    useAnkiFieldContext();
  const [$ref, $setRef] = createSignal<HTMLDivElement>();

  const $displayExpression = createMemo(() => {
    if ($initialSide() === "back") return initialAnkiFields.Expression;
    if (initialAnkiFields.IsSentenceCard || initialAnkiFields.IsAudioCard) return "?";
    return initialAnkiFields.Expression;
  });

  const $relatedExpression = createMemo(() => {
    const query = $$card();
    if (!query) return [];
    const excludeNewCards = $config.relatedExpressionExcludeNewCards;
    const newCardIds = new Set(query.newNotes.flatMap((n) => n.cards));

    // On the front side, only show cards for the same word with a different pronunciation
    // (heteronyms like "read" /riːd/ and /rɛd/), which tell apart which one is being asked.
    if ($initialSide() === "front") {
      const pronunciation = initialAnkiFields.ExpressionIPA;
      return [...(query.sameExpression ?? [])]
        .filter((v) => {
          const otherPronunciation = v.fields.ExpressionIPA?.value ?? "";
          if (!pronunciation || !otherPronunciation || otherPronunciation === pronunciation) {
            return false;
          }
          return !excludeNewCards || !newCardIds.has(v.cards[0]);
        })
        .sort(sortNote);
    }

    // Related expressions first; other cards for the same word fill in when there are fewer than 2.
    let fallback = [...(query.sameExpression ?? [])];
    let relatedExpression = query.relatedExpression;

    if (excludeNewCards) {
      fallback = fallback.filter((v) => !newCardIds.has(v.cards[0]));
      relatedExpression = relatedExpression.filter((v) => !newCardIds.has(v.cards[0]));
    }
    if (!$config.relatedExpressionFallback) fallback = [];

    if (relatedExpression.length >= 2) return dedupeByCardId(relatedExpression);
    return dedupeByCardId([...relatedExpression, ...fallback.sort(sortNote)]).slice(0, 2);
  });

  const $newNotes = createMemo(() => new Set($$card()?.newNotes.flatMap((n) => n.cards) ?? []));
  const $isNewNote = createMemo(() => $newNotes().has(Number(initialAnkiFields.CardID)));

  const isExplicitRelatedExpression = (note: AnkiNote) => {
    return $$card()?.relatedExpression?.some((n) => n.noteId === note.noteId) ?? false;
  };

  createEffect(
    on(
      () => $relatedExpression(),
      (notes) => {
        notes.forEach((note) => preloadImages(note.fields.Picture.value));
      },
      { defer: true },
    ),
  );

  const played = new Set<string>();
  createEffect(
    on(
      () => $ankiFields.CardID,
      () => {
        if ($isInitialAnkiFields()) return;
        if (played.has($ankiFields.CardID)) return;
        played.add($ankiFields.CardID);
        const audio =
          $card.expressionAudioRef?.querySelector("a") ??
          $card.expressionAudioRef?.querySelector("audio");
        if (audio) {
          logger.info("[RelatedExpression] autoPlay: expression");
          if (audio instanceof HTMLAnchorElement) audio.click();
          if (audio instanceof HTMLAudioElement) void audio.play();
        } else {
          logger.debug("[RelatedExpression] autoPlay: no expression audio to play");
        }
      },
      {
        defer: true,
      },
    ),
  );

  const [$hasMultipleRows, $setHasMultipleRows] = createSignal(false);

  onMount(() => {
    const ref = $ref();
    if (!ref) return;
    const observer = new ResizeObserver(() => {
      if (ref.children.length <= 1) {
        $setHasMultipleRows(false);
        return;
      }
      const children = Array.from(ref.children) as HTMLElement[];
      const firstTop = children[0].offsetTop;
      $setHasMultipleRows(children.some((child) => child.offsetTop > firstTop));
    });
    observer.observe(ref);
    onCleanup(() => observer.disconnect());
  });

  /** Shows the note in place of the card's own, like the related cards above. */
  function NoteButton(props: { note: AnkiNote; explicit: boolean; text?: string }) {
    const note = props.note;
    const cardId = note.cards[0]?.toString() ?? "";
    const isNew = $newNotes().has(Number(cardId));
    return (
      <button
        class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm indicator"
        classList={{
          "text-base-content-soft underline underline-offset-4 sm:underline-offset-5 decoration-1":
            $ankiFields.CardID !== cardId && props.explicit,
          "text-base-content-soft": $ankiFields.CardID !== cardId && !props.explicit,
          "text-base-content underline underline-offset-4 sm:underline-offset-5 decoration-1":
            $ankiFields.CardID === cardId && props.explicit,
          "text-base-content": $ankiFields.CardID === cardId && !props.explicit,
        }}
        on:click={() => {
          $setCard("fadeInTopSection", false);
          $setAnkiFields({
            ...ankiFieldsSkeleton,
            ...Object.fromEntries(
              Object.entries(note.fields).map(([key, value]) => {
                return [key, value.value];
              }),
            ),
            CardID: cardId,
            Tags: note.tags.join(" "),
            __IS_ROOT__: false,
          });
          $setCard("side", "back");
        }}
        on:touchend={(e) => e.stopPropagation()}
      >
        {props.text ?? note.fields.Expression.value}
        <Show when={isNew}>
          <span class="status status-info"></span>
        </Show>
      </button>
    );
  }

  function RelativeGroup(props: { label: string; title: string; notes: AnkiNote[] }) {
    return (
      <Show when={props.notes.length > 0}>
        <div class="flex gap-x-2 sm:gap-x-3 items-baseline animate-fade-in-sm" title={props.title}>
          <span class="text-xs sm:text-sm text-base-content-faint">{props.label}</span>
          <For each={props.notes}>{(note) => <NoteButton note={note} explicit={false} />}</For>
        </div>
      </Show>
    );
  }

  // Like related cards, unstudied cards stay hidden unless the user opts in
  const studied = (notes: AnkiNote[] | undefined) =>
    (notes ?? []).filter(
      (note) => !$config.relatedExpressionExcludeNewCards || !$newNotes().has(note.cards[0]),
    );
  const $family = createMemo(() => studied($$card()?.family));
  const $homophones = createMemo(() => studied($$card()?.homophones));
  const $hasRelatives = createMemo(() => $family().length + $homophones().length > 0);

  return (
    <div ref={$setRef} class="flex gap-x-2 sm:gap-x-4 flex-wrap relative">
      <Show
        when={
          $relatedExpression().length ||
          $hasRelatives() ||
          ($isNewNote() && $initialSide() === "back")
        }
      >
        <div class="flex gap-px items-center">
          <MoveDown
            class="size-4 sm:size-5 text-base-content-faint"
            classList={{
              hidden: !$hasMultipleRows(),
            }}
          ></MoveDown>
          <button
            class="hover:text-base-content transition-colors cursor-pointer animate-fade-in-sm indicator"
            classList={{
              "text-base-content-soft": !$isInitialAnkiFields(),
              "text-base-content": $isInitialAnkiFields(),
            }}
            on:click={() => {
              $setCard("fadeInTopSection", false);
              resetAnkiFields();
              $setCard("side", $initialSide());
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            {$displayExpression()}
            <Show when={$isNewNote() && $initialSide() === "back"}>
              <span class="status status-info"></span>
            </Show>
          </button>
        </div>
      </Show>
      <For each={$relatedExpression()}>
        {(note) => (
          <NoteButton
            note={note}
            explicit={isExplicitRelatedExpression(note)}
            text={
              $initialSide() === "front"
                ? (parseIpa(note.fields.ExpressionIPA?.value ?? "")[0]?.transcription ??
                  note.fields.Expression.value)
                : undefined
            }
          />
        )}
      </For>
      <RelativeGroup label="family" title="Word family" notes={$family()} />
      <RelativeGroup label="sounds like" title="Homophones" notes={$homophones()} />
    </div>
  );
}

export function RelatedExpression() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <$RelatedExpression />
      </Suspense>
    </ErrorBoundary>
  );
}
