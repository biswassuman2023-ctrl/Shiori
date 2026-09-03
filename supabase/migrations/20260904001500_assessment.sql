-- ============================================================================
-- Assessment: diagnostics, placement and checks.
--
-- The product promise is "learn Japanese from where you actually are", so this
-- is not a bolt-on -- it is how a learner enters the curriculum.
-- See docs/DIAGNOSTIC.md.
-- ============================================================================

-- A test definition. Fixed-form tests list their questions in
-- assessment_questions; adaptive tests select at runtime and leave it empty.
create table public.assessment_tests (
  id uuid primary key default gen_random_uuid(),
  kind public.assessment_kind not null,
  slug text not null unique,
  title text not null,
  description text,
  -- True when questions are chosen at runtime rather than listed below.
  is_adaptive boolean not null default false,
  -- Selection and stopping rules for adaptive tests.
  -- TODO -- DECISION REQUIRED: the adaptive algorithm is not yet specified.
  config jsonb not null default '{}'::jsonb,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger assessment_tests_set_updated_at
  before update on public.assessment_tests
  for each row execute function public.set_updated_at();

create table public.assessment_questions (
  test_id uuid not null references public.assessment_tests (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null,

  primary key (test_id, question_id),
  constraint assessment_questions_position_unique unique (test_id, position)
);

-- ---------------------------------------------------------------------------
-- Attempts and answers (learner state).
-- ---------------------------------------------------------------------------
create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id uuid references public.assessment_tests (id) on delete set null,
  -- Denormalised so an attempt stays interpretable if its test is retired.
  kind public.assessment_kind not null,
  status public.assessment_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- 0.0 to 1.0 overall accuracy.
  score numeric(4, 3),
  -- Running state for adaptive tests: ability estimate, asked items, etc.
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assessment_attempts_score_range check (score is null or score between 0 and 1),
  constraint assessment_attempts_completed_shape check (
    (status = 'completed') = (completed_at is not null)
  )
);

create index assessment_attempts_user_idx
  on public.assessment_attempts (user_id, kind, started_at desc);

create trigger assessment_attempts_set_updated_at
  before update on public.assessment_attempts
  for each row execute function public.set_updated_at();

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts (id) on delete cascade,
  -- Denormalised from the attempt so RLS needs no join.
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null,
  -- The raw response, shape depending on question_type.
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  latency_ms integer,
  answered_at timestamptz not null default now(),

  constraint assessment_answers_position_unique unique (attempt_id, position)
);

create index assessment_answers_attempt_idx on public.assessment_answers (attempt_id);

-- ---------------------------------------------------------------------------
-- Placement.
--
-- The output of an attempt: where on the fixed ladder a learner starts.
-- Kept as its own table -- and as a history, not a single column on profiles --
-- because a learner may be re-placed later and the reasoning must survive.
-- ---------------------------------------------------------------------------
create table public.placement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid references public.assessment_attempts (id) on delete set null,
  placed_level_code public.curriculum_level_code not null,
  placed_unit_id uuid references public.units (id) on delete set null,
  placed_lesson_id uuid references public.lessons (id) on delete set null,
  -- 0.0 to 1.0 confidence in the placement.
  confidence numeric(4, 3) not null default 0,
  -- Per-skill evidence behind the decision, so the results screen can explain
  -- itself instead of merely asserting a level.
  rationale jsonb not null default '{}'::jsonb,
  -- Set once the learner accepts the placement. They may choose to start
  -- earlier: the promise is meeting them where they are, not overruling them.
  accepted_at timestamptz,
  created_at timestamptz not null default now(),

  constraint placement_results_confidence_range check (confidence between 0 and 1)
);

create index placement_results_user_idx
  on public.placement_results (user_id, created_at desc);
