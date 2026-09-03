import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { requireServiceRoleKey } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. **Bypasses Row Level Security entirely.**
 *
 * Permitted callers: content-ingestion pipelines and administrative scripts.
 * Forbidden callers: anything that runs in response to a user request. If a
 * request handler seems to need this, the RLS policy is wrong — fix the policy.
 *
 * Not memoised, so an accidental import into request-handling code stays easy
 * to spot in a profile rather than quietly becoming a shared singleton.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
