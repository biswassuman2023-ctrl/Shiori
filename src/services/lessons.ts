import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { parseResolvedQuestion } from "@/types/lesson";
import type {
  LessonBlockData,
  LessonData,
  ResolvedKanaItem,
  ResolvedQuestion,
} from "@/types/lesson";
import type { CurriculumLevelCode } from "@/types/domain";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetches one published lesson by its (level, unit, lesson) slugs, fully
 * resolved for rendering: every block carries its own content items and
 * question, so `getBlockRenderer` (src/content/registry.ts) is the only
 * lookup a renderer ever needs to do.
 *
 * Returns `null` if any segment of the path doesn't resolve to a *published*
 * row — a draft lesson and a nonexistent one look identical here, which is
 * correct: RLS already filters unpublished content out of every query below,
 * so this function never has to check `status` itself. The caller
 * (the lesson route) turns `null` into `notFound()`.
 *
 * Wrapped in `cache()` so one request's Server Components share a single
 * round trip; safe because the cache is per-request, not module-level.
 */
export const getLessonBySlugs = cache(
  async (
    levelCode: CurriculumLevelCode,
    unitSlug: string,
    lessonSlug: string,
  ): Promise<LessonData | null> => {
    const supabase = await createClient();

    const { data: level, error: levelError } = await supabase
      .from("levels")
      .select("id, title")
      .eq("code", levelCode)
      .maybeSingle();
    if (levelError) throw levelError;
    if (!level) return null;

    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id, title")
      .eq("level_id", level.id)
      .eq("slug", unitSlug)
      .maybeSingle();
    if (unitError) throw unitError;
    if (!unit) return null;

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, slug, title, subtitle")
      .eq("unit_id", unit.id)
      .eq("slug", lessonSlug)
      .maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return null;

    const { data: blockRows, error: blockError } = await supabase
      .from("lesson_content")
      .select("id, position, block_type, props, question_id, is_required")
      .eq("lesson_id", lesson.id)
      .order("position", { ascending: true });
    if (blockError) throw blockError;
    const blocks = blockRows ?? [];

    const blockIds = blocks.map((block) => block.id);
    const questionIds = blocks
      .map((block) => block.question_id)
      .filter((id): id is string => id !== null);

    const [itemsByBlock, questionsById] = await Promise.all([
      resolveBlockItems(supabase, blockIds),
      resolveQuestions(supabase, questionIds),
    ]);

    const resolvedBlocks: LessonBlockData[] = blocks.map((block) => ({
      id: block.id,
      position: block.position,
      type: block.block_type,
      isRequired: block.is_required,
      props: (block.props ?? {}) as Record<string, unknown>,
      items: itemsByBlock.get(block.id) ?? [],
      question: block.question_id ? (questionsById.get(block.question_id) ?? null) : null,
    }));

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      subtitle: lesson.subtitle,
      unitTitle: unit.title,
      levelTitle: level.title,
      blocks: resolvedBlocks,
    };
  },
);

/**
 * Resolves the content items each block presents (via `lesson_content_items`)
 * into fully-formed `ResolvedKanaItem`s, keyed by block id.
 *
 * Only `kana` items are resolved — the only item type this slice's content
 * uses. A block whose items are a different, not-yet-supported type is left
 * with an empty item list rather than failing the whole lesson; see
 * docs/content/registry.ts's "unregistered block type" handling for the same
 * degrade-gracefully principle applied one level up.
 */
async function resolveBlockItems(
  supabase: SupabaseServerClient,
  blockIds: string[],
): Promise<Map<string, ResolvedKanaItem[]>> {
  const result = new Map<string, ResolvedKanaItem[]>();
  if (blockIds.length === 0) return result;

  const { data: links, error: linksError } = await supabase
    .from("lesson_content_items")
    .select("block_id, item_id, position")
    .in("block_id", blockIds)
    .order("position", { ascending: true });
  if (linksError) throw linksError;
  if (!links || links.length === 0) return result;

  const itemIds = [...new Set(links.map((link) => link.item_id))];

  const { data: kanaRows, error: kanaError } = await supabase
    .from("kana")
    .select("item_id, character, script, romaji, mnemonic, audio_asset_id")
    .in("item_id", itemIds);
  if (kanaError) throw kanaError;

  const audioAssetIds = (kanaRows ?? [])
    .map((row) => row.audio_asset_id)
    .filter((id): id is string => id !== null);
  const audioUrlByAssetId = await resolveMediaUrls(supabase, audioAssetIds);

  const kanaByItemId = new Map<string, ResolvedKanaItem>();
  for (const row of kanaRows ?? []) {
    kanaByItemId.set(row.item_id, {
      itemId: row.item_id,
      character: row.character,
      script: row.script === "katakana" ? "katakana" : "hiragana",
      romaji: row.romaji,
      mnemonic: row.mnemonic,
      audioUrl: row.audio_asset_id ? (audioUrlByAssetId.get(row.audio_asset_id) ?? null) : null,
    });
  }

  for (const link of links) {
    const item = kanaByItemId.get(link.item_id);
    if (!item) continue;
    const existing = result.get(link.block_id) ?? [];
    existing.push(item);
    result.set(link.block_id, existing);
  }

  return result;
}

/** Resolves Supabase Storage public URLs for a set of media asset ids. */
async function resolveMediaUrls(
  supabase: SupabaseServerClient,
  assetIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (assetIds.length === 0) return result;

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, bucket_id, storage_path")
    .in("id", assetIds);
  if (error) throw error;

  for (const asset of data ?? []) {
    const { data: url } = supabase.storage.from(asset.bucket_id).getPublicUrl(asset.storage_path);
    result.set(asset.id, url.publicUrl);
  }

  return result;
}

/** Resolves a set of question ids into fully-parsed `ResolvedQuestion`s. */
async function resolveQuestions(
  supabase: SupabaseServerClient,
  questionIds: string[],
): Promise<Map<string, ResolvedQuestion>> {
  const result = new Map<string, ResolvedQuestion>();
  if (questionIds.length === 0) return result;

  const [{ data: questionRows, error: questionError }, { data: optionRows, error: optionError }] =
    await Promise.all([
      supabase
        .from("questions")
        .select("id, question_type, item_id, item_direction, prompt, explanation")
        .in("id", questionIds),
      supabase
        .from("question_options")
        .select("id, question_id, position, content, is_correct")
        .in("question_id", questionIds),
    ]);
  if (questionError) throw questionError;
  if (optionError) throw optionError;

  const optionsByQuestion = new Map<string, NonNullable<typeof optionRows>>();
  for (const option of optionRows ?? []) {
    const existing = optionsByQuestion.get(option.question_id) ?? [];
    existing.push(option);
    optionsByQuestion.set(option.question_id, existing);
  }

  for (const question of questionRows ?? []) {
    const options = (optionsByQuestion.get(question.id) ?? []).map((option) => ({
      id: option.id,
      position: option.position,
      content: option.content,
      isCorrect: option.is_correct,
    }));

    result.set(
      question.id,
      parseResolvedQuestion({
        id: question.id,
        questionType: question.question_type,
        itemId: question.item_id,
        itemDirection: question.item_direction,
        prompt: question.prompt,
        explanation: question.explanation,
        options,
      }),
    );
  }

  return result;
}
