import type { ComponentType } from "react";

import type { LessonBlock } from "@/types/content";
import type { LessonBlockType } from "@/types/domain";

/**
 * The content/rendering boundary.
 *
 * A lesson is a list of blocks read from the database. Which component renders
 * a block is decided *here*, by `block_type` — never by inspecting a lesson
 * slug, a level code, or anything else about where the block happens to
 * appear. That rule is what keeps curriculum in the database and out of React.
 *
 * Adding a lesson format therefore means: add an enum value in the database,
 * add it to `LESSON_BLOCK_TYPES`, write a renderer, register it below. It does
 * not mean touching any page or lesson component.
 *
 * No renderers are registered yet — the lesson engine is not built. The
 * registry, its contract and its failure mode are established now so the
 * engine has something to build against.
 */

/** Every block renderer receives exactly this, and nothing else. */
export type BlockRendererProps = {
  block: LessonBlock;
};

export type BlockRenderer = ComponentType<BlockRendererProps>;

export type BlockRegistry = Partial<Record<LessonBlockType, BlockRenderer>>;

/**
 * TODO — the lesson engine (see docs/LEARNING-ENGINE.md) will register:
 *   prose      -> ProseBlock
 *   kana       -> KanaBlock
 *   vocabulary -> VocabularyBlock
 *   kanji      -> KanjiBlock
 *   grammar    -> GrammarBlock
 *   reading    -> ReadingBlock
 *   listening  -> ListeningBlock
 *   question   -> QuestionBlock
 */
const registry: BlockRegistry = {};

/**
 * Returns the renderer for a block type, or `undefined` if none is registered.
 *
 * Callers decide how to handle an unknown block. A lesson containing a block
 * this build cannot render should degrade — skip the block, keep the lesson —
 * rather than fail the page, because content is deployed independently of code
 * and will sometimes run ahead of it.
 */
export function getBlockRenderer(type: LessonBlockType): BlockRenderer | undefined {
  return registry[type];
}

/**
 * Registers a renderer. Called once per renderer at module load.
 *
 * Throws on a duplicate registration: two components claiming the same block
 * type is always a mistake, and silently keeping one of them would make the
 * outcome depend on import order.
 */
export function registerBlockRenderer(type: LessonBlockType, renderer: BlockRenderer): void {
  if (registry[type]) {
    throw new Error(`A renderer is already registered for block type "${type}".`);
  }

  registry[type] = renderer;
}

/** Test seam: clears the registry so cases cannot leak into each other. */
export function resetBlockRegistry(): void {
  for (const key of Object.keys(registry) as LessonBlockType[]) {
    delete registry[key];
  }
}
