/**
 * Extracts a diagnostic message from an unknown thrown value.
 *
 * `error instanceof Error` is not a safe check for Supabase/PostgREST
 * failures — `PostgrestError` (and the auth client's error types) are plain
 * objects with a `message` property, not subclasses of `Error`, so
 * `instanceof Error` is always `false` for them and any branch gated on it
 * silently falls through to a generic fallback, discarding the real cause.
 *
 * This is for logs and developer-facing diagnostics, not for learner-facing
 * UI text — a Postgres error message routinely contains constraint and table
 * names that mean nothing to a learner and shouldn't be shown to one. Callers
 * that need to display something in the UI should show a fixed, appropriate
 * string and pass this function's output to `console.error` instead.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isMessageBearingError(error)) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    try {
      // `JSON.stringify` returns the value `undefined` (not the string
      // "undefined") for inputs it can't serialize, e.g. one containing only
      // a function or symbol -- guard against that so this always returns a
      // real string, matching its declared type.
      const json = JSON.stringify(error);
      if (json !== undefined) return json;
    } catch {
      // Circular reference or similar -- fall through to String() below.
    }
  }

  return String(error);
}

/** Narrow shape shared by `PostgrestError`, `AuthError` and similar. */
type MessageBearingError = { message: string };

function isMessageBearingError(value: unknown): value is MessageBearingError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}
