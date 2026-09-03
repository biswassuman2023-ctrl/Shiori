import { describe, expect, it } from "vitest";

import { loadLessonProgress, saveLessonProgress } from "@/lib/lesson-progress/persistence";
import { createMockSupabase } from "@/test/mock-supabase";
import type { LessonProgressState } from "@/types/content";

const sampleState: LessonProgressState = {
  completedBlockIds: ["b1"],
  questions: { q1: { attempts: 1, completed: true, lastAnsweredAt: "2026-01-01T00:00:00Z" } },
};

describe("loadLessonProgress", () => {
  it("returns null when no row exists yet", async () => {
    const { supabase } = createMockSupabase({ maybeSingleResult: { data: null, error: null } });
    const result = await loadLessonProgress(supabase, "user-1", "lesson-1");
    expect(result).toBeNull();
  });

  it("scopes the query to the given user and lesson", async () => {
    const { supabase, calls } = createMockSupabase({
      maybeSingleResult: { data: null, error: null },
    });
    await loadLessonProgress(supabase, "user-1", "lesson-1");

    expect(calls[0]).toEqual({ method: "from", args: ["user_curriculum_progress"] });
    const eqCalls = calls.filter((c) => c.method === "eq");
    expect(eqCalls).toEqual([
      { method: "eq", args: ["user_id", "user-1"] },
      { method: "eq", args: ["lesson_id", "lesson-1"] },
    ]);
  });

  it("returns the stored state and status when a row exists", async () => {
    const { supabase } = createMockSupabase({
      maybeSingleResult: {
        data: { status: "in_progress", progress_state: sampleState },
        error: null,
      },
    });
    const result = await loadLessonProgress(supabase, "user-1", "lesson-1");
    expect(result).toEqual({ status: "in_progress", state: sampleState });
  });

  it("falls back to an empty state if the stored value is malformed", async () => {
    const { supabase } = createMockSupabase({
      maybeSingleResult: {
        data: { status: "in_progress", progress_state: { unexpected: true } },
        error: null,
      },
    });
    const result = await loadLessonProgress(supabase, "user-1", "lesson-1");
    expect(result?.state).toEqual({ completedBlockIds: [], questions: {} });
  });

  it("throws when the query errors", async () => {
    const { supabase } = createMockSupabase({
      maybeSingleResult: { data: null, error: new Error("connection refused") },
    });
    await expect(loadLessonProgress(supabase, "user-1", "lesson-1")).rejects.toThrow(
      "connection refused",
    );
  });
});

describe("saveLessonProgress", () => {
  it("sets started_at only on the first save", async () => {
    const { supabase, calls } = createMockSupabase();
    await saveLessonProgress(supabase, {
      userId: "user-1",
      lessonId: "lesson-1",
      state: sampleState,
      status: "in_progress",
      isFirstSave: true,
      justCompleted: false,
    });

    const upsertCall = calls.find((c) => c.method === "upsert");
    const payload = upsertCall?.args[0] as Record<string, unknown>;
    expect(payload.started_at).toBeDefined();
    expect(payload.completed_at).toBeUndefined();
  });

  it("omits started_at on a later save, so it is never overwritten", async () => {
    const { supabase, calls } = createMockSupabase();
    await saveLessonProgress(supabase, {
      userId: "user-1",
      lessonId: "lesson-1",
      state: sampleState,
      status: "in_progress",
      isFirstSave: false,
      justCompleted: false,
    });

    const payload = calls.find((c) => c.method === "upsert")?.args[0] as Record<string, unknown>;
    expect(payload.started_at).toBeUndefined();
  });

  it("stamps completed_at only on the save where the lesson just completed", async () => {
    const { supabase, calls } = createMockSupabase();
    await saveLessonProgress(supabase, {
      userId: "user-1",
      lessonId: "lesson-1",
      state: sampleState,
      status: "completed",
      isFirstSave: false,
      justCompleted: true,
    });

    const payload = calls.find((c) => c.method === "upsert")?.args[0] as Record<string, unknown>;
    expect(payload.completed_at).toBeDefined();
  });

  it("does not restamp completed_at on a save after completion", async () => {
    const { supabase, calls } = createMockSupabase();
    await saveLessonProgress(supabase, {
      userId: "user-1",
      lessonId: "lesson-1",
      state: sampleState,
      status: "completed",
      isFirstSave: false,
      justCompleted: false,
    });

    const payload = calls.find((c) => c.method === "upsert")?.args[0] as Record<string, unknown>;
    expect(payload.completed_at).toBeUndefined();
  });

  it("upserts on the (user_id, lesson_id) conflict target", async () => {
    const { supabase, calls } = createMockSupabase();
    await saveLessonProgress(supabase, {
      userId: "user-1",
      lessonId: "lesson-1",
      state: sampleState,
      status: "in_progress",
      isFirstSave: false,
      justCompleted: false,
    });

    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall?.args[1]).toEqual({ onConflict: "user_id,lesson_id" });
  });

  it("throws when the write errors", async () => {
    const { supabase } = createMockSupabase({
      upsertResult: { data: null, error: new Error("write failed") },
    });
    await expect(
      saveLessonProgress(supabase, {
        userId: "user-1",
        lessonId: "lesson-1",
        state: sampleState,
        status: "in_progress",
        isFirstSave: false,
        justCompleted: false,
      }),
    ).rejects.toThrow("write failed");
  });
});
