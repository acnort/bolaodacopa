create table if not exists provider_sync_state (
  key text primary key,
  last_synced_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);
