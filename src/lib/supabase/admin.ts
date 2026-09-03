import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { requireServiceRoleKey } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. **Bypasses Row Level Security entirely.**
 *
 * Permitted callers:
 *   - content-ingestion pipelines and administrative scripts;
 *   - a small, named set of trusted server-only code paths that have no
 *     correct RLS policy to lean on, because the write is not "a user editing
 *     their own row" — it is the system recording its own output. Today that
 *     is placement-result creation and acceptance (see
 *     docs/DATABASE.md § "Security model — placement results") and, once
 *     built, gated-question grading (docs/DIAGNOSTIC.md § "Gated question
 *     evaluation"). Each such path must itself call `getUser()` and validate
 *     the request before writing — this client grants capability, not
 *     authorization.
 *
 * Forbidden callers: anything else that runs in response to a user request.
 * If a request handler seems to need this and isn't on the list above, the
 * RLS policy is wrong — fix the policy instead of reaching for this client.
 *
 * Not memoised, so an accidental import into general request-handling code
 * stays easy to spot in a profile rather than quietly becoming a shared
 * singleton.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
