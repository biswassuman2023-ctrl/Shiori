import { expect, test } from "@playwright/test";

/**
 * Route smoke tests.
 *
 * These assert only that every route in the skeleton resolves and renders — no
 * feature is implemented yet. They exist so that the moment a route starts
 * throwing (a bad layout, a failed env check, a broken middleware), CI says so.
 *
 * As screens are built, these assertions should be replaced by real ones rather
 * than added to.
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
  "/learn/hiragana/gojuon/a-i-u-e-o",
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
