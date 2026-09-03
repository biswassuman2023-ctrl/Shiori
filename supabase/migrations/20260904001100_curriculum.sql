-- ============================================================================
-- Curriculum: levels -> units -> lessons -> lesson content.
--
-- The curriculum is the *sequence*. It answers "what should this learner do
-- next". It never stores learner state, and it never duplicates content:
-- a lesson points at reusable content items, so the same vocabulary entry can
-- appear in an N5 lesson and an N4 review without being copied.
-- ============================================================================

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  code public.curriculum_level_code not null unique,
  title text not null,
  subtitle text,
  description text,
  -- Position in the fixed ladder: hiragana -> katakana -> N5 -> ... -> N1.
  position smallint not null unique,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger levels_set_updated_at
  before update on public.levels
  for each row execute function public.set_updated_at();

create table public.units (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  position smallint not null,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint units_slug_unique unique (level_id, slug),
  constraint units_position_unique unique (level_id, position)
);

create index units_level_position_idx on public.units (level_id, position);

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  position smallint not null,
  estimated_minutes smallint,
  -- The primary skill this lesson advances. Lessons can touch several, but
  -- one is the reason the lesson exists.
  primary_skill public.skill_type not null,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint lessons_slug_unique unique (unit_id, slug),
  constraint lessons_position_unique unique (unit_id, position)
);

create index lessons_unit_position_idx on public.lessons (unit_id, position);

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lesson content: an ordered list of blocks.
--
-- One row per block. `block_type` selects the renderer (see
-- src/content/registry.ts); `props` carries renderer configuration. A block
-- never embeds the content itself -- it references content items through
-- `lesson_content_items` below.
--
-- The frontend must never branch on a lesson slug. If a lesson needs to look
-- different, that difference belongs in `block_type` or `props`.
-- ---------------------------------------------------------------------------
create table public.lesson_content (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position smallint not null,
  block_type public.lesson_block_type not null,
  -- Renderer configuration and, for prose blocks, the body itself.
  props jsonb not null default '{}'::jsonb,
  -- Only for question blocks.
  question_id uuid references public.questions (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint lesson_content_position_unique unique (lesson_id, position),
  -- A question block must carry a question; nothing else may.
  constraint lesson_content_question_shape check (
    (block_type = 'question' and question_id is not null)
    or (block_type <> 'question' and question_id is null)
  )
);

create index lesson_content_lesson_position_idx
  on public.lesson_content (lesson_id, position);

create trigger lesson_content_set_updated_at
  before update on public.lesson_content
  for each row execute function public.set_updated_at();

-- The content a block presents, in order. A single block can teach several
-- items (one kana block presents five characters), which is why this is a
-- join table rather than a column on lesson_content.
create table public.lesson_content_items (
  block_id uuid not null references public.lesson_content (id) on delete cascade,
  item_id uuid not null references public.content_items (id) on delete restrict,
  position smallint not null,

  primary key (block_id, item_id),
  constraint lesson_content_items_position_unique unique (block_id, position)
);

create index lesson_content_items_item_idx on public.lesson_content_items (item_id);

-- ---------------------------------------------------------------------------
-- Seed: the seven fixed levels.
--
-- These are structure, not content -- the ladder is defined by the product and
-- does not vary. Units and lessons are authored separately and are not seeded.
-- ---------------------------------------------------------------------------
insert into public.levels (code, title, subtitle, position, status) values
  ('hiragana', 'Hiragana', 'The first alphabet', 1, 'draft'),
  ('katakana', 'Katakana', 'The second alphabet', 2, 'draft'),
  ('n5',       'JLPT N5',  'First words and sentences', 3, 'draft'),
  ('n4',       'JLPT N4',  'Everyday Japanese', 4, 'draft'),
  ('n3',       'JLPT N3',  'The bridge to fluency', 5, 'draft'),
  ('n2',       'JLPT N2',  'Real-world Japanese', 6, 'draft'),
  ('n1',       'JLPT N1',  'Advanced Japanese', 7, 'draft');
