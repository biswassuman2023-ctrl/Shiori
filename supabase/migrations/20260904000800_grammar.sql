-- ============================================================================
-- Grammar.
-- ============================================================================

create table public.grammar_points (
  item_id uuid primary key references public.content_items (id) on delete cascade,
  item_type public.content_item_type not null default 'grammar',

  -- Canonical Japanese form of the pattern, tilde-prefixed where conventional.
  pattern text not null,
  -- Short English label, e.g. "permission: may / it is ok to".
  title text not null,
  -- Structured explanation body: rich text stored as data, never as JSX.
  explanation jsonb not null default '{}'::jsonb,
  -- What the pattern attaches to, e.g. {"v-te", "i-adj-te"}.
  formation text[] not null default '{}',
  jlpt_level public.curriculum_level_code,
  -- Register and politeness: casual, polite, written, keigo.
  register text,
  notes text,

  constraint grammar_points_item_type_check check (item_type = 'grammar'),
  foreign key (item_id, item_type)
    references public.content_items (id, item_type) on delete cascade
);

create index grammar_points_jlpt_idx on public.grammar_points (jlpt_level);

create table public.grammar_examples (
  id uuid primary key default gen_random_uuid(),
  grammar_item_id uuid not null
    references public.grammar_points (item_id) on delete cascade,
  position smallint not null,
  japanese text not null,
  furigana jsonb,
  english text not null,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  source_id uuid references public.content_sources (id) on delete set null,

  constraint grammar_examples_position_unique unique (grammar_item_id, position)
);

-- ---------------------------------------------------------------------------
-- Relationships between grammar points.
--
-- Learners reliably confuse near-synonymous patterns. This edge list powers
-- comparison sections without hardcoding pairs in the frontend.
-- ---------------------------------------------------------------------------
create table public.grammar_relations (
  id uuid primary key default gen_random_uuid(),
  from_item_id uuid not null references public.grammar_points (item_id) on delete cascade,
  to_item_id uuid not null references public.grammar_points (item_id) on delete cascade,
  -- similar | contrasts_with | prerequisite_of | variant_of
  relation text not null,
  note text,

  constraint grammar_relations_relation_check
    check (relation in ('similar', 'contrasts_with', 'prerequisite_of', 'variant_of')),
  constraint grammar_relations_no_self check (from_item_id <> to_item_id),
  constraint grammar_relations_unique unique (from_item_id, to_item_id, relation)
);

create index grammar_relations_to_idx on public.grammar_relations (to_item_id);
