-- ============================================================================
-- Content items — the shared identity of every learnable thing.
--
-- Why this table exists:
--   `lesson_content`, `srs_cards`, `user_progress`, `user_skill_mastery` and
--   `questions` all need to reference "some piece of content" without caring
--   which kind it is. The alternatives are exclusive-arc nullable foreign keys
--   (six nullable columns on five tables, none of them enforceable) or an
--   untyped `(item_type, item_id)` pair with no referential integrity at all.
--
--   Instead each content kind is a 1:1 extension of this table (class-table
--   inheritance). One foreign key target, real integrity, and the type is
--   pinned by a composite foreign key so a `vocabulary` row can never attach
--   itself to a `kanji` identity.
--
-- See docs/DATABASE.md ("Content item model").
-- ============================================================================

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  item_type public.content_item_type not null,
  -- Stable, human-readable identifier used in URLs, imports and seed data.
  slug text not null,
  status public.publication_status not null default 'draft',
  source_id uuid references public.content_sources (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint content_items_slug_unique unique (item_type, slug),
  -- Target for the composite foreign keys of the extension tables below.
  constraint content_items_id_type_unique unique (id, item_type)
);

create index content_items_type_status_idx
  on public.content_items (item_type, status);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

comment on table public.content_items is
  'Identity row shared by every learnable content entity. One row per kana, vocabulary entry, kanji, grammar point, reading passage or listening lesson.';
