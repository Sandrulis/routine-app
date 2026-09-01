-- Two earliest categories were stored with a single Latvian title under language_code = en.
-- Fill every site language, including the missing Latvian default rows.
-- Rows are skipped if the category is not present (empty databases).

insert into public.site_docs_category_translations (category_id, language_code, title)
select v.category_id::uuid, v.language_code, v.title
from (
  values
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'lv', $d129$Uzsākšana$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'en', $d129$Getting started$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'ru', $d129$Начало работы$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'de', $d129$Erste Schritte$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'fr', $d129$Démarrage$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'es', $d129$Primeros pasos$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'nl', $d129$Aan de slag$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'da', $d129$Kom godt i gang$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'no', $d129$Kom i gang$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'fi', $d129$Aloittaminen$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'pl', $d129$Pierwsze kroki$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'lt', $d129$Pradžia$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'et', $d129$Alustamine$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'it', $d129$Per iniziare$d129$),
    ('3112cbbc-d7d1-4e6d-8b5b-dc7f2a7b22f0', 'sv', $d129$Kom igång$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'lv', $d129$Komanda un lomas$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'en', $d129$Team and roles$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'ru', $d129$Команда и роли$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'de', $d129$Team und Rollen$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'fr', $d129$Équipe et rôles$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'es', $d129$Equipo y roles$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'nl', $d129$Team en rollen$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'da', $d129$Team og roller$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'no', $d129$Team og roller$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'fi', $d129$Tiimi ja roolit$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'pl', $d129$Zespół i role$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'lt', $d129$Komanda ir vaidmenys$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'et', $d129$Meeskond ja rollid$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'it', $d129$Team e ruoli$d129$),
    ('1dbf6400-d593-47f3-bd2d-7d68d780ccd4', 'sv', $d129$Team och roller$d129$)
) as v(category_id, language_code, title)
join public.site_docs_categories categories
  on categories.id = v.category_id::uuid
on conflict (category_id, language_code) do update
set title = excluded.title;
