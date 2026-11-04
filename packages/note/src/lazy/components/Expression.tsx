import { createMemo, Show } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext, type WordTab } from "#/src/contexts/CardContext";
import { useNavigationTransition } from "#/src/hooks/transition";

/**
 * The word or phrase, as written in the Expression field (which may contain
 * HTML). On the back side, tapping it opens the word's page when the user has
 * other cards related to it.
 */
export function Expression() {
  const { $ankiFields } = useAnkiFieldContext();
  const { $card, $setCard, $$card } = useCardContext();
  const { navigate } = useNavigationTransition();

  const $firstTab = createMemo((): WordTab | undefined => {
    const query = $$card();
    if ($card.side !== "back" || !query) return undefined;
    if (query.family.length) return "family";
    if (query.homophones.length) return "homophones";
    if (query.sameExpression.length) return "same";
    if (query.relatedExpression.length) return "related";
    return undefined;
  });

  return (
    <Show
      when={$firstTab()}
      fallback={<span class="contents" innerHTML={$ankiFields.Expression} />}
    >
      {(tab) => (
        <button
          class="cursor-pointer hover:opacity-80 transition-opacity"
          // Anki styles buttons with its own font; the word keeps the card's
          style={{ font: "inherit", color: "inherit" }}
          title="See related cards"
          on:click={() => {
            $setCard("wordTab", tab());
            navigate("word", "forward", () => navigate("main", "back"));
          }}
          on:touchend={(e) => e.stopPropagation()}
          innerHTML={$ankiFields.Expression}
        />
      )}
    </Show>
  );
}
