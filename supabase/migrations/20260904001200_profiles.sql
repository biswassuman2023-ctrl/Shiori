-- ============================================================================
-- Profiles.
--
-- `auth.users` is owned by Supabase Auth and must not be extended directly.
-- This is the application's user record, created automatically on signup so no
-- code path ever has to cope with a signed-in user who has no profile.
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  -- Interface language. Japanese is the subject, not necessarily the UI.
  ui_locale text not null default 'en',
  timezone text not null default 'UTC',
  -- Onboarding answers drive placement; see docs/DIAGNOSTIC.md.
  daily_goal_minutes smallint not null default 15,
  onboarding_completed_at timestamptz,
  placement_completed_at timestamptz,
  -- Where the learner currently sits on the fixed ladder.
  current_level_code public.curriculum_level_code,
  current_lesson_id uuid references public.lessons (id) on delete set null,
  -- Local-time hour at which the learner's day rolls over for streaks and
  -- SRS due counts. Stored separately from timezone so it can be tuned.
  day_start_hour smallint not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_daily_goal_range check (daily_goal_minutes between 5 and 240),
  constraint profiles_day_start_range check (day_start_hour between 0 and 23)
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Automatic profile creation.
--
-- SECURITY DEFINER because the trigger runs as the auth system, which has no
-- rights on public.profiles. search_path is pinned to defeat search-path
-- hijacking, which is the standard risk with SECURITY DEFINER functions.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
