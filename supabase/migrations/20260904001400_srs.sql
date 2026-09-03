-- ============================================================================
-- Spaced repetition.
--
-- Curriculum answers "what should I learn next". SRS answers "what should I
-- review today". They are deliberately separate systems over the same content
-- items -- see docs/SRS.md.
--
-- Scheduling algorithm: TODO -- DECISION REQUIRED (SM-2 vs. FSRS).
-- The columns below are the ones every mainstream scheduler needs. Anything
-- algorithm-specific (FSRS stability/difficulty, SM-2 ease factor) lives in
-- scheduler_state, so the choice can be made -- and changed -- without a
-- schema migration.
-- ============================================================================

create table public.srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.content_items (id) on delete cascade,
  -- One item yields several cards: recognising a word is not recalling it.
  direction public.srs_direction not null,

  state public.srs_card_state not null default 'new',
  due_at timestamptz not null default now(),
  interval_days numeric(8, 4) not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  last_reviewed_at timestamptz,
  -- Algorithm-specific parameters. Shape is owned by the scheduler module.
  scheduler_state jsonb not null default '{}'::jsonb,
  -- Which algorithm produced the current state, so a future migration can
  -- identify cards that predate a change.
  scheduler text not null default 'unset',
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint srs_cards_unique unique (user_id, item_id, direction),
  constraint srs_cards_counts_non_negative check (reps >= 0 and lapses >= 0),
  constraint srs_cards_interval_non_negative check (interval_days >= 0),
  constraint srs_cards_suspended_shape check (
    (state = 'suspended') = (suspended_at is not null)
  )
);

-- The query that runs on every visit to /review: cards due now, soonest first.
create index srs_cards_due_idx
  on public.srs_cards (user_id, due_at)
  where state <> 'suspended';

create index srs_cards_item_idx on public.srs_cards (item_id);

create trigger srs_cards_set_updated_at
  before update on public.srs_cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Review log.
--
-- Append-only. Every scheduling decision is reconstructible from this table,
-- which is what makes it possible to change algorithms later and replay a
-- history rather than resetting it.
-- ---------------------------------------------------------------------------
create table public.srs_reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.srs_cards (id) on delete cascade,
  -- Denormalised from the card so RLS and per-user queries need no join.
  user_id uuid not null references auth.users (id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  rating public.srs_rating not null,
  -- Card state immediately before this review, for replayability.
  state_before public.srs_card_state not null,
  interval_before numeric(8, 4) not null,
  -- Days actually elapsed since the previous review, which is rarely exactly
  -- the scheduled interval.
  elapsed_days numeric(8, 4),
  -- Interval assigned by this review.
  interval_after numeric(8, 4) not null,
  latency_ms integer,
  -- Where the review happened: review | lesson | assessment.
  context text not null default 'review',

  constraint srs_reviews_latency_non_negative check (latency_ms is null or latency_ms >= 0)
);

create index srs_reviews_card_idx on public.srs_reviews (card_id, reviewed_at desc);
create index srs_reviews_user_idx on public.srs_reviews (user_id, reviewed_at desc);
