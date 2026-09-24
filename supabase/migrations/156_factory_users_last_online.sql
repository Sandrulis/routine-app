alter table public.team_factory_users
  add column if not exists last_online_at timestamptz;
