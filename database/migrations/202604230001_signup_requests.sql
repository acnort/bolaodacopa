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

create index if not exists idx_signup_requests_email on signup_requests (email);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'invites'
  ) then
    insert into signup_requests (
      id,
      full_name,
      email,
      token,
      role,
      status,
      requested_at,
      reviewed_at,
      reviewed_by,
      approved_user_id
    )
    select
      i.id,
      coalesce(p.full_name, split_part(i.email, '@', 1)),
      i.email,
      i.token,
      i.role,
      case
        when i.status = 'accepted' then 'approved'
        when i.status = 'expired' then 'rejected'
        else 'pending'
      end,
      coalesce(i.accepted_at, i.expires_at, timezone('utc', now())),
      i.accepted_at,
      i.invited_by,
      i.accepted_user_id
    from invites i
    left join profiles p on p.user_id = i.accepted_user_id
    on conflict (id) do nothing;
  end if;
end $$;
