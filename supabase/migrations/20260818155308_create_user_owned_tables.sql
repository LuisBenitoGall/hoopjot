create table public.profiles (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  alias text,
  birth_year integer not null,
  height_cm integer,
  dominant_hand text,
  primary_position text not null,
  secondary_position text,
  experience_years integer,
  competitive_level text not null,
  weekly_practices integer,
  weekly_games integer,
  locale text not null,
  physical_context jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint profiles_user_id_key unique (user_id),
  constraint profiles_alias_length check (alias is null or char_length(alias) between 1 and 80),
  constraint profiles_birth_year_check check (birth_year between 1900 and 9999),
  constraint profiles_height_cm_check check (height_cm is null or height_cm > 0),
  constraint profiles_dominant_hand_check check (
    dominant_hand is null
    or dominant_hand in ('right', 'left', 'both', 'prefer_not_to_say')
  ),
  constraint profiles_primary_position_check check (
    primary_position in (
      'point_guard',
      'shooting_guard',
      'small_forward',
      'power_forward',
      'center'
    )
  ),
  constraint profiles_secondary_position_check check (
    secondary_position is null
    or secondary_position in (
      'point_guard',
      'shooting_guard',
      'small_forward',
      'power_forward',
      'center'
    )
  ),
  constraint profiles_experience_years_check check (
    experience_years is null
    or experience_years >= 0
  ),
  constraint profiles_competitive_level_check check (
    competitive_level in (
      'recreational',
      'club',
      'academy',
      'high_school',
      'college',
      'semi_pro',
      'professional',
      'other'
    )
  ),
  constraint profiles_weekly_practices_check check (
    weekly_practices is null
    or weekly_practices >= 0
  ),
  constraint profiles_weekly_games_check check (
    weekly_games is null
    or weekly_games >= 0
  ),
  constraint profiles_locale_length check (char_length(locale) between 2 and 16),
  constraint profiles_physical_context_object check (
    physical_context is null
    or jsonb_typeof(physical_context) = 'object'
  )
);

create table public.player_goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_type text not null,
  custom_label text,
  priority smallint not null,
  active boolean not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint player_goals_goal_type_check check (
    goal_type in (
      'more_minutes',
      'fundamentals',
      'game_understanding',
      'defense',
      'rebounding',
      'inside_game',
      'finishing',
      'decision_making',
      'confidence',
      'rebuild_game_confidence',
      'custom'
    )
  ),
  constraint player_goals_custom_label_length check (
    custom_label is null
    or char_length(custom_label) between 1 and 80
  ),
  constraint player_goals_priority_check check (priority between 1 and 3)
);

create table public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer,
  perceived_load smallint,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  constraint sessions_type_check check (type in ('practice', 'game', 'learning', 'recovery')),
  constraint sessions_duration_minutes_check check (
    duration_minutes is null
    or duration_minutes > 0
  ),
  constraint sessions_perceived_load_check check (
    perceived_load is null
    or perceived_load between 1 and 5
  ),
  constraint sessions_notes_length check (notes is null or char_length(notes) between 1 and 2000)
);

create table public.daily_focus (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  guideline_id text not null,
  reason_code text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint daily_focus_user_local_date_key unique (user_id, local_date),
  constraint daily_focus_guideline_id_length check (char_length(guideline_id) >= 1),
  constraint daily_focus_reason_code_check check (
    reason_code in (
      'goal',
      'recent_difficulty',
      'coach_feedback',
      'development_path',
      'rotation'
    )
  ),
  constraint daily_focus_status_check check (status in ('planned', 'viewed', 'completed', 'skipped'))
);

create table public.check_ins (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  energy smallint,
  confidence smallint,
  physical_feeling smallint,
  note text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint check_ins_session_id_key unique (session_id),
  constraint check_ins_energy_check check (energy is null or energy between 1 and 5),
  constraint check_ins_confidence_check check (confidence is null or confidence between 1 and 5),
  constraint check_ins_physical_feeling_check check (
    physical_feeling is null
    or physical_feeling between 1 and 5
  ),
  constraint check_ins_note_length check (note is null or char_length(note) between 1 and 1000)
);

create table public.reflections (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  daily_focus_id uuid references public.daily_focus (id) on delete set null,
  focus_rating smallint not null,
  note text,
  coach_feedback text,
  remember_next_time text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint reflections_session_id_key unique (session_id),
  constraint reflections_focus_rating_check check (focus_rating between 1 and 5),
  constraint reflections_note_length check (note is null or char_length(note) between 1 and 2000),
  constraint reflections_coach_feedback_length check (
    coach_feedback is null
    or char_length(coach_feedback) between 1 and 2000
  ),
  constraint reflections_remember_next_time_length check (
    remember_next_time is null
    or char_length(remember_next_time) between 1 and 1000
  )
);

create table public.observations (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  reflection_id uuid references public.reflections (id) on delete cascade,
  skill_id text not null,
  pattern text,
  polarity text not null,
  weight double precision not null,
  source text not null,
  confidence double precision not null,
  observed_at timestamptz not null,
  constraint observations_skill_id_length check (char_length(skill_id) >= 1),
  constraint observations_pattern_length check (
    pattern is null
    or char_length(pattern) between 1 and 120
  ),
  constraint observations_polarity_check check (polarity in ('positive', 'negative', 'neutral')),
  constraint observations_source_check check (
    source in ('self_assessment', 'reflection', 'coach_feedback', 'system', 'ai')
  ),
  constraint observations_confidence_check check (confidence >= 0 and confidence <= 1)
);

create table public.skill_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  score double precision not null,
  confidence double precision not null,
  sample_count integer not null,
  trend text not null,
  last_observed_at timestamptz,
  updated_at timestamptz not null,
  primary key (user_id, skill_id),
  constraint skill_state_skill_id_length check (char_length(skill_id) >= 1),
  constraint skill_state_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint skill_state_sample_count_check check (sample_count >= 0),
  constraint skill_state_trend_check check (trend in ('up', 'flat', 'down', 'unknown'))
);

create table public.weekly_reviews (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  highlighted_skill_ids text[] not null default '{}',
  improving_skill_ids text[] not null default '{}',
  recurring_skill_ids text[] not null default '{}',
  next_priority_skill_ids text[] not null default '{}',
  user_improvement_note text,
  user_next_week_note text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint weekly_reviews_user_week_start_key unique (user_id, week_start),
  constraint weekly_reviews_user_improvement_note_length check (
    user_improvement_note is null
    or char_length(user_improvement_note) between 1 and 2000
  ),
  constraint weekly_reviews_user_next_week_note_length check (
    user_next_week_note is null
    or char_length(user_next_week_note) between 1 and 2000
  )
);

create index player_goals_user_active_idx on public.player_goals (user_id, active);
create index sessions_user_updated_idx on public.sessions (user_id, updated_at);
create index sessions_user_deleted_updated_idx on public.sessions (user_id, deleted_at, updated_at);
create index daily_focus_user_updated_idx on public.daily_focus (user_id, updated_at);
create index check_ins_user_session_idx on public.check_ins (user_id, session_id);
create index reflections_user_session_idx on public.reflections (user_id, session_id);
create index reflections_user_daily_focus_idx on public.reflections (user_id, daily_focus_id);
create index observations_user_observed_idx on public.observations (user_id, observed_at);
create index observations_user_session_idx on public.observations (user_id, session_id);
create index observations_user_reflection_idx on public.observations (user_id, reflection_id);
create index observations_user_skill_idx on public.observations (user_id, skill_id);
create index skill_state_user_updated_idx on public.skill_state (user_id, updated_at);
create index weekly_reviews_user_updated_idx on public.weekly_reviews (user_id, updated_at);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.player_goals to authenticated;
grant select, insert, update, delete on table public.sessions to authenticated;
grant select, insert, update, delete on table public.daily_focus to authenticated;
grant select, insert, update, delete on table public.check_ins to authenticated;
grant select, insert, update, delete on table public.reflections to authenticated;
grant select, insert, update, delete on table public.observations to authenticated;
grant select, insert, update, delete on table public.skill_state to authenticated;
grant select, insert, update, delete on table public.weekly_reviews to authenticated;

alter table public.profiles enable row level security;
alter table public.player_goals enable row level security;
alter table public.sessions enable row level security;
alter table public.daily_focus enable row level security;
alter table public.check_ins enable row level security;
alter table public.reflections enable row level security;
alter table public.observations enable row level security;
alter table public.skill_state enable row level security;
alter table public.weekly_reviews enable row level security;

alter table public.profiles force row level security;
alter table public.player_goals force row level security;
alter table public.sessions force row level security;
alter table public.daily_focus force row level security;
alter table public.check_ins force row level security;
alter table public.reflections force row level security;
alter table public.observations force row level security;
alter table public.skill_state force row level security;
alter table public.weekly_reviews force row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy player_goals_select_own on public.player_goals
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy player_goals_insert_own on public.player_goals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy player_goals_update_own on public.player_goals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy player_goals_delete_own on public.player_goals
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy sessions_select_own on public.sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy sessions_insert_own on public.sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy sessions_update_own on public.sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy sessions_delete_own on public.sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy daily_focus_select_own on public.daily_focus
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy daily_focus_insert_own on public.daily_focus
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy daily_focus_update_own on public.daily_focus
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy daily_focus_delete_own on public.daily_focus
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy check_ins_select_own on public.check_ins
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy check_ins_insert_own on public.check_ins
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy check_ins_update_own on public.check_ins
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy check_ins_delete_own on public.check_ins
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy reflections_select_own on public.reflections
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy reflections_insert_own on public.reflections
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy reflections_update_own on public.reflections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy reflections_delete_own on public.reflections
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy observations_select_own on public.observations
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy observations_insert_own on public.observations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy observations_update_own on public.observations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy observations_delete_own on public.observations
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy skill_state_select_own on public.skill_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy skill_state_insert_own on public.skill_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy skill_state_update_own on public.skill_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy skill_state_delete_own on public.skill_state
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy weekly_reviews_select_own on public.weekly_reviews
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy weekly_reviews_insert_own on public.weekly_reviews
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy weekly_reviews_update_own on public.weekly_reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy weekly_reviews_delete_own on public.weekly_reviews
  for delete to authenticated
  using ((select auth.uid()) = user_id);
