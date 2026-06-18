alter table official_results
  add column if not exists is_manual boolean not null default false;
