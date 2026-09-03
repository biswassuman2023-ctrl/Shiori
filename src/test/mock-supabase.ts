import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type MockCall = { method: string; args: unknown[] };

/**
 * A minimal stand-in for the Supabase query builder, covering exactly the
 * chain shapes `src/lib/lesson-progress/` uses: `.from().select().eq().eq()
 * .maybeSingle()` and `.from().upsert(payload, options)`.
 *
 * This verifies *call shape* -- which table, which filters, which upsert
 * options -- not real Postgres behaviour (uniqueness, RLS, `ON CONFLICT`
 * semantics). Those are properties of the database, unverifiable without one
 * running; see docs/DATABASE.md and the final report on this slice for what
 * that leaves unverified.
 */
export function createMockSupabase(
  options: {
    maybeSingleResult?: { data: unknown; error: unknown };
    upsertResult?: { data: unknown; error: unknown };
  } = {},
): { supabase: SupabaseClient<Database>; calls: MockCall[] } {
  const calls: MockCall[] = [];
  const maybeSingleResult = options.maybeSingleResult ?? { data: null, error: null };
  const upsertResult = options.upsertResult ?? { data: null, error: null };

  const chain = {
    select: vi.fn((...args: unknown[]) => {
      calls.push({ method: "select", args });
      return chain;
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return chain;
    }),
    maybeSingle: vi.fn(async () => {
      calls.push({ method: "maybeSingle", args: [] });
      return maybeSingleResult;
    }),
    upsert: vi.fn((...args: unknown[]) => {
      calls.push({ method: "upsert", args });
      return Promise.resolve(upsertResult);
    }),
  };

  const from = vi.fn((table: string) => {
    calls.push({ method: "from", args: [table] });
    return chain;
  });

  return { supabase: { from } as unknown as SupabaseClient<Database>, calls };
}
