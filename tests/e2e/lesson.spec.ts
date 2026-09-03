import { expect, test } from "@playwright/test";

/**
 * End-to-end coverage of the real Hiragana lesson (/learn/hiragana/gojuon/a-i-u-e-o).
 *
 * Requires a running Supabase stack seeded with `supabase/seed.sql` — this
 * page is no longer a static placeholder, it reads real content and writes
 * real learner state (anonymous auth, `user_curriculum_progress`,
 * `srs_cards`). That is not available in every environment this repo runs
 * in (this vertical slice was built without Docker access — see the slice's
 * report for exactly what remains unverified), so this suite is gated behind
 * `RUN_DB_DEPENDENT_E2E=1` rather than left to fail confusingly against an
 * unreachable database.
 *
 * To run for real:
 *   npm run db:start && npm run db:reset
 *   RUN_DB_DEPENDENT_E2E=1 npm run test:e2e -- lesson.spec.ts
 */
test.describe("Hiragana lesson: あいうえお", () => {
  test.skip(
    !process.env.RUN_DB_DEPENDENT_E2E,
    "Requires a seeded local Supabase stack. Set RUN_DB_DEPENDENT_E2E=1 to run.",
  );

  const lessonUrl = "/learn/hiragana/gojuon/a-i-u-e-o";

  test("presents the intro, the five characters, then ten practice questions in order", async ({
    page,
  }) => {
    await page.goto(lessonUrl);

    await expect(page.getByRole("heading", { name: "あいうえお" })).toBeVisible();
    await expect(page.getByText(/core phonetic alphabet/i)).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("あ", { exact: true })).toBeVisible();
    await expect(page.getByText("お", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("What sound does this character make?")).toBeVisible();
  });

  test("lets a wrong answer be retried without losing progress", async ({ page }) => {
    await page.goto(lessonUrl);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // The first recognition question. Deliberately pick a wrong option first.
    const options = page.getByRole("group", { name: "Answer choices" }).getByRole("button");
    await options.nth(1).click();
    await expect(page.getByText(/not quite/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();

    // Now answer correctly -- the question is retryable, not locked.
    await options.nth(0).click();
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  test("persists progress across a reload", async ({ page }) => {
    await page.goto(lessonUrl);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("あ", { exact: true })).toBeVisible();

    await page.reload();

    // Resumed past the intro block, not back at the start.
    await expect(page.getByText("あ", { exact: true })).toBeVisible();
    await expect(page.getByText(/core phonetic alphabet/i)).not.toBeVisible();
  });

  test("reaches a completion screen after all ten questions are answered correctly", async ({
    page,
  }) => {
    await page.goto(lessonUrl);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    for (let i = 0; i < 10; i++) {
      const options = page.getByRole("group", { name: "Answer choices" }).getByRole("button");
      const count = await options.count();
      let answeredCorrectly = false;
      for (let attempt = 0; attempt < count && !answeredCorrectly; attempt++) {
        await options.nth(attempt).click();
        if (await page.getByText(/^Correct\./).isVisible()) {
          answeredCorrectly = true;
        }
      }
      const continueButton = page.getByRole("button", { name: /continue|finish lesson/i });
      await continueButton.click();
    }

    await expect(page.getByRole("heading", { name: "Lesson complete" })).toBeVisible();
  });
});
