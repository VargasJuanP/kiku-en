import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
  type Accessor,
  type Resource,
  type Setter,
} from "solid-js";
import { Portal } from "solid-js/web";
import { AnkiConnect } from "#/src/lib/anki-connect";
import { unique } from "#/src/lib/es";
import { useNavigationTransition } from "#/src/hooks/transition";
import { type AnkiNote, ankiFieldsSkeleton } from "#/src/lib/types";
import { useAnkiFieldContext, useRootAnkiFieldsContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { ArrowLeftIcon, GitPullRequestArrow, RefreshCwIcon } from "./Icons";
import {
  filterTags,
  mergeContext,
  parseMergedIntoReadable,
  removeAnkiInternalFields,
  toContextField,
} from "#/src/lazy/lib/merge-context";

export function MergeContextModal() {
  const [$dialogRef, $setDialogRef] = createSignal<HTMLDialogElement>();
  const { $general, logger, $$ankiConnect, $checkAnkiConnect, isAnkiDesktop } = useGeneralContext();
  const { isMergePreview } = useCardContext();
  const { initialAnkiFields: rootInitialAnkiFields } = useRootAnkiFieldsContext();
  const { noteId: currentNoteId } = useAnkiFieldContext();

  const $shouldFetch = createMemo(() => $$ankiConnect.state === "ready" && !isMergePreview);

  const [$$notesResource, { refetch }] = createResource(
    () => {
      if (!$shouldFetch()) return undefined;
      return { rootCardId: rootInitialAnkiFields.CardID, currentNoteId };
    },
    async ({ rootCardId, currentNoteId }) => {
      try {
        const noteIds = await AnkiConnect.invoke("findNotes", { query: `cid:${rootCardId}` });
        const rootNoteId = noteIds?.result[0] as number | undefined;

        if (!rootNoteId) throw new Error("Failed to get root note id");
        if (!currentNoteId) throw new Error("Failed to get current note id");

        const notes = await AnkiConnect.invoke("notesInfo", { notes: [rootNoteId, currentNoteId] });
        const rootNote = notes?.result[0] as AnkiNote | undefined;
        const currentNote = notes?.result[1] as AnkiNote | undefined;

        if (!rootNote?.noteId) throw new Error("Failed to load root note");
        if (!currentNote?.noteId)
          throw new Error("Failed to load current note, is your notes cache up to date?");

        return { rootNote, currentNote };
      } catch (e) {
        $general.toast.error(e instanceof Error ? e.message : "Failed to load notes");
        logger.error(e);
        throw e;
      }
    },
  );

  onMount(() => {
    if (isAnkiDesktop) void $checkAnkiConnect();
  });

  return (
    <>
      <Switch>
        <Match when={$$notesResource.loading || $$ankiConnect.loading}>
          <span class="loading loading-dots loading-xs text-base-content-faint animate-fade-in-sm"></span>
        </Match>
        <Match when={$$notesResource.state === "ready"}>
          <button
            on:click={() => {
              const dialogRef = $dialogRef();
              if (dialogRef) dialogRef.showModal();
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            <GitPullRequestArrow class="size-4 cursor-pointer text-base-content-soft animate-fade-in-sm" />
          </button>
        </Match>
        <Match when={$$notesResource.state === "errored"}>
          <span class="animate-fade-in-sm">
            <span class="status status-error animate-ping"></span>
          </span>
        </Match>
        <Match
          when={
            $$notesResource.state === "unresolved" ||
            $$ankiConnect.state === "unresolved" ||
            $$ankiConnect.state === "errored"
          }
        >
          <div class="indicator animate-fade-in-sm">
            <div class="flex items-center">
              <button
                on:click={async () => {
                  await $checkAnkiConnect({
                    onFail: () => {
                      $general.toast.error("AnkiConnect is not available");
                    },
                  });
                  await refetch();
                }}
                on:touchend={(e) => e.stopPropagation()}
              >
                <RefreshCwIcon class="size-4 cursor-pointer text-base-content-soft" />
              </button>
            </div>
            <span class="status status-error animate-ping"></span>
          </div>
        </Match>
      </Switch>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <$Dialog
            $$notesResource={$$notesResource}
            $dialogRef={$dialogRef}
            $setDialogRef={$setDialogRef}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function $Dialog(props: {
  $$notesResource: Resource<{
    rootNote: AnkiNote;
    currentNote: AnkiNote;
  }>;
  $dialogRef: Accessor<HTMLDialogElement | undefined>;
  $setDialogRef: Setter<HTMLDialogElement | undefined>;
}) {
  const { $$notesResource, $dialogRef, $setDialogRef } = props;

  const { $general, logger } = useGeneralContext();
  const { $config } = useConfigContext();
  const { navigate } = useNavigationTransition();
  const { $setCard } = useCardContext();

  const [$mergeDirection] = createSignal<"toRoot" | "toCurrent">("toCurrent");
  const [$deleteRootNote, $setDeleteRootNote] = createSignal(false);

  const $$rootNote = createMemo(() => $$notesResource()?.rootNote);
  const $$currentNote = createMemo(() => $$notesResource()?.currentNote);

  const $$merged = createMemo(() => {
    const root = toContextField($$rootNote());
    const current = toContextField($$currentNote());
    if ($mergeDirection() === "toRoot") {
      return mergeContext(root, current);
    } else {
      return mergeContext(current, root);
    }
  });

  const $$mergedReadable = createMemo(() => parseMergedIntoReadable($$merged()));
  const $$hasDuplicates = createMemo(() =>
    Object.values($$mergedReadable().duplicates).some((item) => Boolean(item.length)),
  );

  const $$mergedAnkiFields = createMemo(() => {
    const direction = $mergeDirection();
    // ---- fields ----
    const targetNote = direction === "toRoot" ? $$rootNote() : $$currentNote();
    if (!targetNote) return ankiFieldsSkeleton;
    const targetFields = Object.fromEntries(
      Object.entries(targetNote.fields).map(([key, value]) => [key, value.value]),
    );

    // ---- tags ----
    const rootTags = $$rootNote()?.tags ?? [];
    const currentTags = $$currentNote()?.tags ?? [];
    const targetTags = direction === "toRoot" ? rootTags : currentTags;
    const tags = filterTags(unique([...rootTags, ...currentTags]), targetTags);

    return {
      ...ankiFieldsSkeleton,
      ...targetFields,
      ...$$merged(),
      Tags: tags.join(" "),
    };
  });

  const $$targetId = createMemo(() => {
    const targetId =
      $mergeDirection() === "toRoot" ? $$rootNote()?.noteId : $$currentNote()?.noteId;
    if (!targetId) return;
    return targetId;
  });

  const $$updateNoteFieldsPayload = createMemo(() => {
    const targetId$ = $$targetId();
    if (!targetId$) return;
    const fields = { ...$$mergedAnkiFields() };
    const tags = fields.Tags.split(" ");
    const cleanFields = removeAnkiInternalFields(fields);

    return {
      note: {
        id: targetId$,
        fields: cleanFields,
        tags: tags,
      },
    };
  });

  const onPreviewClick = () => {
    $setCard("nestedIsMergePreview", true);
    $setCard({ nestedAnkiFields: $$mergedAnkiFields() });
    $setCard("nestedNoteId", $$targetId());
    navigate("nested", "forward", () => {
      navigate("main", "back");
      $setCard("nestedIsMergePreview", false);
    });
  };

  const onMergeClick = async () => {
    const dialogRef = $dialogRef();
    const payload = $$updateNoteFieldsPayload();
    await AnkiConnect.invoke("updateNote", payload)
      .catch((e) => {
        logger.error("[MergeContext] updateNote failed:", e);
        $general.toast.error(
          `Failed to update note fields: ${e instanceof Error ? e.message : ""}`,
        );
      })
      .then(() => {
        $general.toast.success(`Note ${payload?.note.id} has been updated!`);
        if (dialogRef) dialogRef.close();
        const rootNoteId = $$rootNote()?.noteId;
        if ($deleteRootNote() && rootNoteId) {
          setTimeout(() => {
            AnkiConnect.invoke("deleteNotes", {
              notes: [rootNoteId],
            })
              .then(() => {
                $general.toast.success(
                  `Note ${payload?.note.id} has been updated! Note ${rootNoteId} has been deleted!`,
                );
              })
              .catch((e) => {
                logger.error("[MergeContext] deleteNotes failed:", e);
                $general.toast.error(
                  `Failed to delete note: ${e instanceof Error ? e.message : ""}`,
                );
              });
          }, 500);
        }
      });
  };

  createEffect(() => {
    if ($mergeDirection() === "toRoot") {
      $setDeleteRootNote(false);
    }
  });

  return (
    <Portal mount={$general.layoutRef}>
      <dialog class="modal" ref={$setDialogRef}>
        <div class="modal-box max-h-[80svh]">
          <h3 class="text-lg font-bold mb-4">Merge Context</h3>

          <div class="flex flex-col gap-4">
            <div class="flex gap-4 items-center justify-center">
              <div class="flex flex-col items-center">
                <div>Root</div>
                <div class="text-base-content-calm text-xs">{$$rootNote()?.noteId}</div>
                <Show when={$$rootNote()?.noteId}>
                  {(id) => (
                    <div class="text-base-content-soft text-xs">
                      {new Date(id()).toLocaleDateString()}
                    </div>
                  )}
                </Show>
              </div>
              <button
                on:click={() => {
                  // TODO: we can't update root while opening the note in anki browser. What to do??? https://github.com/FooSoft/anki-connect/issues/82
                  // setMergeDirection((prev) =>
                  //   prev === "toRoot" ? "toCurrent" : "toRoot",
                  // );
                }}
                on:touchend={(e) => e.stopPropagation()}
              >
                <ArrowLeftIcon
                  class="self-center text-base-content-calm size-10 cursor-pointer transition-transform"
                  classList={{
                    "rotate-0": $mergeDirection() === "toRoot",
                    "rotate-180": $mergeDirection() === "toCurrent",
                  }}
                />
              </button>
              <div class="flex flex-col items-center">
                <div>Current</div>
                <div class="text-base-content-calm text-xs">{$$currentNote()?.noteId}</div>
                <Show when={$$currentNote()?.noteId}>
                  {(id) => (
                    <div class="text-base-content-soft text-xs">
                      {new Date(id()).toLocaleDateString()}
                    </div>
                  )}
                </Show>
              </div>
            </div>

            <Show
              when={
                $$rootNote()?.fields.Expression.value &&
                $$currentNote()?.fields.Expression.value &&
                $$rootNote()?.fields.Expression.value !== $$currentNote()?.fields.Expression.value
              }
            >
              <div role="alert" class="alert alert-warning">
                Root and Current have different Expression
              </div>
            </Show>

            <Show when={$$hasDuplicates()}>
              <div role="alert" class="alert alert-warning">
                Some fields have duplicates data-group-id
              </div>
            </Show>

            <div class="flex flex-col gap-2">
              <FieldPreview title="Sentence" content={$$mergedReadable().Sentence} />
              <FieldPreview
                title="SentenceTranslation"
                content={$$mergedReadable().SentenceTranslation}
              />
              <FieldPreview title="SentenceAudio" content={$$mergedReadable().SentenceAudio} />
              <FieldPreview title="MiscInfo" content={$$mergedReadable().MiscInfo} />
              <FieldPreview title="Picture" content={$$mergedReadable().Picture} />
              <FieldPreview
                title="AnkiConnect Payload Preview"
                content={JSON.stringify($$updateNoteFieldsPayload(), null, 2)}
              />
            </div>

            <Show
              when={
                // only show if root note is not older than 1 day
                Date.now() - ($$rootNote()?.noteId ?? Date.now()) < 1000 * 60 * 60 * 24 &&
                $mergeDirection() === "toCurrent"
              }
            >
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Delete Root Note</legend>
                <label class="label">
                  <input
                    type="checkbox"
                    checked={$deleteRootNote()}
                    class="toggle"
                    on:change={(e) => {
                      $setDeleteRootNote(e.target.checked);
                    }}
                  />
                </label>
              </fieldset>
            </Show>

            <Show when={!$config.preferAnkiConnect}>
              <div role="alert" class="alert alert-warning">
                <span>
                  To prevent unwanted result caused by stale notes cache, please enable{" "}
                  <b>"Prefer AnkiConnect"</b> in Settings.
                </span>
              </div>
            </Show>
          </div>

          <div class="modal-action">
            <form method="dialog">
              <button class="btn" on:touchend={(e) => e.stopPropagation()}>
                Close
              </button>
            </form>
            <button
              class="btn btn-secondary"
              on:click={onPreviewClick}
              on:touchend={(e) => e.stopPropagation()}
            >
              Preview
            </button>
            <button
              class="btn"
              disabled={!$config.preferAnkiConnect}
              classList={{
                "btn-primary": !$deleteRootNote(),
                "btn-error": $deleteRootNote(),
              }}
              on:click={onMergeClick}
              on:touchend={(e) => e.stopPropagation()}
            >
              Merge
            </button>
          </div>
        </div>

        <form method="dialog" class="modal-backdrop">
          <button on:touchend={(e) => e.stopPropagation()}>Close</button>
        </form>
      </dialog>
    </Portal>
  );
}

function FieldPreview(props: { title: string; content: string }) {
  return (
    <div class="flex flex-col gap-0.5">
      <div class="text-sm">{props.title}</div>
      <pre class="text-xs bg-base-200 p-2 rounded-sm overflow-auto max-h-[90svh]">
        {props.content ? props.content : "\n"}
      </pre>
    </div>
  );
}
