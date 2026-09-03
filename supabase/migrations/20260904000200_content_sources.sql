-- ============================================================================
-- Provenance.
--
-- Japanese-language datasets carry real licence obligations (JMdict/KANJIDIC
-- are CC BY-SA; KanjiVG is CC BY-SA; Tatoeba is CC BY). Every piece of imported
-- content records where it came from so attribution can be generated rather
-- than remembered. See docs/CONTENT-BIBLE.md.
-- ============================================================================

create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  url text,
  license text not null,
  license_url text,
  attribution_required boolean not null default true,
  attribution_text text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_sources is
  'Origin and licence of imported content. Required for attribution compliance.';

create trigger content_sources_set_updated_at
  before update on public.content_sources
  for each row execute function public.set_updated_at();
