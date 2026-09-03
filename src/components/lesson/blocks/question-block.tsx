"use client";

import { useState } from "react";

import { useLessonInteraction } from "@/components/lesson/lesson-interaction-context";
import { gradeMultipleChoice } from "@/lib/lesson-progress/reducer";
import { cn } from "@/lib/utils/cn";
import type { BlockRendererProps } from "@/content/registry";

/**
 * A multiple-choice practice question. Grading happens client-side —
 * `question_options.is_correct` is intentionally readable for ordinary
 * practice questions (see docs/DATABASE.md "Gated questions"); this lesson's
 * questions are not gated.
 *
 * Wrong answers show feedback and stay retryable — see
 * docs/LEARNING-ENGINE.md ("Lesson completion"): there is no accuracy
 * threshold and no permanent lockout. Once a question is answered correctly
 * for the first time, it stays in its completed state even if revisited.
 */
export function QuestionBlock({ block }: BlockRendererProps) {
  const { onQuestionAnswered, getQuestionProgress } = useLessonInteraction();
  const question = block.question;

  const existing = question ? getQuestionProgress(question.id) : undefined;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(existing?.completed ?? false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    existing?.completed ? "correct" : null,
  );

  if (!question) return null;

  const isJapaneseDisplay = question.promptDisplayKind === "japanese";

  function handleSelect(optionId: string) {
    if (isCompleted || !question) return;

    const isCorrect = gradeMultipleChoice(question, optionId);
    setSelectedOptionId(optionId);
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setIsCompleted(true);
    onQuestionAnswered(question.id, isCorrect);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 text-center">
        <p className="text-sm text-ink-secondary">{question.promptText}</p>
        <p
          lang={isJapaneseDisplay ? "ja" : undefined}
          className={cn(
            "text-ink",
            isJapaneseDisplay ? "text-6xl" : "text-4xl font-medium tracking-wide",
          )}
        >
          {question.promptDisplayValue}
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Answer choices"
      >
        {question.options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          const revealCorrect = isCompleted && option.isCorrect;
          const revealIncorrectSelection = isSelected && feedback === "incorrect";

          return (
            <button
              key={option.id}
              type="button"
              disabled={isCompleted}
              onClick={() => handleSelect(option.id)}
              lang={question.optionDisplayKind === "japanese" ? "ja" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "duration-fast rounded-button border px-4 py-3 text-lg transition-colors",
                "disabled:cursor-default",
                revealCorrect
                  ? "border-sage bg-sage/15 text-ink"
                  : revealIncorrectSelection
                    ? "border-yellow bg-yellow/15 text-ink"
                    : "border-border bg-surface text-ink hover:border-coral disabled:hover:border-border",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-12 text-center">
        {feedback === "correct" ? (
          <p className="text-sm text-ink">
            <span className="font-medium text-ink">Correct.</span> {question.explanationText}
          </p>
        ) : feedback === "incorrect" ? (
          <p className="text-sm text-ink-secondary">Not quite — try another option.</p>
        ) : null}
      </div>
    </div>
  );
}
