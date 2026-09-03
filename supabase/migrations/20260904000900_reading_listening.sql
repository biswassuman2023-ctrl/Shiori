-- ============================================================================
-- Reading and listening.
--
-- Both are "a piece of media broken into addressable segments". They stay
-- separate tables because a reading sentence and a listening segment carry
-- genuinely different columns (furigana vs. time offsets).
-- ============================================================================

create table public.reading_passages (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'reading',

  title text not null,
  -- dialogue | article | story | notice | email
  genre text,
  jlpt_level public.curriculum_level_code,
  -- Estimated reading time, used for lesson pacing.
  estimated_seconds integer,
  -- Full-passage audio, when a read-along recording exists.
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  notes text,

  constraint reading_passages_item_type_check check (item_type = 'reading'),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

-- Sentence-level granularity is what per-sentence translation, tap-to-hear and
-- comprehension questions all need to anchor to.
create table public.reading_sentences (
  id uuid primary key default gen_random_uuid(),
  passage_item_id uuid not null
    references public.reading_passages (item_id) on delete cascade,
  position smallint not null,
  japanese text not null,
  furigana jsonb,
  english text,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  -- Paragraph grouping, so rendering can rebuild the original layout.
  paragraph smallint not null default 1,

  constraint reading_sentences_position_unique unique (passage_item_id, position)
);

create table public.listening_lessons (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'listening',

  title text not null,
  jlpt_level public.curriculum_level_code,
  audio_asset_id uuid not null references public.media_assets (id) on delete restrict,
  -- Speakers present, as structured data: [{ id, label, voice }].
  speakers jsonb not null default '[]'::jsonb,
  notes text,

  constraint listening_lessons_item_type_check check (item_type = 'listening'),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

create table public.listening_segments (
  id uuid primary key default gen_random_uuid(),
  listening_item_id uuid not null
    references public.listening_lessons (item_id) on delete cascade,
  position smallint not null,
  -- Offsets into the parent lesson's audio asset.
  start_ms integer not null,
  end_ms integer not null,
  speaker_id text,
  transcript_ja text not null,
  furigana jsonb,
  transcript_en text,

  constraint listening_segments_position_unique unique (listening_item_id, position),
  constraint listening_segments_range check (end_ms > start_ms and start_ms >= 0)
);
