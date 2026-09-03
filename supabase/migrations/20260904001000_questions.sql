-- ============================================================================
-- Questions.
--
-- Questions are shared by lessons, reviews and assessments. They are content,
-- not user state, and are authored once and reused everywhere.
--
-- Answer storage: every question type uses `question_options`.
--   - multiple_choice / audio_choice: options are the choices; is_correct marks
--     the answer(s).
--   - text_input: options are the accepted answers (is_correct = true), never
--     displayed. This keeps grading in one place instead of splitting it
--     between a column and a table.
--   - matching / ordering: options are the members; `match_key` pairs them and
--     `position` fixes the correct order.
-- ============================================================================

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_type public.question_type not null,
  -- The skill this question exercises, used for mastery tracking.
  skill public.skill_type not null,
  -- Prompt as structured data: { text, japanese, furigana, audio_asset_id, ... }
  prompt jsonb not null default '{}'::jsonb,
  -- Shown after answering. Structured for the same reason as prompt.
  explanation jsonb,
  -- The content item this question is about, when it targets one directly.
  -- Null for questions that test a combination of items.
  item_id uuid references public.content_items (id) on delete set null,
  -- 1 (easiest) to 5 (hardest), used by adaptive selection.
  difficulty smallint not null default 3,
  jlpt_level public.curriculum_level_code,
  status public.publication_status not null default 'draft',
  source_id uuid references public.content_sources (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint questions_difficulty_range check (difficulty between 1 and 5)
);

create index questions_item_idx on public.questions (item_id);
create index questions_skill_status_idx on public.questions (skill, status);
create index questions_difficulty_idx on public.questions (jlpt_level, difficulty);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position smallint not null,
  -- Option body as structured data: { text, japanese, furigana, audio_asset_id }
  content jsonb not null default '{}'::jsonb,
  is_correct boolean not null default false,
  -- Pairs members for matching questions; null for every other type.
  match_key text,

  constraint question_options_position_unique unique (question_id, position)
);

create index question_options_question_idx on public.question_options (question_id);
