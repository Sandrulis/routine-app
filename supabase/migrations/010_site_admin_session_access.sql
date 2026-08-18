-- Site languages, translations and settings: session access for admins.
-- Writes no longer depend on SUPABASE_SERVICE_ROLE_KEY (needed only for Auth admin APIs).
-- Public SELECT so landing/i18n overlay works without service role.

grant select on table public.site_languages to anon, authenticated;
grant insert, update, delete on table public.site_languages to authenticated;

grant select on table public.site_translations to anon, authenticated;
grant insert, update, delete on table public.site_translations to authenticated;

grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

drop policy if exists "site_languages deny client access" on public.site_languages;
drop policy if exists site_languages_select on public.site_languages;
create policy site_languages_select
  on public.site_languages
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_languages_insert_admin on public.site_languages;
create policy site_languages_insert_admin
  on public.site_languages
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists site_languages_update_admin on public.site_languages;
create policy site_languages_update_admin
  on public.site_languages
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_languages_delete_admin on public.site_languages;
create policy site_languages_delete_admin
  on public.site_languages
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "site_translations deny client access" on public.site_translations;
drop policy if exists site_translations_select on public.site_translations;
create policy site_translations_select
  on public.site_translations
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_translations_insert_admin on public.site_translations;
create policy site_translations_insert_admin
  on public.site_translations
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists site_translations_update_admin on public.site_translations;
create policy site_translations_update_admin
  on public.site_translations
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_translations_delete_admin on public.site_translations;
create policy site_translations_delete_admin
  on public.site_translations
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "site_settings deny client access" on public.site_settings;
drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_settings_insert_admin on public.site_settings;
create policy site_settings_insert_admin
  on public.site_settings
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists site_settings_update_admin on public.site_settings;
create policy site_settings_update_admin
  on public.site_settings
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_settings_delete_admin on public.site_settings;
create policy site_settings_delete_admin
  on public.site_settings
  for delete
  to authenticated
  using (public.current_user_is_admin());
