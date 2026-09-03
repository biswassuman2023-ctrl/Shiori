-- ============================================================================
-- Learner state.
--
-- Strictly separated from content: nothing in this file is ever written by a
-- content pipeline, and nothing in the content tables is ever written by a
-- learner. See docs/ARCHITECTURE.md ("Content vs. state").
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Per-item knowledge.
--
-- "How well does this learner know this specific item, independently of any
-- lesson or review schedule." Distinct from srs_cards, which answers "when
-- should they see it next".
-- ---------------------------------------------------------------------------
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.content_items (id) on delete cascade,
  -- 0.0 to 1.0. How the number is produced is the learning engine's business.
  strength numeric(4, 3) not null default 0,
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_progress_unique unique (user_id, item_id),
  constraint user_progress_strength_range check (strength between 0 and 1),
  constraint user_progress_counts_sane check (times_correct <= times_seen)
);

create index user_progress_user_idx on public.user_progress (user_id);
create index user_progress_item_idx on public.user_progress (item_id);

create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Position on the curriculum ladder.
--
-- One row per lesson the learner has touched. Unit and level completion are
-- derived from these rows rather than stored, so the two can never disagree.
-- ---------------------------------------------------------------------------
create table public.user_curriculum_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  -- 0.0 to 1.0 accuracy on the lesson's questions, null until answered.
  score numeric(4, 3),
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_curriculum_progress_unique unique (user_id, lesson_id),
  constraint user_curriculum_progress_score_range check (score is null or score between 0 and 1),
  constraint user_curriculum_progress_completed_shape check (
    (status = 'completed') = (completed_at is not null)
  )
);

create index user_curriculum_progress_user_idx
  on public.user_curriculum_progress (user_id, status);

create trigger user_curriculum_progress_set_updated_at
  before update on public.user_curriculum_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Skill mastery.
--
-- Tracked per (skill, level) because "good at N5 vocabulary" and "good at N3
-- vocabulary" are different claims. This is what placement writes into and
-- what the learning engine reads to decide reinforcement.
-- ---------------------------------------------------------------------------
create table public.user_skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill public.skill_type not null,
  level_code public.curriculum_level_code not null,
  -- 0.0 to 1.0 estimated mastery.
  mastery numeric(4, 3) not null default 0,
  -- 0.0 to 1.0 confidence in that estimate. Low after placement, higher after
  -- sustained review evidence.
  confidence numeric(4, 3) not null default 0,
  evidence_count integer not null default 0,
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_skill_mastery_unique unique (user_id, skill, level_code),
  constraint user_skill_mastery_range check (mastery between 0 and 1),
  constraint user_skill_mastery_confidence_range check (confidence between 0 and 1)
);

create index user_skill_mastery_user_idx on public.user_skill_mastery (user_id);

create trigger user_skill_mastery_set_updated_at
  before update on public.user_skill_mastery
  for each row execute function public.set_updated_at();
