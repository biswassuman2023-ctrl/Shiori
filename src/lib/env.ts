import { z } from "zod";

/**
 * Public environment — safe to read in the browser.
 *
 * Every `process.env.NEXT_PUBLIC_*` access below is written out literally.
 * Next.js inlines these at build time by static text replacement, so dynamic
 * lookups such as `process.env[key]` would resolve to `undefined` client-side.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(
    "NEXT_PUBLIC_SUPABASE_URL must be a full URL, e.g. https://xyz.supabase.co",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function parsePublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(formatEnvError("public", result.error));
  }

  return result.data;
}

/**
 * Formats a Zod failure into something a developer can act on immediately,
 * rather than a stack trace pointing at the first line that used the value.
 */
export function formatEnvError(scope: string, error: z.ZodError): string {
  const issues = error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  return [
    `Invalid ${scope} environment configuration:`,
    issues,
    "",
    "Copy .env.example to .env.local and fill in the missing values.",
    "For a local Supabase stack run `npm run db:start` and use the printed URL and anon key.",
  ].join("\n");
}

/**
 * Validated public environment. Accessing this throws immediately — at module
 * load, not at first use — if configuration is missing or malformed.
 */
export const env: PublicEnv = parsePublicEnv();
