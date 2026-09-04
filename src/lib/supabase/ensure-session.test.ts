import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureSession } from "@/lib/supabase/ensure-session";
import { saveLessonProgress } from "@/lib/lesson-progress/persistence";
import { createMockSupabase } from "@/test/mock-supabase";
import type { Database } from "@/types/database";

type AuthMockOptions = {
  session: { user: { id: string } } | null;
  getUser?: { data: { user: { id: string } | null }; error: unknown };
  signInAnonymously?: { data: { user: { id: string } | null }; error: unknown };
};

/**
 * A minimal stand-in for `supabase.auth`, covering exactly the three calls
 * `ensureSession` makes: `getSession`, `getUser`, `signInAnonymously`.
 */
function createMockAuthClient(options: AuthMockOptions) {
  const getUser = vi.fn(
    async () => options.getUser ?? { data: { user: null }, error: new Error("not configured") },
  );
  const signInAnonymously = vi.fn(
    async () =>
      options.signInAnonymously ?? { data: { user: null }, error: new Error("not configured") },
  );

  const supabase = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: options.session } })),
      getUser,
      signInAnonymously,
    },
  } as unknown as SupabaseClient<Database>;

  return { supabase, getUser, signInAnonymously };
}

describe("ensureSession", () => {
  it("reuses a cached session once getUser confirms the user still exists", async () => {
    const { supabase, getUser, signInAnonymously } = createMockAuthClient({
      session: { user: { id: "user-existing" } },
      getUser: { data: { user: { id: "user-existing" } }, error: null },
    });

    const result = await ensureSession(supabase);

    expect(result).toEqual({ userId: "user-existing" });
    expect(getUser).toHaveBeenCalledOnce();
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("establishes a fresh anonymous session when there is no cached session at all", async () => {
    const { supabase, getUser, signInAnonymously } = createMockAuthClient({
      session: null,
      signInAnonymously: { data: { user: { id: "user-fresh" } }, error: null },
    });

    const result = await ensureSession(supabase);

    expect(result).toEqual({ userId: "user-fresh" });
    // No cached session to check -- getUser is never called, only the cheap
    // local getSession() read plus the actual sign-in.
    expect(getUser).not.toHaveBeenCalled();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("falls through to a fresh anonymous session when the cached session is stale (getUser errors)", async () => {
    // This is the exact bug: a session cached locally (e.g. from before a
    // database reset) whose user no longer exists server-side. getUser()
    // revalidates against the server and errors; ensureSession must not
    // trust the stale id and must establish a real one instead.
    const { supabase, getUser, signInAnonymously } = createMockAuthClient({
      session: { user: { id: "user-stale" } },
      getUser: { data: { user: null }, error: { message: "User not found", status: 404 } },
      signInAnonymously: { data: { user: { id: "user-fresh" } }, error: null },
    });

    const result = await ensureSession(supabase);

    expect(result).toEqual({ userId: "user-fresh" });
    expect(result.userId).not.toBe("user-stale");
    expect(getUser).toHaveBeenCalledOnce();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("falls through to a fresh anonymous session when getUser returns no user without an error", async () => {
    const { supabase, signInAnonymously } = createMockAuthClient({
      session: { user: { id: "user-stale" } },
      getUser: { data: { user: null }, error: null },
      signInAnonymously: { data: { user: { id: "user-fresh" } }, error: null },
    });

    const result = await ensureSession(supabase);

    expect(result).toEqual({ userId: "user-fresh" });
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("throws a clear error when anonymous sign-in itself fails", async () => {
    const { supabase } = createMockAuthClient({
      session: null,
      signInAnonymously: {
        data: { user: null },
        error: { message: "Anonymous sign-ins are disabled" },
      },
    });

    await expect(ensureSession(supabase)).rejects.toThrow(/Could not establish a session/);
  });

  it("never calls signInAnonymously when the cached session is valid -- no unnecessary account churn", async () => {
    const { signInAnonymously, supabase } = createMockAuthClient({
      session: { user: { id: "user-existing" } },
      getUser: { data: { user: { id: "user-existing" } }, error: null },
    });

    await ensureSession(supabase);

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("the fresh user id from a stale-session fallback is what a subsequent save actually uses", async () => {
    // Composes ensureSession with saveLessonProgress (both against mocked
    // Supabase clients) to demonstrate the fix end-to-end at the unit level:
    // once a stale session is replaced, progress is saved under the new,
    // real user id -- not the dead one that caused the original
    // foreign-key-violation bug.
    const { supabase: authClient } = createMockAuthClient({
      session: { user: { id: "user-stale" } },
      getUser: { data: { user: null }, error: { message: "User not found" } },
      signInAnonymously: { data: { user: { id: "user-fresh" } }, error: null },
    });

    const { userId } = await ensureSession(authClient);

    const { supabase: dataClient, calls } = createMockSupabase();
    await saveLessonProgress(dataClient, {
      userId,
      lessonId: "lesson-1",
      state: { completedBlockIds: ["b1"], questions: {} },
      status: "in_progress",
      isFirstSave: true,
      justCompleted: false,
    });

    const payload = calls.find((c) => c.method === "upsert")?.args[0] as Record<string, unknown>;
    expect(payload.user_id).toBe("user-fresh");
    expect(payload.user_id).not.toBe("user-stale");
  });
});
