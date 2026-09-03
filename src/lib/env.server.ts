import "server-only";

import { z } from "zod";

import { formatEnvError } from "@/lib/env";

/**
 * Server-only environment.
 *
 * The service-role key bypasses Row Level Security entirely. It is optional
 * because normal request handling must never need it — only content-ingestion
 * and administrative scripts do. See docs/DATABASE.md ("Security model").
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const result = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!result.success) {
  throw new Error(formatEnvError("server", result.error));
}

export const serverEnv: ServerEnv = result.data;

/**
 * Returns the service-role key, throwing a clear error if a caller that
 * requires elevated access runs without one configured.
 */
export function requireServiceRoleKey(): string {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required only by admin/ingestion " +
        "scripts. Set it in .env.local (never commit it) or use the anon client instead.",
    );
  }

  return key;
}
