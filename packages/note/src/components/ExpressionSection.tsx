import { createMemo, Switch, Match, Suspense, lazy } from "solid-js";
import { isServer } from "solid-js/web";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";

// oxfmt-ignore
const Lazy = {
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
};

export function ExpressionSection(props: { hideExpression?: boolean }) {
  const { $card, $initialSide, $isInitialSide, nested } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext();
  const $hideExpression = createMemo(() => props.hideExpression);

  /** Sentence and audio cards hide the word on the front: it is what is being tested. */
  const $isHiddenOnFront = createMemo(
    () => $initialSide() === "front" && !!($ankiFields.IsSentenceCard || $ankiFields.IsAudioCard),
  );

  const $expressionInnerHtml = createMemo(() => {
    if (isServer) return undefined;
    if ($isHiddenOnFront()) return "?";
    return $ankiFields.Expression;
  });

  return (
    <div
      class="expression font-secondary text-center transition-colors text-base-content-primary"
      classList={{
        "border-b-2 border-dotted border-base-content-soft":
          $initialSide() === "front" && !!$ankiFields.IsClickCard && $isInitialSide(),
        "transition-opacity duration-1000 opacity-0":
          $initialSide() === "front" && $hideExpression() && $isInitialSide(),
      }}
    >
      <Switch>
        <Match when={isServer}>
          <div
            class="contents"
            innerHTML={
              $initialSide() === "front"
                ? "{{#IsSentenceCard}}?{{/IsSentenceCard}}{{#IsAudioCard}}?{{/IsAudioCard}}{{^IsSentenceCard}}{{^IsAudioCard}}{{Expression}}{{/IsAudioCard}}{{/IsSentenceCard}}"
                : "{{Expression}}"
            }
          ></div>
        </Match>
        <Match when={!$card.ready}>
          <div
            class="contents"
            classList={{ invisible: nested }}
            innerHTML={$expressionInnerHtml()}
          ></div>
        </Match>
        <Match when={$card.ready && $isHiddenOnFront() && $isInitialSide()}>
          <span>?</span>
        </Match>
        <Match when={$card.ready}>
          <Suspense fallback={<div class="contents" innerHTML={$expressionInnerHtml()}></div>}>
            <Lazy.Expression />
          </Suspense>
        </Match>
      </Switch>
    </div>
  );
}
