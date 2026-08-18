-- Persist the signed-in user's UI language so admins can see preferred languages.
-- Guests keep the choice in the language cookie until they sign in.

alter table public.users
  add column if not exists language_code text references public.site_languages (code) on delete set null;

create index if not exists users_language_code_idx
  on public.users (language_code);

create or replace function public.set_current_user_language(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.site_languages as lang
    where lang.code = p_code
      and lang.is_active = true
  ) then
    raise exception 'Language is not available';
  end if;

  update public.users
  set language_code = p_code
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_language(text) from public, anon;
grant execute on function public.set_current_user_language(text) to authenticated;
