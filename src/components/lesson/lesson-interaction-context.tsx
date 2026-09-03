"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * The one piece of ambient state a block renderer is allowed beyond its own
 * `block` prop: a way to report a question's answer, and a way to read that
 * question's prior progress on revisit.
 *
 * Deliberately a context, not an addition to `BlockRendererProps`
 * (src/content/registry.ts) — the registry's contract stays "every renderer
 * receives exactly `{ block }`", true for every content type including the
 * ones that never need interaction. Only `QuestionBlock` reaches for this.
 */
export type LessonInteraction = {
  onQuestionAnswered: (questionId: string, isCorrect: boolean) => void;
  getQuestionProgress: (questionId: string) => { attempts: number; completed: boolean } | undefined;
};

const LessonInteractionContext = createContext<LessonInteraction | null>(null);

export function LessonInteractionProvider({
  value,
  children,
}: {
  value: LessonInteraction;
  children: ReactNode;
}) {
  return (
    <LessonInteractionContext.Provider value={value}>{children}</LessonInteractionContext.Provider>
  );
}

export function useLessonInteraction(): LessonInteraction {
  const context = useContext(LessonInteractionContext);
  if (!context) {
    throw new Error("useLessonInteraction must be used within a LessonInteractionProvider.");
  }
  return context;
}
