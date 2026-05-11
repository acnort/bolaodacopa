delete from signup_requests
where lower(email) in (
  'pedro@bolao.dev',
  'sofia@bolao.dev',
  'caio@bolao.dev'
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'invites'
  ) then
    delete from invites
    where lower(email) in (
      'andre@bolao.dev',
      'joao@bolao.dev',
      'maria@bolao.dev',
      'sofia@bolao.dev',
      'pedro@bolao.dev',
      'caio@bolao.dev'
    )
    or invited_by in ('user-ana', 'user-joao', 'user-maria', 'user-sofia')
    or accepted_user_id in ('user-ana', 'user-joao', 'user-maria', 'user-sofia');
  end if;
end $$;

delete from users
where lower(email) in (
  'andre@bolao.dev',
  'joao@bolao.dev',
  'maria@bolao.dev',
  'sofia@bolao.dev',
  'pedro@bolao.dev',
  'caio@bolao.dev'
);

delete from access_invites
where token = 'convite-bolao-2026';
