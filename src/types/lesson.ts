import { z } from "zod";

import type { ProseNode } from "@/types/content";
import type { LessonBlockType, QuestionType, SrsDirection } from "@/types/domain";

/**
 * The shape a lesson is assembled into for rendering, and the Zod schemas
 * that parse it out of the `jsonb` columns it comes from.
 *
 * These types are specific to *how the server resolves a lesson for the
 * client* — they are not the generic content primitives in `types/content.ts`
 * (which describe what a block or a prose body looks like in the abstract).
 * A `LessonBlockData` already carries its resolved content; a renderer never
 * has to look anything up.
 */

/* -------------------------------------------------------------------------- */
/* Kana                                                                        */
/* -------------------------------------------------------------------------- */

export type ResolvedKanaItem = {
  itemId: string;
  character: string;
  script: "hiragana" | "katakana";
  romaji: string;
  mnemonic: string | null;
  audioUrl: string | null;
};

/** Only `kana` is implemented. The union exists so vocabulary, kanji, grammar,
 * reading and listening items extend it later without changing the renderer
 * contract in `src/content/registry.ts`. */
export type ResolvedContentItem = ResolvedKanaItem;

/* -------------------------------------------------------------------------- */
/* Questions                                                                   */
/* -------------------------------------------------------------------------- */

/** What kind of thing a prompt's stimulus, or an option, displays. */
export type QuestionDisplayKind = "japanese" | "romaji";

const questionPromptSchema = z.object({
  text: z.string(),
  displayKind: z.enum(["japanese", "romaji"]),
  displayValue: z.string(),
  optionDisplayKind: z.enum(["japanese", "romaji"]),
});

const questionExplanationSchema = z.object({
  text: z.string(),
});

const questionOptionContentSchema = z.object({
  text: z.string(),
});

export type ResolvedQuestionOption = {
  id: string;
  position: number;
  text: string;
  isCorrect: boolean;
};

export type ResolvedQuestion = {
  id: string;
  questionType: QuestionType;
  itemId: string | null;
  itemDirection: SrsDirection | null;
  promptText: string;
  promptDisplayKind: QuestionDisplayKind;
  promptDisplayValue: string;
  optionDisplayKind: QuestionDisplayKind;
  explanationText: string | null;
  options: ResolvedQuestionOption[];
};

/**
 * Parses a question row plus its options into a `ResolvedQuestion`.
 *
 * The jsonb columns (`prompt`, `explanation`, each option's `content`) cross a
 * real trust boundary — they are authored content, not application code — so
 * they are validated here rather than cast. A malformed row fails loudly at
 * the service layer instead of reaching a renderer as `undefined.text`.
 */
export function parseResolvedQuestion(row: {
  id: string;
  questionType: QuestionType;
  itemId: string | null;
  itemDirection: SrsDirection | null;
  prompt: unknown;
  explanation: unknown;
  options: { id: string; position: number; content: unknown; isCorrect: boolean }[];
}): ResolvedQuestion {
  const prompt = questionPromptSchema.parse(row.prompt);
  const explanation =
    row.explanation === null ? null : questionExplanationSchema.parse(row.explanation);

  return {
    id: row.id,
    questionType: row.questionType,
    itemId: row.itemId,
    itemDirection: row.itemDirection,
    promptText: prompt.text,
    promptDisplayKind: prompt.displayKind,
    promptDisplayValue: prompt.displayValue,
    optionDisplayKind: prompt.optionDisplayKind,
    explanationText: explanation?.text ?? null,
    options: row.options
      .map((option) => ({
        id: option.id,
        position: option.position,
        text: questionOptionContentSchema.parse(option.content).text,
        isCorrect: option.isCorrect,
      }))
      .sort((a, b) => a.position - b.position),
  };
}

/* -------------------------------------------------------------------------- */
/* Prose                                                                       */
/* -------------------------------------------------------------------------- */

const inlineNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("text"), value: z.string() }),
    z.object({ type: z.literal("emphasis"), value: z.string() }),
    z.object({ type: z.literal("code"), value: z.string() }),
    z.object({
      type: z.literal("japanese"),
      value: z.array(z.object({ text: z.string(), ruby: z.string().optional() })),
    }),
  ]),
);

const proseNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("paragraph"), content: z.array(inlineNodeSchema) }),
    z.object({
      type: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3)]),
      content: z.array(inlineNodeSchema),
    }),
    z.object({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(z.array(inlineNodeSchema)),
    }),
    z.object({
      type: z.literal("callout"),
      tone: z.enum(["note", "warning", "tip"]),
      content: z.array(inlineNodeSchema),
    }),
    z.object({
      type: z.literal("example"),
      japanese: z.array(z.object({ text: z.string(), ruby: z.string().optional() })),
      english: z.string(),
    }),
  ]),
);

const proseBodySchema = z.object({ body: z.array(proseNodeSchema) });

/** Parses a `prose` block's `props` column into its `ProseNode[]` body. */
export function parseProseBody(props: unknown): ProseNode[] {
  return proseBodySchema.parse(props).body as ProseNode[];
}

/* -------------------------------------------------------------------------- */
/* Blocks and lessons                                                          */
/* -------------------------------------------------------------------------- */

export type LessonBlockData = {
  id: string;
  position: number;
  type: LessonBlockType;
  isRequired: boolean;
  props: Record<string, unknown>;
  items: ResolvedContentItem[];
  question: ResolvedQuestion | null;
};

export type LessonData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  unitTitle: string;
  levelTitle: string;
  blocks: LessonBlockData[];
};
