create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.competitions (
  id text primary key,
  name text not null,
  edition text not null,
  host text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  competition_id text not null references public.competitions(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  unique (user_id, competition_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  role text not null check (role in ('admin', 'member')),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status text not null check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

create table if not exists public.phases (
  id text primary key,
  competition_id text not null references public.competitions(id) on delete cascade,
  slug text not null unique,
  name text not null,
  phase_order integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create table if not exists public.teams (
  id text primary key,
  name text not null,
  short_name text not null,
  code text not null unique,
  group_name text
);

create table if not exists public.prediction_rules (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null unique references public.phases(id) on delete cascade,
  enable_match_predictions boolean not null default true,
  enable_placement_predictions boolean not null default false,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  exact_score_points integer not null default 0,
  correct_outcome_points integer not null default 0,
  champion_points integer not null default 0,
  runner_up_points integer not null default 0,
  third_place_points integer not null default 0,
  status text not null check (status in ('draft', 'active', 'locked'))
);

create table if not exists public.matches (
  id text primary key,
  phase_id text not null references public.phases(id) on delete cascade,
  round_label text not null,
  kickoff_at timestamptz not null,
  venue text not null,
  home_team_id text not null references public.teams(id) on delete restrict,
  away_team_id text not null references public.teams(id) on delete restrict,
  status text not null check (status in ('scheduled', 'in_progress', 'completed'))
);

create table if not exists public.official_results (
  match_id text primary key references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  published_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.placement_results (
  competition_id text primary key references public.competitions(id) on delete cascade,
  champion_team_id text references public.teams(id) on delete restrict,
  runner_up_team_id text references public.teams(id) on delete restrict,
  third_place_team_id text references public.teams(id) on delete restrict,
  published_at timestamptz
);

create table if not exists public.match_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

create table if not exists public.placement_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  competition_id text not null references public.competitions(id) on delete cascade,
  champion_team_id text references public.teams(id) on delete restrict,
  runner_up_team_id text references public.teams(id) on delete restrict,
  third_place_team_id text references public.teams(id) on delete restrict,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, competition_id)
);

create table if not exists public.score_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phase_id text not null references public.phases(id) on delete cascade,
  source_type text not null check (source_type in ('match', 'placement')),
  source_id text not null,
  points integer not null default 0,
  exact_hit boolean not null default false,
  outcome_hit boolean not null default false,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.phases enable row level security;
alter table public.prediction_rules enable row level security;
alter table public.matches enable row level security;
alter table public.official_results enable row level security;
alter table public.placement_results enable row level security;
alter table public.match_predictions enable row level security;
alter table public.placement_predictions enable row level security;
alter table public.score_entries enable row level security;

create policy "members can read profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.memberships m
    where m.user_id = public.profiles.id
       or m.user_id = (select id from public.profiles where auth_user_id = auth.uid())
  ));

create policy "members can read shared data"
  on public.matches for select
  using (true);

create policy "members can read phases"
  on public.phases for select
  using (true);

create policy "members can read rules"
  on public.prediction_rules for select
  using (true);

create policy "members can read official results"
  on public.official_results for select
  using (true);

create policy "members can read podium results"
  on public.placement_results for select
  using (true);

create policy "members manage own match predictions"
  on public.match_predictions for all
  using (
    user_id = (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "members manage own placement predictions"
  on public.placement_predictions for all
  using (
    user_id = (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "admins manage invites"
  on public.invites for all
  using (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "admins manage results"
  on public.official_results for all
  using (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "admins manage podium result"
  on public.placement_results for all
  using (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid() and role = 'admin'
    )
  );
