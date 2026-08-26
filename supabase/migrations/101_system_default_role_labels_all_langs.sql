-- System default role labels for all UI languages.
-- Also rename default member role from Biedrs/Member to Lietotājs/User.

update public.system_default_roles
set
  name = 'Īpašnieks',
  labels = '{
    "lv": "Īpašnieks",
    "en": "Owner",
    "ru": "Владелец",
    "de": "Inhaber",
    "fr": "Propriétaire",
    "es": "Propietario",
    "nl": "Eigenaar",
    "da": "Ejer",
    "no": "Eier",
    "fi": "Omistaja",
    "pl": "Właściciel",
    "lt": "Savininkas",
    "et": "Omanik",
    "it": "Proprietario",
    "sv": "Ägare"
  }'::jsonb
where slug = 'owner';

update public.system_default_roles
set
  name = 'Lietotājs',
  labels = '{
    "lv": "Lietotājs",
    "en": "User",
    "ru": "Пользователь",
    "de": "Nutzer",
    "fr": "Utilisateur",
    "es": "Usuario",
    "nl": "Gebruiker",
    "da": "Bruger",
    "no": "Bruker",
    "fi": "Käyttäjä",
    "pl": "Użytkownik",
    "lt": "Naudotojas",
    "et": "Kasutaja",
    "it": "Utente",
    "sv": "Användare"
  }'::jsonb
where slug = 'member';

-- Existing team copies of the system member role still named Biedrs/Member.
update public.team_roles
set name = 'Lietotājs'
where slug = 'member'
  and is_system = true
  and name in ('Biedrs', 'Member', 'Участник');

-- Keep seed fallbacks aligned for new teams.
create or replace function public.seed_default_team_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
  select
    'role-' || new.id || '-' || d.slug,
    new.id,
    d.slug,
    coalesce(nullif(trim(d.labels ->> 'lv'), ''), d.name),
    d.sort_order,
    case
      when d.slug in ('owner', 'member') then true
      else d.is_system
    end,
    d.permissions
  from public.system_default_roles as d
  order by d.sort_order, d.slug
  on conflict (team_id, slug) do nothing;

  if not exists (
    select 1 from public.team_roles as r where r.team_id = new.id and r.slug = 'owner'
  ) then
    insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
    values (
      'role-' || new.id || '-owner',
      new.id,
      'owner',
      'Īpašnieks',
      0,
      true,
      public.owner_role_permissions()
    )
    on conflict (team_id, slug) do nothing;
  end if;

  if not exists (
    select 1 from public.team_roles as r where r.team_id = new.id and r.slug = 'member'
  ) then
    insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
    values (
      'role-' || new.id || '-member',
      new.id,
      'member',
      'Lietotājs',
      1,
      true,
      public.member_role_permissions()
    )
    on conflict (team_id, slug) do nothing;
  end if;

  return new;
end;
$$;
