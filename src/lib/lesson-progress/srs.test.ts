import { describe, expect, it } from "vitest";

import { ensureSrsCard } from "@/lib/lesson-progress/srs";
import { createMockSupabase } from "@/test/mock-supabase";

describe("ensureSrsCard", () => {
  it("upserts a new card in state 'new', due immediately", async () => {
    const { supabase, calls } = createMockSupabase();
    await ensureSrsCard(supabase, { userId: "user-1", itemId: "item-a", direction: "recognition" });

    expect(calls[0]).toEqual({ method: "from", args: ["srs_cards"] });
    const payload = calls.find((c) => c.method === "upsert")?.args[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      user_id: "user-1",
      item_id: "item-a",
      direction: "recognition",
      state: "new",
      scheduler: "unset",
    });
    expect(typeof payload.due_at).toBe("string");
  });

  it("upserts on the (user_id, item_id, direction) conflict target and ignores duplicates", async () => {
    // This is the actual "no duplicate cards" guarantee: it is enforced by
    // srs_cards's unique constraint via ON CONFLICT ... DO NOTHING, which
    // `ignoreDuplicates: true` compiles to -- not by application logic. This
    // test verifies the call is shaped to invoke that guarantee; it cannot
    // verify the guarantee itself without a real Postgres instance. See
    // docs/DATABASE.md and the vertical-slice report for what remains
    // unverified without Docker.
    const { supabase, calls } = createMockSupabase();
    await ensureSrsCard(supabase, { userId: "user-1", itemId: "item-a", direction: "recall" });

    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall?.args[1]).toEqual({
      onConflict: "user_id,item_id,direction",
      ignoreDuplicates: true,
    });
  });

  it("is safe to call twice for the same (user, item, direction) -- same call shape both times", async () => {
    const { supabase, calls } = createMockSupabase();
    await ensureSrsCard(supabase, { userId: "user-1", itemId: "item-a", direction: "recognition" });
    await ensureSrsCard(supabase, { userId: "user-1", itemId: "item-a", direction: "recognition" });

    const upsertCalls = calls.filter((c) => c.method === "upsert");
    expect(upsertCalls).toHaveLength(2);
    expect(upsertCalls[0]?.args[1]).toEqual(upsertCalls[1]?.args[1]);
  });

  it("throws when the write errors", async () => {
    const { supabase } = createMockSupabase({
      upsertResult: { data: null, error: new Error("write failed") },
    });
    await expect(
      ensureSrsCard(supabase, { userId: "user-1", itemId: "item-a", direction: "recognition" }),
    ).rejects.toThrow("write failed");
  });
});
