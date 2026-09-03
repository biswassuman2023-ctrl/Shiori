-- ============================================================================
-- Questions: which SRS direction a question exercises.
--
-- SRS card creation is triggered by lesson practice completion (see
-- docs/SRS.md "Card creation"): the first time a learner answers a question
-- correctly, and that question exercises one content item in one review
-- direction, a card should be created for that (item, direction) pair.
--
-- The question needs to say which direction it exercises for that trigger to
-- know what to create. `item_id` already exists; this adds its direction
-- counterpart.
-- ============================================================================

alter table public.questions
  add column item_direction public.srs_direction;

comment on column public.questions.item_direction is
  'For a question that exercises exactly one content item in one SRS review direction, the direction it exercises -- used to trigger SRS card creation on first correct answer (see docs/SRS.md). Null for questions that do not map 1:1 onto a single item and direction (e.g. a question spanning several items).';
