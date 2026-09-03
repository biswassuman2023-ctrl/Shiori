import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ASSESSMENT_ATTEMPT_STATUSES,
  ASSESSMENT_KINDS,
  CONTENT_ITEM_TYPES,
  CURRICULUM_LEVELS,
  isLevelBefore,
  LESSON_BLOCK_TYPES,
  LESSON_PROGRESS_STATUSES,
  levelPosition,
  MEDIA_KINDS,
  nextLevel,
  PUBLICATION_STATUSES,
  QUESTION_TYPES,
  SKILLS,
  SRS_CARD_STATES,
  SRS_DIRECTIONS,
  SRS_RATINGS,
} from "@/types/domain";

/**
 * `src/types/domain.ts` restates the database enums so the application can rely
 * on their order. These tests parse the migration that defines them and fail if
 * the two ever drift, which is what makes the restatement safe.
 */

const MIGRATION = join(process.cwd(), "supabase", "migrations", "20260904000100_foundation.sql");

function enumValuesFromMigration(typeName: string): string[] {
  const sql = readFileSync(MIGRATION, "utf8");
  const match = new RegExp(`create type public\.${typeName} as enum\s*\(([^)]*)\)`, "i").exec(sql);

  if (!match?.[1]) {
    throw new Error(`No enum named "${typeName}" found in ${MIGRATION}`);
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
}

const cases: ReadonlyArray<[string, readonly string[]]> = [
  ["curriculum_level_code", CURRICULUM_LEVELS],
  ["skill_type", SKILLS],
  ["content_item_type", CONTENT_ITEM_TYPES],
  ["lesson_block_type", LESSON_BLOCK_TYPES],
  ["question_type", QUESTION_TYPES],
  ["publication_status", PUBLICATION_STATUSES],
  ["media_kind", MEDIA_KINDS],
  ["srs_direction", SRS_DIRECTIONS],
  ["srs_card_state", SRS_CARD_STATES],
  ["srs_rating", SRS_RATINGS],
  ["lesson_progress_status", LESSON_PROGRESS_STATUSES],
  ["assessment_kind", ASSESSMENT_KINDS],
  ["assessment_attempt_status", ASSESSMENT_ATTEMPT_STATUSES],
];

describe("domain enums match the database", () => {
  it.each(cases)("%s", (typeName, values) => {
    expect(enumValuesFromMigration(typeName)).toEqual([...values]);
  });
});

describe("curriculum ladder", () => {
  it("runs hiragana to N1 in product order", () => {
    expect([...CURRICULUM_LEVELS]).toEqual(["hiragana", "katakana", "n5", "n4", "n3", "n2", "n1"]);
  });

  it("numbers positions from 1", () => {
    expect(levelPosition("hiragana")).toBe(1);
    expect(levelPosition("n1")).toBe(7);
  });

  it("orders JLPT levels by difficulty, not by numeral", () => {
    // N5 is the easiest and comes first, despite the larger number.
    expect(isLevelBefore("n5", "n1")).toBe(true);
    expect(isLevelBefore("n1", "n5")).toBe(false);
  });

  it("advances through the ladder and stops at the end", () => {
    expect(nextLevel("hiragana")).toBe("katakana");
    expect(nextLevel("n2")).toBe("n1");
    expect(nextLevel("n1")).toBeNull();
  });
});
