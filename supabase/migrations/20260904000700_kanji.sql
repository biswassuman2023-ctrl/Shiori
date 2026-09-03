-- ============================================================================
-- Kanji.
-- ============================================================================

create table public.kanji (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'kanji',

  character text not null unique,
  meanings text[] not null default '{}',
  -- Readings are kept split: a lesson teaching a kanji must show its on and
  -- kun readings differently, and quizzes grade them separately.
  on_readings text[] not null default '{}',
  kun_readings text[] not null default '{}',
  nanori_readings text[] not null default '{}',
  stroke_count smallint,
  -- Traditional radical (Kangxi number) and the radical character itself.
  radical_number smallint,
  radical_character text,
  jlpt_level public.curriculum_level_code,
  -- Japanese school grade (1-6, 8 = secondary, 9/10 = jinmeiyou).
  grade smallint,
  frequency_rank integer,
  -- KanjiVG-style stroke order graphic, stored in Supabase Storage.
  stroke_order_asset_id uuid references public.media_assets (id) on delete set null,
  mnemonic text,
  notes text,

  constraint kanji_item_type_check check (item_type = 'kanji'),
  constraint kanji_character_length check (char_length(character) = 1),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

create index kanji_jlpt_idx on public.kanji (jlpt_level);
create index kanji_frequency_idx on public.kanji (frequency_rank);

-- Deferred from the vocabulary migration: kanji did not exist yet at that point.
alter table public.vocabulary_kanji
  add constraint vocabulary_kanji_kanji_item_id_fkey
  foreign key (kanji_item_id) references public.kanji (item_id) on delete cascade;

create index vocabulary_kanji_kanji_idx on public.vocabulary_kanji (kanji_item_id);

-- ---------------------------------------------------------------------------
-- Kanji components.
--
-- A component may itself be a kanji, or a bare radical form that is not a
-- standalone kanji. component_kanji_item_id is therefore optional and
-- component_character always carries the glyph.
-- ---------------------------------------------------------------------------
create table public.kanji_components (
  id uuid primary key default gen_random_uuid(),
  kanji_item_id uuid not null references public.kanji (item_id) on delete cascade,
  component_kanji_item_id uuid references public.kanji (item_id) on delete set null,
  component_character text not null,
  component_meaning text,
  position smallint not null,
  -- radical | phonetic | semantic | other
  role text not null default 'other',

  constraint kanji_components_role_check
    check (role in ('radical', 'phonetic', 'semantic', 'other')),
  constraint kanji_components_position_unique unique (kanji_item_id, position),
  constraint kanji_components_not_self
    check (component_kanji_item_id is distinct from kanji_item_id)
);

create index kanji_components_component_idx
  on public.kanji_components (component_kanji_item_id);
