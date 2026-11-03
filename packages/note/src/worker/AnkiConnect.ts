import { parseRelatedExpression } from "#/src/lib/parse-related-expression";
import type { AnkiNote } from "#/src/lib/types";
import type { MainThreadApi } from "./MainThreadApi";

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class AnkiConnect {
  private fetchJson: MainThreadApi["fetchJson"];
  public ankiConnectAddress: string;
  private noteType: string;

  constructor(fetchJson: MainThreadApi["fetchJson"], ankiConnectAddress: string, noteType: string) {
    this.fetchJson = fetchJson;
    this.ankiConnectAddress = ankiConnectAddress;
    this.noteType = noteType;
  }

  async invoke(action: string, params: Record<string, unknown> = {}) {
    const result = (await this.fetchJson(this.ankiConnectAddress, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    })) as { error?: string; result: unknown };
    if (result.error) throw new Error(result.error);
    return result.result;
  }

  async batchFindNotes(queries: string[]) {
    return (await this.invoke("multi", {
      actions: queries.map((query) => ({
        action: "findNotes",
        params: { query },
      })),
    })) as Array<number[]>;
  }

  async batchNotesInfo(noteIdsList: number[][]) {
    return (await this.invoke("multi", {
      actions: noteIdsList.map((ids) => ({
        action: "notesInfo",
        params: { notes: ids },
      })),
    })) as Array<AnkiNote[]>;
  }

  /** Notes whose Expression is one of `expressionList`, or that list one of them as related. */
  async queryFieldContains({
    expressionList,
    withNewNotes = true,
  }: {
    expressionList: string[];
    withNewNotes?: boolean;
  }) {
    const noteFilter = `"note:${this.noteType}"`;

    const expressionPattern = expressionList.map(escapeRegex).join("|");
    const expressionQuery =
      expressionList.length === 0
        ? null
        : `${noteFilter} AND (Expression:re:^${expressionPattern}$ OR RelatedExpression:re:${expressionPattern})`;

    const newQuery = `${noteFilter} AND is:new`;

    const queries = [expressionQuery].filter(Boolean) as string[];
    if (withNewNotes) queries.push(newQuery);
    const idsLists = await this.batchFindNotes(queries);
    const allIds = [...new Set(idsLists.flat())];
    const [allNotes] = await this.batchNotesInfo([allIds]);
    const newNoteIds = withNewNotes ? (idsLists[idsLists.length - 1] ?? []) : [];
    const newNoteIdsSet = new Set(newNoteIds);
    const newNotes: AnkiNote[] = withNewNotes
      ? allNotes.filter((n) => newNoteIdsSet.has(n.noteId))
      : [];

    const expressionListResult: Record<string, AnkiNote[]> = {};
    for (const e of expressionList) {
      expressionListResult[e] = allNotes.filter((n) => {
        if (n.fields.Expression?.value === e) return true;
        const related = n.fields.RelatedExpression?.value;
        if (related) {
          const list = parseRelatedExpression(related);
          return list.includes(e);
        }
        return false;
      });
    }

    return { expressionListResult, newNotes };
  }
}
