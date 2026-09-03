-- ============================================================================
-- Foundation: shared helpers and domain enums.
--
-- Everything lives in the `public` schema so PostgREST exposes it without extra
-- configuration. The content/user-state boundary is enforced by Row Level
-- Security and naming, not by schema separation (see docs/DATABASE.md).
-- ============================================================================

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps `updated_at` honest without trusting the client to send it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger function: stamps updated_at on every UPDATE.';

-- ---------------------------------------------------------------------------
-- Enums
--
-- Postgres enums are used for closed sets that the application branches on.
-- Adding a value later is cheap (ALTER TYPE ... ADD VALUE); removing one is
-- not, so these are kept deliberately small.
-- ---------------------------------------------------------------------------

-- The fixed curriculum ladder. Order here is the learner's progression order.
create type public.curriculum_level_code as enum (
  'hiragana',
  'katakana',
  'n5',
  'n4',
  'n3',
  'n2',
  'n1'
);

-- The skills the product tracks mastery for, independently of level.
create type public.skill_type as enum (
  'hiragana',
  'katakana',
  'vocabulary',
  'kanji',
  'grammar',
  'reading',
  'listening'
);

-- Reusable, level-agnostic pieces of learnable content.
create type public.content_item_type as enum (
  'kana',
  'vocabulary',
  'kanji',
  'grammar',
  'reading',
  'listening'
);

-- What a lesson block renders. Maps 1:1 to a renderer component
-- (see src/content/registry.ts).
create type public.lesson_block_type as enum (
  'prose',
  'kana',
  'vocabulary',
  'kanji',
  'grammar',
  'reading',
  'listening',
  'question'
);

-- TODO — DECISION REQUIRED: the full question taxonomy has not been specified.
-- These cover the interaction shapes implied by the product so far.
create type public.question_type as enum (
  'multiple_choice',
  'text_input',
  'audio_choice',
  'matching',
  'ordering'
);

-- Editorial lifecycle. Only 'published' rows are readable by learners.
create type public.publication_status as enum (
  'draft',
  'in_review',
  'published',
  'archived'
);

create type public.media_kind as enum (
  'audio',
  'image',
  'svg',
  'video'
);

-- How a learner is being asked to recall an item.
-- TODO — DECISION REQUIRED: confirm this is the full set of review directions.
create type public.srs_direction as enum (
  'recognition',
  'recall',
  'listening'
);

-- Scheduling state machine. Named after the states every mainstream spaced
-- repetition scheduler distinguishes, so the algorithm choice stays open.
create type public.srs_card_state as enum (
  'new',
  'learning',
  'review',
  'relearning',
  'suspended'
);

-- Four-point grading, the shared vocabulary of SM-2, FSRS and Anki.
create type public.srs_rating as enum (
  'again',
  'hard',
  'good',
  'easy'
);

create type public.lesson_progress_status as enum (
  'not_started',
  'in_progress',
  'completed'
);

create type public.assessment_kind as enum (
  'placement',
  'diagnostic',
  'unit_check',
  'level_test'
);

create type public.assessment_attempt_status as enum (
  'in_progress',
  'completed',
  'abandoned'
);
