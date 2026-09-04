import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Ensures the browser has a *valid* Supabase session, signing in
 * anonymously if it doesn't, and returns the resulting user id.
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
 * Two-step check, and why both steps exist:
 *
 * 1. `getSession()` — a local, no-network read. Answers "is there a session
 *    worth checking at all?" Skipping straight to `getUser()` would cost a
 *    round trip on every single load, including the common case of a
 *    first-ever visit with no session.
 * 2. `getUser()` — only called when step 1 found something. Unlike
 *    `getSession()`, this revalidates the session against the auth server
 *    rather than trusting whatever is cached locally. That distinction is
 *    normally about trusting a cookie for a server-side authorization
 *    decision (see the `getUser()` vs `getSession()` note in
 *    docs/ARCHITECTURE.md) — but it matters here too, for a different
 *    reason: a cached session can outlive the user it names. Resetting the
 *    local Supabase database during development wipes `auth.users` without
 *    touching the browser's cached session, so `getSession()` alone would
 *    keep handing back a `userId` that no longer exists — every write
 *    referencing it then fails its foreign-key constraint
 *    (`..._user_id_fkey`), permanently, for that browser, since nothing
 *    would ever prompt a fresh sign-in. `getUser()` catches exactly that:
 *    when the named user is gone, it errors, and this function falls
 *    through to `signInAnonymously()` to establish a real one.
 *
 * Never touches the service-role key or bypasses RLS: both calls run as the
 * anon/authenticated role through the ordinary browser client, exactly like
 * every other call in this module.
 */
export async function ensureSession(
  supabase: SupabaseClient<Database>,
): Promise<{ userId: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData.user) {
      return { userId: userData.user.id };
    }
    // Session was cached locally but no longer names a real user (e.g. the
    // database was reset out from under it). Fall through and establish a
    // fresh one, rather than handing back a dead id forever.
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
