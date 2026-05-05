create extension if not exists "pgcrypto";

create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text,
  magic_link_token text unique,
  magic_link_expires_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists profiles (
  id text primary key,
  user_id text not null unique references users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists competitions (
  id text primary key,
  name text not null,
  edition text not null,
  host text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists competition_groups (
  id text primary key,
  competition_id text not null references competitions(id) on delete cascade,
  code text not null,
  name text not null,
  group_order integer not null,
  unique (competition_id, code)
);

create table if not exists memberships (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  competition_id text not null references competitions(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  unique (user_id, competition_id)
);

create table if not exists signup_requests (
  id text primary key,
  full_name text not null,
  email text not null,
  token text not null unique,
  role text not null check (role in ('admin', 'member')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by text references profiles(id) on delete set null,
  approved_user_id text references users(id) on delete set null
);

create table if not exists phases (
  id text primary key,
  competition_id text not null references competitions(id) on delete cascade,
  slug text not null unique,
  name text not null,
  phase_order integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create table if not exists teams (
  id text primary key,
  competition_id text not null references competitions(id) on delete cascade,
  group_id text references competition_groups(id) on delete set null,
  name text not null,
  short_name text not null,
  code text not null unique
);

create table if not exists prediction_rules (
  id text primary key,
  phase_id text not null unique references phases(id) on delete cascade,
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

create table if not exists matches (
  id text primary key,
  phase_id text not null references phases(id) on delete cascade,
  round_label text not null,
  stage_group text,
  kickoff_at timestamptz not null,
  venue text not null default '',
  home_team_id text references teams(id) on delete restrict,
  away_team_id text references teams(id) on delete restrict,
  home_placeholder text,
  away_placeholder text,
  status text not null check (status in ('scheduled', 'in_progress', 'completed'))
);

create table if not exists official_results (
  match_id text primary key references matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  published_at timestamptz not null default timezone('utc', now())
);

create table if not exists placement_results (
  competition_id text primary key references competitions(id) on delete cascade,
  champion_team_id text references teams(id) on delete restrict,
  runner_up_team_id text references teams(id) on delete restrict,
  third_place_team_id text references teams(id) on delete restrict,
  published_at timestamptz
);

create table if not exists match_predictions (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  match_id text not null references matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

create table if not exists placement_predictions (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  competition_id text not null references competitions(id) on delete cascade,
  champion_team_id text references teams(id) on delete restrict,
  runner_up_team_id text references teams(id) on delete restrict,
  third_place_team_id text references teams(id) on delete restrict,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, competition_id)
);

create table if not exists score_entries (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  phase_id text not null references phases(id) on delete cascade,
  source_type text not null check (source_type in ('match', 'placement')),
  source_id text not null,
  points integer not null default 0,
  exact_hit boolean not null default false,
  outcome_hit boolean not null default false,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_teams_competition_id on teams (competition_id);
create index if not exists idx_matches_phase_id on matches (phase_id);
create index if not exists idx_matches_kickoff_at on matches (kickoff_at);
create index if not exists idx_predictions_user_id on match_predictions (user_id);
create index if not exists idx_signup_requests_email on signup_requests (email);
