"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let client: BrowserClient | undefined;

/**
 * Supabase client for Client Components.
 *
 * Memoised: `createBrowserClient` is cheap, but a single instance keeps one
 * auth listener and one realtime socket per tab instead of one per render.
 *
 * Requests made through this client authenticate as the signed-in user and are
 * therefore subject to Row Level Security. That is the intended security
 * boundary — see docs/DATABASE.md.
 */
export function createClient(): BrowserClient {
  client ??= createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return client;
}
