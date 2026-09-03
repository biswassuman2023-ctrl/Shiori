import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side authentication reads.
 *
 * Services are the only place the application talks to Supabase on the server.
 * Route components call services; they never build queries themselves. That
 * boundary is what keeps data access testable and stops query logic from
 * spreading across the route tree.
 */

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

/**
 * The signed-in user, or null.
 *
 * Wrapped in React's `cache` so several components in one render tree share a
 * single round trip. The cache is per-request, so it cannot leak between users.
 *
 * Uses `getUser()`, which revalidates the token against the auth server, rather
 * than `getSession()`, which trusts a cookie the client could have written.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
});

/**
 * The signed-in user, or throws.
 *
 * For code paths that are already behind an authentication check and would be
 * a bug to reach anonymously. Route protection itself belongs in the route,
 * where it can redirect.
 */
export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("requireCurrentUser() was called without an authenticated session.");
  }

  return user;
}
