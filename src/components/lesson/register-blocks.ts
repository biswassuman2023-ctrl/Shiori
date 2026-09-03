import { KanaBlock } from "@/components/lesson/blocks/kana-block";
import { ProseBlock } from "@/components/lesson/blocks/prose-block";
import { QuestionBlock } from "@/components/lesson/blocks/question-block";
import { registerBlockRenderer } from "@/content/registry";

/**
 * Registers every implemented block renderer. Imported once, for its side
 * effect, from `lesson-player.tsx` — see docs/LEARNING-ENGINE.md ("Adding a
 * lesson format") for what changes here when a new block type is built.
 *
 * Specifically the *client* component, not the server-side lesson route:
 * Next.js's Server and Client Components run in separate module graphs, and
 * `getBlockRenderer` is only ever called from client code (the interactive
 * lesson player). Registering from a Server Component would populate a
 * registry the client-side lookup can never see.
 *
 * `getBlockRenderer` throws on double-registration (src/content/registry.ts);
 * importing this module from exactly one place is what keeps that true.
 */
registerBlockRenderer("prose", ProseBlock);
registerBlockRenderer("kana", KanaBlock);
registerBlockRenderer("question", QuestionBlock);
