-- Rename system owner role display label from Īpašnieks/Owner to Vadītājs/Leader.

update public.system_default_roles
set
  name = 'Vadītājs',
  labels = '{
    "lv": "Vadītājs",
    "en": "Leader",
    "ru": "Руководитель",
    "de": "Leiter",
    "fr": "Responsable",
    "es": "Responsable",
    "nl": "Leider",
    "da": "Leder",
    "no": "Leder",
    "fi": "Vetäjä",
    "pl": "Kierownik",
    "lt": "Vadovas",
    "et": "Juht",
    "it": "Responsabile",
    "sv": "Ledare"
  }'::jsonb
where slug = 'owner';

-- Existing team copies of the system owner role still named Owner / Īpašnieks / etc.
update public.team_roles
set name = 'Vadītājs'
where slug = 'owner'
  and is_system = true
  and name in (
    'Īpašnieks',
    'Owner',
    'Владелец',
    'Inhaber',
    'Inhaber:in',
    'Propriétaire',
    'Propietario',
    'Proprietario',
    'Eigenaar',
    'Ejer',
    'Eier',
    'Omistaja',
    'Właściciel',
    'Savininkas',
    'Omanik',
    'Ägare'
  );

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
      'Vadītājs',
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
