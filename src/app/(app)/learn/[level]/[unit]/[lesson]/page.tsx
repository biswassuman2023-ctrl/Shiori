import { notFound } from "next/navigation";

import { LessonPlayer } from "@/components/lesson/lesson-player";
import { getLessonBySlugs } from "@/services/lessons";
import { CURRICULUM_LEVELS } from "@/types/domain";
import type { CurriculumLevelCode } from "@/types/domain";

/**
 * The lesson player route. Generic by design — it resolves whatever
 * (level, unit, lesson) the URL names through `getLessonBySlugs` and renders
 * whatever blocks come back through the renderer registry. It has no
 * knowledge that "あいうえお" is the only real lesson yet; a second lesson
 * needs no change here at all. See docs/LEARNING-ENGINE.md.
 */
export default async function LessonPage({ params }: PageProps<"/learn/[level]/[unit]/[lesson]">) {
  const { level, unit, lesson } = await params;

  if (!isCurriculumLevelCode(level)) {
    notFound();
  }

  const lessonData = await getLessonBySlugs(level, unit, lesson);
  if (!lessonData) {
    notFound();
  }

  return <LessonPlayer lesson={lessonData} />;
}

function isCurriculumLevelCode(value: string): value is CurriculumLevelCode {
  return (CURRICULUM_LEVELS as readonly string[]).includes(value);
}
