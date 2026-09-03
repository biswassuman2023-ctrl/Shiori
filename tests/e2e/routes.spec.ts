import { expect, test } from "@playwright/test";

/**
 * Route smoke tests.
 *
 * These assert only that every *placeholder* route in the skeleton resolves
 * and renders — no feature is implemented behind them yet. They exist so that
 * the moment a route starts throwing (a bad layout, a failed env check, a
 * broken proxy), CI says so.
 *
 * As screens are built, their routes should move out of this list and get
 * real assertions of their own — see lesson.spec.ts for the first one.
 * `/learn/[level]`, `/learn/[level]/[unit]` and `/learn` itself stay here:
 * they are still placeholders. `/learn/hiragana/gojuon/a-i-u-e-o` is not — it
 * is a real, Supabase-backed page as of the Hiragana vertical slice, so it no
 * longer belongs in a list that only promises "doesn't error, has a body".
 */

const routes = [
  "/",
  "/auth",
  "/onboarding",
  "/diagnostic",
  "/results",
  "/placement",
  "/home",
  "/learn",
  "/learn/hiragana",
  "/learn/hiragana/gojuon",
  "/review",
  "/explore",
  "/profile",
];

for (const route of routes) {
  test(`${route} responds and renders`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response?.status(), `${route} should not error`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });
}

test("an unknown route renders the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  await expect(page.getByRole("heading", { name: /does not exist/i })).toBeVisible();
});
