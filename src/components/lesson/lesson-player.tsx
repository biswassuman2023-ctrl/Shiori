"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "@/components/lesson/register-blocks";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { LessonInteractionProvider } from "@/components/lesson/lesson-interaction-context";
import { getBlockRenderer } from "@/content/registry";
import { useSupabase } from "@/hooks/use-supabase";
import { loadLessonProgress, saveLessonProgress } from "@/lib/lesson-progress/persistence";
import {
  computeLessonStatus,
  emptyLessonProgressState,
  firstUnsatisfiedBlockIndex,
  isBlockSatisfied,
  markBlockViewed,
  recordQuestionAnswer,
  srsCardIntentFor,
} from "@/lib/lesson-progress/reducer";
import { ensureSrsCard } from "@/lib/lesson-progress/srs";
import { ensureSession } from "@/lib/supabase/ensure-session";
import { cn } from "@/lib/utils/cn";
import type { LessonProgressState } from "@/types/content";
import type { LessonProgressStatus } from "@/types/domain";
import type { LessonBlockData, LessonData, ResolvedQuestion } from "@/types/lesson";

type Phase = "loading" | "ready" | "error";

/**
 * Orchestrates one lesson: session bootstrap, resuming saved progress,
 * navigation between blocks, and recording completion + SRS cards as the
 * learner practices. See docs/LEARNING-ENGINE.md ("Lesson completion") and
 * docs/SRS.md ("Card creation") for the rules this implements — the rules
 * themselves live in `src/lib/lesson-progress/reducer.ts`, kept pure and
 * tested independently of this component.
 */
export function LessonPlayer({ lesson }: { lesson: LessonData }) {
  const supabase = useSupabase();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<LessonProgressState>(
    emptyLessonProgressState(),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  /** Whether a `user_curriculum_progress` row already existed when this
   * mount loaded — decides whether the next save is an insert (sets
   * `started_at`) or an update. See persistence.ts. */
  const rowExistedOnLoad = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { userId: id } = await ensureSession(supabase);
        const loaded = await loadLessonProgress(supabase, id, lesson.id);
        if (cancelled) return;

        setUserId(id);

        const baseState = loaded ? loaded.state : emptyLessonProgressState();
        if (loaded) rowExistedOnLoad.current = true;

        const baseStatus = computeLessonStatus(lesson.blocks, baseState);
        if (baseStatus === "completed") {
          setProgressState(baseState);
          setShowCompletionScreen(true);
          setPhase("ready");
          return;
        }

        // The block a resuming learner lands on needs to count as viewed
        // immediately (they're about to see it), the same way it would if
        // they had just navigated to it with Continue. Folded into this
        // async continuation rather than a separate reactive effect, so
        // there is exactly one place that ever calls setState purely because
        // "the current block changed" — inside a genuine event or a resolved
        // async load, never a bare effect body watching state.
        const index = firstUnsatisfiedBlockIndex(lesson.blocks, baseState);
        const landingBlock = lesson.blocks[index];
        const shouldMarkViewed =
          landingBlock !== undefined &&
          landingBlock.type !== "question" &&
          !isBlockSatisfied(landingBlock, baseState);
        const finalState = shouldMarkViewed
          ? markBlockViewed(baseState, landingBlock.id)
          : baseState;

        setProgressState(finalState);
        setCurrentIndex(index);
        setPhase("ready");

        if (shouldMarkViewed && landingBlock) {
          const finalStatus = computeLessonStatus(lesson.blocks, finalState);
          try {
            await saveLessonProgress(supabase, {
              userId: id,
              lessonId: lesson.id,
              state: finalState,
              status: finalStatus,
              isFirstSave: !rowExistedOnLoad.current,
              justCompleted: finalStatus === "completed",
            });
            rowExistedOnLoad.current = true;
          } catch (error) {
            if (!cancelled) {
              setErrorMessage(error instanceof Error ? error.message : "Could not save progress.");
            }
          }
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
        setPhase("error");
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // `lesson` is stable for the lifetime of this component -- one lesson per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const persistNow = useCallback(
    async (state: LessonProgressState, status: LessonProgressStatus, justCompleted: boolean) => {
      if (!userId) return;
      try {
        await saveLessonProgress(supabase, {
          userId,
          lessonId: lesson.id,
          state,
          status,
          isFirstSave: !rowExistedOnLoad.current,
          justCompleted,
        });
        rowExistedOnLoad.current = true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not save progress.");
      }
    },
    [userId, lesson.id, supabase],
  );

  const handleBlockViewed = useCallback(
    (blockId: string) => {
      setProgressState((previous) => {
        const next = markBlockViewed(previous, blockId);
        if (next === previous) return previous;

        const previousStatus = computeLessonStatus(lesson.blocks, previous);
        const nextStatus = computeLessonStatus(lesson.blocks, next);
        void persistNow(
          next,
          nextStatus,
          previousStatus !== "completed" && nextStatus === "completed",
        );
        return next;
      });
    },
    [lesson.blocks, persistNow],
  );

  const handleQuestionAnswered = useCallback(
    (questionId: string, isCorrect: boolean) => {
      setProgressState((previous) => {
        const { state: next, outcome } = recordQuestionAnswer(
          previous,
          questionId,
          isCorrect,
          new Date().toISOString(),
        );

        const previousStatus = computeLessonStatus(lesson.blocks, previous);
        const nextStatus = computeLessonStatus(lesson.blocks, next);
        void persistNow(
          next,
          nextStatus,
          previousStatus !== "completed" && nextStatus === "completed",
        );

        const question = findQuestionById(lesson.blocks, questionId);
        const intent = question ? srsCardIntentFor(question, outcome) : null;
        if (intent && userId) {
          void ensureSrsCard(supabase, {
            userId,
            itemId: intent.itemId,
            direction: intent.direction,
          });
        }

        return next;
      });
    },
    [lesson.blocks, persistNow, supabase, userId],
  );

  const getQuestionProgress = useCallback(
    (questionId: string) => progressState.questions[questionId],
    [progressState],
  );

  const currentBlock: LessonBlockData | undefined = lesson.blocks[currentIndex];

  // Looked up (never constructed) from the stable, module-level registry in
  // src/content/registry.ts, so the same block type always resolves to the
  // same reference -- memoised so that identity, not the lookup call itself,
  // is what changes across renders.
  const Renderer = useMemo(
    () => (currentBlock ? getBlockRenderer(currentBlock.type) : undefined),
    [currentBlock],
  );

  if (phase === "loading" || phase === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-10 sm:py-16">
        <LessonHeader
          levelTitle={lesson.levelTitle}
          unitTitle={lesson.unitTitle}
          lessonTitle={lesson.title}
          stepIndex={0}
          stepCount={lesson.blocks.length}
        />
        {phase === "error" ? (
          <p
            role="alert"
            className="rounded-card border border-yellow bg-yellow/15 px-4 py-3 text-sm text-ink"
          >
            {errorMessage ?? "Something went wrong loading this lesson."}
          </p>
        ) : (
          <p className="text-center text-sm text-ink-muted">Loading your progress…</p>
        )}
      </main>
    );
  }

  const canContinue = currentBlock ? isBlockSatisfied(currentBlock, progressState) : false;
  const isLastBlock = currentIndex === lesson.blocks.length - 1;

  function handleContinue() {
    if (!canContinue) return;
    if (isLastBlock) {
      setShowCompletionScreen(true);
      return;
    }

    const nextIndex = Math.min(currentIndex + 1, lesson.blocks.length - 1);
    setCurrentIndex(nextIndex);

    // The newly-entered block counts as viewed the moment the learner
    // arrives on it, same rule as the initial landing block in bootstrap()
    // above -- both are the one moment "the current block changed" is
    // allowed to cause a state update, and both do it from a real trigger
    // (a click; a resolved async load), never a bare effect.
    const nextBlock = lesson.blocks[nextIndex];
    if (nextBlock && nextBlock.type !== "question") {
      handleBlockViewed(nextBlock.id);
    }
  }

  function handleBack() {
    // Only ever revisits an earlier, already-viewed block -- nothing to mark.
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-10 sm:py-16">
      <LessonHeader
        levelTitle={lesson.levelTitle}
        unitTitle={lesson.unitTitle}
        lessonTitle={lesson.title}
        stepIndex={showCompletionScreen ? lesson.blocks.length : currentIndex}
        stepCount={lesson.blocks.length}
      />

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-card border border-yellow bg-yellow/15 px-4 py-3 text-sm text-ink"
        >
          {errorMessage}
        </p>
      ) : null}

      {showCompletionScreen ? (
        <LessonCompleteView />
      ) : (
        <LessonInteractionProvider
          value={{ onQuestionAnswered: handleQuestionAnswered, getQuestionProgress }}
        >
          <div className="rounded-card-lg border border-border bg-surface p-6 shadow-raised sm:p-8">
            {currentBlock && Renderer ? (
              // `Renderer` is looked up (never constructed) from the stable,
              // module-level registry in src/content/registry.ts, keyed on
              // content-supplied `block_type` -- picking a renderer this way, at
              // runtime, rather than a static per-lesson component tree, *is* the
              // architecture (see docs/LEARNING-ENGINE.md "The rendering
              // pipeline"), not an oversight this rule happens to be catching.
              // eslint-disable-next-line react-hooks/static-components
              <Renderer block={currentBlock} />
            ) : (
              <p className="text-sm text-ink-muted">
                This block isn&apos;t supported in this build yet — continuing.
              </p>
            )}
          </div>
        </LessonInteractionProvider>
      )}

      {!showCompletionScreen ? (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="rounded-button px-4 py-2.5 text-sm text-ink-secondary disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              "duration-fast rounded-button bg-coral px-6 py-2.5 text-sm font-medium text-ink transition-opacity",
              "disabled:opacity-40",
            )}
          >
            {isLastBlock ? "Finish lesson" : "Continue"}
          </button>
        </div>
      ) : null}
    </main>
  );
}

function LessonCompleteView() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card-lg border border-border bg-surface p-8 text-center shadow-raised sm:p-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-sage/20 text-sage">
        <CheckIcon className="size-6" />
      </span>
      <h2 className="text-xl font-medium text-ink">Lesson complete</h2>
      <p lang="ja" className="text-3xl text-ink">
        あいうえお
      </p>
      <p className="max-w-sm text-sm text-ink-secondary">
        You&apos;ve learned the five vowel sounds and practiced recognizing and recalling each one.
        Your progress is saved.
      </p>
      <Link
        href="/learn"
        className="mt-2 rounded-button bg-coral px-5 py-2.5 text-sm font-medium text-ink"
      >
        Back to curriculum
      </Link>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function findQuestionById(blocks: LessonBlockData[], questionId: string): ResolvedQuestion | null {
  for (const block of blocks) {
    if (block.question?.id === questionId) return block.question;
  }
  return null;
}
