import { describe, expect, it } from "vitest";
import {
  type ContextField,
  mergeContext,
  normalizeFields,
  parseMergedIntoReadable,
  toContextField,
  filterTags,
  removeAnkiInternalFields,
} from "./merge-context";
import type { AnkiNote } from "#/src/lib/types";
import { parseHtml } from "#/src/lib/dom";

function extractGroupIds(html: string) {
  const doc = parseHtml(html);
  return Array.from(doc.querySelectorAll("[data-group-id]")).map((el) =>
    el.getAttribute("data-group-id"),
  );
}

describe("mergeContext", () => {
  it("concatenates two simple text fields", () => {
    const base = { Sentence: "Hello " } as ContextField;
    const extra = { Sentence: "World" } as ContextField;
    const result = mergeContext(base, extra);
    expect(result.Sentence).toContain("Hello");
    expect(result.Sentence).toContain("World");
  });

  it("sorts grouped elements so higher group-id appears first", () => {
    const base = {
      Sentence: '<span data-group-id="1">old</span>',
    } as ContextField;
    const extra = {
      Sentence: '<span data-group-id="2">new</span>',
    } as ContextField;
    const result = mergeContext(base, extra);
    const doc = parseHtml(result.Sentence);
    const spans = doc.querySelectorAll("[data-group-id]");
    expect(spans[0].textContent).toBe("new");
    expect(spans[1].textContent).toBe("old");
  });

  it("merges picture fields with img selector", () => {
    const base = {
      Picture: '<img src="a.jpg" />',
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
    } as ContextField;
    const extra = {
      Picture: '<img src="b.jpg" />',
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
    } as ContextField;
    const result = mergeContext(base, extra);
    expect(result.Picture).toContain('src="a.jpg"');
    expect(result.Picture).toContain('src="b.jpg"');
  });
});

describe("normalizeFields", () => {
  it("assigns data-group-id to ungrouped content", () => {
    const fields = {
      Sentence: "hello world",
      SentenceTranslation: "你好世界",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = normalizeFields(fields);
    expect(extractGroupIds(result.Sentence)).toHaveLength(1);
    expect(extractGroupIds(result.SentenceTranslation)).toHaveLength(1);
  });

  it("preserves existing grouped elements", () => {
    const fields = {
      Sentence: '<span data-group-id="99">grouped</span> raw',
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = normalizeFields(fields);
    const ids = extractGroupIds(result.Sentence);
    expect(ids).toContain("99");
    expect(ids).toHaveLength(2);
  });

  it("uses noteId when provided", () => {
    const fields = {
      noteId: 42,
      Sentence: "test",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = normalizeFields(fields);
    const doc = parseHtml(result.Sentence);
    const span = doc.querySelector("[data-group-id]");
    expect(span?.getAttribute("data-group-id")).toBe("42");
  });

  it("assigns group id to img elements in Picture", () => {
    const fields = {
      Picture: '<img src="test.jpg" />',
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
    };
    const result = normalizeFields(fields);
    const doc = parseHtml(result.Picture);
    const img = doc.querySelector("img");
    expect(img?.getAttribute("data-group-id")).toBeTruthy();
  });

  it("handles empty fields", () => {
    const fields = {
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = normalizeFields(fields);
    expect(result.Sentence).toBe("");
    expect(result.SentenceTranslation).toBe("");
    expect(result.SentenceAudio).toBe("");
    expect(result.MiscInfo).toBe("");
    expect(result.Picture).toBe("");
  });
});

describe("parseMergedIntoReadable", () => {
  it("groups text by data-group-id", () => {
    const fields = {
      Sentence: '<span data-group-id="1">foo</span><span data-group-id="2">bar</span>',
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = parseMergedIntoReadable(fields);
    expect(result.Sentence).toContain("1: foo");
    expect(result.Sentence).toContain("2: bar");
  });

  it("reports duplicate group ids", () => {
    const fields = {
      Sentence: '<span data-group-id="1">a</span><span data-group-id="1">b</span>',
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = parseMergedIntoReadable(fields);
    expect(result.duplicates.Sentence).toContain("1");
  });

  it("extracts src from img elements for Picture", () => {
    const fields = {
      Picture: '<img data-group-id="1" src="cat.jpg" />',
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
    };
    const result = parseMergedIntoReadable(fields);
    expect(result.Picture).toContain("1: cat.jpg");
  });

  it("handles empty fields", () => {
    const fields = {
      Sentence: "",
      SentenceTranslation: "",
      SentenceAudio: "",
      MiscInfo: "",
      Picture: "",
    };
    const result = parseMergedIntoReadable(fields);
    expect(result.Sentence).toBe("");
    expect(result.duplicates.Sentence).toEqual([]);
  });
});

describe("toContextField", () => {
  it("maps AnkiNote fields to ContextField", () => {
    const note = {
      noteId: 123,
      fields: {
        Sentence: { value: "hello", order: 0 },
        SentenceTranslation: { value: "你好", order: 1 },
        SentenceAudio: { value: "[sound:hello.mp3]", order: 3 },
        MiscInfo: { value: "test", order: 4 },
        Picture: { value: "<img src='x.jpg' />", order: 5 },
      },
    } as unknown as AnkiNote;
    const result = toContextField(note);
    expect(result.noteId).toBe(123);
    expect(result.Sentence).toBe("hello");
    expect(result.SentenceTranslation).toBe("你好");
    expect(result.Picture).toBe("<img src='x.jpg' />");
  });

  it("returns empty strings for undefined note", () => {
    const result = toContextField(undefined);
    expect(result.noteId).toBeUndefined();
    expect(result.Sentence).toBe("");
  });

  it("handles note with missing fields gracefully", () => {
    const note = { noteId: 1, fields: {} } as unknown as AnkiNote;
    const result = toContextField(note);
    expect(result.noteId).toBe(1);
    expect(result.Sentence).toBe("");
  });
});

describe("filterTags", () => {
  it("removes unwanted tags not in targetTags", () => {
    const result = filterTags(["japanese", "leech", "vocab"], ["japanese", "vocab"]);
    expect(result).toEqual(["japanese", "vocab"]);
  });

  it("keeps unwanted tag if it belongs to targetTags", () => {
    const result = filterTags(["leech", "japanese"], ["leech"]);
    expect(result).toContain("leech");
  });

  it("handles empty arrays", () => {
    expect(filterTags([], [])).toEqual([]);
    expect(filterTags(["leech"], [])).toEqual([]);
  });
});

describe("removeAnkiInternalFields", () => {
  it("removes Tags, CardID, __IS_ROOT__", () => {
    const result = removeAnkiInternalFields({
      Tags: "japanese",
      CardID: "123",
      __IS_ROOT__: "true",
      Expression: "test",
    });
    expect(result).not.toHaveProperty("Tags");
    expect(result).not.toHaveProperty("CardID");
    expect(result).not.toHaveProperty("__IS_ROOT__");
    expect(result).toHaveProperty("Expression");
  });

  it("keeps unrelated keys", () => {
    const result = removeAnkiInternalFields({
      Sentence: "hello",
      Picture: "<img />",
      MiscInfo: "info",
    });
    expect(result).toEqual({ Sentence: "hello", Picture: "<img />", MiscInfo: "info" });
  });

  it("handles empty object", () => {
    expect(removeAnkiInternalFields({})).toEqual({});
  });
});
