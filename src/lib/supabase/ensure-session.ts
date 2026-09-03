import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Ensures the browser has a Supabase session, signing in anonymously if it
 * doesn't, and returns the resulting user id.
 *
 * Why this exists: lesson progress and SRS cards are RLS-gated to
 * `auth.uid()` (see docs/DATABASE.md), so persisting either one needs a real
 * signed-in user — but this vertical slice deliberately does not build sign-up
 * UI (see docs/PRODUCT.md). Supabase's anonymous auth closes that gap: it
 * creates a real `auth.users` row and a real session cookie with no UI at
 * all. `supabase/config.toml` enables it for exactly this reason.
 *
 * This is a bootstrap, not a permanent design — an anonymous learner has no
 * way to come back on another device, and linking an anonymous account to a
 * real one later is a TODO (see the comment in config.toml). Treat it as
 * scaffolding the real auth flow will replace, not as the auth architecture.
 *
 * `getSession()`, not `getUser()`: this only decides "do we already have a
 * local session to reuse", which has no security consequence either way — the
 * `getUser()` vs `getSession()` distinction in docs/ARCHITECTURE.md is about
 * trusting a cookie for an authorization decision server-side, which this is
 * not.
 */
export async function ensureSession(
  supabase: SupabaseClient<Database>,
): Promise<{ userId: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    return { userId: session.user.id };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `Could not establish a session: ${error?.message ?? "no user returned"}. ` +
        "Anonymous sign-in must be enabled (supabase/config.toml: auth.enable_anonymous_sign_ins).",
    );
  }

  return { userId: data.user.id };
}
