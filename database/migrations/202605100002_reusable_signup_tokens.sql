alter table signup_requests
  drop constraint if exists signup_requests_token_key;

create index if not exists idx_signup_requests_token on signup_requests (token);
