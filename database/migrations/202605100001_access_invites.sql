create table if not exists access_invites (
  id text primary key,
  token text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  created_by text references profiles(id) on delete set null,
  revoked_at timestamptz
);

create index if not exists idx_access_invites_token on access_invites (token);

insert into access_invites (id, token, created_at)
values ('access-invite-default', 'convite-bolao-2026', timezone('utc', now()))
on conflict (token) do nothing;
