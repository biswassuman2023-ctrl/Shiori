/**
 * Shapes for content that is stored as JSON in the database.
 *
 * These columns are `jsonb` in Postgres, so generated types give us `Json` and
 * nothing more. Parsing and narrowing happens at the boundary where the data
 * is read; these types describe what the boundary must produce.
 */

/* -------------------------------------------------------------------------- */
/* Furigana                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One aligned segment of Japanese text.
 *
 * Furigana is stored pre-aligned rather than computed at render time: mapping
 * a reading onto a mixed kanji/kana string is genuinely ambiguous
 * (e.g. 一日 is both いちにち and ついたち), and getting it wrong is visible to
 * the learner. Alignment is an editorial decision made once, at authoring time.
 *
 * `ruby` is omitted for segments that need no reading, such as okurigana.
 */
export type FuriganaSegment = {
  text: string;
  ruby?: string;
};

export type FuriganaText = FuriganaSegment[];

/* -------------------------------------------------------------------------- */
/* Prose                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Explanatory text stored as structured data.
 *
 * Deliberately a small, closed set of nodes rather than raw HTML or Markdown:
 * a closed set can be rendered safely, translated, and restyled by the design
 * system without a sanitiser or a Markdown parser in the bundle.
 *
 * TODO -- DECISION REQUIRED: confirm this node set is sufficient for the
 * grammar explanations we intend to write before authoring begins in bulk.
 */
export type ProseNode =
  | { type: "paragraph"; content: InlineNode[] }
  | { type: "heading"; level: 2 | 3; content: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "callout"; tone: "note" | "warning" | "tip"; content: InlineNode[] }
  | { type: "example"; japanese: FuriganaText; english: string };

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "emphasis"; value: string }
  | { type: "japanese"; value: FuriganaText }
  | { type: "code"; value: string };

/* -------------------------------------------------------------------------- */
/* Lesson progress                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Shape of `user_curriculum_progress.progress_state`.
 *
 * Block-level state within one lesson, for one learner. This is what lets a
 * refresh or a closed tab resume in the right place and lets lesson
 * completion be computed rather than asserted. See docs/LEARNING-ENGINE.md
 * ("Lesson completion").
 *
 * Stored as jsonb and read back whole for a single lesson — never queried
 * into — which is what makes this type, not a migration, the place to change
 * the shape while the lesson engine is still being built.
 */
export type LessonProgressState = {
  /** IDs of `lesson_content` blocks a required, non-question block has satisfied. */
  completedBlockIds: string[];
  /** Per-question attempt state, keyed by `lesson_content.question_id`. */
  questions: Record<string, QuestionProgress>;
};

export type QuestionProgress = {
  attempts: number;
  /**
   * True once this question has been answered correctly at least once.
   * A wrong answer never regresses this — see docs/LEARNING-ENGINE.md.
   */
  completed: boolean;
  lastAnsweredAt: string;
};

/** An empty, valid `LessonProgressState` — the value a new lesson attempt starts from. */
export function emptyLessonProgressState(): LessonProgressState {
  return { completedBlockIds: [], questions: {} };
}
