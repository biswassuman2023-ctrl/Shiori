import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/lib/utils/error-message";

describe("getErrorMessage", () => {
  it("extracts the message from a real Error instance", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("extracts the message from a PostgrestError-shaped plain object", () => {
    // The exact shape Supabase-js returns for a failed query -- not an
    // Error subclass, so `instanceof Error` on this is false. This is the
    // case the original bug got wrong: a check gated on `instanceof Error`
    // silently discards this message.
    const postgrestError = {
      message:
        'insert or update on table "user_curriculum_progress" violates foreign key constraint',
      details: 'Key is not present in table "users".',
      hint: null,
      code: "23503",
    };

    expect(getErrorMessage(postgrestError)).toBe(postgrestError.message);
  });

  it("extracts the message from an AuthError-shaped plain object", () => {
    expect(getErrorMessage({ message: "User not found", status: 404 })).toBe("User not found");
  });

  it("confirms the failure mode instanceof Error would have hit", () => {
    // Documents *why* the fix matters: this is a real PostgrestError shape,
    // and it is not an instance of the built-in Error class.
    const postgrestError = { message: "some failure", details: null, hint: null, code: "23503" };
    expect(postgrestError instanceof Error).toBe(false);
    expect(getErrorMessage(postgrestError)).toBe("some failure");
  });

  it("returns a plain string error as-is", () => {
    expect(getErrorMessage("plain string failure")).toBe("plain string failure");
  });

  it("falls back to a JSON representation for a message-less object", () => {
    expect(getErrorMessage({ code: "23503", details: "no message field here" })).toBe(
      JSON.stringify({ code: "23503", details: "no message field here" }),
    );
  });

  it("returns a real string, never the value undefined, for values JSON can't serialize", () => {
    // JSON.stringify(undefined) returns the JS value `undefined`, not the
    // string "undefined" -- a real edge case, not a hypothetical one.
    expect(getErrorMessage(undefined)).toBe("undefined");
    expect(typeof getErrorMessage(undefined)).toBe("string");
  });

  it("does not throw for null or primitive values, and returns a readable string", () => {
    expect(() => getErrorMessage(null)).not.toThrow();
    expect(() => getErrorMessage(42)).not.toThrow();
    expect(getErrorMessage(null)).toBe("null");
    expect(getErrorMessage(42)).toBe("42");
  });
});
