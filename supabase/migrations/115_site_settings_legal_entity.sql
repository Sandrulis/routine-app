-- Legal entity details for privacy policy (controller identification).

alter table public.site_settings
  add column if not exists legal_entity_name text not null default '',
  add column if not exists legal_entity_reg_no text not null default '',
  add column if not exists legal_entity_address text not null default '';
