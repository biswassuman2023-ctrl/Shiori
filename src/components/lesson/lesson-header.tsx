import { ProgressBar } from "@/components/ui/progress-bar";

export function LessonHeader({
  levelTitle,
  unitTitle,
  lessonTitle,
  stepIndex,
  stepCount,
}: {
  levelTitle: string;
  unitTitle: string;
  lessonTitle: string;
  /** 0-based index of the current block. */
  stepIndex: number;
  stepCount: number;
}) {
  return (
    <header className="space-y-3">
      <p className="text-xs tracking-wide text-ink-muted uppercase">
        {levelTitle} · {unitTitle}
      </p>
      <h1 lang="ja" className="text-2xl font-medium text-ink">
        {lessonTitle}
      </h1>
      <ProgressBar value={stepIndex + 1} max={stepCount} label="Lesson progress" />
      <p className="text-xs text-ink-muted">
        Step {Math.min(stepIndex + 1, stepCount)} of {stepCount}
      </p>
    </header>
  );
}
