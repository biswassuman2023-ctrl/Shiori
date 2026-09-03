-- ============================================================================
-- Lesson-level progress persistence.
--
-- A lesson is a sequence of blocks, some of which are practice questions. To
-- resume correctly after a refresh or a closed tab, and to know when a lesson
-- is actually complete, the application needs to know which required blocks a
-- learner has already satisfied -- not just whether the lesson as a whole is
-- "in progress". See docs/LEARNING-ENGINE.md ("Lesson completion").
-- ============================================================================

-- Not every block is mandatory for completion (e.g. a supplementary aside).
-- Defaults to true, so existing content -- everything required -- is
-- unaffected until an author opts a specific block out.
alter table public.lesson_content
  add column is_required boolean not null default true;

-- Per-learner, per-lesson progress at block granularity. Deliberately opaque
-- jsonb rather than a child table: the shape is still settling alongside the
-- lesson engine (see LessonProgressState in src/types/content.ts), and a
-- jsonb column can be reshaped without a migration while that is true.
-- Revisit as a normalised table if the application ever needs to query into
-- it (e.g. "which learners have completed block X"); today it is read back
-- whole, for one learner, to resume one lesson.
alter table public.user_curriculum_progress
  add column progress_state jsonb not null default '{}'::jsonb;

comment on column public.user_curriculum_progress.progress_state is
  'Block-level progress within the lesson: which required blocks are satisfied and, for question blocks, attempt/success state. Shape: LessonProgressState in src/types/content.ts. Read to resume position and to compute lesson completion -- never used to gate access to content.';
