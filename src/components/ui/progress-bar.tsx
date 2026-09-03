import { cn } from "@/lib/utils/cn";

/**
 * A determinate progress indicator. First design-system primitive populated
 * in `components/ui/` — see docs/DESIGN-SYSTEM.md ("Components"): it arrives
 * with the first real screen that needs it, not before.
 */
export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  /** Current position, 0..max. */
  value: number;
  max: number;
  /** Accessible name, e.g. "Lesson progress". Not rendered as visible text. */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className="duration-base h-full rounded-full bg-coral transition-[width] ease-out-soft"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
