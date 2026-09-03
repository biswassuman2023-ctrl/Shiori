"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Plays pronunciation audio for a single item. Renders nothing when `src` is
 * null — the seed content for this slice has no recorded audio yet (see
 * docs/CONTENT-BIBLE.md), so every kana renders without this button today.
 * The control itself is fully functional given a real Supabase Storage URL,
 * which is what `src` will be once audio assets exist.
 */
export function AudioButton({ src, label }: { src: string | null; label: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!src) return null;

  function handleClick() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isPlaying}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full border border-border",
          "duration-fast bg-surface text-ink-secondary transition-colors",
          "hover:border-coral hover:text-coral",
        )}
      >
        <SpeakerIcon className={cn("size-4", isPlaying && "text-coral")} />
      </button>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
    </>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8v4h3l4 3.5v-10.5l-4 3.5H3Z" fill="currentColor" />
      <path
        d="M13 7.5a3 3 0 0 1 0 5M15.2 5.5a6 6 0 0 1 0 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
