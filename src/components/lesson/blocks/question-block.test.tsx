import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionBlock } from "@/components/lesson/blocks/question-block";
import { LessonInteractionProvider } from "@/components/lesson/lesson-interaction-context";
import type { LessonInteraction } from "@/components/lesson/lesson-interaction-context";
import type { LessonBlockData, ResolvedQuestion } from "@/types/lesson";

const question: ResolvedQuestion = {
  id: "q1",
  questionType: "multiple_choice",
  itemId: "item-a",
  itemDirection: "recognition",
  promptText: "What sound does this character make?",
  promptDisplayKind: "japanese",
  promptDisplayValue: "あ",
  optionDisplayKind: "romaji",
  explanationText: "あ makes the ah sound, like the a in father.",
  options: [
    { id: "opt-a", position: 1, text: "a", isCorrect: true },
    { id: "opt-i", position: 2, text: "i", isCorrect: false },
    { id: "opt-u", position: 3, text: "u", isCorrect: false },
  ],
};

const block: LessonBlockData = {
  id: "block-1",
  position: 1,
  type: "question",
  isRequired: true,
  props: {},
  items: [],
  question,
};

function renderQuestionBlock(overrides: Partial<LessonInteraction> = {}) {
  const onQuestionAnswered = vi.fn();
  const getQuestionProgress = vi.fn(() => undefined);
  const value: LessonInteraction = { onQuestionAnswered, getQuestionProgress, ...overrides };

  render(
    <LessonInteractionProvider value={value}>
      <QuestionBlock block={block} />
    </LessonInteractionProvider>,
  );

  return { onQuestionAnswered, getQuestionProgress };
}

describe("QuestionBlock", () => {
  it("renders the prompt and every option", () => {
    renderQuestionBlock();
    expect(screen.getByText("What sound does this character make?")).toBeInTheDocument();
    expect(screen.getByText("あ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "i" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "u" })).toBeInTheDocument();
  });

  it("reports a correct answer and shows the explanation", async () => {
    const user = userEvent.setup();
    const { onQuestionAnswered } = renderQuestionBlock();

    await user.click(screen.getByRole("button", { name: "a" }));

    expect(onQuestionAnswered).toHaveBeenCalledExactlyOnceWith("q1", true);
    expect(screen.getByText(/makes the ah sound/)).toBeInTheDocument();
  });

  it("reports a wrong answer without locking the question, and lets the learner retry", async () => {
    const user = userEvent.setup();
    const { onQuestionAnswered } = renderQuestionBlock();

    await user.click(screen.getByRole("button", { name: "i" }));
    expect(onQuestionAnswered).toHaveBeenNthCalledWith(1, "q1", false);
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
    // Nothing is disabled after a wrong answer -- the learner can pick again.
    expect(screen.getByRole("button", { name: "a" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "a" }));
    expect(onQuestionAnswered).toHaveBeenNthCalledWith(2, "q1", true);
    expect(onQuestionAnswered).toHaveBeenCalledTimes(2);
  });

  it("disables the options once answered correctly", async () => {
    const user = userEvent.setup();
    renderQuestionBlock();

    await user.click(screen.getByRole("button", { name: "a" }));

    expect(screen.getByRole("button", { name: "a" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "i" })).toBeDisabled();
  });

  it("ignores further clicks once already completed -- no repeat calls", async () => {
    const user = userEvent.setup();
    const { onQuestionAnswered } = renderQuestionBlock();

    await user.click(screen.getByRole("button", { name: "a" }));
    // Options are disabled post-completion; a click on a disabled button is a no-op.
    await user.click(screen.getByRole("button", { name: "i" }));

    expect(onQuestionAnswered).toHaveBeenCalledTimes(1);
  });

  it("renders already in the completed state when progress says it was already answered", () => {
    renderQuestionBlock({
      getQuestionProgress: () => ({ attempts: 2, completed: true }),
    });

    expect(screen.getByRole("button", { name: "a" })).toBeDisabled();
    expect(screen.getByText(/makes the ah sound/)).toBeInTheDocument();
  });
});
