-- ============================================================================
-- Gated questions: keep correctness hidden until submission.
--
-- question_options.is_correct is readable alongside its question for ordinary
-- practice -- a learner doing a lesson exercise can already see the answer key
-- in the network tab of any client-side quiz, and hiding it there would add a
-- round trip for no real benefit.
--
-- Placement and diagnostic questions are different: their entire purpose is an
-- honest measurement, so the correct answer must never reach the client before
-- the learner submits a response. `questions.is_gated` marks those questions;
-- the RLS policy on question_options refuses to serve a gated question's
-- options to any client-facing role. See docs/DATABASE.md ("Security model —
-- gated questions") and docs/DIAGNOSTIC.md ("Gated question evaluation").
-- ============================================================================

alter table public.questions
  add column is_gated boolean not null default false;

comment on column public.questions.is_gated is
  'True for placement/diagnostic questions whose answer key must never reach the client before submission. Set explicitly by content authors, not inferred from assessment_questions membership -- a question can be reused in both a practice lesson and a gated test, and the two contexts do not have to agree.';

drop policy "question_options follow their question" on public.question_options;

create policy "question_options follow their non-gated question"
  on public.question_options for select
  using (exists (
    select 1 from public.questions q
    where q.id = question_options.question_id
      and q.status = 'published'
      and q.is_gated = false
  ));

-- Gated questions now have no select policy that admits their options, so the
-- command is denied for every client-facing role -- the same "no policy, no
-- access" mechanism used everywhere else content is protected. Grading a
-- gated question is a server-side evaluation boundary, not yet implemented:
-- no code path grades one today, because no assessment engine exists yet.
-- This migration only closes the leak ahead of that engine being built.
