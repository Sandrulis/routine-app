-- Per-user guided product tour state (null = tour never finished).

alter table public.users
  add column if not exists product_tour_completed_at timestamptz;

create or replace function public.set_current_user_product_tour_completed(
  p_completed boolean default true
)
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

  update public.users
  set product_tour_completed_at = case when coalesce(p_completed, true) then now() else null end
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_product_tour_completed(boolean)
  from public, anon;
grant execute on function public.set_current_user_product_tour_completed(boolean)
  to authenticated;
