import { emptyLessonProgressState } from "@/types/content";
import type { LessonProgressState } from "@/types/content";
import type { LessonBlockData, ResolvedQuestion } from "@/types/lesson";
import type { LessonProgressStatus, SrsDirection } from "@/types/domain";

/**
 * The pure core of lesson progress: state transitions and derived values,
 * with no Supabase, no React, no I/O of any kind. See
 * docs/LEARNING-ENGINE.md ("Lesson completion") for the rules this
 * implements. Kept separate from `persistence.ts` (which writes these states
 * to the database) and from `LessonPlayer` (which calls both) specifically so
 * these rules are testable without mocking a network call.
 */

export { emptyLessonProgressState };

/** Whether `state` already counts `block` as satisfied. */
export function isBlockSatisfied(block: LessonBlockData, state: LessonProgressState): boolean {
  if (block.type === "question") {
    return block.question ? (state.questions[block.question.id]?.completed ?? false) : false;
  }
  return state.completedBlockIds.includes(block.id);
}

/**
 * Marks a non-question block as viewed. Non-question blocks are satisfied by
 * presentation alone (see docs/LEARNING-ENGINE.md) — there is nothing to
 * grade about reading a card or hearing an audio clip.
 *
 * Returns the same reference when the block was already marked, so callers
 * can cheaply skip a write when nothing changed.
 */
export function markBlockViewed(state: LessonProgressState, blockId: string): LessonProgressState {
  if (state.completedBlockIds.includes(blockId)) return state;
  return { ...state, completedBlockIds: [...state.completedBlockIds, blockId] };
}

/**
 * What happened as a result of one answer to one question.
 *
 * - `"completed"` — this answer is the first correct one for this question.
 *   The only outcome that should trigger SRS card creation.
 * - `"already-completed"` — the question was completed before this answer;
 *   its `completed` flag never regresses, whatever this answer was.
 * - `"retry"` — an incorrect answer to a not-yet-completed question. The
 *   learner can try again; nothing is locked.
 */
export type AnswerOutcome = "completed" | "already-completed" | "retry";

export function recordQuestionAnswer(
  state: LessonProgressState,
  questionId: string,
  isCorrect: boolean,
  now: string,
): { state: LessonProgressState; outcome: AnswerOutcome } {
  const existing = state.questions[questionId];
  const wasCompleted = existing?.completed ?? false;
  const attempts = (existing?.attempts ?? 0) + 1;

  const completed = wasCompleted || isCorrect;
  const outcome: AnswerOutcome = wasCompleted
    ? "already-completed"
    : isCorrect
      ? "completed"
      : "retry";

  return {
    state: {
      ...state,
      questions: {
        ...state.questions,
        [questionId]: { attempts, completed, lastAnsweredAt: now },
      },
    },
    outcome,
  };
}

/** Derives lesson status from progress against a lesson's required blocks. */
export function computeLessonStatus(
  blocks: LessonBlockData[],
  state: LessonProgressState,
): LessonProgressStatus {
  const hasAnyProgress =
    state.completedBlockIds.length > 0 || Object.keys(state.questions).length > 0;
  if (!hasAnyProgress) return "not_started";

  const requiredBlocks = blocks.filter((block) => block.isRequired);
  const allSatisfied = requiredBlocks.every((block) => isBlockSatisfied(block, state));
  return allSatisfied ? "completed" : "in_progress";
}

/**
 * The index of the first required, unsatisfied block — where a learner should
 * resume. Returns the last index once every required block is satisfied (or
 * there are no blocks), which is where the lesson-complete view lives.
 */
export function firstUnsatisfiedBlockIndex(
  blocks: LessonBlockData[],
  state: LessonProgressState,
): number {
  if (blocks.length === 0) return 0;
  const index = blocks.findIndex((block) => block.isRequired && !isBlockSatisfied(block, state));
  return index === -1 ? blocks.length - 1 : index;
}

/**
 * The (item, direction) pair to create an SRS card for, given how a question
 * was just answered — or `null` if this answer shouldn't create one.
 *
 * Only `"completed"` (the first-correct transition) creates a card. Answering
 * an already-completed question again, correctly or not, must not create a
 * second one — that guarantee is enforced at the database level by
 * `srs_cards`'s unique constraint (see docs/SRS.md), but starting from the
 * right outcome here means the common case never even attempts a duplicate
 * write.
 */
export function srsCardIntentFor(
  question: ResolvedQuestion,
  outcome: AnswerOutcome,
): { itemId: string; direction: SrsDirection } | null {
  if (outcome !== "completed") return null;
  if (!question.itemId || !question.itemDirection) return null;
  return { itemId: question.itemId, direction: question.itemDirection };
}

/** Grades a multiple-choice answer against a question's options. Pure. */
export function gradeMultipleChoice(question: ResolvedQuestion, selectedOptionId: string): boolean {
  return question.options.some((option) => option.id === selectedOptionId && option.isCorrect);
}
