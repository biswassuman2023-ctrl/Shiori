"use client";

import { useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * The browser Supabase client, for Client Components.
 *
 * `createClient` already memoises the instance; `useMemo` here keeps the
 * reference stable across renders so it can be listed in dependency arrays
 * without retriggering effects.
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
