-- Allow encrypted calendar feed tokens (enc:v1:) after application-layer encryption.
-- Lookup remains feed_token_hash (sha256 of plaintext).

create extension if not exists pgcrypto;

alter table public.user_calendar_integrations
  drop constraint if exists user_calendar_integrations_feed_token_check;

alter table public.user_calendar_integrations
  add constraint user_calendar_integrations_feed_token_check check (
    feed_token ~ '^[a-f0-9]{64}$'
    or feed_token like 'enc:v1:%'
  );

update public.user_calendar_integrations
set feed_token_hash = encode(digest(convert_to(feed_token, 'UTF8'), 'sha256'), 'hex')
where (feed_token_hash is null or feed_token_hash = '')
  and feed_token is not null
  and feed_token <> ''
  and feed_token not like 'enc:v1:%';
