import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";

/** The word or phrase, as written in the Expression field (which may contain HTML). */
export function Expression() {
  const { $ankiFields } = useAnkiFieldContext();
  return <span class="contents" innerHTML={$ankiFields.Expression} />;
}
