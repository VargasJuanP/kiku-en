import {
  createMemo,
  createSignal,
  ErrorBoundary,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { useCardContext } from "#/src/contexts/CardContext";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useFieldGroupContext } from "#/src/contexts/FieldGroupContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { parseHtml } from "#/src/lib/dom";

export function Sentence() {
  const { $card } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $general } = useGeneralContext();
  const ctx = useCtxContext();

  function DefaultSentence() {
    return (
      <div class="flex flex-col justify-center gap-2 items-center text-center">
        <Switch>
          <Match when={$card.side === "back" && $group().sentenceTranslationField}>
            <SentenceFieldWithTranslation />
          </Match>
          <Match when={true}>
            <SentenceField />
          </Match>
        </Switch>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<DefaultSentence />}>
      <Show when={$general.plugin?.Sentence} fallback={<DefaultSentence />}>
        {(get) => {
          const Sentence = get();
          return <Sentence ctx={ctx} DefaultSentence={DefaultSentence} />;
        }}
      </Show>
    </ErrorBoundary>
  );
}

function SentenceFieldWithTranslation() {
  const [$containerRef, $setContainerRef] = createSignal<HTMLDivElement>();
  const { $group } = useFieldGroupContext();
  onMount(() => {
    const containerRef = $containerRef();
    if (!containerRef) return;
    const checkbox = containerRef.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (!checkbox) return;
    const handleActive = () => {
      checkbox.checked = true;
    };
    const handleInactive = () => {
      checkbox.checked = false;
    };

    containerRef.addEventListener("mouseenter", handleActive);
    containerRef.addEventListener("mouseleave", handleInactive);
    containerRef.addEventListener("focusin", handleActive);
    containerRef.addEventListener("focusout", handleInactive);
    containerRef.addEventListener("touchstart", handleActive);
    containerRef.addEventListener("touchend", handleInactive);

    onCleanup(() => {
      containerRef.removeEventListener("mouseenter", handleActive);
      containerRef.removeEventListener("mouseleave", handleInactive);
      containerRef.removeEventListener("focusin", handleActive);
      containerRef.removeEventListener("focusout", handleInactive);
      containerRef.removeEventListener("touchstart", handleActive);
      containerRef.removeEventListener("touchend", handleInactive);
    });
  });

  return (
    <div
      class="collapse animate-fade-in border-b-2 rounded-b-none border-base-200"
      ref={$setContainerRef}
    >
      <input class="p-0 pointer-events-none" type="checkbox" />
      <div class="collapse-title after:inset-s-5 after:inset-e-auto p-0 pb-2">
        <SentenceField />
      </div>
      <div
        class="collapse-content text-base sm:text-lg text-base-content-calm p-0"
        innerHTML={$group().sentenceTranslationField}
      ></div>
    </div>
  );
}

function SentenceField() {
  const { $card, $initialSide } = useCardContext();
  const { $group } = useFieldGroupContext();
  const { $ankiFields } = useAnkiFieldContext();

  const $sentence = createMemo(() => {
    const doc = parseHtml($group().sentenceField);

    if ($card.side === "front" && $ankiFields.IsAudioCard) {
      const bEls = doc.querySelectorAll("b");
      bEls.forEach((el) => {
        el.innerHTML = "[...]";
        el.classList.add("text-base-content-primary");
      });
    }

    return doc.body.innerHTML;
  });

  const $animateFadeIn = createMemo(() => {
    if ($initialSide() === "back") {
      if (
        $ankiFields.IsAudioCard ||
        $ankiFields.IsSentenceCard ||
        $ankiFields.IsClickCard ||
        $ankiFields.IsWordAndSentenceCard
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      class={`sentence font-secondary sentence-field`}
      classList={{
        "animate-fade-in": $animateFadeIn(),
      }}
      innerHTML={$sentence()}
    ></div>
  );
}
