-- Early Bird is a global pool of seats, not teams. Claimed seats stay
-- consumed if a team drops an unused seat at cycle end.

alter table public.site_settings
  add column if not exists early_bird_claimed integer not null default 0;

alter table public.site_settings
  drop constraint if exists site_settings_early_bird_claimed_check;

alter table public.site_settings
  add constraint site_settings_early_bird_claimed_check
  check (early_bird_claimed >= 0);

alter table public.teams
  add column if not exists early_bird_seat_count integer not null default 0;

alter table public.teams
  drop constraint if exists teams_early_bird_seat_count_check;

alter table public.teams
  add constraint teams_early_bird_seat_count_check
  check (early_bird_seat_count >= 0);

update public.teams
set early_bird_seat_count = greatest(coalesce(paid_seat_count, 0), 0)
where payment_plan_is_early_bird = true
  and coalesce(early_bird_seat_count, 0) = 0;

update public.site_settings
set early_bird_claimed = greatest(
  coalesce(early_bird_claimed, 0),
  coalesce((select sum(early_bird_seat_count) from public.teams), 0)
)
where id = 1;
