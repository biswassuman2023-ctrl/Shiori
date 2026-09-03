-- ============================================================================
-- Media assets.
--
-- Binary content (pronunciation audio, listening tracks, kanji stroke-order
-- SVGs) lives in Supabase Storage. This table is the database-side handle:
-- it records the bucket/path plus the metadata queries need, so nothing has to
-- list a bucket to answer a question.
--
-- This replaces the separately-proposed `audio_assets` and `kanji_strokes`
-- tables — both are the same problem (reference a file in Storage) and splitting
-- them would duplicate the schema. See docs/DATABASE.md ("Deviations").
-- ============================================================================

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  kind public.media_kind not null,
  bucket_id text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint,
  duration_ms integer,
  -- Free-form, kind-specific metadata (sample rate, viewBox, speaker, ...).
  metadata jsonb not null default '{}'::jsonb,
  source_id uuid references public.content_sources (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint media_assets_unique_object unique (bucket_id, storage_path),
  constraint media_assets_duration_positive check (duration_ms is null or duration_ms >= 0),
  constraint media_assets_byte_size_positive check (byte_size is null or byte_size >= 0)
);

create index media_assets_kind_idx on public.media_assets (kind);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();
