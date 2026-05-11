alter table matches
  add column if not exists external_match_id text;

create unique index if not exists idx_matches_external_match_id on matches (external_match_id);
