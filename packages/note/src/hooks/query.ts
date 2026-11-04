import { createMemo, createResource, type Accessor } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import type { CardStore } from "#/src/contexts/CardContext";
import type { AnkiNote } from "#/src/lib/types";
import { type Store, unwrap } from "solid-js/store";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import {
  areHomophones,
  familySearchPattern,
  homophoneKeys,
  homophoneSearchPattern,
  isWordFamily,
} from "#/src/lib/word-family";
import { useWorker } from "./worker";

/** Word family and homophones kept per kind, for the word page. */
const MAX_RELATIVES = 50;

/**
 * Finds the user's other notes for this word: notes with the same expression,
 * notes linked to it through the RelatedExpression field (in either direction),
 * and, on the back side, its word family and homophones.
 */
export function useCardQuery({
  $initialSide,
  $card,
}: {
  $initialSide: Accessor<CardStore["side"]>;
  $card: Store<CardStore>;
}) {
  const { aborter, logger } = useGeneralContext();
  const { initialAnkiFields: ankiFields } = useAnkiFieldContext();
  const { getWorker } = useWorker();

  const $isFront = createMemo(() => $initialSide() === "front");
  const $relatedExpressions = createMemo(() => {
    if ($isFront()) return [];
    return parseRelatedExpression(ankiFields.RelatedExpression);
  });
  const $expressionList = createMemo(() => [
    ...(ankiFields.Expression ? [ankiFields.Expression] : []),
    ...$relatedExpressions(),
  ]);

  const [$$card] = createResource(
    () => {
      if (!$card.ready) return undefined;
      return {
        isFront: $isFront(),
        expression: ankiFields.Expression,
        relatedExpressions: $relatedExpressions(),
        expressionList: $expressionList(),
      };
    },
    async ({ isFront, expression, relatedExpressions, expressionList }) => {
      const workerApi = await getWorker();
      if (aborter.signal.aborted) return;

      const { expressionResult, newNotes, isNotesCache } = await workerApi.queryShared({
        ankiFields: unwrap(ankiFields),
        expressionList,
      });
      if (aborter.signal.aborted) return;

      const thisExpressionResults = expressionResult[expression] ?? [];
      const sameExpression = thisExpressionResults.filter(
        (n) => n.fields.Expression.value === expression,
      );

      let relatedExpression: AnkiNote[] = [];
      if (!isFront) {
        const incomingRelated = thisExpressionResults.filter(
          (n) => n.fields.Expression.value !== expression,
        );
        const outgoingRelated = relatedExpressions.flatMap((e) => expressionResult[e] ?? []);
        const combinedRelated = [...incomingRelated, ...outgoingRelated];
        relatedExpression = Array.from(new Map(combinedRelated.map((n) => [n.noteId, n])).values());
      }

      let family: AnkiNote[] = [];
      let homophones: AnkiNote[] = [];
      if (!isFront) {
        try {
          const shown = new Set([...sameExpression, ...relatedExpression].map((n) => n.noteId));
          ({ family, homophones } = await findRelatives(shown));
        } catch (e) {
          logger.warn("[query] word family and homophones unavailable:", e);
        }
        if (aborter.signal.aborted) return;
      }

      logger.debug(
        `[query] results for "${expression}": source=${isNotesCache ? "cache" : "ankiConnect"}, ` +
          `sameExpr=${sameExpression.length}, related=${relatedExpression.length}, ` +
          `family=${family.length}, homophones=${homophones.length}`,
      );

      return { sameExpression, relatedExpression, family, homophones, newNotes, isNotesCache };
    },
  );

  /** Notes in the word's family and notes that sound the same, newest first, one per word. */
  async function findRelatives(exclude: Set<number>) {
    const workerApi = await getWorker();
    const expression = ankiFields.Expression;
    const ipa = ankiFields.ExpressionIPA;
    const candidates = (
      await workerApi.queryRelativeCandidates({
        expressionPattern: familySearchPattern(expression),
        ipaPatterns: homophoneKeys(ipa).map(homophoneSearchPattern),
        cardId: ankiFields.CardID,
      })
    ).filter((note) => !exclude.has(note.noteId));

    const family = onePerWord(
      candidates.filter((note) => isWordFamily(expression, note.fields.Expression.value)),
    );
    const inFamily = new Set(family.map((note) => note.noteId));
    const homophones = onePerWord(
      candidates.filter(
        (note) =>
          !inFamily.has(note.noteId) &&
          areHomophones(
            { expression, ipa },
            {
              expression: note.fields.Expression.value,
              ipa: note.fields.ExpressionIPA?.value ?? "",
            },
          ),
      ),
    );
    return {
      family: family.slice(0, MAX_RELATIVES),
      homophones: homophones.slice(0, MAX_RELATIVES),
    };
  }

  return { $$card };
}

function onePerWord(notes: AnkiNote[]) {
  const byWord = new Map<string, AnkiNote>();
  for (const note of [...notes].sort((a, b) => b.noteId - a.noteId)) {
    const word = note.fields.Expression.value.trim().toLowerCase();
    if (!byWord.has(word)) byWord.set(word, note);
  }
  return [...byWord.values()];
}

export type $$Card = ReturnType<typeof useCardQuery>["$$card"];
