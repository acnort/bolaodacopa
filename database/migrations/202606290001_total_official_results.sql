alter table official_results
  add column if not exists total_home_score integer check (total_home_score >= 0),
  add column if not exists total_away_score integer check (total_away_score >= 0);
