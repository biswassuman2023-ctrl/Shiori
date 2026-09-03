-- ============================================================================
-- Kana.
--
-- Hiragana and Katakana are curriculum levels in their own right, so a kana
-- character is a first-class content item — it cannot be modelled as
-- vocabulary (it has no meaning) or as kanji (it has no readings in that
-- sense). See docs/DATABASE.md ("Deviations").
-- ============================================================================

create table public.kana (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'kana',

  character text not null,
  -- 'hiragana' | 'katakana' — kept as a constrained text column rather than a
  -- new enum because it is only ever two values and is not branched on widely.
  script text not null,
  romaji text not null,
  -- Row within the gojūon table (a, ka, sa, ...) and column (a, i, u, e, o).
  gojuon_row text not null,
  gojuon_column text not null,
  -- Base kana this one derives from: が -> か, きゃ -> き. Null for base kana.
  base_item_id uuid references public.kana (item_id) on delete set null,
  -- 'base' | 'dakuten' | 'handakuten' | 'youon' | 'sokuon'
  variant text not null default 'base',
  stroke_count smallint,
  stroke_order_asset_id uuid references public.media_assets (id) on delete set null,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  -- Learner-facing note, e.g. a mnemonic or a "looks like" hint.
  mnemonic text,

  constraint kana_item_type_check check (item_type = 'kana'),
  constraint kana_script_check check (script in ('hiragana', 'katakana')),
  constraint kana_variant_check
    check (variant in ('base', 'dakuten', 'handakuten', 'youon', 'sokuon')),
  constraint kana_character_unique unique (script, character),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

create index kana_script_idx on public.kana (script, gojuon_row, gojuon_column);
