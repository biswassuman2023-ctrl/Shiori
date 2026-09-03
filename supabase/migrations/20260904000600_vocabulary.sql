-- ============================================================================
-- Vocabulary.
-- ============================================================================

create table public.vocabulary (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'vocabulary',

  -- Written form as it normally appears (may contain kanji): 食べる
  written text not null,
  -- Kana-only reading: たべる
  reading text not null,
  -- Furigana alignment for the written form. Array of
  -- { text: string, ruby?: string } segments, so rendering never has to guess
  -- which kana belong to which kanji.
  furigana jsonb,
  -- Primary English gloss, plus the full ordered sense list.
  meaning text not null,
  senses jsonb not null default '[]'::jsonb,
  -- Part of speech tags, e.g. {"v1","vt"}.
  part_of_speech text[] not null default '{}',
  -- Pitch accent pattern positions (0 = heiban). Null when unknown.
  pitch_accent smallint[],
  jlpt_level public.curriculum_level_code,
  frequency_rank integer,
  is_common boolean not null default false,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  notes text,

  constraint vocabulary_item_type_check check (item_type = 'vocabulary'),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

create index vocabulary_reading_idx on public.vocabulary (reading);
create index vocabulary_written_idx on public.vocabulary (written);
create index vocabulary_jlpt_idx on public.vocabulary (jlpt_level);

-- Example sentences for a vocabulary entry.
create table public.vocabulary_examples (
  id uuid primary key default gen_random_uuid(),
  vocabulary_item_id uuid not null
    references public.vocabulary (item_id) on delete cascade,
  position smallint not null,
  japanese text not null,
  furigana jsonb,
  english text not null,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  source_id uuid references public.content_sources (id) on delete set null,
  created_at timestamptz not null default now(),

  constraint vocabulary_examples_position_unique unique (vocabulary_item_id, position)
);

-- Which kanji appear in a vocabulary entry. Lets a lesson answer "you already
-- know 三 from 三月" without scanning strings at request time.
create table public.vocabulary_kanji (
  vocabulary_item_id uuid not null
    references public.vocabulary (item_id) on delete cascade,
  kanji_item_id uuid not null,
  position smallint not null,

  primary key (vocabulary_item_id, kanji_item_id, position)
);

comment on table public.vocabulary_kanji is
  'Join table: kanji occurring in a vocabulary entry. The kanji foreign key is added in the kanji migration, which runs after this one.';
