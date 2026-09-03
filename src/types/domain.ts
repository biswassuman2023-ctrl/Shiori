/**
 * Domain vocabulary shared by the whole application.
 *
 * These unions mirror Postgres enums defined in
 * `supabase/migrations/20260904000100_foundation.sql`. They are declared here
 * rather than derived from generated types for one reason: TypeScript can tell
 * us the *members* of a database enum, but not their *order*, and the
 * curriculum ladder is an ordered sequence that the product depends on.
 *
 * `src/types/domain.test.ts` parses the migration and fails if these lists
 * ever drift from the database. That test is the reason this is not
 * duplication in the harmful sense.
 */

/* -------------------------------------------------------------------------- */
/* Curriculum                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The fixed curriculum ladder, in learning order.
 * Hiragana -> Katakana -> N5 -> N4 -> N3 -> N2 -> N1.
 */
export const CURRICULUM_LEVELS = ["hiragana", "katakana", "n5", "n4", "n3", "n2", "n1"] as const;

export type CurriculumLevelCode = (typeof CURRICULUM_LEVELS)[number];

/** Position on the ladder, 1-based. Lower means earlier. */
export function levelPosition(code: CurriculumLevelCode): number {
  return CURRICULUM_LEVELS.indexOf(code) + 1;
}

/** True when `a` comes strictly before `b` in the fixed progression. */
export function isLevelBefore(a: CurriculumLevelCode, b: CurriculumLevelCode): boolean {
  return levelPosition(a) < levelPosition(b);
}

/** The level a learner moves to after `code`, or null at the end of the ladder. */
export function nextLevel(code: CurriculumLevelCode): CurriculumLevelCode | null {
  return CURRICULUM_LEVELS[CURRICULUM_LEVELS.indexOf(code) + 1] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export const SKILLS = [
  "hiragana",
  "katakana",
  "vocabulary",
  "kanji",
  "grammar",
  "reading",
  "listening",
] as const;

export type SkillType = (typeof SKILLS)[number];

/* -------------------------------------------------------------------------- */
/* Content                                                                     */
/* -------------------------------------------------------------------------- */

export const CONTENT_ITEM_TYPES = [
  "kana",
  "vocabulary",
  "kanji",
  "grammar",
  "reading",
  "listening",
] as const;

export type ContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

/** A lesson block type maps 1:1 to a renderer; see `src/content/registry.ts`. */
export const LESSON_BLOCK_TYPES = [
  "prose",
  "kana",
  "vocabulary",
  "kanji",
  "grammar",
  "reading",
  "listening",
  "question",
] as const;

export type LessonBlockType = (typeof LESSON_BLOCK_TYPES)[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "text_input",
  "audio_choice",
  "matching",
  "ordering",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const PUBLICATION_STATUSES = ["draft", "in_review", "published", "archived"] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const MEDIA_KINDS = ["audio", "image", "svg", "video"] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

/* -------------------------------------------------------------------------- */
/* Spaced repetition                                                           */
/* -------------------------------------------------------------------------- */

export const SRS_DIRECTIONS = ["recognition", "recall", "listening"] as const;

export type SrsDirection = (typeof SRS_DIRECTIONS)[number];

export const SRS_CARD_STATES = ["new", "learning", "review", "relearning", "suspended"] as const;

export type SrsCardState = (typeof SRS_CARD_STATES)[number];

/** Four-point grading, ordered worst to best. */
export const SRS_RATINGS = ["again", "hard", "good", "easy"] as const;

export type SrsRating = (typeof SRS_RATINGS)[number];

/* -------------------------------------------------------------------------- */
/* Progress and assessment                                                     */
/* -------------------------------------------------------------------------- */

export const LESSON_PROGRESS_STATUSES = ["not_started", "in_progress", "completed"] as const;

export type LessonProgressStatus = (typeof LESSON_PROGRESS_STATUSES)[number];

export const ASSESSMENT_KINDS = ["placement", "diagnostic", "unit_check", "level_test"] as const;

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export const ASSESSMENT_ATTEMPT_STATUSES = ["in_progress", "completed", "abandoned"] as const;

export type AssessmentAttemptStatus = (typeof ASSESSMENT_ATTEMPT_STATUSES)[number];
