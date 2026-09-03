-- ============================================================================
-- Row Level Security.
--
-- The security model in one sentence:
--   published content is readable by everyone and writable by no one;
--   learner state is readable and writable only by the learner it belongs to.
--
-- Nothing here depends on the frontend. Every policy is expressed in terms of
-- auth.uid() and the row itself, so a leaked anon key gets an attacker exactly
-- what an anonymous visitor already has: published content, and nothing else.
--
-- Content writes happen through the service-role key (ingestion scripts only,
-- src/lib/supabase/admin.ts), which bypasses RLS by design. There is
-- deliberately no content-write policy for any normal role.
--
-- See docs/DATABASE.md ("Security model").
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is the current request from the owner of this row?
--
-- STABLE + pinned search_path. Wrapping auth.uid() lets Postgres evaluate it
-- once per query instead of once per row, which matters on the SRS due-cards
-- query more than anywhere else.
-- ---------------------------------------------------------------------------
create or replace function public.is_owner(row_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select row_user_id = (select auth.uid());
$$;

-- ===========================================================================
-- CONTENT TABLES: read published, write never.
-- ===========================================================================

alter table public.content_sources enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_items enable row level security;
alter table public.kana enable row level security;
alter table public.vocabulary enable row level security;
alter table public.vocabulary_examples enable row level security;
alter table public.vocabulary_kanji enable row level security;
alter table public.kanji enable row level security;
alter table public.kanji_components enable row level security;
alter table public.grammar_points enable row level security;
alter table public.grammar_examples enable row level security;
alter table public.grammar_relations enable row level security;
alter table public.reading_passages enable row level security;
alter table public.reading_sentences enable row level security;
alter table public.listening_lessons enable row level security;
alter table public.listening_segments enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.levels enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_content enable row level security;
alter table public.lesson_content_items enable row level security;
alter table public.assessment_tests enable row level security;
alter table public.assessment_questions enable row level security;

-- Provenance and media are readable by anyone: attribution is a licence
-- obligation and audio must be fetchable before a lesson starts.
create policy "content_sources are readable by everyone"
  on public.content_sources for select using (true);

create policy "media_assets are readable by everyone"
  on public.media_assets for select using (true);

-- Published items only. Drafts stay invisible to learners.
create policy "published content_items are readable by everyone"
  on public.content_items for select
  using (status = 'published');

-- Extension tables inherit visibility from their content_items row, so a draft
-- item cannot leak its body through a side table.
create policy "kana of published items are readable"
  on public.kana for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = kana.item_id and ci.status = 'published'
  ));

create policy "vocabulary of published items are readable"
  on public.vocabulary for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = vocabulary.item_id and ci.status = 'published'
  ));

create policy "kanji of published items are readable"
  on public.kanji for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = kanji.item_id and ci.status = 'published'
  ));

create policy "grammar_points of published items are readable"
  on public.grammar_points for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = grammar_points.item_id and ci.status = 'published'
  ));

create policy "reading_passages of published items are readable"
  on public.reading_passages for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = reading_passages.item_id and ci.status = 'published'
  ));

create policy "listening_lessons of published items are readable"
  on public.listening_lessons for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = listening_lessons.item_id and ci.status = 'published'
  ));

-- Child rows follow their parent item's visibility.
create policy "vocabulary_examples follow their entry"
  on public.vocabulary_examples for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = vocabulary_examples.vocabulary_item_id and ci.status = 'published'
  ));

create policy "vocabulary_kanji follow their entry"
  on public.vocabulary_kanji for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = vocabulary_kanji.vocabulary_item_id and ci.status = 'published'
  ));

create policy "kanji_components follow their kanji"
  on public.kanji_components for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = kanji_components.kanji_item_id and ci.status = 'published'
  ));

create policy "grammar_examples follow their point"
  on public.grammar_examples for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = grammar_examples.grammar_item_id and ci.status = 'published'
  ));

create policy "grammar_relations follow their source point"
  on public.grammar_relations for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = grammar_relations.from_item_id and ci.status = 'published'
  ));

create policy "reading_sentences follow their passage"
  on public.reading_sentences for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = reading_sentences.passage_item_id and ci.status = 'published'
  ));

create policy "listening_segments follow their lesson"
  on public.listening_segments for select
  using (exists (
    select 1 from public.content_items ci
    where ci.id = listening_segments.listening_item_id and ci.status = 'published'
  ));

-- ---------------------------------------------------------------------------
-- Questions.
--
-- Options are readable alongside their question, including is_correct. That is
-- a deliberate, documented trade-off: hiding the answer key would require
-- routing every question through a server function, and a determined learner
-- can already see it in the network tab of any client-side quiz.
--
-- TODO -- DECISION REQUIRED: if graded assessments must be cheat-resistant,
-- question_options needs a server-side grading path and this policy must be
-- narrowed. Track before placement tests are used for anything consequential.
-- ---------------------------------------------------------------------------
create policy "published questions are readable by everyone"
  on public.questions for select
  using (status = 'published');

create policy "question_options follow their question"
  on public.question_options for select
  using (exists (
    select 1 from public.questions q
    where q.id = question_options.question_id and q.status = 'published'
  ));

-- ---------------------------------------------------------------------------
-- Curriculum structure.
-- ---------------------------------------------------------------------------
create policy "published levels are readable by everyone"
  on public.levels for select using (status = 'published');

create policy "published units are readable by everyone"
  on public.units for select
  using (status = 'published' and exists (
    select 1 from public.levels l
    where l.id = units.level_id and l.status = 'published'
  ));

create policy "published lessons are readable by everyone"
  on public.lessons for select
  using (status = 'published' and exists (
    select 1 from public.units u
    join public.levels l on l.id = u.level_id
    where u.id = lessons.unit_id and u.status = 'published' and l.status = 'published'
  ));

create policy "lesson_content follows its lesson"
  on public.lesson_content for select
  using (exists (
    select 1 from public.lessons le
    where le.id = lesson_content.lesson_id and le.status = 'published'
  ));

create policy "lesson_content_items follow their block"
  on public.lesson_content_items for select
  using (exists (
    select 1 from public.lesson_content lc
    join public.lessons le on le.id = lc.lesson_id
    where lc.id = lesson_content_items.block_id and le.status = 'published'
  ));

create policy "published assessment_tests are readable by everyone"
  on public.assessment_tests for select using (status = 'published');

create policy "assessment_questions follow their test"
  on public.assessment_questions for select
  using (exists (
    select 1 from public.assessment_tests t
    where t.id = assessment_questions.test_id and t.status = 'published'
  ));

-- No INSERT, UPDATE or DELETE policy is defined on any table above. With RLS
-- enabled and no permissive policy for a command, that command is denied for
-- every role except those that bypass RLS (service_role, table owner).

-- ===========================================================================
-- LEARNER STATE: each learner sees and changes only their own rows.
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_curriculum_progress enable row level security;
alter table public.user_skill_mastery enable row level security;
alter table public.srs_cards enable row level security;
alter table public.srs_reviews enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.placement_results enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles.
--
-- No DELETE policy: profiles are removed by the cascade from auth.users, which
-- is the only correct way to delete one.
-- ---------------------------------------------------------------------------
create policy "profiles are readable by their owner"
  on public.profiles for select using (public.is_owner(id));

create policy "profiles are updatable by their owner"
  on public.profiles for update
  using (public.is_owner(id))
  with check (public.is_owner(id));

-- The signup trigger creates the row; this covers the recovery case where a
-- profile is somehow missing. The WITH CHECK stops a learner from creating a
-- profile for anyone else.
create policy "profiles are insertable by their owner"
  on public.profiles for insert with check (public.is_owner(id));

-- ---------------------------------------------------------------------------
-- Learning state, SRS and assessment.
--
-- FOR ALL covers select/insert/update/delete in one policy. USING gates reads
-- and the rows a write may touch; WITH CHECK gates the rows a write may
-- produce -- both are required, or a learner could reassign their row to
-- someone else by updating user_id.
-- ---------------------------------------------------------------------------
create policy "user_progress is private to its owner"
  on public.user_progress for all
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy "user_curriculum_progress is private to its owner"
  on public.user_curriculum_progress for all
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy "user_skill_mastery is private to its owner"
  on public.user_skill_mastery for all
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy "srs_cards are private to their owner"
  on public.srs_cards for all
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy "assessment_attempts are private to their owner"
  on public.assessment_attempts for all
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

-- ---------------------------------------------------------------------------
-- Append-only tables.
--
-- srs_reviews is the evidence a future scheduler change would be replayed
-- from, and assessment_answers is the evidence behind a placement. Neither
-- may be rewritten or deleted by the learner -- only inserted and read.
-- ---------------------------------------------------------------------------
create policy "srs_reviews are readable by their owner"
  on public.srs_reviews for select using (public.is_owner(user_id));

create policy "srs_reviews are insertable by their owner"
  on public.srs_reviews for insert with check (public.is_owner(user_id));

create policy "assessment_answers are readable by their owner"
  on public.assessment_answers for select using (public.is_owner(user_id));

create policy "assessment_answers are insertable by their owner"
  on public.assessment_answers for insert with check (public.is_owner(user_id));

-- ---------------------------------------------------------------------------
-- Placement results.
--
-- Insert and update are permitted so the learner can accept a placement.
-- TODO -- DECISION REQUIRED: if placement must be tamper-proof, move writes to
-- a SECURITY DEFINER function and drop the insert/update policies here.
-- ---------------------------------------------------------------------------
create policy "placement_results are readable by their owner"
  on public.placement_results for select using (public.is_owner(user_id));

create policy "placement_results are insertable by their owner"
  on public.placement_results for insert with check (public.is_owner(user_id));

create policy "placement_results are updatable by their owner"
  on public.placement_results for update
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));
