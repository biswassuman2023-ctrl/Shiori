import type { SupabaseClient } from "@supabase/supabase-js";

import { emptyLessonProgressState } from "@/types/content";
import type { LessonProgressState } from "@/types/content";
import type { Database } from "@/types/database";
import type { LessonProgressStatus } from "@/types/domain";

/**
 * The I/O shell around the pure reducer in `reducer.ts`: reads and writes
 * `user_curriculum_progress` through the RLS-respecting browser client. These
 * run from Client Components (the lesson player), not from a Server
 * Component or Route Handler — `user_curriculum_progress` is owner-writable
 * by design (see docs/DATABASE.md), so a direct client write under RLS is the
 * correct, intended path here, not a shortcut around one.
 */

export type LoadedLessonProgress = {
  state: LessonProgressState;
  status: LessonProgressStatus;
};

/** Loads existing progress for (user, lesson), or `null` if none exists yet. */
export async function loadLessonProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string,
): Promise<LoadedLessonProgress | null> {
  const { data, error } = await supabase
    .from("user_curriculum_progress")
    .select("status, progress_state")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    status: data.status,
    state: parseProgressState(data.progress_state),
  };
}

/**
 * Persists progress for (user, lesson).
 *
 * `isFirstSave` and `justCompleted` are supplied by the caller rather than
 * inferred here, because the caller (LessonPlayer) is the one that knows the
 * *previous* state — this function stays a pure write, not a read-then-write.
 *
 * Uses `upsert` with only the changed columns present in the payload: on the
 * `ON CONFLICT` path, Postgres updates exactly the columns given and leaves
 * every other column untouched, so `started_at` is set once (only on
 * `isFirstSave`) and never overwritten by a later save, and `completed_at` is
 * stamped once (only on `justCompleted`) rather than creeping forward on
 * every save after completion.
 */
export async function saveLessonProgress(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    lessonId: string;
    state: LessonProgressState;
    status: LessonProgressStatus;
    isFirstSave: boolean;
    justCompleted: boolean;
  },
): Promise<void> {
  const nowIso = new Date().toISOString();

  const payload: Database["public"]["Tables"]["user_curriculum_progress"]["Insert"] = {
    user_id: params.userId,
    lesson_id: params.lessonId,
    status: params.status,
    progress_state: params.state,
  };
  if (params.isFirstSave) payload.started_at = nowIso;
  if (params.justCompleted) payload.completed_at = nowIso;

  const { error } = await supabase
    .from("user_curriculum_progress")
    .upsert(payload, { onConflict: "user_id,lesson_id" });
  if (error) throw error;
}

/**
 * Narrows the `jsonb` column back into `LessonProgressState`.
 *
 * No schema validation here (unlike the question/prompt parsing in
 * `types/lesson.ts`): this column is written only by this module, never by a
 * content pipeline, so the trust boundary that justifies Zod validation for
 * authored content doesn't apply — a malformed value here would be this
 * module's own bug, not untrusted input.
 */
function parseProgressState(value: unknown): LessonProgressState {
  if (value && typeof value === "object" && "completedBlockIds" in value && "questions" in value) {
    return value as LessonProgressState;
  }
  return emptyLessonProgressState();
}
