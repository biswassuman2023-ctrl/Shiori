"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Client Component by necessity — error boundaries are a
 * client-side React feature.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO — DECISION REQUIRED: no error reporting service has been chosen.
    // Until one is, failures are visible only in server logs and the console.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-medium">Something went wrong</h1>
      <p className="text-sm text-ink-secondary">
        The error has been logged. Try again, and let us know if it keeps happening.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-button bg-coral px-4 py-2 text-sm text-ink"
      >
        Try again
      </button>
    </main>
  );
}
