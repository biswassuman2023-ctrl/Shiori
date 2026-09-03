import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Global test setup.
 *
 * Environment variables are stubbed here because `src/lib/env.ts` validates at
 * module load and throws when configuration is missing — which is the correct
 * production behaviour, and would otherwise make every test that transitively
 * imports it fail for the wrong reason.
 */
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

afterEach(() => {
  cleanup();
});
