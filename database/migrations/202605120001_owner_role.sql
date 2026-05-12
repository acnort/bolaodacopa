alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check check (role in ('owner', 'admin', 'member'));

alter table memberships
  drop constraint if exists memberships_role_check;

alter table memberships
  add constraint memberships_role_check check (role in ('owner', 'admin', 'member'));

alter table signup_requests
  drop constraint if exists signup_requests_role_check;

alter table signup_requests
  add constraint signup_requests_role_check check (role in ('owner', 'admin', 'member'));
