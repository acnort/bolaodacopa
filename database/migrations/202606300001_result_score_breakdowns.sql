alter table official_results
  add column if not exists extra_time_home_score integer check (extra_time_home_score >= 0),
  add column if not exists extra_time_away_score integer check (extra_time_away_score >= 0),
  add column if not exists penalty_home_score integer check (penalty_home_score >= 0),
  add column if not exists penalty_away_score integer check (penalty_away_score >= 0);
