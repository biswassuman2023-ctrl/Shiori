import { afterEach, describe, expect, it } from "vitest";

import { getBlockRenderer, registerBlockRenderer, resetBlockRegistry } from "@/content/registry";

function StubRenderer() {
  return null;
}

afterEach(() => {
  resetBlockRegistry();
});

describe("block renderer registry", () => {
  it("returns undefined for a block type nothing has registered", () => {
    // Content is deployed independently of code, so a lesson can legitimately
    // contain a block this build does not know how to draw.
    expect(getBlockRenderer("vocabulary")).toBeUndefined();
  });

  it("returns the renderer registered for a block type", () => {
    registerBlockRenderer("vocabulary", StubRenderer);

    expect(getBlockRenderer("vocabulary")).toBe(StubRenderer);
  });

  it("keeps block types independent", () => {
    registerBlockRenderer("vocabulary", StubRenderer);

    expect(getBlockRenderer("kanji")).toBeUndefined();
  });

  it("refuses a second renderer for the same block type", () => {
    registerBlockRenderer("kana", StubRenderer);

    expect(() => registerBlockRenderer("kana", StubRenderer)).toThrow(/already registered/i);
  });
});
