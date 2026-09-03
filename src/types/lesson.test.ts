import { describe, expect, it } from "vitest";

import { parseProseBody, parseResolvedQuestion } from "@/types/lesson";

describe("parseResolvedQuestion", () => {
  const validRow = {
    id: "q1",
    questionType: "multiple_choice" as const,
    itemId: "item-a",
    itemDirection: "recognition" as const,
    prompt: {
      text: "What sound does this character make?",
      displayKind: "japanese",
      displayValue: "あ",
      optionDisplayKind: "romaji",
    },
    explanation: { text: "あ makes the ah sound." },
    options: [
      { id: "opt-a", position: 1, content: { text: "a" }, isCorrect: true },
      { id: "opt-i", position: 2, content: { text: "i" }, isCorrect: false },
    ],
  };

  it("parses a well-formed question row into a ResolvedQuestion", () => {
    const result = parseResolvedQuestion(validRow);
    expect(result).toEqual({
      id: "q1",
      questionType: "multiple_choice",
      itemId: "item-a",
      itemDirection: "recognition",
      promptText: "What sound does this character make?",
      promptDisplayKind: "japanese",
      promptDisplayValue: "あ",
      optionDisplayKind: "romaji",
      explanationText: "あ makes the ah sound.",
      options: [
        { id: "opt-a", position: 1, text: "a", isCorrect: true },
        { id: "opt-i", position: 2, text: "i", isCorrect: false },
      ],
    });
  });

  it("sorts options by position regardless of input order", () => {
    const result = parseResolvedQuestion({
      ...validRow,
      options: [
        { id: "opt-i", position: 2, content: { text: "i" }, isCorrect: false },
        { id: "opt-a", position: 1, content: { text: "a" }, isCorrect: true },
      ],
    });
    expect(result.options.map((o) => o.id)).toEqual(["opt-a", "opt-i"]);
  });

  it("allows a null explanation", () => {
    const result = parseResolvedQuestion({ ...validRow, explanation: null });
    expect(result.explanationText).toBeNull();
  });

  it("throws on a malformed prompt -- this is the trust boundary for authored content", () => {
    expect(() =>
      parseResolvedQuestion({ ...validRow, prompt: { text: "missing fields" } }),
    ).toThrow();
  });

  it("throws on a malformed option", () => {
    expect(() =>
      parseResolvedQuestion({
        ...validRow,
        options: [{ id: "opt-a", position: 1, content: { wrongKey: "a" }, isCorrect: true }],
      }),
    ).toThrow();
  });
});

describe("parseProseBody", () => {
  it("parses a paragraph with plain text", () => {
    const body = parseProseBody({
      body: [{ type: "paragraph", content: [{ type: "text", value: "Hello" }] }],
    });
    expect(body).toEqual([{ type: "paragraph", content: [{ type: "text", value: "Hello" }] }]);
  });

  it("parses a Japanese inline node with furigana", () => {
    const body = parseProseBody({
      body: [
        {
          type: "paragraph",
          content: [{ type: "japanese", value: [{ text: "食", ruby: "た" }, { text: "べる" }] }],
        },
      ],
    });
    expect(body).toEqual([
      {
        type: "paragraph",
        content: [{ type: "japanese", value: [{ text: "食", ruby: "た" }, { text: "べる" }] }],
      },
    ]);
  });

  it("throws on an unrecognised node type", () => {
    expect(() => parseProseBody({ body: [{ type: "not-a-real-type" }] })).toThrow();
  });

  it("throws when body is missing", () => {
    expect(() => parseProseBody({})).toThrow();
  });
});
