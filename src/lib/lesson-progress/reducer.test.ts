import { describe, expect, it } from "vitest";

import {
  computeLessonStatus,
  emptyLessonProgressState,
  firstUnsatisfiedBlockIndex,
  gradeMultipleChoice,
  isBlockSatisfied,
  markBlockViewed,
  recordQuestionAnswer,
  srsCardIntentFor,
} from "@/lib/lesson-progress/reducer";
import type { LessonBlockData, ResolvedQuestion } from "@/types/lesson";

function question(overrides: Partial<ResolvedQuestion> = {}): ResolvedQuestion {
  return {
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
      { id: "opt-u", position: 3, text: "u", isCorrect: false },
    ],
    ...overrides,
  };
}

function proseBlock(id: string, isRequired = true): LessonBlockData {
  return { id, position: 1, type: "prose", isRequired, props: {}, items: [], question: null };
}

function kanaBlock(id: string, isRequired = true): LessonBlockData {
  return { id, position: 2, type: "kana", isRequired, props: {}, items: [], question: null };
}

function questionBlock(id: string, q: ResolvedQuestion, isRequired = true): LessonBlockData {
  return { id, position: 3, type: "question", isRequired, props: {}, items: [], question: q };
}

describe("markBlockViewed", () => {
  it("adds a new block id", () => {
    const state = markBlockViewed(emptyLessonProgressState(), "block-1");
    expect(state.completedBlockIds).toEqual(["block-1"]);
  });

  it("is idempotent and returns the same reference when already viewed", () => {
    const state = markBlockViewed(emptyLessonProgressState(), "block-1");
    const again = markBlockViewed(state, "block-1");
    expect(again).toBe(state);
    expect(again.completedBlockIds).toEqual(["block-1"]);
  });

  it("does not disturb question progress already recorded", () => {
    const withAnswer = recordQuestionAnswer(
      emptyLessonProgressState(),
      "q1",
      true,
      "2026-01-01T00:00:00Z",
    ).state;
    const next = markBlockViewed(withAnswer, "block-1");
    expect(next.questions).toEqual(withAnswer.questions);
  });
});

describe("recordQuestionAnswer", () => {
  it("marks a first correct answer as completed", () => {
    const { state, outcome } = recordQuestionAnswer(
      emptyLessonProgressState(),
      "q1",
      true,
      "2026-01-01T00:00:00Z",
    );
    expect(outcome).toBe("completed");
    expect(state.questions.q1).toEqual({
      attempts: 1,
      completed: true,
      lastAnsweredAt: "2026-01-01T00:00:00Z",
    });
  });

  it("marks an incorrect answer to a fresh question as retry, not completed", () => {
    const { state, outcome } = recordQuestionAnswer(
      emptyLessonProgressState(),
      "q1",
      false,
      "2026-01-01T00:00:00Z",
    );
    expect(outcome).toBe("retry");
    expect(state.questions.q1?.completed).toBe(false);
    expect(state.questions.q1?.attempts).toBe(1);
  });

  it("lets a retry succeed: wrong then right completes the question", () => {
    const afterWrong = recordQuestionAnswer(emptyLessonProgressState(), "q1", false, "t1").state;
    const { state, outcome } = recordQuestionAnswer(afterWrong, "q1", true, "t2");
    expect(outcome).toBe("completed");
    expect(state.questions.q1).toEqual({ attempts: 2, completed: true, lastAnsweredAt: "t2" });
  });

  it("never regresses an already-completed question, even on a later wrong answer", () => {
    const completed = recordQuestionAnswer(emptyLessonProgressState(), "q1", true, "t1").state;
    const { state, outcome } = recordQuestionAnswer(completed, "q1", false, "t2");
    expect(outcome).toBe("already-completed");
    expect(state.questions.q1?.completed).toBe(true);
  });

  it("reports repeat-correct answers as already-completed, not completed again", () => {
    const completed = recordQuestionAnswer(emptyLessonProgressState(), "q1", true, "t1").state;
    const { outcome } = recordQuestionAnswer(completed, "q1", true, "t2");
    expect(outcome).toBe("already-completed");
  });

  it("tracks attempts independently per question", () => {
    let state = emptyLessonProgressState();
    state = recordQuestionAnswer(state, "q1", false, "t1").state;
    state = recordQuestionAnswer(state, "q2", true, "t1").state;
    expect(state.questions.q1?.attempts).toBe(1);
    expect(state.questions.q2?.attempts).toBe(1);
  });
});

describe("isBlockSatisfied / computeLessonStatus", () => {
  const blocks = [proseBlock("b1"), kanaBlock("b2"), questionBlock("b3", question())];

  it("is not_started with no progress at all", () => {
    expect(computeLessonStatus(blocks, emptyLessonProgressState())).toBe("not_started");
  });

  it("is in_progress once some but not all required blocks are satisfied", () => {
    const state = markBlockViewed(emptyLessonProgressState(), "b1");
    expect(isBlockSatisfied(blocks[0]!, state)).toBe(true);
    expect(isBlockSatisfied(blocks[1]!, state)).toBe(false);
    expect(computeLessonStatus(blocks, state)).toBe("in_progress");
  });

  it("is completed only once every required block, including the question, is satisfied", () => {
    let state = markBlockViewed(emptyLessonProgressState(), "b1");
    state = markBlockViewed(state, "b2");
    expect(computeLessonStatus(blocks, state)).toBe("in_progress");

    state = recordQuestionAnswer(state, "q1", true, "t1").state;
    expect(computeLessonStatus(blocks, state)).toBe("completed");
  });

  it("ignores optional blocks when computing completion", () => {
    const withOptional = [proseBlock("b1"), proseBlock("optional", false)];
    const state = markBlockViewed(emptyLessonProgressState(), "b1");
    expect(computeLessonStatus(withOptional, state)).toBe("completed");
  });

  it("a question block is satisfied only by completion, not by being reached", () => {
    const block = questionBlock("b3", question());
    expect(isBlockSatisfied(block, emptyLessonProgressState())).toBe(false);
    const wrongOnly = recordQuestionAnswer(emptyLessonProgressState(), "q1", false, "t1").state;
    expect(isBlockSatisfied(block, wrongOnly)).toBe(false);
  });
});

describe("firstUnsatisfiedBlockIndex", () => {
  const blocks = [proseBlock("b1"), kanaBlock("b2"), questionBlock("b3", question())];

  it("starts at 0 for a fresh lesson", () => {
    expect(firstUnsatisfiedBlockIndex(blocks, emptyLessonProgressState())).toBe(0);
  });

  it("resumes at the first unsatisfied required block", () => {
    const state = markBlockViewed(emptyLessonProgressState(), "b1");
    expect(firstUnsatisfiedBlockIndex(blocks, state)).toBe(1);
  });

  it("lands on the last block once everything is satisfied", () => {
    let state = markBlockViewed(emptyLessonProgressState(), "b1");
    state = markBlockViewed(state, "b2");
    state = recordQuestionAnswer(state, "q1", true, "t1").state;
    expect(firstUnsatisfiedBlockIndex(blocks, state)).toBe(2);
  });
});

describe("srsCardIntentFor", () => {
  it("creates an intent only on the completed outcome", () => {
    const q = question({ itemId: "item-a", itemDirection: "recognition" });
    expect(srsCardIntentFor(q, "completed")).toEqual({
      itemId: "item-a",
      direction: "recognition",
    });
  });

  it("creates no intent for a retry", () => {
    expect(srsCardIntentFor(question(), "retry")).toBeNull();
  });

  it("creates no intent for an already-completed repeat answer -- this is what prevents duplicate cards", () => {
    expect(srsCardIntentFor(question(), "already-completed")).toBeNull();
  });

  it("creates no intent for a question with no item/direction mapping", () => {
    const q = question({ itemId: null, itemDirection: null });
    expect(srsCardIntentFor(q, "completed")).toBeNull();
  });
});

describe("gradeMultipleChoice", () => {
  it("grades the correct option as correct", () => {
    expect(gradeMultipleChoice(question(), "opt-a")).toBe(true);
  });

  it("grades any other option as incorrect", () => {
    expect(gradeMultipleChoice(question(), "opt-i")).toBe(false);
  });

  it("grades an unknown option id as incorrect rather than throwing", () => {
    expect(gradeMultipleChoice(question(), "does-not-exist")).toBe(false);
  });
});
