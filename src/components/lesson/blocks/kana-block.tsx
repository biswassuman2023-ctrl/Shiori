import { AudioButton } from "@/components/lesson/audio-button";
import type { BlockRendererProps } from "@/content/registry";

/**
 * Presents a set of kana characters together: the glyph, its sound, a
 * mnemonic, and audio if a recording exists. This is the "character
 * presentation" + "reading/sound information" + "audio interaction where
 * appropriate" surface of a lesson — see docs/LEARNING-ENGINE.md.
 *
 * Satisfied by being shown, not by any interaction here — see
 * docs/LEARNING-ENGINE.md ("Lesson completion"). The lesson player marks it
 * viewed; this component stays a pure presentational renderer.
 */
export function KanaBlock({ block }: BlockRendererProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {block.items.map((item) => (
        <div
          key={item.itemId}
          className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-5 text-center shadow-hairline"
        >
          <span lang="ja" className="text-5xl leading-none text-ink">
            {item.character}
          </span>
          <span className="text-sm font-medium tracking-wide text-ink-secondary uppercase">
            {item.romaji}
          </span>
          {item.mnemonic ? <p className="text-xs text-ink-muted">{item.mnemonic}</p> : null}
          <AudioButton src={item.audioUrl} label={`Play the sound for ${item.character}`} />
        </div>
      ))}
    </div>
  );
}
