import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { SrsDirection } from "@/types/domain";

/**
 * Creates an SRS card for (user, item, direction) if one doesn't already
 * exist. Called from the lesson player exactly when `srsCardIntentFor`
 * (reducer.ts) says a question's first-correct answer warrants one — see
 * docs/SRS.md ("Card creation").
 *
 * `ignoreDuplicates: true` compiles to `ON CONFLICT (...) DO NOTHING` against
 * `srs_cards`'s `unique (user_id, item_id, direction)` constraint. That
 * constraint, not application logic, is what actually guarantees no
 * duplicate card — this function can be called twice (a retried request, a
 * second tab) and the second call is a no-op at the database level, not
 * merely at the call site.
 *
 * Creates the card in `state: 'new'`, due immediately. No scheduler runs yet
 * — `scheduler: 'unset'` records that FSRS (the decided algorithm; see
 * docs/SRS.md) has not been implemented. This function's job ends at "a card
 * exists to review later", not "when it should next be reviewed".
 */
export async function ensureSrsCard(
  supabase: SupabaseClient<Database>,
  params: { userId: string; itemId: string; direction: SrsDirection },
): Promise<void> {
  const { error } = await supabase.from("srs_cards").upsert(
    {
      user_id: params.userId,
      item_id: params.itemId,
      direction: params.direction,
      state: "new",
      due_at: new Date().toISOString(),
      scheduler: "unset",
    },
    { onConflict: "user_id,item_id,direction", ignoreDuplicates: true },
  );
  if (error) throw error;
}
