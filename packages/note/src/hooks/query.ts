import { createMemo, createResource, type Accessor } from "solid-js";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import type { CardStore } from "#/src/contexts/CardContext";
import type { AnkiNote } from "#/src/lib/types";
import { type Store, unwrap } from "solid-js/store";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import { useWorker } from "./worker";

/**
 * Finds the user's other notes for this word: notes with the same expression,
 * and notes linked to it through the RelatedExpression field (in either direction).
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

      logger.debug(
        `[query] results for "${expression}": source=${isNotesCache ? "cache" : "ankiConnect"}, ` +
          `sameExpr=${sameExpression.length}, related=${relatedExpression.length}`,
      );

      return { sameExpression, relatedExpression, newNotes, isNotesCache };
    },
  );

  return { $$card };
}

export type $$Card = ReturnType<typeof useCardQuery>["$$card"];
