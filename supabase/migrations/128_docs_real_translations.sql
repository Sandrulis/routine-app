-- Replace placeholder (Latvian-copied) docs translations with real translations.
-- Latvian (default) rows are left unchanged. Shared article images are untouched.

insert into public.site_docs_category_translations (category_id, language_code, title)
values
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'en', $d128$Administration and customisation$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'en', $d128$Subtasks and progress$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'en', $d128$Security$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'en', $d128$Files and cloud integration$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'en', $d128$Gmail extension$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'en', $d128$Billing and plans$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'en', $d128$Notifications and calendar$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'en', $d128$Templates and automations$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'en', $d128$Lists, folders and tasks$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'en', $d128$Language and localisation$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'ru', $d128$Администрирование и настройка$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'ru', $d128$Подзадачи и прогресс$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'ru', $d128$Безопасность$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'ru', $d128$Файлы и облачная интеграция$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'ru', $d128$Расширение Gmail$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'ru', $d128$Биллинг и тарифы$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'ru', $d128$Уведомления и календарь$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'ru', $d128$Шаблоны и автоматизации$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'ru', $d128$Списки, папки и задачи$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'ru', $d128$Язык и локализация$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'de', $d128$Administration und Anpassung$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'de', $d128$Teilaufgaben und Fortschritt$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'de', $d128$Sicherheit$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'de', $d128$Dateien und Cloud-Integration$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'de', $d128$Gmail-Erweiterung$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'de', $d128$Abrechnung und Tarife$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'de', $d128$Benachrichtigungen und Kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'de', $d128$Vorlagen und Automatisierungen$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'de', $d128$Listen, Ordner und Aufgaben$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'de', $d128$Sprache und Lokalisierung$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'fr', $d128$Administration et personnalisation$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'fr', $d128$Sous-tâches et progression$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'fr', $d128$Sécurité$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'fr', $d128$Fichiers et intégration cloud$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'fr', $d128$Extension Gmail$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'fr', $d128$Facturation et offres$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'fr', $d128$Notifications et calendrier$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'fr', $d128$Modèles et automatisations$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'fr', $d128$Listes, dossiers et tâches$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'fr', $d128$Langue et localisation$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'es', $d128$Administración y personalización$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'es', $d128$Subtareas y progreso$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'es', $d128$Seguridad$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'es', $d128$Archivos e integración en la nube$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'es', $d128$Extensión de Gmail$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'es', $d128$Facturación y planes$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'es', $d128$Notificaciones y calendario$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'es', $d128$Plantillas y automatizaciones$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'es', $d128$Listas, carpetas y tareas$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'es', $d128$Idioma y localización$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'nl', $d128$Beheer en aanpassing$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'nl', $d128$Subtaken en voortgang$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'nl', $d128$Beveiliging$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'nl', $d128$Bestanden en cloudintegratie$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'nl', $d128$Gmail-extensie$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'nl', $d128$Abonnementen en plannen$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'nl', $d128$Meldingen en kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'nl', $d128$Sjablonen en automatiseringen$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'nl', $d128$Lijsten, mappen en taken$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'nl', $d128$Taal en lokalisatie$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'da', $d128$Administration og tilpasning$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'da', $d128$Underopgaver og fremdrift$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'da', $d128$Sikkerhed$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'da', $d128$Filer og cloudintegration$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'da', $d128$Gmail-udvidelse$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'da', $d128$Abonnementer og planer$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'da', $d128$Notifikationer og kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'da', $d128$Skabeloner og automatiseringer$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'da', $d128$Lister, mapper og opgaver$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'da', $d128$Sprog og lokalisering$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'no', $d128$Administrasjon og tilpasning$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'no', $d128$Underoppgaver og fremdrift$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'no', $d128$Sikkerhet$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'no', $d128$Filer og skyintegrasjon$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'no', $d128$Gmail-utvidelse$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'no', $d128$Abonnement og planer$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'no', $d128$Varsler og kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'no', $d128$Maler og automatiseringer$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'no', $d128$Lister, mapper og oppgaver$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'no', $d128$Språk og lokalisering$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'fi', $d128$Hallinta ja mukauttaminen$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'fi', $d128$Osatehtävät ja edistyminen$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'fi', $d128$Tietoturva$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'fi', $d128$Tiedostot ja pilvi-integraatio$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'fi', $d128$Gmail-laajennus$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'fi', $d128$Laskutus ja tilaussuunnitelmat$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'fi', $d128$Ilmoitukset ja kalenteri$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'fi', $d128$Mallit ja automaatiot$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'fi', $d128$Listat, kansiot ja tehtävät$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'fi', $d128$Kieli ja lokalisointi$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'pl', $d128$Administracja i dostosowywanie$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'pl', $d128$Podzadania i postęp$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'pl', $d128$Bezpieczeństwo$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'pl', $d128$Pliki i integracja z chmurą$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'pl', $d128$Rozszerzenie Gmail$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'pl', $d128$Subskrypcje i plany$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'pl', $d128$Powiadomienia i kalendarz$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'pl', $d128$Szablony i automatyzacje$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'pl', $d128$Listy, foldery i zadania$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'pl', $d128$Język i lokalizacja$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'lt', $d128$Administravimas ir pritaikymas$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'lt', $d128$Použduotys ir eiga$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'lt', $d128$Saugumas$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'lt', $d128$Failai ir debesijos integracija$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'lt', $d128$Gmail papildinys$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'lt', $d128$Atsiskaitymai ir planai$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'lt', $d128$Pranešimai ir kalendorius$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'lt', $d128$Šablonai ir automatizavimas$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'lt', $d128$Sąrašai, aplankai ir užduotys$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'lt', $d128$Kalba ir lokalizacija$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'et', $d128$Haldus ja kohandamine$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'et', $d128$Alamülesanded ja edenemine$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'et', $d128$Turvalisus$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'et', $d128$Failid ja pilveintegratsioon$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'et', $d128$Gmail'i laiendus$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'et', $d128$Arveldus ja plaanid$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'et', $d128$Teavitused ja kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'et', $d128$Mallid ja automaatika$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'et', $d128$Nimekirjad, kaustad ja ülesanded$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'et', $d128$Keel ja lokaliseerimine$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'it', $d128$Amministrazione e personalizzazione$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'it', $d128$Sottoattività e avanzamento$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'it', $d128$Sicurezza$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'it', $d128$File e integrazione cloud$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'it', $d128$Estensione Gmail$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'it', $d128$Fatturazione e piani$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'it', $d128$Notifiche e calendario$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'it', $d128$Modelli e automazioni$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'it', $d128$Liste, cartelle e attività$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'it', $d128$Lingua e localizzazione$d128$),
  ('8b42a8be-edb7-48c1-bf2b-41e8910fd896', 'sv', $d128$Administration och anpassning$d128$),
  ('4258b5ad-09c3-414c-90db-113f141382f9', 'sv', $d128$Deluppgifter och förlopp$d128$),
  ('25f6c94b-5afb-4bc9-a423-4082ff1f9980', 'sv', $d128$Säkerhet$d128$),
  ('9f0f8c37-6312-40af-bb37-b8e468a551bf', 'sv', $d128$Filer och molnintegration$d128$),
  ('b7d9d4c2-b479-4701-bc49-5493a1a664e2', 'sv', $d128$Gmail-tillägg$d128$),
  ('b65a9fc4-3be7-40ca-a94e-3166675faade', 'sv', $d128$Fakturering och planer$d128$),
  ('110fa71c-eb10-43b2-9d12-568a28869ad6', 'sv', $d128$Aviseringar och kalender$d128$),
  ('dfbd7d5f-fbf2-40cf-9004-d7030430e247', 'sv', $d128$Mallar och automatiseringar$d128$),
  ('5b261c76-ba04-4d2b-b1c8-dd34668af912', 'sv', $d128$Listor, mappar och uppgifter$d128$),
  ('463fbd94-bdaf-4c0b-a945-a268c6994baa', 'sv', $d128$Språk och lokalisering$d128$)
on conflict (category_id, language_code) do update
set title = excluded.title;

insert into public.site_docs_article_translations (article_id, language_code, title, slogan, content)
values
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'en', $d128$Subscription management$d128$, $d128$Monthly or yearly billing, invoices, cancellation.$d128$, $d128$On the team billing page you can see the current subscription status, choose between monthly and yearly billing, and pay through a secure Stripe checkout. If a paid seat is freed (a team user is removed), it stays available until the end of the current billing cycle instead of being lost immediately.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'en', $d128$Creating subtasks$d128$, $d128$Split a task into subtasks, each with its own status flow.$d128$, $d128$If a task has several steps that different people can do at different times, you can split it into subtasks. Each subtask has its own status flow, assignee, due date and attachments - it works like a small task inside the parent task.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'en', $d128$Archive$d128$, $d128$Archive completed and deleted tasks/folders, colour coding, restore.$d128$, $d128$Completed or deleted tasks, subtasks and folders do not disappear immediately. They go to the archive, separate from active work. Archived items are colour-coded by their last status so you can tell them apart quickly, and you can restore them to the active list at any time.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'en', $d128$Supported languages$d128$, $d128$Full list of UI and marketing translations (15 languages).$d128$, $d128${SYSTEM_NAME} interface and marketing content is fully translated into 15 languages, including Latvian, English and Russian. During development the system checks that no translation key or placeholder is missing in any supported language.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'en', $d128$Authentication$d128$, $d128$Email, Google sign-in, password requirements.$d128$, $d128${SYSTEM_NAME} supports sign-in with email and password, and with a Google account. Email registration and sign-in require a strong enough password and include a reset flow if it is forgotten.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'en', $d128$Automations$d128$, $d128$Rules that automatically apply a template to a new folder.$d128$, $d128$Automations let the system act on its own in set conditions. The available automation applies a chosen template to any new folder created in a specific list. Every new project folder then gets the full structure without repeating the setup by hand.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'en', $d128$Bot protection$d128$, $d128$Cloudflare Turnstile checks on registration and sign-in forms.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registration, sign-in and password reset forms are protected with Cloudflare Turnstile. It blocks automated, abusive account creation or sign-in attempts while staying unobtrusive for real users.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'en', $d128$Pricing model$d128$, $d128$The first seat is free; you pay for each extra team user.$d128$, $d128$The first team seat in {SYSTEM_NAME} (the owner seat) is always free. You only pay for each extra team user above the first seat. One person can use the system for free with no time limit; billing starts only when a real team is formed.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'en', $d128$Check List$d128$, $d128$A simple checklist inside a subtask; it must be 100% done before closing.$d128$, $d128$Inside a subtask you can add a simple checklist for smaller, quickly tickable steps that are not full subtasks. If the checklist is not fully done, the subtask cannot move to a closed or completed status group. Statuses then always reflect the real state of the work.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'en', $d128$Data encryption$d128$, $d128$Encryption of integration access tokens.$d128$, $d128$All integration credentials (for example Google Drive or other third-party auth tokens) are stored encrypted, not as plain text in the database. Even with direct database access, this sensitive data is not readable as-is.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'en', $d128$Date and time formats$d128$, $d128$Week start, date format/separator, 12/24-hour time.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Each user can set their preferred first day of the week, date format and separator, and choose 12- or 24-hour time. These personal settings override the system default set by the administrator.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'en', $d128$Two-factor authentication (MFA)$d128$, $d128$Set up TOTP in the profile.$d128$, $d128$Each user can optionally turn on two-factor authentication in their profile using TOTP (an authenticator app such as Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

When MFA is on, every sign-in also asks for a one-time code from the authenticator app, in addition to the password.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'en', $d128$Adding an email to a task$d128$, $d128$Import email text and attachments from Gmail; choose list, folder and task.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

From any email in Gmail, the extension can add it to a chosen task or subtask. The email body is saved as a text file, and you can pick attachments separately. When adding, you choose the exact destination through list, folder, task and subtask.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'en', $d128$Email templates$d128$, $d128$Edit registration, password reset and notification templates.$d128$, $d128$All emails the system sends automatically - registration confirmation, password reset, team invite and other system notices - are editable as HTML templates in the admin panel, each available in every supported system language.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'en', $d128$Early Bird offer$d128$, $d128$A limited number of discounted seats for the first customers.$d128$, $d128$The first customers get a limited number of discounted seats from a global Early Bird pool. While seats remain in that pool, a newly purchased seat automatically gets the discounted price. When a seat is unused and the subscription ends, it does not return to the pool.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'en', $d128$Sending a file by email$d128$, $d128$Send an attachment from the system to an email address and track delivery.$d128$, $d128$Any file on a subtask can be emailed to any address from the system, without opening a separate mail app.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

When sending, you can add a subject and message. The system shows delivery status (sent, delivered or failed) and keeps a full forwarding history, with the option to send again if delivery fails.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'en', $d128$File upload$d128$, $d128$Allowed file types, size limits, preview (PDF, images, txt).$d128$, $d128$You can attach files in the task tree, inside subtasks, and in a separate Files window at folder level.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

The administrator sets which file types may be uploaded (for example PDF, Word, Excel, DWG drawings, images or archives). The system shows a clear error if a file does not match. Images, PDF and text files can be previewed without leaving the system.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'en', $d128$File storage usage$d128$, $d128$Server vs cloud storage volume in the sidebar.$d128$, $d128$Above Settings in the sidebar you see total file storage use - files on the {SYSTEM_NAME} server and files in the connected cloud, counted separately. That makes it clear how much space different files take and helps you decide whether to move to cloud storage.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'en', $d128$Google Drive integration$d128$, $d128$Connect an account, save files to Drive automatically, rename and download.$d128$, $d128$When a team's Google Drive account is connected, newly uploaded files are saved to that Drive by default instead of the {SYSTEM_NAME} server. That lowers storage cost and keeps documents under your control.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

You can rename and download a file from the {SYSTEM_NAME} UI, and changes sync with Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'en', $d128$Install and connect$d128$, $d128$Install the extension and authorise the account.$d128$, $d128$The {SYSTEM_NAME} Gmail extension installs in Chrome, then asks you to connect it to your {SYSTEM_NAME} account through a secure auth flow.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

The extension has its own session, independent of the website sign-in, so signing out of the {SYSTEM_NAME} site does not disconnect the extension.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'en', $d128$Integration configuration$d128$, $d128$Set up Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$In the admin panel you configure all external services needed for full functionality in one place: Google and Microsoft OAuth sign-in, Resend for email, Stripe for billing, Sentry for error tracking and Umami for analytics. Each integration can be turned on or off, and related features depend on that setup (for example email sign-in does not work without a configured Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'en', $d128$Create a new subtask from an email$d128$, $d128$A modal to assign a person directly from Gmail.$d128$, $d128$If an email should become a new task, the extension can do that from Gmail. A modal lets you assign a person (live search by name) and attach email files.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'en', $d128$Calendar integration$d128$, $d128$Subscribe to an `.ics` feed in Google/Apple Calendar for due dates.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Tasks with due dates can appear in Google or Apple Calendar by subscribing to a personal `.ics` feed generated for your user. The feed updates when due dates change, so the calendar stays current without manual sync.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'en', $d128$Kanban-style drag and drop$d128$, $d128$A grouped table: drag between status groups to change status.$d128$, $d128$In the task table, statuses are grouped into columns or group headers. You change a task status by dragging it into another group, like a classic Kanban board. While dragging, a blue line shows where the task will land.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'en', $d128$Inviting team users$d128$, $d128$Email invites, accept/decline flow, resend the invite link.$d128$, $d128$You add people to a team by sending an invite to their email. If they already have a {SYSTEM_NAME} account, they get an in-app notification; if not, the invite link opens signup with the email pre-filled.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

The invite must be accepted or declined - nobody is added automatically. While it is pending, you can resend or revoke it, and you can copy the link to send it through another channel (not only email).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'en', $d128$Leaving a team and removing users$d128$, $d128$How a team user can leave, and how an owner removes users.$d128$, $d128$Any team user except the owner can leave the team at any time from their profile or the team page. An owner or a user with the right access can also remove others from the team. That permission is configured separately and is not available to the default user role. The owner cannot be removed, and cannot leave without transferring ownership.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'en', $d128$Creating an account$d128$, $d128$Sign up with email or Google; password rules and strength check.$d128$, $d128$You can create a {SYSTEM_NAME} account with email and password, or by signing in with Google. Email signup requires at least a medium-strength password and can generate a secure 16-character password that you can use or replace. With Google sign-in, first and last name come from the Google profile. After email signup you must confirm the address before using the system.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'en', $d128$Roles and access levels$d128$, $d128$Default system roles, custom roles, granular access (folders, archive, file upload, status changes).$d128$, $d128$Each team user has a role that defines what they may do, from basic user rights to full admin access.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roles can be set in detail: allow or deny folder creation, archive viewing, file upload on subtasks, status changes and other specific actions.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

The system ships with several default roles, and a team owner can also create custom roles with exactly the rights that team needs.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'en', $d128$Paid plan catalogue$d128$, $d128$Create plans, attach modules, set prices.$d128$, $d128$An administrator can create and manage the paid plan catalogue: price, available modules and user limits. Plans can be assigned to teams, and the system limits features to the team's active plan.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'en', $d128$Navigation overview$d128$, $d128$Sidebar tree (folders, lists, tasks), Home view, team switcher.$d128$, $d128$The left sidebar shows a tree of your folders, lists and tasks. You can expand, collapse and reorder it by dragging.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

At the top is a team switcher if you belong to more than one team. Home collects tasks assigned to you across lists so you see what to do each day. The user menu (top right) opens profile settings, notifications and sign-out.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'en', $d128$Unpaid subscription state$d128$, $d128$What happens to access if payment fails or is not renewed.$d128$, $d128$If a team's payment fails or the subscription is inactive, regular users see a limited, blurred view with a blocking message. The team owner sees a clear red warning banner with how to fix billing. Basic navigation, team switching and account settings stay available so the issue can be resolved without risking data loss.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'en', $d128$OneDrive integration$d128$, $d128$Same idea as Google Drive: connect and sync files.$d128$, $d128$Like Google Drive, Microsoft OneDrive can be connected as team-level file storage. After connecting, new files go to that OneDrive account, with the same convenience and control as the Google Drive setup.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'en', $d128$Notification settings$d128$, $d128$Grouped settings by category; old notifications are cleaned up automatically.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Notification types can be adjusted in a grouped settings window: task events, reminders and team events, each with its own on/off switch. Older read notifications are deleted after 30 days so the list stays readable.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'en', $d128$Notification types$d128$, $d128$Assignment, comments, files, status changes, team events.$d128$, $d128$

The system creates notifications for events that affect you: a task assigned to you, removed from you, a file added, a status change, or a new subtask under your watch. They appear on the bell icon with an unread count.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'en', $d128$Custom statuses in templates$d128$, $d128$Each template task can have its own set of statuses.$d128$, $d128$Each task inside a template can have a different status set from the list default. For example a production-stage task can use a different flow than a delivery-stage task.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Tasks with custom statuses are marked in the template so they are easy to spot.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'en', $d128$First list and task$d128$, $d128$Basic flow: create a list, add a task, change status.$d128$, $d128$A list is the basic work unit in {SYSTEM_NAME}. It holds tasks for one project, process or area. After creating a list you can add tasks, each with an assignee and a status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

You change a task status with one click or by dragging it between status groups in the table view.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

If a task is more complex, split it into subtasks, each with its own status flow.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'en', $d128$Creating your first team$d128$, $d128$How to create a team, invite the first users, and how the owner role works.$d128$, $d128$To start in {SYSTEM_NAME} you create or join a team. The product is built for shared work, not only personal use. When you create a team you become its owner with full access to features and settings. From there you invite colleagues, create the first lists and structure the work. One user with no other team users is free; adding a second person makes it a paid team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'en', $d128$Private lists$d128$, $d128$How to create a list visible only to selected team users.$d128$, $d128$A list can be made private so it does not show in the sidebar tree for users without direct access. That helps with sensitive information or a small subset of tasks not meant for the whole team. If an administrator turns this feature off for the whole system, existing private lists become visible inside the team.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'en', $d128$Template editor$d128$, $d128$Named templates with folders, tasks and subtasks; sequential entry.$d128$, $d128$At team level you can create reusable templates with a ready structure of folders, tasks and subtasks. That helps when similar projects start with the same work sequence.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

The template editor lets you add items in sequence and already assign a person and checklist items at template level.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'en', $d128$List access levels$d128$, $d128$Full edit / edit / comment / view only / no access, per list.$d128$, $d128$On top of the team role, each list can set an access level per user or role: full edit, edit, comment only, view only, or no access.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

For example one project lead can have full control of a list while other team users only view it. Effective access combines team-role rights with that list's settings.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'en', $d128$Lists and folder structure$d128$, $d128$Folders and subfolders to organise lists, tasks and files.$d128$, $d128${SYSTEM_NAME} organises work with folders and subfolders for lists, tasks and files - for example by project, client or department. In the sidebar tree you can drag items into a folder or out of it. The structure can be as deep as the organisation needs.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'en', $d128$Session management$d128$, $d128$Sign-in independent from the website account; session length.$d128$, $d128$The extension keeps its sign-in session locally in the browser for about 30 days, whether or not you are signed in to the {SYSTEM_NAME} site in the same tab. If the session is invalid, or you only signed out on the website, the extension notices and asks you to sign in again only when that is actually needed.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'en', $d128$Session handling$d128$, $d128$Remember me, session length, sign-out.$d128$, $d128$When signing in you can choose Remember me so the session stays after the browser is closed. Without that option the session ends when you close the browser. Signing out of the website does not affect the separate Gmail extension session, which stays active on its own.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'en', $d128$System modules$d128$, $d128$Turn features on or off (private lists, files, templates, automations, calendar, cloud integrations).$d128$, $d128$An administrator can turn system features on or off globally, for example private lists, file upload, checklists, automations, templates, calendar integration or cloud storage. A disabled module disappears from the user interface and the marketing page, so you control what is available in that install or paid plan.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'en', $d128$Derived status$d128$, $d128$How a parent task status/progress is calculated from subtasks.$d128$, $d128$For a task with subtasks, overall status and progress are calculated from those subtask statuses. The owner does not need to update the parent status by hand - it always reflects how many subtasks are done.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'en', $d128$Due dates and reminders$d128$, $d128$Start/due dates, relative labels (today/left/overdue), email reminders.$d128$, $d128$Each task and subtask can have a start date and a due date. The system shows a relative label (for example "today", "3 days left" or "2 days overdue") depending on the status group. If the administrator has enabled it, the system emails reminders about upcoming start or due dates.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'en', $d128$Task statuses$d128$, $d128$System status catalogue and custom statuses per list, including order.$d128$, $d128$Each list has a set of statuses for task stages, from the system default catalogue to fully custom statuses with their own name, colour and order.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Status order is set in list settings. It affects how tasks sort in views and how overall progress is calculated.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'en', $d128$Task history$d128$, $d128$Full change log (status, dates, assignees, files, moves).$d128$, $d128$Each task and subtask keeps a full change log: status changes, date changes, adding and removing assignees, title and description edits, moves between lists, and file and checklist changes. You can always see who changed what and when.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'en', $d128$Language choice$d128$, $d128$System default language, personal choice, guest language detection.$d128$, $d128$For a signed-in user the language is stored on the profile and used everywhere, on any device. For a guest it comes from a browser cookie, or if none exists, from the administrator's default language. You can change language at any time with the switcher, which shows flags and full language names.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'en', $d128$Buying seats$d128$, $d128$How to add paid seats; automatic purchase when inviting someone new.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
If you invite someone and the team has no free paid seat, the system offers to buy an extra seat before sending the invite. You can also buy seats in advance from the team billing page, choosing monthly or yearly billing.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'en', $d128$Brand customisation$d128$, $d128$System name, logo, favicon.$d128$, $d128$An administrator can set the system name and upload a logo and favicon. If no logo is uploaded, the system generates an avatar from the first letters of the name. These changes show everywhere: browser tab title, email templates and the public marketing page.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'ru', $d128$Управление подпиской$d128$, $d128$Ежемесячная или ежегодная оплата, счета, отмена.$d128$, $d128$На странице биллинга команды вы видите текущий статус подписки, можете выбрать ежемесячную или ежегодную оплату и оплатить через защищённый Stripe Checkout. Если оплаченное место освобождается (пользователя команды удалили), оно остаётся доступным до конца текущего расчётного периода, а не пропадает сразу.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'ru', $d128$Создание подзадач$d128$, $d128$Разделите задачу на подзадачи, у каждой свой поток статусов.$d128$, $d128$Если у задачи несколько шагов, которые разные люди могут выполнять в разное время, её можно разбить на подзадачи. У каждой подзадачи свой поток статусов, исполнитель, срок и вложения — она работает как небольшая задача внутри родительской.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'ru', $d128$Архив$d128$, $d128$Архив завершённых и удалённых задач и папок, цветовая кодировка, восстановление.$d128$, $d128$Завершённые или удалённые задачи, подзадачи и папки не исчезают сразу. Они попадают в архив, отдельно от активной работы. Архивные элементы окрашены по последнему статусу, чтобы их было легко отличить, и в любой момент их можно вернуть в активный список.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'ru', $d128$Поддерживаемые языки$d128$, $d128$Полный список переводов интерфейса и маркетинга (15 языков).$d128$, $d128$Интерфейс и маркетинговые материалы {SYSTEM_NAME} полностью переведены на 15 языков, включая латышский, английский и русский. Во время разработки система проверяет, что ни в одном поддерживаемом языке не отсутствует ключ перевода или подстановка.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'ru', $d128$Аутентификация$d128$, $d128$E-mail, вход через Google, требования к паролю.$d128$, $d128${SYSTEM_NAME} поддерживает вход по e-mail и паролю, а также через аккаунт Google. Регистрация и вход по e-mail требуют достаточно надёжного пароля и включают восстановление, если пароль забыт.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'ru', $d128$Автоматизации$d128$, $d128$Правила, которые автоматически применяют шаблон к новой папке.$d128$, $d128$Автоматизации позволяют системе самой действовать при заданных условиях. Доступная автоматизация применяет выбранный шаблон к любой новой папке, созданной в конкретном списке. Каждая новая папка проекта сразу получает полную структуру — без повторной ручной настройки.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'ru', $d128$Защита от ботов$d128$, $d128$Проверки Cloudflare Turnstile на формах регистрации и входа.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Формы регистрации, входа и сброса пароля защищены Cloudflare Turnstile. Это блокирует автоматическое злоупотребление при создании аккаунтов или входе и при этом почти незаметно для настоящих пользователей.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'ru', $d128$Модель тарификации$d128$, $d128$Первое место бесплатно; вы платите за каждого дополнительного пользователя команды.$d128$, $d128$Первое место в команде {SYSTEM_NAME} (место владельца) всегда бесплатно. Вы платите только за каждого дополнительного пользователя команды сверх первого места. Один человек может пользоваться системой бесплатно без ограничения по времени; биллинг начинается только когда появляется настоящая команда.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'ru', $d128$Check List$d128$, $d128$Простой чек-лист внутри подзадачи; он должен быть выполнен на 100 %, прежде чем её закрыть.$d128$, $d128$Внутри подзадачи можно добавить простой чек-лист для мелких, быстро отмечаемых шагов, которые не являются полноценными подзадачами. Если чек-лист выполнен не полностью, подзадачу нельзя перевести в группу закрытых или завершённых статусов. Тогда статусы всегда отражают реальное состояние работы.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'ru', $d128$Шифрование данных$d128$, $d128$Шифрование токенов доступа интеграций.$d128$, $d128$Все учётные данные интеграций (например Google Drive или другие сторонние токены авторизации) хранятся в зашифрованном виде, а не открытым текстом в базе. Даже при прямом доступе к базе эти чувствительные данные нельзя прочитать как есть.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'ru', $d128$Форматы даты и времени$d128$, $d128$Начало недели, формат и разделитель даты, 12- или 24-часовое время.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Каждый пользователь может задать предпочтительный первый день недели, формат и разделитель даты, а также выбрать 12- или 24-часовое время. Эти личные настройки перекрывают системный стандарт, заданный администратором.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'ru', $d128$Двухфакторная аутентификация (MFA)$d128$, $d128$Настройка TOTP в профиле.$d128$, $d128$Каждый пользователь может по желанию включить двухфакторную аутентификацию в профиле через TOTP (приложение-аутентификатор, например Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Когда MFA включена, при каждом входе дополнительно к паролю запрашивается одноразовый код из приложения-аутентификатора.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'ru', $d128$Добавление письма в задачу$d128$, $d128$Импорт текста письма и вложений из Gmail; выбор списка, папки и задачи.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Из любого письма в Gmail расширение может добавить его в выбранную задачу или подзадачу. Текст письма сохраняется как текстовый файл, вложения можно выбрать отдельно. При добавлении вы указываете точное место назначения: список, папку, задачу и подзадачу.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'ru', $d128$Шаблоны писем$d128$, $d128$Редактирование шаблонов регистрации, сброса пароля и уведомлений.$d128$, $d128$Все письма, которые система отправляет автоматически — подтверждение регистрации, сброс пароля, приглашение в команду и другие системные уведомления — можно править как HTML-шаблоны в панели администратора; каждый доступен на всех поддерживаемых языках системы.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'ru', $d128$Предложение Early Bird$d128$, $d128$Ограниченное число мест со скидкой для первых клиентов.$d128$, $d128$Первые клиенты получают ограниченное число мест со скидкой из общего пула Early Bird. Пока в пуле есть места, новое купленное место автоматически получает льготную цену. Если место не используется и подписка заканчивается, оно в пул не возвращается.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'ru', $d128$Отправка файла по e-mail$d128$, $d128$Отправьте вложение из системы на e-mail и отследите доставку.$d128$, $d128$Любой файл на подзадаче можно отправить с любого адреса из системы, не открывая отдельную почтовую программу.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

При отправке можно добавить тему и сообщение. Система показывает статус доставки (отправлено, доставлено или ошибка) и хранит полную историю пересылок, с возможностью отправить снова, если доставка не удалась.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'ru', $d128$Загрузка файлов$d128$, $d128$Разрешённые типы файлов, лимиты размера, предпросмотр (PDF, изображения, txt).$d128$, $d128$Файлы можно прикреплять в дереве задач, внутри подзадач и в отдельном окне «Файлы» на уровне папки.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Администратор задаёт, какие типы файлов можно загружать (например PDF, Word, Excel, чертежи DWG, изображения или архивы). Если файл не подходит, система показывает понятную ошибку. Изображения, PDF и текстовые файлы можно просматривать, не покидая систему.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'ru', $d128$Использование хранилища файлов$d128$, $d128$Объём на сервере и в облаке в боковой панели.$d128$, $d128$Над пунктом «Настройки» в боковой панели видно общее использование файлового хранилища — файлы на сервере {SYSTEM_NAME} и файлы в подключённом облаке считаются отдельно. Так понятно, сколько места занимают разные файлы, и проще решить, переносить ли их в облако.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'ru', $d128$Интеграция Google Drive$d128$, $d128$Подключите аккаунт, сохраняйте файлы в Drive автоматически, переименовывайте и скачивайте.$d128$, $d128$Когда аккаунт Google Drive команды подключён, новые загруженные файлы по умолчанию сохраняются в этот Drive, а не на сервер {SYSTEM_NAME}. Это снижает стоимость хранения и оставляет документы под вашим контролем.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Файл можно переименовать и скачать из интерфейса {SYSTEM_NAME}, изменения синхронизируются с Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'ru', $d128$Установка и подключение$d128$, $d128$Установите расширение и авторизуйте аккаунт.$d128$, $d128$Расширение {SYSTEM_NAME} для Gmail устанавливается в Chrome, затем предлагает подключить его к аккаунту {SYSTEM_NAME} через защищённый процесс авторизации.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

У расширения своя сессия, независимая от входа на сайте: выход с сайта {SYSTEM_NAME} не отключает расширение.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'ru', $d128$Настройка интеграций$d128$, $d128$Настройка Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$В панели администратора в одном месте настраиваются все внешние сервисы, нужные для полной работы: вход через Google и Microsoft OAuth, Resend для почты, Stripe для биллинга, Sentry для отслеживания ошибок и Umami для аналитики. Каждую интеграцию можно включать и выключать, связанные функции зависят от этой настройки (например вход по e-mail не работает без настроенного Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'ru', $d128$Новая подзадача из письма$d128$, $d128$Модальное окно, чтобы назначить человека прямо из Gmail.$d128$, $d128$Если письмо должно стать новой задачей, расширение может сделать это из Gmail. В модальном окне можно назначить человека (живой поиск по имени) и прикрепить файлы из письма.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'ru', $d128$Интеграция календаря$d128$, $d128$Подпишитесь на ленту `.ics` в Google/Apple Calendar, чтобы видеть сроки.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Задачи со сроками могут появляться в Google или Apple Calendar, если подписаться на персональную ленту `.ics`, созданную для вашего пользователя. Лента обновляется при изменении сроков, поэтому календарь остаётся актуальным без ручной синхронизации.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'ru', $d128$Перетаскивание в стиле Kanban$d128$, $d128$Сгруппированная таблица: перетащите между группами статусов, чтобы сменить статус.$d128$, $d128$В таблице задач статусы сгруппированы в колонки или заголовки групп. Статус задачи меняется перетаскиванием в другую группу, как на классической доске Kanban. Во время перетаскивания синяя линия показывает, куда задача попадёт.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'ru', $d128$Приглашение пользователей команды$d128$, $d128$Приглашения по e-mail, принятие или отказ, повторная отправка ссылки.$d128$, $d128$Людей в команду добавляют, отправляя приглашение на e-mail. Если у них уже есть аккаунт {SYSTEM_NAME}, они получают уведомление в приложении; если нет, ссылка приглашения открывает регистрацию с заранее заполненным адресом.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Приглашение нужно принять или отклонить — никто не добавляется автоматически. Пока оно в ожидании, его можно отправить повторно или отозвать, а ссылку скопировать и передать другим каналом (не только по почте).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'ru', $d128$Выход из команды и удаление пользователей$d128$, $d128$Как пользователь команды может выйти и как владелец удаляет пользователей.$d128$, $d128$Любой пользователь команды, кроме владельца, может в любой момент выйти из команды в профиле или на странице команды. Владелец или пользователь с нужным правом может также удалить других из команды. Это право настраивается отдельно и недоступно роли пользователя по умолчанию. Владельца нельзя удалить, и он не может уйти, не передав владение.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'ru', $d128$Создание аккаунта$d128$, $d128$Регистрация по e-mail или Google; правила пароля и проверка надёжности.$d128$, $d128$Аккаунт {SYSTEM_NAME} можно создать с e-mail и паролем или войти через Google. Для регистрации по e-mail нужен пароль хотя бы средней надёжности; система может сгенерировать безопасный пароль из 16 символов, который можно использовать или заменить. При входе через Google имя и фамилия берутся из профиля Google. После регистрации по e-mail нужно подтвердить адрес, прежде чем пользоваться системой.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'ru', $d128$Роли и уровни доступа$d128$, $d128$Системные роли по умолчанию, свои роли, детальный доступ (папки, архив, загрузка файлов, смена статусов).$d128$, $d128$У каждого пользователя команды есть роль, которая определяет, что ему можно делать — от базовых прав пользователя до полного доступа администратора.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Роли можно настроить подробно: разрешить или запретить создание папок, просмотр архива, загрузку файлов в подзадачи, смену статусов и другие конкретные действия.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

В системе есть несколько ролей по умолчанию, а владелец команды может создавать собственные роли ровно с теми правами, которые нужны команде.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'ru', $d128$Каталог платных тарифов$d128$, $d128$Создавайте тарифы, подключайте модули, задавайте цены.$d128$, $d128$Администратор может создавать и вести каталог платных тарифов: цена, доступные модули и лимиты пользователей. Тарифы можно назначать командам, и система ограничивает функции активным тарифом команды.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'ru', $d128$Обзор навигации$d128$, $d128$Дерево в боковой панели (папки, списки, задачи), вид «Главная», переключатель команд.$d128$, $d128$Левая боковая панель показывает дерево ваших папок, списков и задач. Его можно разворачивать, сворачивать и менять порядок перетаскиванием.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Сверху есть переключатель команд, если вы состоите в нескольких. «Главная» собирает назначенные вам задачи из разных списков, чтобы было видно, что делать каждый день. Меню пользователя (справа сверху) открывает настройки профиля, уведомления и выход.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'ru', $d128$Состояние неоплаченной подписки$d128$, $d128$Что происходит с доступом, если оплата не прошла или подписка не продлена.$d128$, $d128$Если оплата команды не проходит или подписка неактивна, обычные пользователи видят ограниченный, размытый интерфейс с блокирующим сообщением. Владелец команды видит явную красную предупреждающую полосу с подсказкой, как исправить биллинг. Базовая навигация, переключение команд и настройки аккаунта остаются доступны, чтобы проблему можно было решить без риска потери данных.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'ru', $d128$Интеграция OneDrive$d128$, $d128$Та же идея, что у Google Drive: подключить и синхронизировать файлы.$d128$, $d128$Как и Google Drive, Microsoft OneDrive можно подключить как файловое хранилище команды. После подключения новые файлы попадают в этот аккаунт OneDrive — с тем же удобством и контролем, что при настройке Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'ru', $d128$Настройки уведомлений$d128$, $d128$Сгруппированные настройки по категориям; старые уведомления очищаются автоматически.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Типы уведомлений настраиваются в сгруппированном окне: события задач, напоминания и события команды — у каждого свой переключатель. Прочитанные уведомления старше 30 дней удаляются, чтобы список оставался читаемым.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'ru', $d128$Типы уведомлений$d128$, $d128$Назначение, комментарии, файлы, смена статуса, события команды.$d128$, $d128$

Система создаёт уведомления о событиях, которые вас касаются: задачу назначили вам, сняли с вас, добавили файл, сменили статус или появилась новая подзадача под вашим контролем. Они отображаются на значке колокольчика со счётчиком непрочитанных.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'ru', $d128$Свои статусы в шаблонах$d128$, $d128$У каждой задачи шаблона может быть свой набор статусов.$d128$, $d128$У каждой задачи внутри шаблона может быть набор статусов, отличный от стандартного для списка. Например, задача этапа производства может идти по другому потоку, чем задача этапа поставки.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Задачи с собственными статусами помечены в шаблоне, чтобы их было легко заметить.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'ru', $d128$Первый список и задача$d128$, $d128$Базовый поток: создать список, добавить задачу, сменить статус.$d128$, $d128$Список — основная единица работы в {SYSTEM_NAME}. В нём лежат задачи одного проекта, процесса или направления. После создания списка можно добавлять задачи, у каждой — исполнитель и статус.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Статус задачи меняется одним щелчком или перетаскиванием между группами статусов в табличном виде.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Если задача сложнее, разбейте её на подзадачи — у каждой свой поток статусов.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'ru', $d128$Создание первой команды$d128$, $d128$Как создать команду, пригласить первых пользователей и как работает роль владельца.$d128$, $d128$Чтобы начать работу в {SYSTEM_NAME}, создайте команду или вступите в неё. Продукт рассчитан на совместную работу, а не только на личное использование. Когда вы создаёте команду, вы становитесь её владельцем с полным доступом к функциям и настройкам. Дальше приглашаете коллег, создаёте первые списки и выстраиваете работу. Один пользователь без других пользователей команды — бесплатно; добавление второго человека делает команду платной.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'ru', $d128$Приватные списки$d128$, $d128$Как создать список, видимый только выбранным пользователям команды.$d128$, $d128$Список можно сделать приватным, чтобы он не показывался в дереве боковой панели пользователям без прямого доступа. Это помогает со скрытой информацией или небольшой частью задач, которые не предназначены всей команде. Если администратор отключает эту возможность для всей системы, существующие приватные списки становятся видимыми внутри команды.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'ru', $d128$Редактор шаблонов$d128$, $d128$Именованные шаблоны с папками, задачами и подзадачами; последовательный ввод.$d128$, $d128$На уровне команды можно создавать повторно используемые шаблоны с готовой структурой папок, задач и подзадач. Это помогает, когда похожие проекты начинаются с одной и той же последовательности работ.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Редактор шаблонов позволяет добавлять элементы по очереди и уже на уровне шаблона назначать человека и пункты чек-листа.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'ru', $d128$Уровни доступа к списку$d128$, $d128$Полное редактирование / редактирование / комментарии / только просмотр / без доступа — для каждого списка.$d128$, $d128$Поверх роли в команде у каждого списка можно задать уровень доступа для пользователя или роли: полное редактирование, редактирование, только комментарии, только просмотр или без доступа.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Например, руководитель проекта может полностью управлять списком, а остальные пользователи команды — только просматривать. Фактический доступ складывается из прав роли в команде и настроек этого списка.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'ru', $d128$Списки и структура папок$d128$, $d128$Папки и подпапки, чтобы организовать списки, задачи и файлы.$d128$, $d128${SYSTEM_NAME} организует работу папками и подпапками для списков, задач и файлов — например по проекту, клиенту или отделу. В дереве боковой панели элементы можно перетащить в папку или из неё. Структура может быть такой глубокой, как нужно организации.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'ru', $d128$Управление сессией$d128$, $d128$Вход независим от аккаунта на сайте; длительность сессии.$d128$, $d128$Расширение хранит сессию входа локально в браузере около 30 дней — независимо от того, выполнен ли вход на сайте {SYSTEM_NAME} в той же вкладке. Если сессия недействительна или вы вышли только с сайта, расширение это замечает и просит войти снова только когда это действительно нужно.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'ru', $d128$Обработка сессии$d128$, $d128$«Запомнить меня», длительность сессии, выход.$d128$, $d128$При входе можно выбрать «Запомнить меня», чтобы сессия сохранялась после закрытия браузера. Без этой опции сессия заканчивается, когда вы закрываете браузер. Выход с сайта не затрагивает отдельную сессию расширения Gmail — она остаётся активной сама по себе.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'ru', $d128$Системные модули$d128$, $d128$Включение и отключение функций (приватные списки, файлы, шаблоны, автоматизации, календарь, облачные интеграции).$d128$, $d128$Администратор может глобально включать и выключать функции системы, например приватные списки, загрузку файлов, чек-листы, автоматизации, шаблоны, интеграцию календаря или облачное хранилище. Отключённый модуль исчезает из интерфейса и с маркетинговой страницы, так что вы контролируете, что доступно в этой установке или платном тарифе.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'ru', $d128$Производный статус$d128$, $d128$Как статус и прогресс родительской задачи считаются из подзадач.$d128$, $d128$Для задачи с подзадачами общий статус и прогресс считаются по статусам этих подзадач. Владельцу не нужно вручную обновлять статус родителя — он всегда отражает, сколько подзадач выполнено.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'ru', $d128$Сроки и напоминания$d128$, $d128$Даты начала и срока, относительные подписи (сегодня / осталось / просрочено), напоминания по e-mail.$d128$, $d128$У каждой задачи и подзадачи могут быть дата начала и срок. Система показывает относительную подпись (например «сегодня», «осталось 3 дня» или «просрочено на 2 дня») в зависимости от группы статусов. Если администратор включил эту возможность, система отправляет напоминания по e-mail о ближайших датах начала или срока.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'ru', $d128$Статусы задач$d128$, $d128$Системный каталог статусов и свои статусы для каждого списка, включая порядок.$d128$, $d128$У каждого списка есть набор статусов для этапов задачи — от системного каталога по умолчанию до полностью своих статусов с названием, цветом и порядком.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Порядок статусов задаётся в настройках списка. Он влияет на сортировку задач в видах и на расчёт общего прогресса.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'ru', $d128$История задачи$d128$, $d128$Полный журнал изменений (статус, даты, исполнители, файлы, перемещения).$d128$, $d128$У каждой задачи и подзадачи ведётся полный журнал изменений: смена статуса, дат, добавление и снятие исполнителей, правки названия и описания, перемещения между списками, изменения файлов и чек-листа. Всегда видно, кто что и когда изменил.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'ru', $d128$Выбор языка$d128$, $d128$Язык системы по умолчанию, личный выбор, определение языка гостя.$d128$, $d128$Для вошедшего пользователя язык хранится в профиле и используется везде, на любом устройстве. Для гостя он берётся из cookie браузера, а если его нет — из языка по умолчанию администратора. Язык можно сменить в любой момент переключателем, который показывает флаги и полные названия языков.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'ru', $d128$Покупка мест$d128$, $d128$Как добавить платные места; автоматическая покупка при приглашении нового человека.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Если вы приглашаете кого-то, а в команде нет свободного оплаченного места, система предлагает купить дополнительное место до отправки приглашения. Места можно также купить заранее на странице биллинга команды, выбрав ежемесячную или ежегодную оплату.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'ru', $d128$Настройка бренда$d128$, $d128$Название системы, логотип, favicon.$d128$, $d128$Администратор может задать название системы и загрузить логотип и favicon. Если логотип не загружен, система генерирует аватар из первых букв названия. Эти изменения видны везде: в заголовке вкладки браузера, в шаблонах писем и на публичной маркетинговой странице.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'de', $d128$Abonnementverwaltung$d128$, $d128$Monatliche oder jährliche Abrechnung, Rechnungen, Kündigung.$d128$, $d128$Auf der Abrechnungsseite des Teams sehen Sie den aktuellen Abonnementstatus, können zwischen monatlicher und jährlicher Abrechnung wählen und über einen sicheren Stripe Checkout bezahlen. Wird ein bezahlter Platz frei (ein Teamnutzer wird entfernt), bleibt er bis zum Ende des aktuellen Abrechnungszeitraums verfügbar, statt sofort verloren zu gehen.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'de', $d128$Teilaufgaben erstellen$d128$, $d128$Eine Aufgabe in Teilaufgaben mit eigenem Statusfluss aufteilen.$d128$, $d128$Hat eine Aufgabe mehrere Schritte, die verschiedene Personen zu unterschiedlichen Zeiten erledigen können, teilen Sie sie in Teilaufgaben. Jede Teilaufgabe hat eigenen Statusfluss, zuständige Person, Fälligkeitsdatum und Anhänge — sie funktioniert wie eine kleine Aufgabe innerhalb der übergeordneten Aufgabe.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'de', $d128$Archiv$d128$, $d128$Archiv abgeschlossener und gelöschter Aufgaben/Ordner, Farbcodierung, Wiederherstellen.$d128$, $d128$Abgeschlossene oder gelöschte Aufgaben, Teilaufgaben und Ordner verschwinden nicht sofort. Sie gelangen ins Archiv, getrennt von der aktiven Arbeit. Archivierte Elemente sind nach ihrem letzten Status farbcodiert, damit Sie sie schnell unterscheiden können, und Sie können sie jederzeit in die aktive Liste zurückholen.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'de', $d128$Unterstützte Sprachen$d128$, $d128$Vollständige Liste der UI- und Marketingübersetzungen (15 Sprachen).$d128$, $d128$Oberfläche und Marketinginhalte von {SYSTEM_NAME} sind vollständig in 15 Sprachen übersetzt, darunter Lettisch, Englisch und Russisch. Während der Entwicklung prüft das System, dass in keiner unterstützten Sprache ein Übersetzungsschlüssel oder Platzhalter fehlt.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'de', $d128$Authentifizierung$d128$, $d128$E-Mail, Google-Anmeldung, Passwortanforderungen.$d128$, $d128${SYSTEM_NAME} unterstützt die Anmeldung mit E-Mail und Passwort sowie mit einem Google-Konto. E-Mail-Registrierung und -Anmeldung verlangen ein ausreichend starkes Passwort und bieten einen Zurücksetzungsablauf, falls es vergessen wird.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'de', $d128$Automatisierungen$d128$, $d128$Regeln, die automatisch eine Vorlage auf einen neuen Ordner anwenden.$d128$, $d128$Automatisierungen lassen das System unter festgelegten Bedingungen selbst handeln. Die verfügbare Automatisierung wendet eine gewählte Vorlage auf jeden neuen Ordner an, der in einer bestimmten Liste erstellt wird. Jeder neue Projektordner erhält dann die vollständige Struktur, ohne die Einrichtung von Hand zu wiederholen.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'de', $d128$Bot-Schutz$d128$, $d128$Cloudflare Turnstile-Prüfungen auf Registrierungs- und Anmeldeformularen.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registrierungs-, Anmelde- und Passwort-Zurücksetzungsformulare sind mit Cloudflare Turnstile geschützt. Es blockiert automatisierte, missbräuchliche Kontoerstellungen oder Anmeldeversuche und bleibt für echte Nutzer unauffällig.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'de', $d128$Preismodell$d128$, $d128$Der erste Platz ist kostenlos; Sie zahlen für jeden weiteren Teamnutzer.$d128$, $d128$Der erste Teamplatz in {SYSTEM_NAME} (der Inhaberplatz) ist immer kostenlos. Sie zahlen nur für jeden weiteren Teamnutzer über den ersten Platz hinaus. Eine Person kann das System zeitlich unbegrenzt kostenlos nutzen; die Abrechnung beginnt erst, wenn ein echtes Team entsteht.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'de', $d128$Check List$d128$, $d128$Eine einfache Checkliste in einer Teilaufgabe; sie muss zu 100 % erledigt sein, bevor Sie schließen.$d128$, $d128$In einer Teilaufgabe können Sie eine einfache Checkliste für kleinere, schnell abhakbare Schritte hinzufügen, die keine vollständigen Teilaufgaben sind. Ist die Checkliste nicht vollständig erledigt, kann die Teilaufgabe nicht in eine geschlossene oder abgeschlossene Statusgruppe wechseln. Statuswerte spiegeln dann immer den tatsächlichen Arbeitsstand wider.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'de', $d128$Datenverschlüsselung$d128$, $d128$Verschlüsselung von Integrations-Zugriffstoken.$d128$, $d128$Alle Integrationszugangsdaten (zum Beispiel Google Drive oder andere Drittanbieter-Auth-Token) werden verschlüsselt gespeichert, nicht als Klartext in der Datenbank. Selbst bei direktem Datenbankzugriff sind diese sensiblen Daten nicht einfach lesbar.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'de', $d128$Datums- und Zeitformate$d128$, $d128$Wochenbeginn, Datumsformat/Trennzeichen, 12-/24-Stunden-Zeit.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Jede Nutzerin und jeder Nutzer kann den bevorzugten ersten Wochentag, Datumsformat und Trennzeichen festlegen und zwischen 12- und 24-Stunden-Zeit wählen. Diese persönlichen Einstellungen überschreiben die vom Administrator gesetzte Systemvorgabe.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'de', $d128$Zwei-Faktor-Authentifizierung (MFA)$d128$, $d128$TOTP im Profil einrichten.$d128$, $d128$Jede Nutzerin und jeder Nutzer kann optional die Zwei-Faktor-Authentifizierung im Profil mit TOTP aktivieren (eine Authenticator-App wie Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Ist MFA aktiv, verlangt jede Anmeldung zusätzlich zum Passwort einen Einmalcode aus der Authenticator-App.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'de', $d128$Eine E-Mail zu einer Aufgabe hinzufügen$d128$, $d128$E-Mail-Text und Anhänge aus Gmail importieren; Liste, Ordner und Aufgabe wählen.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Aus jeder E-Mail in Gmail kann die Erweiterung sie einer gewählten Aufgabe oder Teilaufgabe hinzufügen. Der E-Mail-Text wird als Textdatei gespeichert, Anhänge wählen Sie getrennt. Beim Hinzufügen bestimmen Sie das genaue Ziel über Liste, Ordner, Aufgabe und Teilaufgabe.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'de', $d128$E-Mail-Vorlagen$d128$, $d128$Vorlagen für Registrierung, Passwortzurücksetzung und Benachrichtigungen bearbeiten.$d128$, $d128$Alle E-Mails, die das System automatisch sendet — Registrierungsbestätigung, Passwortzurücksetzung, Teameinladung und andere Systemhinweise — sind als HTML-Vorlagen im Admin-Bereich bearbeitbar, jeweils in jeder unterstützten Systemsprache.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'de', $d128$Early Bird-Angebot$d128$, $d128$Eine begrenzte Zahl rabattierter Plätze für die ersten Kundinnen und Kunden.$d128$, $d128$Die ersten Kundinnen und Kunden erhalten eine begrenzte Zahl rabattierter Plätze aus einem globalen Early Bird-Pool. Solange Plätze in diesem Pool bleiben, erhält ein neu gekaufter Platz automatisch den rabattierten Preis. Wird ein Platz nicht genutzt und das Abonnement endet, kehrt er nicht in den Pool zurück.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'de', $d128$Eine Datei per E-Mail senden$d128$, $d128$Einen Anhang aus dem System an eine E-Mail-Adresse senden und die Zustellung verfolgen.$d128$, $d128$Jede Datei an einer Teilaufgabe kann aus dem System an jede Adresse per E-Mail gesendet werden, ohne eine separate Mail-App zu öffnen.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Beim Senden können Sie Betreff und Nachricht ergänzen. Das System zeigt den Zustellstatus (gesendet, zugestellt oder fehlgeschlagen) und behält eine vollständige Weiterleitungshistorie, mit der Option, erneut zu senden, wenn die Zustellung fehlschlägt.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'de', $d128$Datei-Upload$d128$, $d128$Erlaubte Dateitypen, Größenlimits, Vorschau (PDF, Bilder, txt).$d128$, $d128$Sie können Dateien im Aufgabenbaum, in Teilaufgaben und in einem eigenen Dateien-Fenster auf Ordnerebene anhängen.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Der Administrator legt fest, welche Dateitypen hochgeladen werden dürfen (zum Beispiel PDF, Word, Excel, DWG-Zeichnungen, Bilder oder Archive). Das System zeigt eine klare Fehlermeldung, wenn eine Datei nicht passt. Bilder, PDF und Textdateien können Sie ohne Verlassen des Systems in der Vorschau ansehen.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'de', $d128$Speichernutzung für Dateien$d128$, $d128$Server- vs. Cloud-Speichervolumen in der Seitenleiste.$d128$, $d128$Über Einstellungen in der Seitenleiste sehen Sie die gesamte Dateispeichernutzung — Dateien auf dem {SYSTEM_NAME}-Server und Dateien in der verbundenen Cloud, getrennt gezählt. So ist klar, wie viel Platz unterschiedliche Dateien brauchen, und Sie können besser entscheiden, ob Sie in den Cloud-Speicher wechseln.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'de', $d128$Google Drive-Integration$d128$, $d128$Konto verbinden, Dateien automatisch in Drive speichern, umbenennen und herunterladen.$d128$, $d128$Ist das Google Drive-Konto eines Teams verbunden, werden neu hochgeladene Dateien standardmäßig in diesem Drive gespeichert statt auf dem {SYSTEM_NAME}-Server. Das senkt Speicherkosten und hält Dokumente unter Ihrer Kontrolle.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Sie können eine Datei in der {SYSTEM_NAME}-Oberfläche umbenennen und herunterladen; Änderungen werden mit Drive synchronisiert.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'de', $d128$Installieren und verbinden$d128$, $d128$Die Erweiterung installieren und das Konto autorisieren.$d128$, $d128$Die {SYSTEM_NAME}-Gmail-Erweiterung wird in Chrome installiert und fordert Sie dann auf, sie über einen sicheren Auth-Ablauf mit Ihrem {SYSTEM_NAME}-Konto zu verbinden.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Die Erweiterung hat eine eigene Sitzung, unabhängig von der Website-Anmeldung. Eine Abmeldung von der {SYSTEM_NAME}-Website trennt die Erweiterung nicht.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'de', $d128$Integrationskonfiguration$d128$, $d128$Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami einrichten.$d128$, $d128$Im Admin-Bereich konfigurieren Sie alle externen Dienste für den vollen Funktionsumfang an einem Ort: Google- und Microsoft OAuth-Anmeldung, Resend für E-Mail, Stripe für die Abrechnung, Sentry für Fehlerverfolgung und Umami für Analysen. Jede Integration lässt sich ein- oder ausschalten, abhängige Funktionen folgen dieser Einrichtung (zum Beispiel funktioniert die E-Mail-Anmeldung ohne konfiguriertes Resend nicht).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'de', $d128$Eine neue Teilaufgabe aus einer E-Mail erstellen$d128$, $d128$Ein Modal, um direkt aus Gmail eine Person zuzuweisen.$d128$, $d128$Soll eine E-Mail eine neue Aufgabe werden, kann die Erweiterung das aus Gmail erledigen. Ein Modal lässt Sie eine Person zuweisen (Live-Suche nach Namen) und E-Mail-Dateien anhängen.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'de', $d128$Kalenderintegration$d128$, $d128$Ein `.ics`-Feed in Google/Apple Calendar abonnieren, um Fälligkeitsdaten zu sehen.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Aufgaben mit Fälligkeitsdaten können in Google oder Apple Calendar erscheinen, indem Sie einen persönlichen `.ics`-Feed abonnieren, der für Ihr Nutzerkonto erzeugt wird. Der Feed aktualisiert sich, wenn sich Fälligkeitsdaten ändern, sodass der Kalender ohne manuelle Synchronisierung aktuell bleibt.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'de', $d128$Drag-and-Drop im Kanban-Stil$d128$, $d128$Eine gruppierte Tabelle: Ziehen zwischen Statusgruppen ändert den Status.$d128$, $d128$In der Aufgabentabelle sind Status in Spalten oder Gruppenüberschriften gebündelt. Sie ändern den Aufgabenstatus, indem Sie die Aufgabe in eine andere Gruppe ziehen — wie auf einem klassischen Kanban-Board. Während des Ziehens zeigt eine blaue Linie, wo die Aufgabe landen wird.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'de', $d128$Teamnutzer einladen$d128$, $d128$E-Mail-Einladungen, Annehmen/Ablehnen, Einladungslink erneut senden.$d128$, $d128$Sie nehmen Personen ins Team auf, indem Sie eine Einladung an ihre E-Mail senden. Haben sie bereits ein {SYSTEM_NAME}-Konto, erhalten sie eine In-App-Benachrichtigung; andernfalls öffnet der Einladungslink die Registrierung mit vorausgefüllter E-Mail.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Die Einladung muss angenommen oder abgelehnt werden — niemand wird automatisch hinzugefügt. Solange sie aussteht, können Sie sie erneut senden oder widerrufen und den Link kopieren, um ihn über einen anderen Kanal zu schicken (nicht nur per E-Mail).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'de', $d128$Ein Team verlassen und Nutzer entfernen$d128$, $d128$Wie ein Teamnutzer das Team verlässt und wie ein Inhaber Nutzer entfernt.$d128$, $d128$Jeder Teamnutzer außer dem Inhaber kann das Team jederzeit über Profil oder Teamseite verlassen. Ein Inhaber oder ein Nutzer mit dem passenden Recht kann andere auch aus dem Team entfernen. Diese Berechtigung wird getrennt konfiguriert und steht der Standardnutzerrolle nicht zur Verfügung. Der Inhaber kann nicht entfernt werden und kann nicht gehen, ohne das Eigentum zu übertragen.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'de', $d128$Ein Konto erstellen$d128$, $d128$Mit E-Mail oder Google registrieren; Passwortregeln und Stärkenprüfung.$d128$, $d128$Sie können ein {SYSTEM_NAME}-Konto mit E-Mail und Passwort anlegen oder sich mit Google anmelden. Die E-Mail-Registrierung verlangt mindestens ein mittelschweres Passwort und kann ein sicheres 16-Zeichen-Passwort erzeugen, das Sie nutzen oder ersetzen. Bei Google-Anmeldung kommen Vor- und Nachname aus dem Google-Profil. Nach der E-Mail-Registrierung müssen Sie die Adresse bestätigen, bevor Sie das System nutzen.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'de', $d128$Rollen und Zugriffsebenen$d128$, $d128$Standard-Systemrollen, eigene Rollen, granularer Zugriff (Ordner, Archiv, Datei-Upload, Statusänderungen).$d128$, $d128$Jeder Teamnutzer hat eine Rolle, die festlegt, was erlaubt ist — von grundlegenden Nutzerrechten bis zum vollen Admin-Zugriff.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Rollen lassen sich im Detail festlegen: Ordnererstellung, Archivansicht, Datei-Upload an Teilaufgaben, Statusänderungen und andere konkrete Aktionen erlauben oder verweigern.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Das System bringt mehrere Standardrollen mit, und ein Teaminhaber kann auch eigene Rollen mit genau den Rechten anlegen, die das Team braucht.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'de', $d128$Katalog der kostenpflichtigen Pläne$d128$, $d128$Pläne anlegen, Module zuordnen, Preise festlegen.$d128$, $d128$Ein Administrator kann den Katalog kostenpflichtiger Pläne anlegen und verwalten: Preis, verfügbare Module und Nutzerlimits. Pläne können Teams zugewiesen werden; das System begrenzt Funktionen auf den aktiven Plan des Teams.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'de', $d128$Navigationsüberblick$d128$, $d128$Seitenleistenbaum (Ordner, Listen, Aufgaben), Home-Ansicht, Teamumschalter.$d128$, $d128$Die linke Seitenleiste zeigt einen Baum Ihrer Ordner, Listen und Aufgaben. Sie können ihn aufklappen, zuklappen und per Ziehen neu ordnen.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Oben gibt es einen Teamumschalter, wenn Sie mehreren Teams angehören. Home sammelt Ihnen zugewiesene Aufgaben über Listen hinweg, damit Sie sehen, was jeden Tag ansteht. Das Nutzermenü (oben rechts) öffnet Profileinstellungen, Benachrichtigungen und die Abmeldung.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'de', $d128$Zustand bei unbezahltem Abonnement$d128$, $d128$Was mit dem Zugang passiert, wenn die Zahlung fehlschlägt oder nicht verlängert wird.$d128$, $d128$Schlägt die Zahlung eines Teams fehl oder ist das Abonnement inaktiv, sehen reguläre Nutzer eine eingeschränkte, unscharfe Ansicht mit einer blockierenden Meldung. Der Teaminhaber sieht ein klares rotes Warnbanner mit dem Weg zur Abrechnungskorrektur. Grundnavigation, Teamwechsel und Kontoeinstellungen bleiben verfügbar, damit das Problem ohne Datenverlustrisiko gelöst werden kann.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'de', $d128$OneDrive-Integration$d128$, $d128$Dieselbe Idee wie bei Google Drive: verbinden und Dateien synchronisieren.$d128$, $d128$Wie Google Drive kann Microsoft OneDrive als Dateispeicher auf Teamebene verbunden werden. Nach dem Verbinden gehen neue Dateien in dieses OneDrive-Konto — mit derselben Bequemlichkeit und Kontrolle wie bei der Google Drive-Einrichtung.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'de', $d128$Benachrichtigungseinstellungen$d128$, $d128$Gruppierte Einstellungen nach Kategorie; alte Benachrichtigungen werden automatisch bereinigt.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Benachrichtigungstypen lassen sich in einem gruppierten Einstellungsfenster anpassen: Aufgabenereignisse, Erinnerungen und Teamereignisse, jeweils mit eigenem Ein-/Ausschalter. Ältere gelesene Benachrichtigungen werden nach 30 Tagen gelöscht, damit die Liste lesbar bleibt.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'de', $d128$Benachrichtigungstypen$d128$, $d128$Zuweisung, Kommentare, Dateien, Statusänderungen, Teamereignisse.$d128$, $d128$

Das System erzeugt Benachrichtigungen zu Ereignissen, die Sie betreffen: eine Ihnen zugewiesene Aufgabe, eine von Ihnen entfernte Zuweisung, eine hinzugefügte Datei, eine Statusänderung oder eine neue Teilaufgabe in Ihrem Blickfeld. Sie erscheinen am Glockensymbol mit einer Ungelesen-Anzahl.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'de', $d128$Eigene Status in Vorlagen$d128$, $d128$Jede Vorlagenaufgabe kann einen eigenen Statussatz haben.$d128$, $d128$Jede Aufgabe in einer Vorlage kann einen anderen Statussatz haben als die Listenvorgabe. Eine Aufgabe in der Produktionsphase kann zum Beispiel einen anderen Ablauf nutzen als eine Aufgabe in der Lieferphase.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Aufgaben mit eigenen Status sind in der Vorlage markiert, damit sie leicht zu erkennen sind.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'de', $d128$Erste Liste und Aufgabe$d128$, $d128$Grundablauf: Liste anlegen, Aufgabe hinzufügen, Status ändern.$d128$, $d128$Eine Liste ist die grundlegende Arbeitseinheit in {SYSTEM_NAME}. Sie enthält Aufgaben für ein Projekt, einen Prozess oder einen Bereich. Nach dem Anlegen einer Liste können Sie Aufgaben hinzufügen, jeweils mit zuständiger Person und Status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Sie ändern den Aufgabenstatus mit einem Klick oder indem Sie die Aufgabe in der Tabellenansicht zwischen Statusgruppen ziehen.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Ist eine Aufgabe komplexer, teilen Sie sie in Teilaufgaben, jede mit eigenem Statusfluss.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'de', $d128$Ihr erstes Team erstellen$d128$, $d128$Wie Sie ein Team anlegen, die ersten Nutzer einladen und wie die Inhaberrolle funktioniert.$d128$, $d128$Zum Start in {SYSTEM_NAME} erstellen oder treten Sie einem Team bei. Das Produkt ist für gemeinsame Arbeit gebaut, nicht nur für die persönliche Nutzung. Wenn Sie ein Team anlegen, werden Sie Inhaber mit vollem Zugriff auf Funktionen und Einstellungen. Von dort laden Sie Kolleginnen und Kollegen ein, erstellen die ersten Listen und strukturieren die Arbeit. Eine Nutzerin oder ein Nutzer ohne weitere Teamnutzer ist kostenlos; eine zweite Person macht daraus ein kostenpflichtiges Team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'de', $d128$Private Listen$d128$, $d128$Wie Sie eine Liste anlegen, die nur ausgewählte Teamnutzer sehen.$d128$, $d128$Eine Liste kann privat gemacht werden, sodass sie im Seitenleistenbaum für Nutzer ohne direkten Zugriff nicht erscheint. Das hilft bei sensiblen Informationen oder einer kleinen Teilmenge von Aufgaben, die nicht für das ganze Team gedacht sind. Schaltet ein Administrator diese Funktion systemweit aus, werden bestehende private Listen innerhalb des Teams sichtbar.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'de', $d128$Vorlageneditor$d128$, $d128$Benannte Vorlagen mit Ordnern, Aufgaben und Teilaufgaben; sequenzielle Eingabe.$d128$, $d128$Auf Teamebene können Sie wiederverwendbare Vorlagen mit einer fertigen Struktur aus Ordnern, Aufgaben und Teilaufgaben anlegen. Das hilft, wenn ähnliche Projekte mit derselben Arbeitsfolge starten.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Der Vorlageneditor lässt Sie Elemente nacheinander hinzufügen und bereits auf Vorlagenebene eine Person sowie Checklistenpunkte zuweisen.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'de', $d128$Zugriffsebenen für Listen$d128$, $d128$Volles Bearbeiten / Bearbeiten / Kommentieren / Nur Ansehen / Kein Zugriff, pro Liste.$d128$, $d128$Zusätzlich zur Teamrolle kann jede Liste eine Zugriffsebene pro Nutzer oder Rolle setzen: volles Bearbeiten, Bearbeiten, nur Kommentieren, nur Ansehen oder kein Zugriff.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Zum Beispiel kann eine Projektleitung die Liste vollständig steuern, während andere Teamnutzer sie nur ansehen. Der wirksame Zugriff kombiniert die Rechte der Teamrolle mit den Einstellungen dieser Liste.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'de', $d128$Listen und Ordnerstruktur$d128$, $d128$Ordner und Unterordner zum Organisieren von Listen, Aufgaben und Dateien.$d128$, $d128${SYSTEM_NAME} organisiert die Arbeit mit Ordnern und Unterordnern für Listen, Aufgaben und Dateien — zum Beispiel nach Projekt, Kundin oder Kunde oder Abteilung. Im Seitenleistenbaum können Sie Elemente in einen Ordner oder wieder herausziehen. Die Struktur kann so tief sein, wie die Organisation braucht.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'de', $d128$Sitzungsverwaltung$d128$, $d128$Anmeldung unabhängig vom Website-Konto; Sitzungsdauer.$d128$, $d128$Die Erweiterung speichert ihre Anmeldesitzung lokal im Browser etwa 30 Tage lang, unabhängig davon, ob Sie in derselben Registerkarte bei der {SYSTEM_NAME}-Website angemeldet sind. Ist die Sitzung ungültig oder haben Sie sich nur auf der Website abgemeldet, merkt die Erweiterung das und fordert eine erneute Anmeldung nur, wenn sie wirklich nötig ist.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'de', $d128$Sitzungsverhalten$d128$, $d128$Angemeldet bleiben, Sitzungsdauer, Abmeldung.$d128$, $d128$Bei der Anmeldung können Sie „Angemeldet bleiben“ wählen, damit die Sitzung nach dem Schließen des Browsers bestehen bleibt. Ohne diese Option endet die Sitzung, wenn Sie den Browser schließen. Die Abmeldung von der Website berührt die separate Gmail-Erweiterungssitzung nicht; sie bleibt eigenständig aktiv.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'de', $d128$Systemmodule$d128$, $d128$Funktionen ein- oder ausschalten (private Listen, Dateien, Vorlagen, Automatisierungen, Kalender, Cloud-Integrationen).$d128$, $d128$Ein Administrator kann Systemfunktionen global ein- oder ausschalten, zum Beispiel private Listen, Datei-Upload, Checklisten, Automatisierungen, Vorlagen, Kalenderintegration oder Cloud-Speicher. Ein deaktiviertes Modul verschwindet aus der Benutzeroberfläche und von der Marketingseite, sodass Sie steuern, was in dieser Installation oder diesem kostenpflichtigen Plan verfügbar ist.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'de', $d128$Abgeleiteter Status$d128$, $d128$Wie Status und Fortschritt der übergeordneten Aufgabe aus Teilaufgaben berechnet werden.$d128$, $d128$Bei einer Aufgabe mit Teilaufgaben werden Gesamtstatus und Fortschritt aus den Status dieser Teilaufgaben berechnet. Die zuständige Person muss den übergeordneten Status nicht von Hand aktualisieren — er zeigt immer, wie viele Teilaufgaben erledigt sind.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'de', $d128$Fälligkeitsdaten und Erinnerungen$d128$, $d128$Start-/Fälligkeitsdaten, relative Kennzeichnungen (heute/übrig/überfällig), E-Mail-Erinnerungen.$d128$, $d128$Jede Aufgabe und Teilaufgabe kann ein Startdatum und ein Fälligkeitsdatum haben. Das System zeigt eine relative Kennzeichnung (zum Beispiel „heute“, „noch 3 Tage“ oder „2 Tage überfällig“) je nach Statusgruppe. Wenn der Administrator es aktiviert hat, sendet das System E-Mail-Erinnerungen zu bevorstehenden Start- oder Fälligkeitsdaten.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'de', $d128$Aufgabenstatus$d128$, $d128$System-Statuskatalog und eigene Status pro Liste, inklusive Reihenfolge.$d128$, $d128$Jede Liste hat einen Satz Status für Aufgabenphasen — vom systemweiten Standardkatalog bis zu vollständig eigenen Status mit Name, Farbe und Reihenfolge.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Die Statusreihenfolge wird in den Listeneinstellungen festgelegt. Sie beeinflusst, wie Aufgaben in Ansichten sortiert und wie der Gesamtfortschritt berechnet wird.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'de', $d128$Aufgabenverlauf$d128$, $d128$Vollständiges Änderungsprotokoll (Status, Daten, Zuständige, Dateien, Verschiebungen).$d128$, $d128$Jede Aufgabe und Teilaufgabe führt ein vollständiges Änderungsprotokoll: Statusänderungen, Datumsänderungen, Hinzufügen und Entfernen Zuständiger, Titel- und Beschreibungsbearbeitungen, Verschiebungen zwischen Listen sowie Datei- und Checklistenänderungen. Sie sehen jederzeit, wer was wann geändert hat.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'de', $d128$Sprachwahl$d128$, $d128$Systemstandardsprache, persönliche Wahl, Spracherkennung für Gäste.$d128$, $d128$Für angemeldete Nutzerinnen und Nutzer wird die Sprache im Profil gespeichert und überall, auf jedem Gerät, verwendet. Für Gäste kommt sie aus einem Browser-Cookie oder, falls keines existiert, aus der Standardsprache des Administrators. Sie können die Sprache jederzeit mit dem Umschalter ändern, der Flaggen und vollständige Sprachnamen zeigt.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'de', $d128$Plätze kaufen$d128$, $d128$Wie Sie bezahlte Plätze hinzufügen; automatischer Kauf beim Einladen einer neuen Person.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Laden Sie jemanden ein und das Team hat keinen freien bezahlten Platz, bietet das System an, vor dem Senden der Einladung einen zusätzlichen Platz zu kaufen. Sie können Plätze auch vorab auf der Team-Abrechnungsseite kaufen und monatliche oder jährliche Abrechnung wählen.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'de', $d128$Markenanpassung$d128$, $d128$Systemname, Logo, Favicon.$d128$, $d128$Ein Administrator kann den Systemnamen festlegen und Logo sowie Favicon hochladen. Ist kein Logo hochgeladen, erzeugt das System einen Avatar aus den Anfangsbuchstaben des Namens. Diese Änderungen erscheinen überall: im Browsertitel, in E-Mail-Vorlagen und auf der öffentlichen Marketingseite.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'fr', $d128$Gestion de l'abonnement$d128$, $d128$Facturation mensuelle ou annuelle, factures, résiliation.$d128$, $d128$Sur la page de facturation de l'équipe, vous voyez l'état actuel de l'abonnement, pouvez choisir entre une facturation mensuelle et annuelle, et payer via un Stripe Checkout sécurisé. Si une place payante se libère (un utilisateur d'équipe est retiré), elle reste disponible jusqu'à la fin de la période de facturation en cours au lieu d'être perdue immédiatement.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'fr', $d128$Créer des sous-tâches$d128$, $d128$Découpez une tâche en sous-tâches, chacune avec son propre flux de statuts.$d128$, $d128$Si une tâche comporte plusieurs étapes que différentes personnes peuvent réaliser à des moments différents, vous pouvez la découper en sous-tâches. Chaque sous-tâche a son propre flux de statuts, un responsable, une échéance et des pièces jointes — elle fonctionne comme une petite tâche à l'intérieur de la tâche parente.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'fr', $d128$Archive$d128$, $d128$Archive des tâches et dossiers terminés ou supprimés, code couleur, restauration.$d128$, $d128$Les tâches, sous-tâches et dossiers terminés ou supprimés ne disparaissent pas tout de suite. Ils vont dans l'archive, séparés du travail actif. Les éléments archivés sont colorés selon leur dernier statut pour les distinguer rapidement, et vous pouvez les restaurer dans la liste active à tout moment.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'fr', $d128$Langues prises en charge$d128$, $d128$Liste complète des traductions de l'interface et du marketing (15 langues).$d128$, $d128$L'interface et les contenus marketing de {SYSTEM_NAME} sont entièrement traduits en 15 langues, dont le letton, l'anglais et le russe. Pendant le développement, le système vérifie qu'aucune clé de traduction ni aucun espace réservé ne manque dans une langue prise en charge.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'fr', $d128$Authentification$d128$, $d128$E-mail, connexion Google, exigences de mot de passe.$d128$, $d128${SYSTEM_NAME} prend en charge la connexion par e-mail et mot de passe, ainsi qu'avec un compte Google. L'inscription et la connexion par e-mail exigent un mot de passe suffisamment fort et incluent une procédure de réinitialisation s'il est oublié.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'fr', $d128$Automatisations$d128$, $d128$Règles qui appliquent automatiquement un modèle à un nouveau dossier.$d128$, $d128$Les automatisations permettent au système d'agir tout seul dans des conditions définies. L'automatisation disponible applique un modèle choisi à tout nouveau dossier créé dans une liste précise. Chaque nouveau dossier de projet reçoit alors la structure complète, sans refaire le paramétrage à la main.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'fr', $d128$Protection anti-robots$d128$, $d128$Contrôles Cloudflare Turnstile sur les formulaires d'inscription et de connexion.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Les formulaires d'inscription, de connexion et de réinitialisation du mot de passe sont protégés par Cloudflare Turnstile. Cela bloque la création de comptes ou les tentatives de connexion automatisées et abusives, tout en restant discret pour les vrais utilisateurs.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'fr', $d128$Modèle tarifaire$d128$, $d128$La première place est gratuite ; vous payez pour chaque utilisateur d'équipe supplémentaire.$d128$, $d128$La première place d'équipe dans {SYSTEM_NAME} (la place du propriétaire) est toujours gratuite. Vous ne payez que pour chaque utilisateur d'équipe supplémentaire au-delà de la première place. Une personne peut utiliser le système gratuitement sans limite de temps ; la facturation commence seulement lorsqu'une vraie équipe se forme.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'fr', $d128$Check List$d128$, $d128$Une liste de contrôle simple dans une sous-tâche ; elle doit être à 100 % avant la clôture.$d128$, $d128$Dans une sous-tâche, vous pouvez ajouter une liste de contrôle simple pour des étapes plus petites, rapidement cochables, qui ne sont pas de vraies sous-tâches. Si la liste de contrôle n'est pas entièrement faite, la sous-tâche ne peut pas passer dans un groupe de statuts clos ou terminés. Les statuts reflètent alors toujours l'état réel du travail.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'fr', $d128$Chiffrement des données$d128$, $d128$Chiffrement des jetons d'accès des intégrations.$d128$, $d128$Tous les identifiants d'intégration (par exemple Google Drive ou d'autres jetons d'authentification tiers) sont stockés chiffrés, et non en texte clair dans la base. Même avec un accès direct à la base, ces données sensibles ne sont pas lisibles telles quelles.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'fr', $d128$Formats de date et d'heure$d128$, $d128$Début de semaine, format et séparateur de date, heure 12/24 h.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Chaque utilisateur peut définir le premier jour de la semaine souhaité, le format et le séparateur de date, et choisir l'heure sur 12 ou 24 heures. Ces réglages personnels priment sur le défaut système défini par l'administrateur.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'fr', $d128$Authentification à deux facteurs (MFA)$d128$, $d128$Configurer TOTP dans le profil.$d128$, $d128$Chaque utilisateur peut activer facultativement l'authentification à deux facteurs dans son profil via TOTP (une application d'authentification telle que Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Lorsque MFA est activée, chaque connexion demande aussi un code à usage unique de l'application d'authentification, en plus du mot de passe.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'fr', $d128$Ajouter un e-mail à une tâche$d128$, $d128$Importer le texte et les pièces jointes depuis Gmail ; choisir liste, dossier et tâche.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Depuis n'importe quel e-mail dans Gmail, l'extension peut l'ajouter à une tâche ou sous-tâche choisie. Le corps de l'e-mail est enregistré comme fichier texte, et vous pouvez sélectionner les pièces jointes séparément. Lors de l'ajout, vous choisissez la destination exacte via liste, dossier, tâche et sous-tâche.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'fr', $d128$Modèles d'e-mail$d128$, $d128$Modifier les modèles d'inscription, de réinitialisation du mot de passe et de notification.$d128$, $d128$Tous les e-mails que le système envoie automatiquement — confirmation d'inscription, réinitialisation du mot de passe, invitation d'équipe et autres avis système — sont modifiables comme modèles HTML dans le panneau d'administration, chacun disponible dans toutes les langues système prises en charge.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'fr', $d128$Offre Early Bird$d128$, $d128$Un nombre limité de places à tarif réduit pour les premiers clients.$d128$, $d128$Les premiers clients reçoivent un nombre limité de places à tarif réduit depuis un pool Early Bird mondial. Tant qu'il reste des places dans ce pool, une place nouvellement achetée obtient automatiquement le prix réduit. Lorsqu'une place n'est pas utilisée et que l'abonnement se termine, elle ne revient pas dans le pool.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'fr', $d128$Envoyer un fichier par e-mail$d128$, $d128$Envoyer une pièce jointe depuis le système vers une adresse e-mail et suivre la livraison.$d128$, $d128$Tout fichier d'une sous-tâche peut être envoyé par e-mail à n'importe quelle adresse depuis le système, sans ouvrir une application de messagerie séparée.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Lors de l'envoi, vous pouvez ajouter un objet et un message. Le système affiche l'état de livraison (envoyé, livré ou échec) et conserve un historique complet des transferts, avec la possibilité de renvoyer si la livraison échoue.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'fr', $d128$Téléversement de fichiers$d128$, $d128$Types de fichiers autorisés, limites de taille, aperçu (PDF, images, txt).$d128$, $d128$Vous pouvez joindre des fichiers dans l'arborescence des tâches, dans les sous-tâches et dans une fenêtre Fichiers séparée au niveau du dossier.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

L'administrateur définit quels types de fichiers peuvent être téléversés (par exemple PDF, Word, Excel, dessins DWG, images ou archives). Le système affiche une erreur claire si un fichier ne correspond pas. Les images, PDF et fichiers texte peuvent être prévisualisés sans quitter le système.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'fr', $d128$Utilisation du stockage de fichiers$d128$, $d128$Volume de stockage serveur et cloud dans la barre latérale.$d128$, $d128$Au-dessus de Paramètres dans la barre latérale, vous voyez l'usage total du stockage de fichiers — les fichiers sur le serveur {SYSTEM_NAME} et les fichiers dans le cloud connecté, comptés séparément. Cela montre clairement l'espace occupé par les différents fichiers et aide à décider s'il faut passer au stockage cloud.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'fr', $d128$Intégration Google Drive$d128$, $d128$Connecter un compte, enregistrer les fichiers dans Drive automatiquement, renommer et télécharger.$d128$, $d128$Lorsqu'un compte Google Drive d'équipe est connecté, les fichiers nouvellement téléversés sont enregistrés par défaut dans ce Drive plutôt que sur le serveur {SYSTEM_NAME}. Cela réduit le coût de stockage et garde les documents sous votre contrôle.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Vous pouvez renommer et télécharger un fichier depuis l'interface {SYSTEM_NAME}, et les modifications se synchronisent avec Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'fr', $d128$Installer et connecter$d128$, $d128$Installer l'extension et autoriser le compte.$d128$, $d128$L'extension Gmail de {SYSTEM_NAME} s'installe dans Chrome, puis vous demande de la relier à votre compte {SYSTEM_NAME} via un flux d'authentification sécurisé.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

L'extension a sa propre session, indépendante de la connexion au site : se déconnecter du site {SYSTEM_NAME} ne déconnecte pas l'extension.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'fr', $d128$Configuration des intégrations$d128$, $d128$Configurer Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$Dans le panneau d'administration, vous configurez au même endroit tous les services externes nécessaires au fonctionnement complet : connexion Google et Microsoft OAuth, Resend pour l'e-mail, Stripe pour la facturation, Sentry pour le suivi des erreurs et Umami pour l'analytique. Chaque intégration peut être activée ou désactivée, et les fonctions liées en dépendent (par exemple la connexion par e-mail ne fonctionne pas sans Resend configuré).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'fr', $d128$Créer une nouvelle sous-tâche à partir d'un e-mail$d128$, $d128$Une fenêtre pour assigner une personne directement depuis Gmail.$d128$, $d128$Si un e-mail doit devenir une nouvelle tâche, l'extension peut le faire depuis Gmail. Une fenêtre vous permet d'assigner une personne (recherche en direct par nom) et de joindre les fichiers de l'e-mail.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'fr', $d128$Intégration calendrier$d128$, $d128$Abonnez-vous à un flux `.ics` dans Google/Apple Calendar pour les échéances.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Les tâches avec échéance peuvent apparaître dans Google ou Apple Calendar en vous abonnant à un flux `.ics` personnel généré pour votre utilisateur. Le flux se met à jour quand les échéances changent, donc le calendrier reste à jour sans synchronisation manuelle.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'fr', $d128$Glisser-déposer de type Kanban$d128$, $d128$Un tableau groupé : glissez entre les groupes de statuts pour changer le statut.$d128$, $d128$Dans le tableau des tâches, les statuts sont groupés en colonnes ou en en-têtes de groupe. Vous changez le statut d'une tâche en la faisant glisser vers un autre groupe, comme un tableau Kanban classique. Pendant le glissement, une ligne bleue indique où la tâche se posera.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'fr', $d128$Inviter des utilisateurs d'équipe$d128$, $d128$Invitations par e-mail, flux accepter/refuser, renvoyer le lien d'invitation.$d128$, $d128$Vous ajoutez des personnes à une équipe en envoyant une invitation à leur e-mail. S'ils ont déjà un compte {SYSTEM_NAME}, ils reçoivent une notification dans l'application ; sinon, le lien d'invitation ouvre l'inscription avec l'e-mail prérempli.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

L'invitation doit être acceptée ou refusée — personne n'est ajouté automatiquement. Tant qu'elle est en attente, vous pouvez la renvoyer ou la révoquer, et copier le lien pour l'envoyer par un autre canal (pas seulement par e-mail).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'fr', $d128$Quitter une équipe et retirer des utilisateurs$d128$, $d128$Comment un utilisateur d'équipe peut partir, et comment un propriétaire retire des utilisateurs.$d128$, $d128$Tout utilisateur d'équipe sauf le propriétaire peut quitter l'équipe à tout moment depuis son profil ou la page de l'équipe. Un propriétaire ou un utilisateur avec le droit adéquat peut aussi retirer d'autres personnes de l'équipe. Cette autorisation se configure à part et n'est pas disponible pour le rôle utilisateur par défaut. Le propriétaire ne peut pas être retiré et ne peut pas partir sans transférer la propriété.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'fr', $d128$Créer un compte$d128$, $d128$Inscription par e-mail ou Google ; règles de mot de passe et contrôle de robustesse.$d128$, $d128$Vous pouvez créer un compte {SYSTEM_NAME} avec e-mail et mot de passe, ou en vous connectant avec Google. L'inscription par e-mail exige au moins un mot de passe de robustesse moyenne et peut générer un mot de passe sécurisé de 16 caractères, que vous pouvez utiliser ou remplacer. Avec la connexion Google, le prénom et le nom viennent du profil Google. Après une inscription par e-mail, vous devez confirmer l'adresse avant d'utiliser le système.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'fr', $d128$Rôles et niveaux d'accès$d128$, $d128$Rôles système par défaut, rôles personnalisés, accès granulaire (dossiers, archive, téléversement, changements de statut).$d128$, $d128$Chaque utilisateur d'équipe a un rôle qui définit ce qu'il peut faire, des droits utilisateur de base à l'accès administrateur complet.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Les rôles se règlent en détail : autoriser ou refuser la création de dossiers, la consultation de l'archive, le téléversement de fichiers sur les sous-tâches, les changements de statut et d'autres actions précises.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Le système est livré avec plusieurs rôles par défaut, et un propriétaire d'équipe peut aussi créer des rôles personnalisés avec exactement les droits dont l'équipe a besoin.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'fr', $d128$Catalogue des offres payantes$d128$, $d128$Créer des offres, rattacher des modules, fixer les prix.$d128$, $d128$Un administrateur peut créer et gérer le catalogue des offres payantes : prix, modules disponibles et plafonds d'utilisateurs. Les offres peuvent être assignées aux équipes, et le système limite les fonctions à l'offre active de l'équipe.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'fr', $d128$Aperçu de la navigation$d128$, $d128$Arborescence latérale (dossiers, listes, tâches), vue Accueil, sélecteur d'équipe.$d128$, $d128$La barre latérale gauche affiche une arborescence de vos dossiers, listes et tâches. Vous pouvez la déplier, la replier et la réordonner par glisser-déposer.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

En haut se trouve un sélecteur d'équipe si vous appartenez à plus d'une équipe. Accueil rassemble les tâches qui vous sont assignées dans toutes les listes, pour voir quoi faire chaque jour. Le menu utilisateur (en haut à droite) ouvre les paramètres du profil, les notifications et la déconnexion.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'fr', $d128$État d'abonnement impayé$d128$, $d128$Ce qui arrive à l'accès si le paiement échoue ou n'est pas renouvelé.$d128$, $d128$Si le paiement d'une équipe échoue ou que l'abonnement est inactif, les utilisateurs ordinaires voient une vue limitée et floutée, avec un message bloquant. Le propriétaire de l'équipe voit une bannière d'alerte rouge claire indiquant comment corriger la facturation. La navigation de base, le changement d'équipe et les paramètres du compte restent disponibles pour résoudre le problème sans risquer une perte de données.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'fr', $d128$Intégration OneDrive$d128$, $d128$Le même principe que Google Drive : connecter et synchroniser les fichiers.$d128$, $d128$Comme Google Drive, Microsoft OneDrive peut être connecté comme stockage de fichiers au niveau de l'équipe. Après la connexion, les nouveaux fichiers vont dans ce compte OneDrive, avec la même commodité et le même contrôle que la configuration Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'fr', $d128$Paramètres de notification$d128$, $d128$Réglages groupés par catégorie ; les anciennes notifications sont nettoyées automatiquement.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Les types de notification se règlent dans une fenêtre de paramètres groupés : événements de tâche, rappels et événements d'équipe, chacun avec son interrupteur. Les notifications lues plus anciennes sont supprimées après 30 jours pour que la liste reste lisible.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'fr', $d128$Types de notification$d128$, $d128$Assignation, commentaires, fichiers, changements de statut, événements d'équipe.$d128$, $d128$

Le système crée des notifications pour les événements qui vous concernent : une tâche qui vous est assignée, qui vous est retirée, un fichier ajouté, un changement de statut, ou une nouvelle sous-tâche sous votre suivi. Elles apparaissent sur l'icône de cloche avec un compteur non lus.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'fr', $d128$Statuts personnalisés dans les modèles$d128$, $d128$Chaque tâche de modèle peut avoir son propre ensemble de statuts.$d128$, $d128$Chaque tâche d'un modèle peut avoir un ensemble de statuts différent du défaut de la liste. Par exemple, une tâche d'étape de production peut suivre un autre flux qu'une tâche d'étape de livraison.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Les tâches avec des statuts personnalisés sont marquées dans le modèle pour les repérer facilement.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'fr', $d128$Première liste et tâche$d128$, $d128$Flux de base : créer une liste, ajouter une tâche, changer le statut.$d128$, $d128$Une liste est l'unité de travail de base dans {SYSTEM_NAME}. Elle contient les tâches d'un projet, d'un processus ou d'un domaine. Après avoir créé une liste, vous pouvez ajouter des tâches, chacune avec un responsable et un statut.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Vous changez le statut d'une tâche en un clic ou en la faisant glisser entre les groupes de statuts dans la vue tableau.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Si une tâche est plus complexe, découpez-la en sous-tâches, chacune avec son propre flux de statuts.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'fr', $d128$Créer votre première équipe$d128$, $d128$Comment créer une équipe, inviter les premiers utilisateurs et comment fonctionne le rôle de propriétaire.$d128$, $d128$Pour commencer dans {SYSTEM_NAME}, vous créez ou rejoignez une équipe. Le produit est conçu pour le travail partagé, pas seulement un usage personnel. Lorsque vous créez une équipe, vous en devenez le propriétaire, avec un accès complet aux fonctions et aux paramètres. Ensuite vous invitez des collègues, créez les premières listes et structurez le travail. Un utilisateur sans autres utilisateurs d'équipe est gratuit ; l'ajout d'une deuxième personne en fait une équipe payante.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'fr', $d128$Listes privées$d128$, $d128$Comment créer une liste visible uniquement pour certains utilisateurs d'équipe.$d128$, $d128$Une liste peut être rendue privée pour qu'elle n'apparaisse pas dans l'arborescence latérale pour les utilisateurs sans accès direct. Cela aide pour des informations sensibles ou un petit sous-ensemble de tâches qui ne sont pas destinées à toute l'équipe. Si un administrateur désactive cette fonction pour tout le système, les listes privées existantes deviennent visibles dans l'équipe.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'fr', $d128$Éditeur de modèles$d128$, $d128$Modèles nommés avec dossiers, tâches et sous-tâches ; saisie séquentielle.$d128$, $d128$Au niveau de l'équipe, vous pouvez créer des modèles réutilisables avec une structure prête de dossiers, tâches et sous-tâches. Cela aide lorsque des projets similaires commencent par la même séquence de travail.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

L'éditeur de modèles vous permet d'ajouter des éléments en séquence et d'assigner déjà une personne et des éléments de liste de contrôle au niveau du modèle.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'fr', $d128$Niveaux d'accès aux listes$d128$, $d128$Édition complète / édition / commentaire / lecture seule / aucun accès, par liste.$d128$, $d128$En plus du rôle d'équipe, chaque liste peut définir un niveau d'accès par utilisateur ou rôle : édition complète, édition, commentaire seulement, lecture seule, ou aucun accès.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Par exemple, un chef de projet peut avoir le contrôle total d'une liste tandis que les autres utilisateurs d'équipe la consultent seulement. L'accès effectif combine les droits du rôle d'équipe et les réglages de cette liste.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'fr', $d128$Listes et structure de dossiers$d128$, $d128$Dossiers et sous-dossiers pour organiser listes, tâches et fichiers.$d128$, $d128${SYSTEM_NAME} organise le travail avec des dossiers et sous-dossiers pour les listes, tâches et fichiers — par exemple par projet, client ou service. Dans l'arborescence latérale, vous pouvez glisser des éléments dans un dossier ou hors de celui-ci. La structure peut être aussi profonde que l'organisation en a besoin.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'fr', $d128$Gestion de session$d128$, $d128$Connexion indépendante du compte du site ; durée de session.$d128$, $d128$L'extension conserve sa session de connexion localement dans le navigateur pendant environ 30 jours, que vous soyez ou non connecté au site {SYSTEM_NAME} dans le même onglet. Si la session n'est plus valable, ou si vous vous êtes seulement déconnecté du site, l'extension le détecte et ne vous demande de vous reconnecter que lorsque c'est vraiment nécessaire.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'fr', $d128$Gestion de la session$d128$, $d128$Se souvenir de moi, durée de session, déconnexion.$d128$, $d128$Lors de la connexion, vous pouvez choisir « Se souvenir de moi » pour que la session reste après la fermeture du navigateur. Sans cette option, la session se termine lorsque vous fermez le navigateur. La déconnexion du site n'affecte pas la session séparée de l'extension Gmail, qui reste active de son côté.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'fr', $d128$Modules système$d128$, $d128$Activer ou désactiver des fonctions (listes privées, fichiers, modèles, automatisations, calendrier, intégrations cloud).$d128$, $d128$Un administrateur peut activer ou désactiver globalement des fonctions du système, par exemple les listes privées, le téléversement de fichiers, les listes de contrôle, les automatisations, les modèles, l'intégration calendrier ou le stockage cloud. Un module désactivé disparaît de l'interface utilisateur et de la page marketing, afin que vous contrôliez ce qui est disponible dans cette installation ou cette offre payante.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'fr', $d128$Statut dérivé$d128$, $d128$Comment le statut et la progression de la tâche parente sont calculés à partir des sous-tâches.$d128$, $d128$Pour une tâche avec sous-tâches, le statut et la progression d'ensemble sont calculés à partir des statuts de ces sous-tâches. Le propriétaire n'a pas besoin de mettre à jour le statut parent à la main — il reflète toujours combien de sous-tâches sont terminées.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'fr', $d128$Échéances et rappels$d128$, $d128$Dates de début et d'échéance, libellés relatifs (aujourd'hui / restant / en retard), rappels par e-mail.$d128$, $d128$Chaque tâche et sous-tâche peut avoir une date de début et une échéance. Le système affiche un libellé relatif (par exemple « aujourd'hui », « 3 jours restants » ou « 2 jours de retard ») selon le groupe de statuts. Si l'administrateur l'a activé, le système envoie des rappels par e-mail pour les dates de début ou d'échéance à venir.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'fr', $d128$Statuts des tâches$d128$, $d128$Catalogue de statuts système et statuts personnalisés par liste, y compris l'ordre.$d128$, $d128$Chaque liste a un ensemble de statuts pour les étapes de tâche, du catalogue système par défaut jusqu'à des statuts entièrement personnalisés avec nom, couleur et ordre.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

L'ordre des statuts se définit dans les paramètres de la liste. Il influe sur le tri des tâches dans les vues et sur le calcul de la progression globale.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'fr', $d128$Historique de la tâche$d128$, $d128$Journal complet des modifications (statut, dates, responsables, fichiers, déplacements).$d128$, $d128$Chaque tâche et sous-tâche conserve un journal complet des modifications : changements de statut, de dates, ajout et retrait de responsables, modifications de titre et de description, déplacements entre listes, et changements de fichiers et de liste de contrôle. Vous voyez toujours qui a changé quoi et quand.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'fr', $d128$Choix de la langue$d128$, $d128$Langue système par défaut, choix personnel, détection de langue pour les invités.$d128$, $d128$Pour un utilisateur connecté, la langue est enregistrée sur le profil et utilisée partout, sur n'importe quel appareil. Pour un visiteur, elle vient d'un cookie du navigateur, ou s'il n'y en a pas, de la langue par défaut de l'administrateur. Vous pouvez changer de langue à tout moment avec le sélecteur, qui affiche des drapeaux et les noms complets des langues.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'fr', $d128$Acheter des places$d128$, $d128$Comment ajouter des places payantes ; achat automatique lors de l'invitation d'une nouvelle personne.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Si vous invitez quelqu'un et que l'équipe n'a pas de place payante libre, le système propose d'acheter une place supplémentaire avant d'envoyer l'invitation. Vous pouvez aussi acheter des places à l'avance depuis la page de facturation de l'équipe, en choisissant une facturation mensuelle ou annuelle.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'fr', $d128$Personnalisation de la marque$d128$, $d128$Nom du système, logo, favicon.$d128$, $d128$Un administrateur peut définir le nom du système et téléverser un logo et un favicon. Si aucun logo n'est téléversé, le système génère un avatar à partir des premières lettres du nom. Ces modifications s'affichent partout : titre de l'onglet du navigateur, modèles d'e-mail et page marketing publique.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'es', $d128$Gestión de la suscripción$d128$, $d128$Facturación mensual o anual, facturas, cancelación.$d128$, $d128$En la página de facturación del equipo puedes ver el estado actual de la suscripción, elegir entre facturación mensual y anual, y pagar a través de un checkout seguro de Stripe. Si se libera un asiento de pago (se elimina un usuario del equipo), permanece disponible hasta el final del ciclo de facturación actual en lugar de perderse de inmediato.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'es', $d128$Crear subtareas$d128$, $d128$Divide una tarea en subtareas, cada una con su propio flujo de estados.$d128$, $d128$Si una tarea tiene varios pasos que distintas personas pueden hacer en momentos distintos, puedes dividirla en subtareas. Cada subtarea tiene su propio flujo de estados, persona asignada, fecha de vencimiento y adjuntos: funciona como una tarea pequeña dentro de la tarea padre.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'es', $d128$Archivo$d128$, $d128$Archiva tareas y carpetas completadas o eliminadas, código de colores, restaurar.$d128$, $d128$Las tareas, subtareas y carpetas completadas o eliminadas no desaparecen de inmediato. Van al archivo, separado del trabajo activo. Los elementos archivados están codificados por color según su último estado para distinguirlos con rapidez, y puedes restaurarlos a la lista activa en cualquier momento.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'es', $d128$Idiomas compatibles$d128$, $d128$Lista completa de traducciones de la interfaz y el marketing (15 idiomas).$d128$, $d128$La interfaz y el contenido de marketing de {SYSTEM_NAME} están traducidos por completo a 15 idiomas, entre ellos letón, inglés y ruso. Durante el desarrollo el sistema comprueba que no falte ninguna clave de traducción ni ningún marcador de posición en ningún idioma compatible.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'es', $d128$Autenticación$d128$, $d128$Correo electrónico, inicio de sesión con Google, requisitos de contraseña.$d128$, $d128${SYSTEM_NAME} admite el inicio de sesión con correo electrónico y contraseña, y con una cuenta de Google. El registro y el inicio de sesión por correo exigen una contraseña lo bastante segura e incluyen un flujo de restablecimiento si se olvida.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'es', $d128$Automatizaciones$d128$, $d128$Reglas que aplican automáticamente una plantilla a una carpeta nueva.$d128$, $d128$Las automatizaciones permiten que el sistema actúe por sí solo en condiciones definidas. La automatización disponible aplica una plantilla elegida a cualquier carpeta nueva creada en una lista concreta. Así cada carpeta de proyecto nueva recibe la estructura completa sin repetir la configuración a mano.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'es', $d128$Protección contra bots$d128$, $d128$Comprobaciones de Cloudflare Turnstile en los formularios de registro e inicio de sesión.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Los formularios de registro, inicio de sesión y restablecimiento de contraseña están protegidos con Cloudflare Turnstile. Bloquea la creación de cuentas o los intentos de inicio de sesión automatizados y abusivos, y permanece discreto para los usuarios reales.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'es', $d128$Modelo de precios$d128$, $d128$El primer asiento es gratuito; pagas por cada usuario extra del equipo.$d128$, $d128$El primer asiento del equipo en {SYSTEM_NAME} (el asiento del propietario) es siempre gratuito. Solo pagas por cada usuario extra del equipo por encima del primer asiento. Una persona puede usar el sistema gratis sin límite de tiempo; la facturación empieza solo cuando se forma un equipo real.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'es', $d128$Check List$d128$, $d128$Una lista de comprobación sencilla dentro de una subtarea; debe estar al 100 % antes de cerrar.$d128$, $d128$Dentro de una subtarea puedes añadir una lista de comprobación sencilla para pasos más pequeños y rápidos de marcar que no son subtareas completas. Si la lista no está del todo hecha, la subtarea no puede pasar a un grupo de estados cerrado o completado. Así los estados reflejan siempre el estado real del trabajo.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'es', $d128$Cifrado de datos$d128$, $d128$Cifrado de los tokens de acceso de las integraciones.$d128$, $d128$Todas las credenciales de integración (por ejemplo, tokens de autenticación de Google Drive u otros terceros) se almacenan cifradas, no como texto plano en la base de datos. Incluso con acceso directo a la base de datos, estos datos sensibles no se pueden leer tal cual.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'es', $d128$Formatos de fecha y hora$d128$, $d128$Inicio de la semana, formato y separador de fecha, hora de 12/24 horas.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Cada usuario puede definir el primer día de la semana preferido, el formato y el separador de fecha, y elegir hora de 12 o 24 horas. Estos ajustes personales anulan el valor predeterminado del sistema establecido por el administrador.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'es', $d128$Autenticación en dos pasos (MFA)$d128$, $d128$Configura TOTP en el perfil.$d128$, $d128$Cada usuario puede activar opcionalmente la autenticación en dos pasos en su perfil con TOTP (una app de autenticación como Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Cuando la MFA está activa, cada inicio de sesión también pide un código de un solo uso de la app de autenticación, además de la contraseña.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'es', $d128$Añadir un correo a una tarea$d128$, $d128$Importa el texto y los adjuntos del correo desde Gmail; elige lista, carpeta y tarea.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Desde cualquier correo en Gmail, la extensión puede añadirlo a una tarea o subtarea elegida. El cuerpo del correo se guarda como archivo de texto y puedes elegir los adjuntos por separado. Al añadir, eliges el destino exacto a través de lista, carpeta, tarea y subtarea.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'es', $d128$Plantillas de correo$d128$, $d128$Edita las plantillas de registro, restablecimiento de contraseña y notificaciones.$d128$, $d128$Todos los correos que el sistema envía automáticamente (confirmación de registro, restablecimiento de contraseña, invitación al equipo y otros avisos del sistema) se pueden editar como plantillas HTML en el panel de administración, cada una disponible en todos los idiomas del sistema compatibles.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'es', $d128$Oferta Early Bird$d128$, $d128$Un número limitado de asientos con descuento para los primeros clientes.$d128$, $d128$Los primeros clientes obtienen un número limitado de asientos con descuento de un fondo global Early Bird. Mientras queden asientos en ese fondo, un asiento recién comprado recibe automáticamente el precio con descuento. Cuando un asiento no se usa y la suscripción termina, no vuelve al fondo.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'es', $d128$Enviar un archivo por correo$d128$, $d128$Envía un adjunto desde el sistema a una dirección de correo y sigue la entrega.$d128$, $d128$Cualquier archivo de una subtarea se puede enviar por correo a cualquier dirección desde el sistema, sin abrir una app de correo aparte.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Al enviar, puedes añadir un asunto y un mensaje. El sistema muestra el estado de entrega (enviado, entregado o fallido) y conserva un historial completo de reenvíos, con la opción de enviar de nuevo si la entrega falla.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'es', $d128$Subida de archivos$d128$, $d128$Tipos de archivo permitidos, límites de tamaño, vista previa (PDF, imágenes, txt).$d128$, $d128$Puedes adjuntar archivos en el árbol de tareas, dentro de las subtareas y en una ventana de Archivos aparte a nivel de carpeta.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

El administrador define qué tipos de archivo se pueden subir (por ejemplo PDF, Word, Excel, planos DWG, imágenes o archivos comprimidos). El sistema muestra un error claro si un archivo no coincide. Las imágenes, PDF y archivos de texto se pueden previsualizar sin salir del sistema.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'es', $d128$Uso del almacenamiento de archivos$d128$, $d128$Volumen de almacenamiento en servidor frente a la nube, en la barra lateral.$d128$, $d128$Encima de Ajustes, en la barra lateral, ves el uso total del almacenamiento de archivos: los archivos en el servidor de {SYSTEM_NAME} y los archivos en la nube conectada, contados por separado. Así queda claro cuánto espacio ocupan los distintos archivos y ayuda a decidir si pasar al almacenamiento en la nube.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'es', $d128$Integración con Google Drive$d128$, $d128$Conecta una cuenta, guarda archivos en Drive automáticamente, renombra y descarga.$d128$, $d128$Cuando la cuenta de Google Drive del equipo está conectada, los archivos subidos de nuevo se guardan por defecto en ese Drive en lugar del servidor de {SYSTEM_NAME}. Eso reduce el coste de almacenamiento y mantiene los documentos bajo tu control.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Puedes renombrar y descargar un archivo desde la interfaz de {SYSTEM_NAME}, y los cambios se sincronizan con Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'es', $d128$Instalar y conectar$d128$, $d128$Instala la extensión y autoriza la cuenta.$d128$, $d128$La extensión de Gmail de {SYSTEM_NAME} se instala en Chrome y luego te pide conectarla a tu cuenta de {SYSTEM_NAME} mediante un flujo de autenticación seguro.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

La extensión tiene su propia sesión, independiente del inicio de sesión del sitio web, así que cerrar sesión en el sitio de {SYSTEM_NAME} no desconecta la extensión.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'es', $d128$Configuración de integraciones$d128$, $d128$Configura Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$En el panel de administración configuras en un solo lugar todos los servicios externos necesarios para la funcionalidad completa: inicio de sesión OAuth de Google y Microsoft, Resend para el correo, Stripe para la facturación, Sentry para el seguimiento de errores y Umami para la analítica. Cada integración se puede activar o desactivar, y las funciones relacionadas dependen de esa configuración (por ejemplo, el inicio de sesión por correo no funciona sin un Resend configurado).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'es', $d128$Crear una subtarea nueva desde un correo$d128$, $d128$Un modal para asignar a una persona directamente desde Gmail.$d128$, $d128$Si un correo debe convertirse en una tarea nueva, la extensión puede hacerlo desde Gmail. Un modal te permite asignar a una persona (búsqueda en vivo por nombre) y adjuntar archivos del correo.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'es', $d128$Integración con el calendario$d128$, $d128$Suscríbete a un feed `.ics` en Google/Apple Calendar para las fechas de vencimiento.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Las tareas con fecha de vencimiento pueden aparecer en Google o Apple Calendar al suscribirte a un feed `.ics` personal generado para tu usuario. El feed se actualiza cuando cambian las fechas de vencimiento, así el calendario se mantiene al día sin sincronización manual.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'es', $d128$Arrastrar y soltar al estilo Kanban$d128$, $d128$Una tabla agrupada: arrastra entre grupos de estado para cambiar el estado.$d128$, $d128$En la tabla de tareas, los estados se agrupan en columnas o encabezados de grupo. Cambias el estado de una tarea arrastrándola a otro grupo, como en un tablero Kanban clásico. Mientras arrastras, una línea azul indica dónde aterrizará la tarea.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'es', $d128$Invitar usuarios del equipo$d128$, $d128$Invitaciones por correo, flujo de aceptar/rechazar, reenviar el enlace de invitación.$d128$, $d128$Añades personas a un equipo enviando una invitación a su correo. Si ya tienen una cuenta de {SYSTEM_NAME}, reciben una notificación en la app; si no, el enlace de invitación abre el registro con el correo rellenado.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

La invitación debe aceptarse o rechazarse: nadie se añade automáticamente. Mientras está pendiente, puedes reenviarla o revocarla, y puedes copiar el enlace para enviarlo por otro canal (no solo por correo).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'es', $d128$Salir de un equipo y eliminar usuarios$d128$, $d128$Cómo puede salir un usuario del equipo y cómo un propietario elimina usuarios.$d128$, $d128$Cualquier usuario del equipo excepto el propietario puede salir del equipo en cualquier momento desde su perfil o la página del equipo. Un propietario o un usuario con el acceso adecuado también puede eliminar a otros del equipo. Ese permiso se configura por separado y no está disponible para el rol de usuario predeterminado. El propietario no se puede eliminar y no puede salir sin transferir la propiedad.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'es', $d128$Crear una cuenta$d128$, $d128$Regístrate con correo o Google; reglas de contraseña y comprobación de seguridad.$d128$, $d128$Puedes crear una cuenta de {SYSTEM_NAME} con correo y contraseña, o iniciando sesión con Google. El registro por correo exige al menos una contraseña de seguridad media y puede generar una contraseña segura de 16 caracteres que puedes usar o sustituir. Con el inicio de sesión de Google, el nombre y el apellido vienen del perfil de Google. Tras el registro por correo debes confirmar la dirección antes de usar el sistema.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'es', $d128$Roles y niveles de acceso$d128$, $d128$Roles predeterminados del sistema, roles personalizados, acceso detallado (carpetas, archivo, subida de archivos, cambios de estado).$d128$, $d128$Cada usuario del equipo tiene un rol que define lo que puede hacer, desde derechos de usuario básicos hasta acceso de administrador completo.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Los roles se pueden definir con detalle: permitir o denegar la creación de carpetas, la vista del archivo, la subida de archivos en subtareas, los cambios de estado y otras acciones concretas.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

El sistema incluye varios roles predeterminados, y el propietario del equipo también puede crear roles personalizados con exactamente los derechos que el equipo necesita.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'es', $d128$Catálogo de planes de pago$d128$, $d128$Crea planes, asocia módulos, define precios.$d128$, $d128$Un administrador puede crear y gestionar el catálogo de planes de pago: precio, módulos disponibles y límites de usuarios. Los planes se pueden asignar a equipos, y el sistema limita las funciones al plan activo del equipo.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'es', $d128$Visión general de la navegación$d128$, $d128$Árbol de la barra lateral (carpetas, listas, tareas), vista Inicio, selector de equipo.$d128$, $d128$La barra lateral izquierda muestra un árbol de tus carpetas, listas y tareas. Puedes expandirlo, contraerlo y reordenarlo arrastrando.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Arriba hay un selector de equipo si perteneces a más de uno. Inicio reúne las tareas asignadas a ti en todas las listas para que veas qué hacer cada día. El menú de usuario (arriba a la derecha) abre los ajustes del perfil, las notificaciones y el cierre de sesión.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'es', $d128$Estado de suscripción impagada$d128$, $d128$Qué ocurre con el acceso si el pago falla o no se renueva.$d128$, $d128$Si el pago de un equipo falla o la suscripción está inactiva, los usuarios habituales ven una vista limitada y desenfocada con un mensaje bloqueante. El propietario del equipo ve un banner de aviso rojo claro con cómo corregir la facturación. La navegación básica, el cambio de equipo y los ajustes de la cuenta siguen disponibles para resolver el problema sin riesgo de pérdida de datos.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'es', $d128$Integración con OneDrive$d128$, $d128$La misma idea que Google Drive: conectar y sincronizar archivos.$d128$, $d128$Como Google Drive, Microsoft OneDrive se puede conectar como almacenamiento de archivos a nivel de equipo. Tras conectar, los archivos nuevos van a esa cuenta de OneDrive, con la misma comodidad y control que la configuración de Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'es', $d128$Ajustes de notificaciones$d128$, $d128$Ajustes agrupados por categoría; las notificaciones antiguas se limpian automáticamente.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Los tipos de notificación se pueden ajustar en una ventana de ajustes agrupada: eventos de tareas, recordatorios y eventos del equipo, cada uno con su propio interruptor. Las notificaciones leídas más antiguas se eliminan a los 30 días para que la lista siga siendo legible.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'es', $d128$Tipos de notificación$d128$, $d128$Asignación, comentarios, archivos, cambios de estado, eventos del equipo.$d128$, $d128$

El sistema crea notificaciones para los eventos que te afectan: una tarea asignada a ti, retirada de ti, un archivo añadido, un cambio de estado o una subtarea nueva bajo tu supervisión. Aparecen en el icono de campana con un recuento de no leídas.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'es', $d128$Estados personalizados en plantillas$d128$, $d128$Cada tarea de una plantilla puede tener su propio conjunto de estados.$d128$, $d128$Cada tarea dentro de una plantilla puede tener un conjunto de estados distinto del predeterminado de la lista. Por ejemplo, una tarea de etapa de producción puede usar un flujo distinto al de una tarea de etapa de entrega.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Las tareas con estados personalizados están marcadas en la plantilla para identificarlas con facilidad.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'es', $d128$Primera lista y tarea$d128$, $d128$Flujo básico: crear una lista, añadir una tarea, cambiar el estado.$d128$, $d128$Una lista es la unidad de trabajo básica en {SYSTEM_NAME}. Agrupa las tareas de un proyecto, proceso o área. Tras crear una lista puedes añadir tareas, cada una con una persona asignada y un estado.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Cambias el estado de una tarea con un clic o arrastrándola entre grupos de estado en la vista de tabla.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Si una tarea es más compleja, divídela en subtareas, cada una con su propio flujo de estados.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'es', $d128$Crear tu primer equipo$d128$, $d128$Cómo crear un equipo, invitar a los primeros usuarios y cómo funciona el rol de propietario.$d128$, $d128$Para empezar en {SYSTEM_NAME} creas o te unes a un equipo. El producto está pensado para el trabajo compartido, no solo para uso personal. Al crear un equipo te conviertes en su propietario, con acceso completo a funciones y ajustes. Desde ahí invitas a colegas, creas las primeras listas y estructuras el trabajo. Un usuario sin otros usuarios del equipo es gratuito; añadir a una segunda persona lo convierte en un equipo de pago.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'es', $d128$Listas privadas$d128$, $d128$Cómo crear una lista visible solo para usuarios del equipo seleccionados.$d128$, $d128$Una lista se puede hacer privada para que no aparezca en el árbol de la barra lateral para los usuarios sin acceso directo. Eso ayuda con información sensible o un subconjunto pequeño de tareas que no está pensado para todo el equipo. Si un administrador desactiva esta función para todo el sistema, las listas privadas existentes se vuelven visibles dentro del equipo.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'es', $d128$Editor de plantillas$d128$, $d128$Plantillas con nombre con carpetas, tareas y subtareas; entrada secuencial.$d128$, $d128$A nivel de equipo puedes crear plantillas reutilizables con una estructura lista de carpetas, tareas y subtareas. Eso ayuda cuando proyectos similares empiezan con la misma secuencia de trabajo.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

El editor de plantillas te permite añadir elementos en secuencia y ya asignar una persona y elementos de lista de comprobación a nivel de plantilla.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'es', $d128$Niveles de acceso de la lista$d128$, $d128$Edición completa / editar / comentar / solo ver / sin acceso, por lista.$d128$, $d128$Además del rol del equipo, cada lista puede definir un nivel de acceso por usuario o rol: edición completa, editar, solo comentar, solo ver o sin acceso.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Por ejemplo, un responsable de proyecto puede tener control total de una lista mientras otros usuarios del equipo solo la ven. El acceso efectivo combina los derechos del rol del equipo con los ajustes de esa lista.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'es', $d128$Listas y estructura de carpetas$d128$, $d128$Carpetas y subcarpetas para organizar listas, tareas y archivos.$d128$, $d128${SYSTEM_NAME} organiza el trabajo con carpetas y subcarpetas para listas, tareas y archivos, por ejemplo por proyecto, cliente o departamento. En el árbol de la barra lateral puedes arrastrar elementos a una carpeta o sacarlos de ella. La estructura puede ser tan profunda como necesite la organización.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'es', $d128$Gestión de sesión$d128$, $d128$Inicio de sesión independiente de la cuenta del sitio web; duración de la sesión.$d128$, $d128$La extensión mantiene su sesión de inicio de sesión en local en el navegador unos 30 días, estés o no conectado al sitio de {SYSTEM_NAME} en la misma pestaña. Si la sesión no es válida, o solo has cerrado sesión en el sitio web, la extensión lo detecta y te pide iniciar sesión de nuevo solo cuando realmente hace falta.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'es', $d128$Manejo de la sesión$d128$, $d128$Recuérdame, duración de la sesión, cierre de sesión.$d128$, $d128$Al iniciar sesión puedes elegir Recuérdame para que la sesión se conserve al cerrar el navegador. Sin esa opción, la sesión termina al cerrar el navegador. Cerrar sesión en el sitio web no afecta a la sesión aparte de la extensión de Gmail, que permanece activa por su cuenta.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'es', $d128$Módulos del sistema$d128$, $d128$Activa o desactiva funciones (listas privadas, archivos, plantillas, automatizaciones, calendario, integraciones en la nube).$d128$, $d128$Un administrador puede activar o desactivar funciones del sistema de forma global, por ejemplo listas privadas, subida de archivos, listas de comprobación, automatizaciones, plantillas, integración con el calendario o almacenamiento en la nube. Un módulo desactivado desaparece de la interfaz de usuario y de la página de marketing, así controlas lo que está disponible en esa instalación o plan de pago.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'es', $d128$Estado derivado$d128$, $d128$Cómo se calcula el estado y el progreso de la tarea padre a partir de las subtareas.$d128$, $d128$En una tarea con subtareas, el estado general y el progreso se calculan a partir de los estados de esas subtareas. El propietario no necesita actualizar el estado padre a mano: siempre refleja cuántas subtareas están hechas.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'es', $d128$Fechas de vencimiento y recordatorios$d128$, $d128$Fechas de inicio y vencimiento, etiquetas relativas (hoy/quedan/atrasada), recordatorios por correo.$d128$, $d128$Cada tarea y subtarea puede tener una fecha de inicio y una fecha de vencimiento. El sistema muestra una etiqueta relativa (por ejemplo "hoy", "quedan 3 días" o "2 días de retraso") según el grupo de estado. Si el administrador lo ha activado, el sistema envía recordatorios por correo sobre las fechas de inicio o vencimiento próximas.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'es', $d128$Estados de las tareas$d128$, $d128$Catálogo de estados del sistema y estados personalizados por lista, incluido el orden.$d128$, $d128$Cada lista tiene un conjunto de estados para las etapas de las tareas, desde el catálogo predeterminado del sistema hasta estados totalmente personalizados con su propio nombre, color y orden.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

El orden de los estados se define en los ajustes de la lista. Afecta a cómo se ordenan las tareas en las vistas y a cómo se calcula el progreso general.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'es', $d128$Historial de la tarea$d128$, $d128$Registro completo de cambios (estado, fechas, asignados, archivos, movimientos).$d128$, $d128$Cada tarea y subtarea conserva un registro completo de cambios: cambios de estado, cambios de fecha, alta y baja de asignados, ediciones de título y descripción, movimientos entre listas, y cambios de archivos y listas de comprobación. Siempre puedes ver quién cambió qué y cuándo.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'es', $d128$Elección de idioma$d128$, $d128$Idioma predeterminado del sistema, elección personal, detección de idioma para invitados.$d128$, $d128$Para un usuario conectado, el idioma se guarda en el perfil y se usa en todas partes, en cualquier dispositivo. Para un invitado proviene de una cookie del navegador o, si no hay ninguna, del idioma predeterminado del administrador. Puedes cambiar de idioma en cualquier momento con el selector, que muestra banderas y los nombres completos de los idiomas.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'es', $d128$Comprar asientos$d128$, $d128$Cómo añadir asientos de pago; compra automática al invitar a alguien nuevo.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Si invitas a alguien y el equipo no tiene un asiento de pago libre, el sistema ofrece comprar un asiento extra antes de enviar la invitación. También puedes comprar asientos por adelantado desde la página de facturación del equipo, eligiendo facturación mensual o anual.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'es', $d128$Personalización de marca$d128$, $d128$Nombre del sistema, logotipo, favicon.$d128$, $d128$Un administrador puede definir el nombre del sistema y subir un logotipo y un favicon. Si no se sube logotipo, el sistema genera un avatar con las primeras letras del nombre. Estos cambios se ven en todas partes: título de la pestaña del navegador, plantillas de correo y la página pública de marketing.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'nl', $d128$Abonnementbeheer$d128$, $d128$Maandelijkse of jaarlijkse facturering, facturen, opzegging.$d128$, $d128$Op de factureringspagina van het team zie je de huidige abonnementsstatus, kies je tussen maandelijkse en jaarlijkse facturering, en betaal je via een beveiligde Stripe-afrekening. Als een betaalde plek vrijkomt (een teamgebruiker wordt verwijderd), blijft die beschikbaar tot het einde van de huidige factureringscyclus in plaats van meteen verloren te gaan.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'nl', $d128$Subtaken aanmaken$d128$, $d128$Splits een taak in subtaken, elk met een eigen statusstroom.$d128$, $d128$Als een taak meerdere stappen heeft die verschillende personen op verschillende momenten kunnen uitvoeren, kun je die in subtaken splitsen. Elke subtaak heeft een eigen statusstroom, toegewezene, deadline en bijlagen - het werkt als een kleine taak binnen de oudertaak.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'nl', $d128$Archief$d128$, $d128$Archiveer afgeronde en verwijderde taken/mappen, kleurcodering, herstellen.$d128$, $d128$Afgeronde of verwijderde taken, subtaken en mappen verdwijnen niet meteen. Ze gaan naar het archief, gescheiden van actief werk. Gearchiveerde items zijn kleurgecodeerd volgens hun laatste status, zodat je ze snel kunt onderscheiden, en je kunt ze op elk moment terugzetten naar de actieve lijst.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'nl', $d128$Ondersteunde talen$d128$, $d128$Volledige lijst van UI- en marketingvertalingen (15 talen).$d128$, $d128$De interface en marketinginhoud van {SYSTEM_NAME} zijn volledig vertaald in 15 talen, waaronder Lets, Engels en Russisch. Tijdens de ontwikkeling controleert het systeem dat geen vertaalsleutel of plaatshouder ontbreekt in een ondersteunde taal.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'nl', $d128$Authenticatie$d128$, $d128$E-mail, Google-inloggen, wachtwoordvereisten.$d128$, $d128${SYSTEM_NAME} ondersteunt inloggen met e-mail en wachtwoord, en met een Google-account. Registratie en inloggen via e-mail vereisen een voldoende sterk wachtwoord en hebben een resetprocedure als het is vergeten.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'nl', $d128$Automatiseringen$d128$, $d128$Regels die automatisch een sjabloon toepassen op een nieuwe map.$d128$, $d128$Automatiseringen laten het systeem zelf handelen onder vastgestelde voorwaarden. De beschikbare automatisering past een gekozen sjabloon toe op elke nieuwe map die in een specifieke lijst wordt aangemaakt. Elke nieuwe projectmap krijgt dan de volledige structuur zonder dat je de instelling handmatig herhaalt.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'nl', $d128$Botbescherming$d128$, $d128$Cloudflare Turnstile-controles op registratie- en inlogformulieren.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registratie-, inlog- en wachtwoordresetformulieren zijn beveiligd met Cloudflare Turnstile. Het blokkeert geautomatiseerde, misbruikende pogingen tot accountaanmaak of inloggen, terwijl het voor echte gebruikers onopvallend blijft.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'nl', $d128$Prijsmodel$d128$, $d128$De eerste plek is gratis; je betaalt voor elke extra teamgebruiker.$d128$, $d128$De eerste teamplek in {SYSTEM_NAME} (de plek van de eigenaar) is altijd gratis. Je betaalt alleen voor elke extra teamgebruiker boven de eerste plek. Eén persoon kan het systeem onbeperkt gratis gebruiken; facturering start pas wanneer een echt team wordt gevormd.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'nl', $d128$Check List$d128$, $d128$Een eenvoudige checklist in een subtaak; die moet 100% klaar zijn vóór afsluiten.$d128$, $d128$In een subtaak kun je een eenvoudige checklist toevoegen voor kleinere, snel afvinkbare stappen die geen volledige subtaken zijn. Als de checklist niet volledig is afgerond, kan de subtaak niet naar een gesloten of afgeronde statusgroep. Statussen weerspiegelen dan altijd de echte stand van het werk.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'nl', $d128$Gegevensversleuteling$d128$, $d128$Versleuteling van toegangstokens van integraties.$d128$, $d128$Alle inloggegevens van integraties (bijvoorbeeld Google Drive of andere tokens van derden) worden versleuteld opgeslagen, niet als platte tekst in de database. Zelfs bij directe databasetoegang is deze gevoelige informatie niet zomaar leesbaar.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'nl', $d128$Datum- en tijdformaten$d128$, $d128$Weekstart, datumformaat/scheidingsteken, 12/24-uurs tijd.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Elke gebruiker kan de voorkeursstartdag van de week, het datumformaat en het scheidingsteken instellen, en kiezen tussen 12- of 24-uurs tijd. Deze persoonlijke instellingen gaan boven de systeemstandaard van de beheerder.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'nl', $d128$Tweestapsverificatie (MFA)$d128$, $d128$TOTP instellen in het profiel.$d128$, $d128$Elke gebruiker kan optioneel tweestapsverificatie inschakelen in het profiel met TOTP (een authenticator-app zoals Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Als MFA aanstaat, vraagt elke login naast het wachtwoord ook om een eenmalige code uit de authenticator-app.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'nl', $d128$Een e-mail aan een taak toevoegen$d128$, $d128$Importeer e-mailtekst en bijlagen uit Gmail; kies lijst, map en taak.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Vanuit elke e-mail in Gmail kan de extensie die toevoegen aan een gekozen taak of subtaak. De e-mailinhoud wordt als tekstbestand opgeslagen, en bijlagen kies je apart. Bij het toevoegen kies je de exacte bestemming via lijst, map, taak en subtaak.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'nl', $d128$E-mailsjablonen$d128$, $d128$Bewerk sjablonen voor registratie, wachtwoordreset en meldingen.$d128$, $d128$Alle e-mails die het systeem automatisch verstuurt - bevestiging van registratie, wachtwoordreset, teamuitnodiging en andere systeemmeldingen - zijn bewerkbaar als HTML-sjablonen in het beheerpaneel, elk beschikbaar in elke ondersteunde systeemtaal.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'nl', $d128$Early Bird-aanbieding$d128$, $d128$Een beperkt aantal kortingsplekken voor de eerste klanten.$d128$, $d128$De eerste klanten krijgen een beperkt aantal kortingsplekken uit een wereldwijde Early Bird-pool. Zolang er plekken in die pool over zijn, krijgt een nieuw gekochte plek automatisch de kortingsprijs. Als een plek ongebruikt blijft en het abonnement eindigt, keert die niet terug naar de pool.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'nl', $d128$Een bestand per e-mail versturen$d128$, $d128$Stuur een bijlage vanuit het systeem naar een e-mailadres en volg de bezorging.$d128$, $d128$Elk bestand op een subtaak kan vanuit het systeem naar elk adres worden gemaild, zonder een aparte mailapp te openen.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Bij het versturen kun je een onderwerp en bericht toevoegen. Het systeem toont de bezorgstatus (verzonden, bezorgd of mislukt) en bewaart een volledige doorstuurgeschiedenis, met de mogelijkheid om opnieuw te versturen als de bezorging mislukt.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'nl', $d128$Bestanden uploaden$d128$, $d128$Toegestane bestandstypen, groottebeperkingen, voorbeeld (PDF, afbeeldingen, txt).$d128$, $d128$Je kunt bestanden bijvoegen in de takenboom, in subtaken en in een apart venster Bestanden op mapniveau.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

De beheerder bepaalt welke bestandstypen mogen worden geüpload (bijvoorbeeld PDF, Word, Excel, DWG-tekeningen, afbeeldingen of archieven). Het systeem toont een duidelijke foutmelding als een bestand niet overeenkomt. Afbeeldingen, PDF en tekstbestanden kun je bekijken zonder het systeem te verlaten.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'nl', $d128$Gebruik van bestandsopslag$d128$, $d128$Server- versus cloudopslagvolume in de zijbalk.$d128$, $d128$Boven Instellingen in de zijbalk zie je het totale gebruik van bestandsopslag - bestanden op de {SYSTEM_NAME}-server en bestanden in de gekoppelde cloud, apart geteld. Zo is duidelijk hoeveel ruimte verschillende bestanden innemen en kun je beter beslissen of je naar cloudopslag wilt overstappen.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'nl', $d128$Google Drive-integratie$d128$, $d128$Koppel een account, sla bestanden automatisch op in Drive, hernoem en download.$d128$, $d128$Wanneer het Google Drive-account van een team is gekoppeld, worden nieuw geüploade bestanden standaard in die Drive opgeslagen in plaats van op de {SYSTEM_NAME}-server. Dat verlaagt de opslagkosten en houdt documenten onder jouw controle.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Je kunt een bestand hernoemen en downloaden vanuit de {SYSTEM_NAME}-interface, en wijzigingen synchroniseren met Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'nl', $d128$Installeren en koppelen$d128$, $d128$Installeer de extensie en autoriseer het account.$d128$, $d128$De Gmail-extensie van {SYSTEM_NAME} installeer je in Chrome; daarna vraagt die om koppeling met je {SYSTEM_NAME}-account via een beveiligde authenticatiestroom.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

De extensie heeft een eigen sessie, onafhankelijk van het inloggen op de website, dus uitloggen van de {SYSTEM_NAME}-site verbreekt de extensie niet.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'nl', $d128$Integratieconfiguratie$d128$, $d128$Stel Google/Microsoft OAuth, Resend, Stripe, Sentry en Umami in.$d128$, $d128$In het beheerpaneel configureer je alle externe diensten die nodig zijn voor volledige functionaliteit op één plek: Google- en Microsoft-OAuth-inloggen, Resend voor e-mail, Stripe voor facturering, Sentry voor foutopvolging en Umami voor analytics. Elke integratie kun je in- of uitschakelen, en gerelateerde functies hangen van die instelling af (bijvoorbeeld e-mailinloggen werkt niet zonder een geconfigureerde Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'nl', $d128$Een nieuwe subtaak vanuit een e-mail aanmaken$d128$, $d128$Een venster om direct vanuit Gmail een persoon toe te wijzen.$d128$, $d128$Als een e-mail een nieuwe taak moet worden, kan de extensie dat vanuit Gmail doen. Een venster laat je een persoon toewijzen (live zoeken op naam) en e-mailbestanden bijvoegen.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'nl', $d128$Kalenderintegratie$d128$, $d128$Abonneer je op een `.ics`-feed in Google/Apple Calendar voor deadlines.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Taken met deadlines kunnen in Google of Apple Calendar verschijnen door te abonneren op een persoonlijke `.ics`-feed die voor jouw gebruiker wordt gegenereerd. De feed wordt bijgewerkt wanneer deadlines wijzigen, zodat de kalender actueel blijft zonder handmatige synchronisatie.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'nl', $d128$Slepen en neerzetten in Kanban-stijl$d128$, $d128$Een gegroepeerde tabel: sleep tussen statusgroepen om de status te wijzigen.$d128$, $d128$In de takentabel zijn statussen gegroepeerd in kolommen of groepskoppen. Je wijzigt de status van een taak door die naar een andere groep te slepen, zoals op een klassiek Kanban-bord. Tijdens het slepen toont een blauwe lijn waar de taak terechtkomt.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'nl', $d128$Teamgebruikers uitnodigen$d128$, $d128$Uitnodigingen per e-mail, accepteren/afwijzen, de uitnodigingslink opnieuw versturen.$d128$, $d128$Je voegt mensen aan een team toe door een uitnodiging naar hun e-mail te sturen. Als ze al een {SYSTEM_NAME}-account hebben, krijgen ze een melding in de app; zo niet, dan opent de uitnodigingslink de registratie met het e-mailadres al ingevuld.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

De uitnodiging moet worden geaccepteerd of afgewezen - niemand wordt automatisch toegevoegd. Zolang die in behandeling is, kun je die opnieuw versturen of intrekken, en je kunt de link kopiëren om die via een ander kanaal te sturen (niet alleen e-mail).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'nl', $d128$Een team verlaten en gebruikers verwijderen$d128$, $d128$Hoe een teamgebruiker kan vertrekken, en hoe een eigenaar gebruikers verwijdert.$d128$, $d128$Elke teamgebruiker behalve de eigenaar kan het team op elk moment verlaten via het profiel of de teampagina. Een eigenaar of een gebruiker met de juiste toegang kan anderen ook uit het team verwijderen. Die machtiging is apart ingesteld en is niet beschikbaar voor de standaardgebruikersrol. De eigenaar kan niet worden verwijderd en kan niet vertrekken zonder het eigenaarschap over te dragen.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'nl', $d128$Een account aanmaken$d128$, $d128$Registreren met e-mail of Google; wachtwoordregels en sterktecontrole.$d128$, $d128$Je kunt een {SYSTEM_NAME}-account aanmaken met e-mail en wachtwoord, of door in te loggen met Google. Registratie via e-mail vereist minstens een wachtwoord van gemiddelde sterkte en kan een veilig wachtwoord van 16 tekens genereren dat je kunt gebruiken of vervangen. Bij Google-inloggen komen voor- en achternaam uit het Google-profiel. Na registratie via e-mail moet je het adres bevestigen voordat je het systeem gebruikt.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'nl', $d128$Rollen en toegangsniveaus$d128$, $d128$Standaardsysteemrollen, aangepaste rollen, gedetailleerde toegang (mappen, archief, bestandsupload, statuswijzigingen).$d128$, $d128$Elke teamgebruiker heeft een rol die bepaalt wat die mag doen, van basisgebruikersrechten tot volledige beheerderstoegang.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Rollen kun je in detail instellen: mapaanmaak, archiefweergave, bestandsupload op subtaken, statuswijzigingen en andere specifieke acties toestaan of weigeren.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Het systeem wordt geleverd met verschillende standaardrollen, en een teameigenaar kan ook aangepaste rollen maken met precies de rechten die het team nodig heeft.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'nl', $d128$Catalogus van betaalde plannen$d128$, $d128$Plannen aanmaken, modules koppelen, prijzen instellen.$d128$, $d128$Een beheerder kan de catalogus van betaalde plannen aanmaken en beheren: prijs, beschikbare modules en gebruikerslimieten. Plannen kunnen aan teams worden toegewezen, en het systeem beperkt functies tot het actieve plan van het team.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'nl', $d128$Overzicht van de navigatie$d128$, $d128$Boom in de zijbalk (mappen, lijsten, taken), Home-weergave, teamwisselaar.$d128$, $d128$De linkerzijbalk toont een boom van je mappen, lijsten en taken. Je kunt die uitklappen, inklappen en herschikken door te slepen.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Bovenaan staat een teamwisselaar als je tot meer dan één team behoort. Home verzamelt taken die aan jou zijn toegewezen over lijsten heen, zodat je ziet wat je elke dag moet doen. Het gebruikersmenu (rechtsboven) opent profielinstellingen, meldingen en uitloggen.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'nl', $d128$Onbetaalde abonnementsstatus$d128$, $d128$Wat er met de toegang gebeurt als de betaling mislukt of niet wordt verlengd.$d128$, $d128$Als de betaling van een team mislukt of het abonnement inactief is, zien gewone gebruikers een beperkte, vervaagde weergave met een blokkerende melding. De teameigenaar ziet een duidelijke rode waarschuwingsbanner met hoe de facturering te herstellen. Basisnavigatie, teamwisselen en accountinstellingen blijven beschikbaar, zodat het probleem kan worden opgelost zonder risico op gegevensverlies.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'nl', $d128$OneDrive-integratie$d128$, $d128$Hetzelfde idee als Google Drive: koppelen en bestanden synchroniseren.$d128$, $d128$Net als Google Drive kan Microsoft OneDrive worden gekoppeld als bestandsopslag op teamniveau. Na het koppelen gaan nieuwe bestanden naar dat OneDrive-account, met dezelfde gebruiksvriendelijkheid en controle als bij Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'nl', $d128$Meldingsinstellingen$d128$, $d128$Gegroepeerde instellingen per categorie; oude meldingen worden automatisch opgeschoond.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Meldingstypen kun je aanpassen in een gegroepeerd instellingenvenster: taakgebeurtenissen, herinneringen en teamgebeurtenissen, elk met een eigen aan/uit-schakelaar. Oudere gelezen meldingen worden na 30 dagen verwijderd, zodat de lijst leesbaar blijft.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'nl', $d128$Meldingstypen$d128$, $d128$Toewijzing, reacties, bestanden, statuswijzigingen, teamgebeurtenissen.$d128$, $d128$

Het systeem maakt meldingen voor gebeurtenissen die jou raken: een taak die aan jou is toegewezen, van jou is verwijderd, een bestand dat is toegevoegd, een statuswijziging of een nieuwe subtaak onder jouw aandacht. Ze verschijnen bij het belpictogram met een ongelezen telling.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'nl', $d128$Aangepaste statussen in sjablonen$d128$, $d128$Elke sjabloontaak kan een eigen set statussen hebben.$d128$, $d128$Elke taak in een sjabloon kan een andere statusset hebben dan de lijststandaard. Een taak in de productiefase kan bijvoorbeeld een andere stroom gebruiken dan een taak in de leveringsfase.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Taken met aangepaste statussen zijn in het sjabloon gemarkeerd, zodat ze makkelijk te herkennen zijn.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'nl', $d128$Eerste lijst en taak$d128$, $d128$Basisstroom: maak een lijst, voeg een taak toe, wijzig de status.$d128$, $d128$Een lijst is de basiseenheid van werk in {SYSTEM_NAME}. Die bevat taken voor één project, proces of gebied. Na het aanmaken van een lijst kun je taken toevoegen, elk met een toegewezene en een status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Je wijzigt de status van een taak met één klik of door die tussen statusgroepen te slepen in de tabelweergave.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Als een taak complexer is, splits je die in subtaken, elk met een eigen statusstroom.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'nl', $d128$Je eerste team aanmaken$d128$, $d128$Hoe je een team aanmaakt, de eerste gebruikers uitnodigt, en hoe de eigenaarsrol werkt.$d128$, $d128$Om in {SYSTEM_NAME} te beginnen, maak je een team aan of sluit je je bij een team aan. Het product is gebouwd voor gedeeld werk, niet alleen persoonlijk gebruik. Wanneer je een team aanmaakt, word je de eigenaar met volledige toegang tot functies en instellingen. Vanaf daar nodig je collega’s uit, maak je de eerste lijsten en structureer je het werk. Eén gebruiker zonder andere teamgebruikers is gratis; een tweede persoon toevoegen maakt het een betaald team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'nl', $d128$Privélijsten$d128$, $d128$Hoe je een lijst aanmaakt die alleen zichtbaar is voor geselecteerde teamgebruikers.$d128$, $d128$Een lijst kan privé worden gemaakt, zodat die niet in de zijbalkboom verschijnt voor gebruikers zonder directe toegang. Dat helpt bij gevoelige informatie of een kleine subset van taken die niet voor het hele team bedoeld is. Als een beheerder deze functie voor het hele systeem uitschakelt, worden bestaande privélijsten zichtbaar binnen het team.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'nl', $d128$Sjablooneditor$d128$, $d128$Benoemde sjablonen met mappen, taken en subtaken; sequentiële invoer.$d128$, $d128$Op teamniveau kun je herbruikbare sjablonen aanmaken met een kant-en-klare structuur van mappen, taken en subtaken. Dat helpt wanneer vergelijkbare projecten met dezelfde werkvolgorde starten.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

De sjablooneditor laat je items in volgorde toevoegen en al op sjabloonniveau een persoon en checklistitems toewijzen.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'nl', $d128$Toegangsniveaus van lijsten$d128$, $d128$Volledig bewerken / bewerken / reageren / alleen bekijken / geen toegang, per lijst.$d128$, $d128$Bovenop de teamrol kan elke lijst een toegangsniveau per gebruiker of rol instellen: volledig bewerken, bewerken, alleen reageren, alleen bekijken of geen toegang.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Een projectleider kan bijvoorbeeld volledige controle over een lijst hebben, terwijl andere teamgebruikers die alleen bekijken. De effectieve toegang combineert de rechten van de teamrol met de instellingen van die lijst.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'nl', $d128$Lijsten en mappenstructuur$d128$, $d128$Mappen en submappen om lijsten, taken en bestanden te organiseren.$d128$, $d128${SYSTEM_NAME} organiseert werk met mappen en submappen voor lijsten, taken en bestanden - bijvoorbeeld per project, klant of afdeling. In de zijbalkboom kun je items in een map slepen of eruit halen. De structuur kan zo diep zijn als de organisatie nodig heeft.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'nl', $d128$Sessiebeheer$d128$, $d128$Inloggen onafhankelijk van het websiteaccount; sessieduur.$d128$, $d128$De extensie bewaart de inlogsessie lokaal in de browser ongeveer 30 dagen, of je nu wel of niet bent ingelogd op de {SYSTEM_NAME}-site in hetzelfde tabblad. Als de sessie ongeldig is, of je alleen op de website bent uitgelogd, merkt de extensie dat en vraagt die alleen opnieuw in te loggen wanneer dat echt nodig is.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'nl', $d128$Sessieafhandeling$d128$, $d128$Onthoud mij, sessieduur, uitloggen.$d128$, $d128$Bij het inloggen kun je Onthoud mij kiezen, zodat de sessie blijft nadat de browser is gesloten. Zonder die optie eindigt de sessie wanneer je de browser sluit. Uitloggen van de website heeft geen invloed op de aparte sessie van de Gmail-extensie, die zelfstandig actief blijft.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'nl', $d128$Systeemmodules$d128$, $d128$Functies in- of uitschakelen (privélijsten, bestanden, sjablonen, automatiseringen, kalender, cloudintegraties).$d128$, $d128$Een beheerder kan systeemfuncties globaal in- of uitschakelen, bijvoorbeeld privélijsten, bestandsupload, checklists, automatiseringen, sjablonen, kalenderintegratie of cloudopslag. Een uitgeschakelde module verdwijnt uit de gebruikersinterface en de marketingpagina, zodat je bepaalt wat beschikbaar is in die installatie of dat betaalde plan.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'nl', $d128$Afgeleide status$d128$, $d128$Hoe de status/voortgang van een oudertaak wordt berekend uit subtaken.$d128$, $d128$Voor een taak met subtaken worden de totale status en voortgang berekend uit die subtaakstatussen. De eigenaar hoeft de ouderstatus niet handmatig bij te werken - die weerspiegelt altijd hoeveel subtaken klaar zijn.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'nl', $d128$Deadlines en herinneringen$d128$, $d128$Start-/einddata, relatieve labels (vandaag/resterend/te laat), e-mailherinneringen.$d128$, $d128$Elke taak en subtaak kan een startdatum en een deadline hebben. Het systeem toont een relatief label (bijvoorbeeld "vandaag", "nog 3 dagen" of "2 dagen te laat") afhankelijk van de statusgroep. Als de beheerder het heeft ingeschakeld, mailt het systeem herinneringen over aankomende start- of einddata.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'nl', $d128$Taakstatussen$d128$, $d128$Systeemstatuscatalogus en aangepaste statussen per lijst, inclusief volgorde.$d128$, $d128$Elke lijst heeft een set statussen voor taakfasen, van de systeemstandaardcatalogus tot volledig aangepaste statussen met eigen naam, kleur en volgorde.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

De statusvolgorde stel je in bij de lijstinstellingen. Die beïnvloedt hoe taken in weergaven worden gesorteerd en hoe de totale voortgang wordt berekend.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'nl', $d128$Taakgeschiedenis$d128$, $d128$Volledig wijzigingslogboek (status, data, toegewezenen, bestanden, verplaatsingen).$d128$, $d128$Elke taak en subtaak houdt een volledig wijzigingslogboek bij: statuswijzigingen, datumwijzigingen, toegewezenen toevoegen en verwijderen, bewerkingen van titel en beschrijving, verplaatsingen tussen lijsten, en wijzigingen aan bestanden en checklists. Je kunt altijd zien wie wat wanneer heeft gewijzigd.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'nl', $d128$Taalkeuze$d128$, $d128$Standaardtaal van het systeem, persoonlijke keuze, taalherkenning voor gasten.$d128$, $d128$Voor een ingelogde gebruiker wordt de taal op het profiel opgeslagen en overal gebruikt, op elk apparaat. Voor een gast komt die uit een browsercookie, of als die er niet is, uit de standaardtaal van de beheerder. Je kunt de taal op elk moment wijzigen met de wisselaar, die vlaggen en volledige taalnamen toont.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'nl', $d128$Plekken kopen$d128$, $d128$Hoe je betaalde plekken toevoegt; automatische aankoop bij het uitnodigen van een nieuwe gebruiker.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Als je iemand uitnodigt en het team geen vrije betaalde plek heeft, biedt het systeem aan om een extra plek te kopen voordat de uitnodiging wordt verstuurd. Je kunt ook vooraf plekken kopen op de factureringspagina van het team, met keuze tussen maandelijkse of jaarlijkse facturering.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'nl', $d128$Merk aanpassen$d128$, $d128$Systeemnaam, logo, favicon.$d128$, $d128$Een beheerder kan de systeemnaam instellen en een logo en favicon uploaden. Als er geen logo is geüpload, genereert het systeem een avatar uit de eerste letters van de naam. Deze wijzigingen zijn overal zichtbaar: in de browsertabtitel, e-mailsjablonen en de openbare marketingpagina.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'da', $d128$Abonnementsadministration$d128$, $d128$Månedlig eller årlig fakturering, fakturaer, opsigelse.$d128$, $d128$På teamets faktureringsside kan du se den aktuelle abonnementsstatus, vælge mellem månedlig og årlig fakturering og betale via en sikker Stripe-betaling. Hvis en betalt plads bliver ledig (en teambruger fjernes), forbliver den tilgængelig indtil slutningen af den aktuelle faktureringscyklus i stedet for at gå tabt med det samme.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'da', $d128$Opret underopgaver$d128$, $d128$Opdel en opgave i underopgaver, hver med sit eget statusflow.$d128$, $d128$Hvis en opgave har flere trin, som forskellige personer kan udføre på forskellige tidspunkter, kan du opdele den i underopgaver. Hver underopgave har sit eget statusflow, tildelt person, frist og vedhæftninger - den fungerer som en lille opgave inde i den overordnede opgave.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'da', $d128$Arkiv$d128$, $d128$Arkiver afsluttede og slettede opgaver/mapper, farvekodning, gendan.$d128$, $d128$Afsluttede eller slettede opgaver, underopgaver og mapper forsvinder ikke med det samme. De går til arkivet, adskilt fra aktivt arbejde. Arkiverede elementer er farvekodet efter deres sidste status, så du hurtigt kan skelne dem, og du kan når som helst gendanne dem til den aktive liste.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'da', $d128$Understøttede sprog$d128$, $d128$Komplet liste over UI- og marketingoversættelser (15 sprog).$d128$, $d128${SYSTEM_NAME}s grænseflade og marketingindhold er fuldt oversat til 15 sprog, herunder lettisk, engelsk og russisk. Under udviklingen tjekker systemet, at ingen oversættelsesnøgle eller pladsholder mangler på noget understøttet sprog.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'da', $d128$Autentificering$d128$, $d128$E-mail, Google-login, adgangskodekrav.$d128$, $d128${SYSTEM_NAME} understøtter login med e-mail og adgangskode samt med en Google-konto. Registrering og login med e-mail kræver en tilstrækkelig stærk adgangskode og har et nulstillingsforløb, hvis den glemmes.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'da', $d128$Automatiseringer$d128$, $d128$Regler, der automatisk anvender en skabelon på en ny mappe.$d128$, $d128$Automatiseringer lader systemet handle af sig selv under fastsatte betingelser. Den tilgængelige automatisering anvender en valgt skabelon på alle nye mapper, der oprettes i en bestemt liste. Hver ny projektmappe får derefter den fulde struktur uden at opsætningen gentages manuelt.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'da', $d128$Botbeskyttelse$d128$, $d128$Cloudflare Turnstile-tjek på registrerings- og loginformularer.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registrerings-, login- og adgangskodenulstillingsformularer er beskyttet med Cloudflare Turnstile. Den blokerer automatiserede, misbrugende forsøg på at oprette konto eller logge ind, samtidig med at den er diskret for rigtige brugere.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'da', $d128$Prismodel$d128$, $d128$Den første plads er gratis; du betaler for hver ekstra teambruger.$d128$, $d128$Den første teamplads i {SYSTEM_NAME} (ejerens plads) er altid gratis. Du betaler kun for hver ekstra teambruger ud over den første plads. Én person kan bruge systemet gratis uden tidsbegrænsning; fakturering starter først, når et rigtigt team dannes.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'da', $d128$Check List$d128$, $d128$En enkel tjekliste inde i en underopgave; den skal være 100 % færdig før lukning.$d128$, $d128$Inde i en underopgave kan du tilføje en enkel tjekliste til mindre, hurtigt afkrydselige trin, der ikke er fulde underopgaver. Hvis tjeklisten ikke er helt færdig, kan underopgaven ikke flyttes til en lukket eller afsluttet statusgruppe. Statusser afspejler derefter altid arbejdets reelle tilstand.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'da', $d128$Datakryptering$d128$, $d128$Kryptering af integrationers adgangstokens.$d128$, $d128$Alle integrationsoplysninger (for eksempel Google Drive eller andre tredjeparts-autentificeringstokens) gemmes krypteret, ikke som almindelig tekst i databasen. Selv med direkte databaseadgang kan disse følsomme data ikke læses som de er.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'da', $d128$Dato- og tidsformater$d128$, $d128$Ugestart, datoformat/separator, 12/24-timers ur.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Hver bruger kan indstille den foretrukne første ugedag, datoformat og separator og vælge 12- eller 24-timers ur. Disse personlige indstillinger tilsidesætter systemets standard, som administratoren har sat.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'da', $d128$Tofaktorgodkendelse (MFA)$d128$, $d128$Opsæt TOTP i profilen.$d128$, $d128$Hver bruger kan valgfrit slå tofaktorgodkendelse til i profilen med TOTP (en authenticator-app som Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Når MFA er slået til, beder hvert login også om en engangskode fra authenticator-appen, ud over adgangskoden.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'da', $d128$Tilføj en e-mail til en opgave$d128$, $d128$Importér e-mailtekst og vedhæftninger fra Gmail; vælg liste, mappe og opgave.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Fra en hvilken som helst e-mail i Gmail kan udvidelsen tilføje den til en valgt opgave eller underopgave. E-mailens brødtekst gemmes som en tekstfil, og vedhæftninger vælger du separat. Når du tilføjer, vælger du den præcise destination via liste, mappe, opgave og underopgave.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'da', $d128$E-mailskabeloner$d128$, $d128$Rediger skabeloner til registrering, nulstilling af adgangskode og notifikationer.$d128$, $d128$Alle e-mails, som systemet sender automatisk - bekræftelse af registrering, nulstilling af adgangskode, teaminvitation og andre systemmeddelelser - kan redigeres som HTML-skabeloner i administrationspanelet, hver tilgængelig på alle understøttede systemsprog.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'da', $d128$Early Bird-tilbud$d128$, $d128$Et begrænset antal rabatpladser til de første kunder.$d128$, $d128$De første kunder får et begrænset antal rabatpladser fra en global Early Bird-pulje. Så længe der er pladser tilbage i puljen, får en nykøbt plads automatisk rabatprisen. Når en plads er ubrugt, og abonnementet slutter, vender den ikke tilbage til puljen.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'da', $d128$Send en fil via e-mail$d128$, $d128$Send en vedhæftning fra systemet til en e-mailadresse, og følg leveringen.$d128$, $d128$Enhver fil på en underopgave kan e-mailes til en hvilken som helst adresse fra systemet, uden at åbne et separat mailprogram.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Når du sender, kan du tilføje emne og besked. Systemet viser leveringsstatus (sendt, leveret eller mislykket) og gemmer en fuld videresendelseshistorik med mulighed for at sende igen, hvis leveringen fejler.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'da', $d128$Filupload$d128$, $d128$Tilladte filtyper, størrelsesgrænser, forhåndsvisning (PDF, billeder, txt).$d128$, $d128$Du kan vedhæfte filer i opgavetræet, inde i underopgaver og i et separat Filer-vindue på mappeniveau.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administratoren fastsætter, hvilke filtyper der må uploades (for eksempel PDF, Word, Excel, DWG-tegninger, billeder eller arkiver). Systemet viser en tydelig fejl, hvis en fil ikke matcher. Billeder, PDF og tekstfiler kan forhåndsvises uden at forlade systemet.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'da', $d128$Forbrug af fillagring$d128$, $d128$Server- vs. cloudlagringsvolumen i sidebjælken.$d128$, $d128$Over Indstillinger i sidebjælken ser du det samlede forbrug af fillagring - filer på {SYSTEM_NAME}-serveren og filer i den tilknyttede cloud, talt hver for sig. Det gør det tydeligt, hvor meget plads forskellige filer fylder, og hjælper dig med at beslutte, om du vil flytte til cloudlagring.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'da', $d128$Google Drive-integration$d128$, $d128$Tilslut en konto, gem filer automatisk på Drive, omdøb og download.$d128$, $d128$Når et teams Google Drive-konto er tilsluttet, gemmes nyuploadede filer som standard på den Drive i stedet for på {SYSTEM_NAME}-serveren. Det sænker lagringsomkostningerne og holder dokumenterne under din kontrol.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Du kan omdøbe og downloade en fil fra {SYSTEM_NAME}-grænsefladen, og ændringer synkroniseres med Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'da', $d128$Installer og tilslut$d128$, $d128$Installer udvidelsen, og autoriser kontoen.$d128$, $d128${SYSTEM_NAME} Gmail-udvidelsen installeres i Chrome og beder dig derefter om at tilslutte den til din {SYSTEM_NAME}-konto via et sikkert godkendelsesforløb.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Udvidelsen har sin egen session, uafhængig af login på webstedet, så logud fra {SYSTEM_NAME}-siden afbryder ikke udvidelsen.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'da', $d128$Integrationskonfiguration$d128$, $d128$Opsæt Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$I administrationspanelet konfigurerer du alle eksterne tjenester, der er nødvendige for fuld funktionalitet, ét sted: Google- og Microsoft-OAuth-login, Resend til e-mail, Stripe til fakturering, Sentry til fejlsporing og Umami til analytics. Hver integration kan slås til eller fra, og relaterede funktioner afhænger af den opsætning (for eksempel virker e-maillogin ikke uden en konfigureret Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'da', $d128$Opret en ny underopgave fra en e-mail$d128$, $d128$Et vindue til at tildele en person direkte fra Gmail.$d128$, $d128$Hvis en e-mail skal blive til en ny opgave, kan udvidelsen gøre det fra Gmail. Et vindue lader dig tildele en person (livesøgning efter navn) og vedhæfte e-mailfiler.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'da', $d128$Kalenderintegration$d128$, $d128$Abonner på et `.ics`-feed i Google/Apple Calendar for frister.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Opgaver med frister kan vises i Google eller Apple Calendar ved at abonnere på et personligt `.ics`-feed, der genereres til din bruger. Feedet opdateres, når frister ændres, så kalenderen forbliver aktuel uden manuel synkronisering.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'da', $d128$Træk og slip i Kanban-stil$d128$, $d128$En grupperet tabel: træk mellem statusgrupper for at ændre status.$d128$, $d128$I opgavetabellen er statusser grupperet i kolonner eller gruppeoverskrifter. Du ændrer en opgaves status ved at trække den ind i en anden gruppe, som på et klassisk Kanban-tavle. Under træk vises en blå linje, hvor opgaven lander.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'da', $d128$Inviter teambrugere$d128$, $d128$Invitationer via e-mail, acceptér/afvis-forløb, send invitationslinket igen.$d128$, $d128$Du tilføjer personer til et team ved at sende en invitation til deres e-mail. Hvis de allerede har en {SYSTEM_NAME}-konto, får de en notifikation i appen; ellers åbner invitationslinket tilmeldingen med e-mailen udfyldt på forhånd.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Invitationen skal accepteres eller afvises - ingen tilføjes automatisk. Mens den afventer, kan du sende den igen eller trække den tilbage, og du kan kopiere linket for at sende det via en anden kanal (ikke kun e-mail).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'da', $d128$Forlad et team og fjern brugere$d128$, $d128$Hvordan en teambruger kan forlade, og hvordan en ejer fjerner brugere.$d128$, $d128$Enhver teambruger undtagen ejeren kan forlade teamet når som helst fra profilen eller teamsiden. En ejer eller en bruger med den rette adgang kan også fjerne andre fra teamet. Den tilladelse konfigureres separat og er ikke tilgængelig for standardbrugerrollen. Ejeren kan ikke fjernes og kan ikke forlade uden at overdrage ejerskabet.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'da', $d128$Opret en konto$d128$, $d128$Tilmeld dig med e-mail eller Google; adgangskoderegler og styrketjek.$d128$, $d128$Du kan oprette en {SYSTEM_NAME}-konto med e-mail og adgangskode eller ved at logge ind med Google. E-mailtilmelding kræver mindst en adgangskode af middel styrke og kan generere en sikker 16-tegns adgangskode, som du kan bruge eller erstatte. Ved Google-login kommer for- og efternavn fra Google-profilen. Efter e-mailtilmelding skal du bekræfte adressen, før du bruger systemet.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'da', $d128$Roller og adgangsniveauer$d128$, $d128$Standard systemroller, tilpassede roller, detaljeret adgang (mapper, arkiv, filupload, statusændringer).$d128$, $d128$Hver teambruger har en rolle, der definerer, hvad vedkommende må, fra grundlæggende brugerrettigheder til fuld administratoradgang.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roller kan indstilles i detaljer: tillad eller nægt oprettelse af mapper, visning af arkiv, filupload på underopgaver, statusændringer og andre specifikke handlinger.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Systemet leveres med flere standardroller, og en teamejer kan også oprette tilpassede roller med præcis de rettigheder, teamet har brug for.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'da', $d128$Katalog over betalte planer$d128$, $d128$Opret planer, tilknyt moduler, sæt priser.$d128$, $d128$En administrator kan oprette og administrere kataloget over betalte planer: pris, tilgængelige moduler og brugergrænser. Planer kan tildeles teams, og systemet begrænser funktioner til teamets aktive plan.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'da', $d128$Navigationsoversigt$d128$, $d128$Træ i sidebjælken (mapper, lister, opgaver), Hjem-visning, teamskifter.$d128$, $d128$Venstre sidebjælke viser et træ over dine mapper, lister og opgaver. Du kan udvide, skjule og omarrangere det ved at trække.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Øverst er en teamskifter, hvis du tilhører mere end ét team. Hjem samler opgaver tildelt til dig på tværs af lister, så du ser, hvad du skal gøre hver dag. Brugermenuen (øverst til højre) åbner profilindstillinger, notifikationer og logud.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'da', $d128$Ubetalt abonnementsstatus$d128$, $d128$Hvad der sker med adgangen, hvis betalingen fejler eller ikke fornyes.$d128$, $d128$Hvis et teams betaling fejler, eller abonnementet er inaktivt, ser almindelige brugere en begrænset, sløret visning med en blokerende besked. Teamejeren ser et tydeligt rødt advarselsbanner med, hvordan fakturering rettes. Grundlæggende navigation, teamskift og kontoindstillinger forbliver tilgængelige, så problemet kan løses uden risiko for datatab.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'da', $d128$OneDrive-integration$d128$, $d128$Samme idé som Google Drive: tilslut og synkroniser filer.$d128$, $d128$Ligesom Google Drive kan Microsoft OneDrive tilsluttes som fillagring på teamniveau. Efter tilslutning går nye filer til den OneDrive-konto, med samme bekvemmelighed og kontrol som Google Drive-opsætningen.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'da', $d128$Notifikationsindstillinger$d128$, $d128$Grupperede indstillinger efter kategori; gamle notifikationer ryddes automatisk.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Notifikationstyper kan justeres i et grupperet indstillingsvindue: opgavebegivenheder, påmindelser og teambegivenheder, hver med sin egen til/fra-kontakt. Ældre læste notifikationer slettes efter 30 dage, så listen forbliver overskuelig.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'da', $d128$Notifikationstyper$d128$, $d128$Tildeling, kommentarer, filer, statusændringer, teambegivenheder.$d128$, $d128$

Systemet opretter notifikationer for begivenheder, der berører dig: en opgave tildelt til dig, fjernet fra dig, en fil tilføjet, en statusændring eller en ny underopgave under dit opsyn. De vises ved klokkeikonet med et ulæst antal.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'da', $d128$Tilpassede statusser i skabeloner$d128$, $d128$Hver skabelonopgave kan have sit eget sæt statusser.$d128$, $d128$Hver opgave i en skabelon kan have et andet statussæt end listens standard. For eksempel kan en opgave i produktionsfasen bruge et andet forløb end en opgave i leveringsfasen.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Opgaver med tilpassede statusser er markeret i skabelonen, så de er nemme at få øje på.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'da', $d128$Første liste og opgave$d128$, $d128$Grundforløb: opret en liste, tilføj en opgave, skift status.$d128$, $d128$En liste er den grundlæggende arbejdsenhed i {SYSTEM_NAME}. Den rummer opgaver til ét projekt, proces eller område. Når du har oprettet en liste, kan du tilføje opgaver, hver med en tildelt person og en status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Du ændrer en opgaves status med ét klik eller ved at trække den mellem statusgrupper i tabelvisningen.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Hvis en opgave er mere kompleks, opdel den i underopgaver, hver med sit eget statusflow.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'da', $d128$Opret dit første team$d128$, $d128$Sådan opretter du et team, inviterer de første brugere, og hvordan ejerrollen fungerer.$d128$, $d128$For at starte i {SYSTEM_NAME} opretter du eller tilslutter dig et team. Produktet er bygget til fælles arbejde, ikke kun personlig brug. Når du opretter et team, bliver du ejer med fuld adgang til funktioner og indstillinger. Derfra inviterer du kolleger, opretter de første lister og strukturerer arbejdet. Én bruger uden andre teambrugere er gratis; tilføjelse af en anden person gør det til et betalt team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'da', $d128$Private lister$d128$, $d128$Sådan opretter du en liste, der kun er synlig for udvalgte teambrugere.$d128$, $d128$En liste kan gøres privat, så den ikke vises i sidebjælkens træ for brugere uden direkte adgang. Det hjælper med følsomme oplysninger eller et lille udsnit af opgaver, der ikke er beregnet til hele teamet. Hvis en administrator slår funktionen fra for hele systemet, bliver eksisterende private lister synlige inden for teamet.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'da', $d128$Skabeloneditor$d128$, $d128$Navngivne skabeloner med mapper, opgaver og underopgaver; sekventiel indtastning.$d128$, $d128$På teamniveau kan du oprette genbrugelige skabeloner med en færdig struktur af mapper, opgaver og underopgaver. Det hjælper, når lignende projekter starter med den samme arbejdsrækkefølge.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Skabeloneditoren lader dig tilføje elementer i rækkefølge og allerede tildele en person og tjeklistepunkter på skabelonniveau.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'da', $d128$Listeadgangsniveauer$d128$, $d128$Fuld redigering / redigering / kommentar / kun visning / ingen adgang, pr. liste.$d128$, $d128$Udover teamrollen kan hver liste sætte et adgangsniveau pr. bruger eller rolle: fuld redigering, redigering, kun kommentar, kun visning eller ingen adgang.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

For eksempel kan en projektleder have fuld kontrol over en liste, mens andre teambrugere kun ser den. Den effektive adgang kombinerer teamrollens rettigheder med listens indstillinger.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'da', $d128$Lister og mappestruktur$d128$, $d128$Mapper og undermapper til at organisere lister, opgaver og filer.$d128$, $d128${SYSTEM_NAME} organiserer arbejde med mapper og undermapper til lister, opgaver og filer - for eksempel efter projekt, kunde eller afdeling. I sidebjælkens træ kan du trække elementer ind i en mappe eller ud af den. Strukturen kan være så dyb, som organisationen har brug for.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'da', $d128$Sessionsstyring$d128$, $d128$Login uafhængigt af webstedskontoen; sessionslængde.$d128$, $d128$Udvidelsen gemmer sin loginsession lokalt i browseren i cirka 30 dage, uanset om du er logget ind på {SYSTEM_NAME}-siden i den samme fane. Hvis sessionen er ugyldig, eller du kun er logget ud på webstedet, opdager udvidelsen det og beder dig kun om at logge ind igen, når det faktisk er nødvendigt.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'da', $d128$Sessionshåndtering$d128$, $d128$Husk mig, sessionslængde, log ud.$d128$, $d128$Når du logger ind, kan du vælge Husk mig, så sessionen bliver, efter browseren lukkes. Uden den indstilling slutter sessionen, når du lukker browseren. Logud fra webstedet påvirker ikke den separate session i Gmail-udvidelsen, som forbliver aktiv for sig selv.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'da', $d128$Systemmoduler$d128$, $d128$Slå funktioner til eller fra (private lister, filer, skabeloner, automatiseringer, kalender, cloudintegrationer).$d128$, $d128$En administrator kan slå systemfunktioner til eller fra globalt, for eksempel private lister, filupload, tjeklister, automatiseringer, skabeloner, kalenderintegration eller cloudlagring. Et deaktiveret modul forsvinder fra brugergrænsefladen og marketingssiden, så du styrer, hvad der er tilgængeligt i den installation eller betalte plan.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'da', $d128$Afledt status$d128$, $d128$Hvordan en overordnet opgaves status/fremdrift beregnes ud fra underopgaver.$d128$, $d128$For en opgave med underopgaver beregnes samlet status og fremdrift ud fra de underopgavers statusser. Ejeren behøver ikke at opdatere den overordnede status i hånden - den afspejler altid, hvor mange underopgaver der er færdige.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'da', $d128$Frister og påmindelser$d128$, $d128$Start-/forfaldsdatoer, relative etiketter (i dag/tilbage/overskredet), e-mailpåmindelser.$d128$, $d128$Hver opgave og underopgave kan have en startdato og en frist. Systemet viser en relativ etiket (for eksempel "i dag", "3 dage tilbage" eller "2 dage overskredet") afhængigt af statusgruppen. Hvis administratoren har slået det til, sender systemet e-mailpåmindelser om kommende start- eller forfaldsdatoer.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'da', $d128$Opgavestatusser$d128$, $d128$Systemets statuskatalog og tilpassede statusser pr. liste, inklusive rækkefølge.$d128$, $d128$Hver liste har et sæt statusser til opgavefaser, fra systemets standardkatalog til fuldt tilpassede statusser med eget navn, farve og rækkefølge.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Statusrækkefølgen sættes i listeindstillingerne. Den påvirker, hvordan opgaver sorteres i visninger, og hvordan den samlede fremdrift beregnes.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'da', $d128$Opgavehistorik$d128$, $d128$Fuld ændringslog (status, datoer, tildelte, filer, flytninger).$d128$, $d128$Hver opgave og underopgave gemmer en fuld ændringslog: statusændringer, datoændringer, tilføjelse og fjernelse af tildelte, redigering af titel og beskrivelse, flytninger mellem lister samt ændringer af filer og tjeklister. Du kan altid se, hvem der ændrede hvad og hvornår.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'da', $d128$Sprogvalg$d128$, $d128$Systemets standardsprog, personligt valg, sproggenkendelse for gæster.$d128$, $d128$For en indlogget bruger gemmes sproget på profilen og bruges overalt, på enhver enhed. For en gæst kommer det fra en browsercookie, eller hvis der ingen er, fra administratorens standardsprog. Du kan skifte sprog når som helst med skifteren, som viser flag og fulde sprognavne.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'da', $d128$Køb pladser$d128$, $d128$Sådan tilføjer du betalte pladser; automatisk køb, når du inviterer en ny.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Hvis du inviterer nogen, og teamet ikke har en ledig betalt plads, tilbyder systemet at købe en ekstra plads, før invitationen sendes. Du kan også købe pladser på forhånd fra teamets faktureringsside og vælge månedlig eller årlig fakturering.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'da', $d128$Brandtilpasning$d128$, $d128$Systemnavn, logo, favicon.$d128$, $d128$En administrator kan angive systemnavnet og uploade et logo og en favicon. Hvis der ikke er uploadet et logo, genererer systemet en avatar ud fra navnets første bogstaver. Disse ændringer vises overalt: i browserfanens titel, e-mailskabeloner og den offentlige marketingside.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'no', $d128$Abonnementsadministrasjon$d128$, $d128$Månedlig eller årlig fakturering, fakturaer, oppsigelse.$d128$, $d128$På teamets abonnementsside ser du gjeldende abonnementsstatus, velger mellom månedlig og årlig fakturering, og betaler gjennom en sikker Stripe-utsjekking. Hvis en betalt plass blir ledig (en teambruker fjernes), forblir den tilgjengelig til slutten av gjeldende faktureringssyklus i stedet for å gå tapt med en gang.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'no', $d128$Opprette underoppgaver$d128$, $d128$Del en oppgave i underoppgaver, hver med egen statusflyt.$d128$, $d128$Hvis en oppgave har flere steg som ulike personer kan gjøre til ulike tider, kan du dele den i underoppgaver. Hver underoppgave har egen statusflyt, tildelt person, frist og vedlegg - den fungerer som en liten oppgave inne i den overordnede oppgaven.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'no', $d128$Arkiv$d128$, $d128$Arkiver fullførte og slettede oppgaver/mapper, fargekoding, gjenoppretting.$d128$, $d128$Fullførte eller slettede oppgaver, underoppgaver og mapper forsvinner ikke med en gang. De går til arkivet, atskilt fra aktivt arbeid. Arkiverte elementer er fargekodet etter siste status, slik at du raskt ser forskjell, og du kan når som helst gjenopprette dem til den aktive listen.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'no', $d128$Støttede språk$d128$, $d128$Fullstendig oversikt over UI- og markedsføringsoversettelser (15 språk).$d128$, $d128${SYSTEM_NAME} sitt grensesnitt og markedsføringsinnhold er fullt oversatt til 15 språk, blant annet latvisk, engelsk og russisk. Under utviklingen sjekker systemet at ingen oversettelsesnøkkel eller plassholder mangler i noe støttet språk.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'no', $d128$Autentisering$d128$, $d128$E-post, Google-innlogging, passordkrav.$d128$, $d128${SYSTEM_NAME} støtter innlogging med e-post og passord, og med en Google-konto. Registrering og innlogging med e-post krever et tilstrekkelig sterkt passord og har en tilbakestillingsflyt hvis det blir glemt.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'no', $d128$Automatiseringer$d128$, $d128$Regler som automatisk bruker en mal på en ny mappe.$d128$, $d128$Automatiseringer lar systemet handle av seg selv under gitte vilkår. Den tilgjengelige automatiseringen bruker en valgt mal på alle nye mapper som opprettes i en bestemt liste. Hver nye prosjektmappe får da hele strukturen uten at oppsettet gjentas manuelt.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'no', $d128$Botbeskyttelse$d128$, $d128$Cloudflare Turnstile-sjekk på registrerings- og innloggingsskjemaer.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registrerings-, innloggings- og passordtilbakestillingsskjemaer er beskyttet med Cloudflare Turnstile. Det stopper automatiske, misbrukende forsøk på å opprette konto eller logge inn, uten å være til hinder for ekte brukere.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'no', $d128$Prismodell$d128$, $d128$Den første plassen er gratis; du betaler for hver ekstra teambruker.$d128$, $d128$Den første teamplassen i {SYSTEM_NAME} (eierplassen) er alltid gratis. Du betaler bare for hver ekstra teambruker utover den første plassen. Én person kan bruke systemet gratis uten tidsbegrensning; fakturering starter først når et ekte team blir dannet.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'no', $d128$Check List$d128$, $d128$En enkel sjekkliste inne i en underoppgave; den må være 100 % ferdig før lukking.$d128$, $d128$Inne i en underoppgave kan du legge til en enkel Check List for mindre, raskt avkryssede steg som ikke er fullverdige underoppgaver. Hvis sjekklisten ikke er helt ferdig, kan underoppgaven ikke flyttes til en lukket eller fullført statusgruppe. Statusene gjenspeiler da alltid den reelle tilstanden i arbeidet.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'no', $d128$Datakryptering$d128$, $d128$Kryptering av tilgangsnøkler for integrasjoner.$d128$, $d128$Alle integrasjonsopplysninger (for eksempel Google Drive eller andre tredjeparts autentiseringstokener) lagres kryptert, ikke som ren tekst i databasen. Selv med direkte databasetilgang er disse sensitive dataene ikke lesbare som de er.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'no', $d128$Dato- og tidsformater$d128$, $d128$Ukesstart, datoformat/skilletegn, 12/24-timers klokke.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Hver bruker kan sette foretrukket første ukedag, datoformat og skilletegn, og velge 12- eller 24-timers klokke. Disse personlige innstillingene overstyrer systemets standard satt av administratoren.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'no', $d128$Tofaktorautentisering (MFA)$d128$, $d128$Sett opp TOTP i profilen.$d128$, $d128$Hver bruker kan valgfritt slå på tofaktorautentisering i profilen med TOTP (en autentiseringsapp som Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Når MFA er på, ber hver innlogging også om en engangskode fra autentiseringsappen, i tillegg til passordet.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'no', $d128$Legge til en e-post i en oppgave$d128$, $d128$Importer e-posttekst og vedlegg fra Gmail; velg liste, mappe og oppgave.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Fra en hvilken som helst e-post i Gmail kan utvidelsen legge den til en valgt oppgave eller underoppgave. E-postteksten lagres som en tekstfil, og du kan velge vedlegg separat. Når du legger til, velger du nøyaktig destinasjon via liste, mappe, oppgave og underoppgave.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'no', $d128$E-postmaler$d128$, $d128$Rediger maler for registrering, passordtilbakestilling og varsler.$d128$, $d128$Alle e-poster systemet sender automatisk - registreringsbekreftelse, passordtilbakestilling, teaminvitasjon og andre systemvarsler - kan redigeres som HTML-maler i administrasjonspanelet, hver tilgjengelig på alle støttede systemspråk.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'no', $d128$Early Bird-tilbud$d128$, $d128$Et begrenset antall rabatterte plasser til de første kundene.$d128$, $d128$De første kundene får et begrenset antall rabatterte plasser fra en global Early Bird-pool. Så lenge det er plasser igjen i poolen, får en nykjøpt plass automatisk rabattprisen. Når en plass er ubrukt og abonnementet avsluttes, går den ikke tilbake til poolen.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'no', $d128$Sende en fil på e-post$d128$, $d128$Send et vedlegg fra systemet til en e-postadresse og følg leveringen.$d128$, $d128$Enhver fil på en underoppgave kan sendes på e-post til hvilken som helst adresse fra systemet, uten å åpne et eget e-postprogram.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Når du sender, kan du legge til emne og melding. Systemet viser leveringsstatus (sendt, levert eller mislykket) og beholder full videresendingshistorikk, med mulighet til å sende på nytt hvis leveringen mislykkes.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'no', $d128$Filopplasting$d128$, $d128$Tillatte filtyper, størrelsesgrenser, forhåndsvisning (PDF, bilder, txt).$d128$, $d128$Du kan legge ved filer i oppgavetreet, inne i underoppgaver, og i et eget Fil-vindu på mappenivå.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administratoren angir hvilke filtyper som kan lastes opp (for eksempel PDF, Word, Excel, DWG-tegninger, bilder eller arkiver). Systemet viser en tydelig feil hvis en fil ikke samsvarer. Bilder, PDF og tekstfiler kan forhåndsvises uten å forlate systemet.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'no', $d128$Fillagring og bruk$d128$, $d128$Server- versus skylagring i sidestolpen.$d128$, $d128$Over Innstillinger i sidestolpen ser du totalt filforbruk - filer på {SYSTEM_NAME}-serveren og filer i den tilkoblede skyen, telt hver for seg. Det gjør det tydelig hvor mye plass ulike filer tar, og hjelper deg å vurdere om du skal flytte til skylagring.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'no', $d128$Google Drive-integrasjon$d128$, $d128$Koble til en konto, lagre filer i Drive automatisk, gi nytt navn og last ned.$d128$, $d128$Når et teams Google Drive-konto er tilkoblet, lagres nyopplastede filer som standard i den Drive-kontoen i stedet for på {SYSTEM_NAME}-serveren. Det senker lagringskostnaden og holder dokumentene under din kontroll.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Du kan gi en fil nytt navn og laste den ned fra {SYSTEM_NAME}-grensesnittet, og endringene synkroniseres med Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'no', $d128$Installere og koble til$d128$, $d128$Installer utvidelsen og autoriser kontoen.$d128$, $d128${SYSTEM_NAME} Gmail-utvidelsen installeres i Chrome, og ber deg deretter koble den til {SYSTEM_NAME}-kontoen din gjennom en sikker autentiseringsflyt.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Utvidelsen har sin egen økt, uavhengig av innloggingen på nettstedet, så utlogging fra {SYSTEM_NAME}-nettstedet kobler ikke fra utvidelsen.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'no', $d128$Integrasjonsoppsett$d128$, $d128$Sett opp Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$I administrasjonspanelet konfigurerer du alle eksterne tjenester som trengs for full funksjonalitet på ett sted: Google- og Microsoft OAuth-innlogging, Resend for e-post, Stripe for fakturering, Sentry for feilsporing og Umami for analyse. Hver integrasjon kan slås på eller av, og relaterte funksjoner avhenger av det oppsettet (for eksempel virker ikke e-postinnlogging uten en konfigurert Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'no', $d128$Opprette en ny underoppgave fra en e-post$d128$, $d128$Et dialogvindu for å tildele en person direkte fra Gmail.$d128$, $d128$Hvis en e-post skal bli en ny oppgave, kan utvidelsen gjøre det fra Gmail. Et dialogvindu lar deg tildele en person (søk etter navn) og legge ved e-postfiler.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'no', $d128$Kalenderintegrasjon$d128$, $d128$Abonner på en `.ics`-strøm i Google/Apple Calendar for frister.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Oppgaver med frister kan vises i Google eller Apple Calendar ved å abonnere på en personlig `.ics`-strøm som genereres for brukeren din. Strømmen oppdateres når fristene endres, slik at kalenderen holder seg oppdatert uten manuell synkronisering.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'no', $d128$Kanban-stil dra og slipp$d128$, $d128$En gruppert tabell: dra mellom statusgrupper for å endre status.$d128$, $d128$I oppgavetabellen er statuser gruppert i kolonner eller gruppeoverskrifter. Du endrer oppgavestatus ved å dra den til en annen gruppe, som på et klassisk Kanban-brett. Mens du drar, viser en blå strek hvor oppgaven lander.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'no', $d128$Invitere teambrukere$d128$, $d128$E-postinvitasjoner, godta/avslå-flyt, send invitasjonslenken på nytt.$d128$, $d128$Du legger til personer i et team ved å sende en invitasjon til e-posten deres. Hvis de allerede har en {SYSTEM_NAME}-konto, får de et varsel i appen; hvis ikke, åpner invitasjonslenken registrering med e-posten forhåndsutfylt.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Invitasjonen må godtas eller avslås - ingen blir lagt til automatisk. Mens den venter, kan du sende den på nytt eller trekke den tilbake, og du kan kopiere lenken for å sende den via en annen kanal (ikke bare e-post).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'no', $d128$Forlate et team og fjerne brukere$d128$, $d128$Hvordan en teambruker kan forlate, og hvordan en eier fjerner brukere.$d128$, $d128$Enhver teambruker unntatt eieren kan når som helst forlate teamet fra profilen eller teamsiden. En eier eller en bruker med riktig tilgang kan også fjerne andre fra teamet. Den tillatelsen settes separat og er ikke tilgjengelig for standard brukerrolle. Eieren kan ikke fjernes, og kan ikke forlate uten å overføre eierskapet.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'no', $d128$Opprette en konto$d128$, $d128$Registrer deg med e-post eller Google; passordregler og styrkesjekk.$d128$, $d128$Du kan opprette en {SYSTEM_NAME}-konto med e-post og passord, eller ved å logge inn med Google. E-postregistrering krever minst et passord med middels styrke og kan generere et sikkert 16-tegns passord som du kan bruke eller bytte ut. Med Google-innlogging kommer for- og etternavn fra Google-profilen. Etter e-postregistrering må du bekrefte adressen før du bruker systemet.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'no', $d128$Roller og tilgangsnivåer$d128$, $d128$Standard systemroller, egendefinerte roller, detaljert tilgang (mapper, arkiv, filopplasting, statusendringer).$d128$, $d128$Hver teambruker har en rolle som definerer hva de får gjøre, fra grunnleggende brukerrettigheter til full administratortilgang.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roller kan settes i detalj: tillat eller nekt oppretting av mapper, visning av arkiv, filopplasting på underoppgaver, statusendringer og andre spesifikke handlinger.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Systemet leveres med flere standardroller, og en teameier kan også opprette egendefinerte roller med nøyaktig de rettighetene teamet trenger.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'no', $d128$Katalog over betalte planer$d128$, $d128$Opprett planer, knytt moduler, sett priser.$d128$, $d128$En administrator kan opprette og administrere katalogen over betalte planer: pris, tilgjengelige moduler og brukergrenser. Planer kan tildeles team, og systemet begrenser funksjoner til teamets aktive plan.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'no', $d128$Navigasjonsoversikt$d128$, $d128$Sidestolpetre (mapper, lister, oppgaver), Hjem-visning, teamveksler.$d128$, $d128$Venstre sidestolpe viser et tre med mapper, lister og oppgaver. Du kan utvide, skjule og endre rekkefølgen ved å dra.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Øverst er en teamveksler hvis du tilhører mer enn ett team. Hjem samler oppgaver tildelt deg på tvers av lister, slik at du ser hva som skal gjøres hver dag. Brukermenyen (øverst til høyre) åpner profilinnstillinger, varsler og utlogging.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'no', $d128$Ubetalt abonnementsstatus$d128$, $d128$Hva som skjer med tilgangen hvis betalingen mislykkes eller ikke fornyes.$d128$, $d128$Hvis et teams betaling mislykkes eller abonnementet er inaktivt, ser vanlige brukere en begrenset, uskarpt visning med en blokkerende melding. Teameieren ser et tydelig rødt advarselsbanner med hvordan faktureringen rettes. Grunnleggende navigasjon, teambytte og kontoinnstillinger forblir tilgjengelige, slik at problemet kan løses uten risiko for tap av data.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'no', $d128$OneDrive-integrasjon$d128$, $d128$Samme idé som Google Drive: koble til og synkroniser filer.$d128$, $d128$Som Google Drive kan Microsoft OneDrive kobles til som fillagring på teamnivå. Etter tilkobling går nye filer til den OneDrive-kontoen, med samme bekvemmelighet og kontroll som Google Drive-oppsettet.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'no', $d128$Varselinnstillinger$d128$, $d128$Grupperte innstillinger etter kategori; gamle varsler ryddes automatisk.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Varseltyper kan justeres i et gruppert innstillingsvindu: oppgavehendelser, påminnelser og teamhendelser, hver med egen av/på-bryter. Eldre leste varsler slettes etter 30 dager, slik at listen holder seg oversiktlig.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'no', $d128$Varseltyper$d128$, $d128$Tildeling, kommentarer, filer, statusendringer, teamhendelser.$d128$, $d128$

Systemet lager varsler for hendelser som gjelder deg: en oppgave tildelt deg, fjernet fra deg, en fil lagt til, en statusendring, eller en ny underoppgave under oppsynet ditt. De vises på bjelleikonet med antall uleste.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'no', $d128$Egendefinerte statuser i maler$d128$, $d128$Hver maloppgave kan ha sitt eget sett med statuser.$d128$, $d128$Hver oppgave i en mal kan ha et annet statussett enn listens standard. For eksempel kan en produksjonsfaseoppgave bruke en annen flyt enn en leveransefaseoppgave.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Oppgaver med egendefinerte statuser er merket i malen, slik at de er lette å få øye på.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'no', $d128$Første liste og oppgave$d128$, $d128$Grunnleggende flyt: opprett en liste, legg til en oppgave, endre status.$d128$, $d128$En liste er den grunnleggende arbeidsenheten i {SYSTEM_NAME}. Den holder oppgaver for ett prosjekt, én prosess eller ett område. Etter at du har opprettet en liste, kan du legge til oppgaver, hver med en tildelt person og en status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Du endrer en oppgavestatus med ett klikk eller ved å dra den mellom statusgrupper i tabellvisningen.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Hvis en oppgave er mer kompleks, del den i underoppgaver, hver med egen statusflyt.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'no', $d128$Opprette det første teamet$d128$, $d128$Hvordan du oppretter et team, inviterer de første brukerne, og hvordan eierrollen virker.$d128$, $d128$For å starte i {SYSTEM_NAME} oppretter eller blir du med i et team. Produktet er laget for felles arbeid, ikke bare personlig bruk. Når du oppretter et team, blir du eier med full tilgang til funksjoner og innstillinger. Derfra inviterer du kolleger, oppretter de første listene og strukturerer arbeidet. Én bruker uten andre teambrukere er gratis; å legge til en annen person gjør det til et betalt team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'no', $d128$Private lister$d128$, $d128$Hvordan du oppretter en liste som bare vises for utvalgte teambrukere.$d128$, $d128$En liste kan gjøres privat, slik at den ikke vises i sidestolpetreet for brukere uten direkte tilgang. Det hjelper med sensitiv informasjon eller en liten delmengde oppgaver som ikke er ment for hele teamet. Hvis en administrator slår av denne funksjonen for hele systemet, blir eksisterende private lister synlige inne i teamet.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'no', $d128$Maleditor$d128$, $d128$Navngitte maler med mapper, oppgaver og underoppgaver; sekvensiell innlegging.$d128$, $d128$På teamnivå kan du opprette gjenbrukbare maler med en ferdig struktur av mapper, oppgaver og underoppgaver. Det hjelper når lignende prosjekter starter med samme arbeidsrekkefølge.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Maleditoren lar deg legge til elementer i rekkefølge og allerede tildele en person og sjekklistepunkter på malnivå.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'no', $d128$Listetilgangsnivåer$d128$, $d128$Full redigering / rediger / kommenter / kun visning / ingen tilgang, per liste.$d128$, $d128$I tillegg til teamrollen kan hver liste sette et tilgangsnivå per bruker eller rolle: full redigering, rediger, kun kommentar, kun visning, eller ingen tilgang.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

For eksempel kan én prosjektleder ha full kontroll over en liste mens andre teambrukere bare ser den. Effektiv tilgang kombinerer teamrollens rettigheter med den listen sine innstillinger.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'no', $d128$Lister og mappestruktur$d128$, $d128$Mapper og undermapper for å organisere lister, oppgaver og filer.$d128$, $d128${SYSTEM_NAME} organiserer arbeidet med mapper og undermapper for lister, oppgaver og filer - for eksempel etter prosjekt, kunde eller avdeling. I sidestolpetreet kan du dra elementer inn i en mappe eller ut av den. Strukturen kan være så dyp som organisasjonen trenger.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'no', $d128$Øktadministrasjon$d128$, $d128$Innlogging uavhengig av nettstedskontoen; øktlengde.$d128$, $d128$Utvidelsen beholder innloggingsøkten lokalt i nettleseren i omtrent 30 dager, uansett om du er logget inn på {SYSTEM_NAME}-nettstedet i samme fane. Hvis økten er ugyldig, eller du bare logget ut på nettstedet, merker utvidelsen det og ber deg logge inn på nytt bare når det faktisk trengs.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'no', $d128$Økthåndtering$d128$, $d128$Husk meg, øktlengde, utlogging.$d128$, $d128$Når du logger inn, kan du velge Husk meg, slik at økten blir værende etter at nettleseren er lukket. Uten det valget avsluttes økten når du lukker nettleseren. Utlogging fra nettstedet påvirker ikke den separate Gmail-utvidelsesøkten, som forblir aktiv på egen hånd.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'no', $d128$Systemmoduler$d128$, $d128$Slå funksjoner på eller av (private lister, filer, maler, automatiseringer, kalender, skyintegrasjoner).$d128$, $d128$En administrator kan slå systemfunksjoner på eller av globalt, for eksempel private lister, filopplasting, sjekklister, automatiseringer, maler, kalenderintegrasjon eller skylagring. En deaktivert modul forsvinner fra brukergrensesnittet og markedsføringssiden, slik at du styrer hva som er tilgjengelig i den installasjonen eller betalte planen.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'no', $d128$Avledet status$d128$, $d128$Hvordan en overordnet oppgaves status/fremdrift beregnes fra underoppgaver.$d128$, $d128$For en oppgave med underoppgaver beregnes samlet status og fremdrift fra underoppgavenes statuser. Eieren trenger ikke å oppdatere den overordnede statusen for hånd - den gjenspeiler alltid hvor mange underoppgaver som er ferdige.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'no', $d128$Frister og påminnelser$d128$, $d128$Start-/forfallsdatoer, relative etiketter (i dag/igjen/forfalt), e-postpåminnelser.$d128$, $d128$Hver oppgave og underoppgave kan ha en startdato og en frist. Systemet viser en relativ etikett (for eksempel "i dag", "3 dager igjen" eller "2 dager forfalt") avhengig av statusgruppen. Hvis administratoren har slått det på, sender systemet e-postpåminnelser om kommende start- eller forfallsdatoer.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'no', $d128$Oppgavestatuser$d128$, $d128$Systemets statuskatalog og egendefinerte statuser per liste, inkludert rekkefølge.$d128$, $d128$Hver liste har et sett med statuser for oppgavefaser, fra systemets standardkatalog til helt egendefinerte statuser med eget navn, farge og rekkefølge.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Statusrekkefølgen settes i listeinnstillingene. Den påvirker hvordan oppgaver sorteres i visninger, og hvordan samlet fremdrift beregnes.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'no', $d128$Oppgavehistorikk$d128$, $d128$Full endringslogg (status, datoer, tildelte, filer, flyttinger).$d128$, $d128$Hver oppgave og underoppgave har en full endringslogg: statusendringer, datoendringer, tillegging og fjerning av tildelte personer, redigering av tittel og beskrivelse, flytting mellom lister, og endringer i filer og sjekkliste. Du kan alltid se hvem som endret hva og når.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'no', $d128$Språkvalg$d128$, $d128$Systemets standardspråk, personlig valg, språkgjenkjenning for gjester.$d128$, $d128$For en innlogget bruker lagres språket på profilen og brukes overalt, på alle enheter. For en gjest kommer det fra en nettleserinformasjonskapsel, eller hvis ingen finnes, fra administratorens standard språk. Du kan når som helst bytte språk med velgeren, som viser flagg og fulle språknavn.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'no', $d128$Kjøpe plasser$d128$, $d128$Hvordan du legger til betalte plasser; automatisk kjøp når du inviterer noen nye.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Hvis du inviterer noen og teamet ikke har en ledig betalt plass, tilbyr systemet å kjøpe en ekstra plass før invitasjonen sendes. Du kan også kjøpe plasser på forhånd fra teamets abonnementsside, og velge månedlig eller årlig fakturering.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'no', $d128$Merkevaretilpasning$d128$, $d128$Systemnavn, logo, favicon.$d128$, $d128$En administrator kan sette systemnavnet og laste opp en logo og et favicon. Hvis ingen logo er lastet opp, lager systemet et avatar fra forbokstavene i navnet. Disse endringene vises overalt: nettleserfanens tittel, e-postmaler og den offentlige markedsføringssiden.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'fi', $d128$Tilauksen hallinta$d128$, $d128$Kuukausi- tai vuosilaskutus, laskut, irtisanominen.$d128$, $d128$Tiimin laskutussivulla näet nykyisen tilauksen tilan, valitset kuukausi- ja vuosilaskutuksen välillä ja maksat suojatun Stripe-kassan kautta. Jos maksettu paikka vapautuu (tiimin käyttäjä poistetaan), se pysyy käytettävissä nykyisen laskutusjakson loppuun asti sen sijaan, että se menetettäisiin heti.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'fi', $d128$Osatehtävien luominen$d128$, $d128$Jaa tehtävä osatehtäviin, joilla kullakin on oma tilakulku.$d128$, $d128$Jos tehtävällä on useita vaiheita, joita eri ihmiset voivat tehdä eri aikoina, voit jakaa sen osatehtäviin. Jokaisella osatehtävällä on oma tilakulku, vastuuhenkilö, eräpäivä ja liitteet - se toimii kuin pieni tehtävä emotehtävän sisällä.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'fi', $d128$Arkisto$d128$, $d128$Arkistoi valmiit ja poistetut tehtävät/kansiot, värikoodaus, palautus.$d128$, $d128$Valmiit tai poistetut tehtävät, osatehtävät ja kansiot eivät katoa heti. Ne siirtyvät arkistoon, erilleen aktiivisesta työstä. Arkistoidut kohteet on värikoodattu viimeisimmän tilan mukaan, jotta erotat ne nopeasti, ja voit palauttaa ne aktiiviseen listaan milloin tahansa.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'fi', $d128$Tuetut kielet$d128$, $d128$Täydellinen luettelo käyttöliittymän ja markkinoinnin käännöksistä (15 kieltä).$d128$, $d128${SYSTEM_NAME}-käyttöliittymä ja markkinointisisältö on käännetty kokonaan 15 kielelle, muun muassa latviaksi, englanniksi ja venäjäksi. Kehityksen aikana järjestelmä tarkistaa, ettei yksikään käännösavain tai paikkamerkki puutu mistään tuetusta kielestä.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'fi', $d128$Tunnistautuminen$d128$, $d128$Sähköposti, Google-kirjautuminen, salasanavaatimukset.$d128$, $d128${SYSTEM_NAME} tukee kirjautumista sähköpostilla ja salasanalla sekä Google-tilillä. Sähköpostirekisteröinti ja -kirjautuminen edellyttävät riittävän vahvaa salasanaa ja sisältävät nollauspolun, jos salasana unohtuu.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'fi', $d128$Automaatiot$d128$, $d128$Säännöt, jotka käyttävät mallia automaattisesti uuteen kansioon.$d128$, $d128$Automaatiot antavat järjestelmän toimia itse tietyissä ehdoissa. Saatavilla oleva automaatio käyttää valittua mallia jokaiseen uuteen kansioon, joka luodaan tietyssä listassa. Jokainen uusi projektikansio saa tällöin koko rakenteen ilman, että asetusta toistetaan käsin.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'fi', $d128$Bottisuoja$d128$, $d128$Cloudflare Turnstile -tarkistukset rekisteröinti- ja kirjautumislomakkeissa.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Rekisteröinti-, kirjautumis- ja salasanan nollauslomakkeet on suojattu Cloudflare Turnstilella. Se estää automaattiset, väärinkäyttöön tähtäävät tilinluonti- tai kirjautumisyritykset pysyen huomaamattomana oikeille käyttäjille.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'fi', $d128$Hinnoittelumalli$d128$, $d128$Ensimmäinen paikka on ilmainen; maksat jokaisesta lisäkäyttäjästä.$d128$, $d128$Ensimmäinen tiimipaikka {SYSTEM_NAME}-järjestelmässä (omistajan paikka) on aina ilmainen. Maksat vain jokaisesta lisäkäyttäjästä ensimmäisen paikan lisäksi. Yksi henkilö voi käyttää järjestelmää ilmaiseksi ilman aikarajaa; laskutus alkaa vasta, kun muodostuu oikea tiimi.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'fi', $d128$Check List$d128$, $d128$Yksinkertainen tarkistuslista osatehtävän sisällä; sen on oltava 100 % valmis ennen sulkemista.$d128$, $d128$Osatehtävän sisällä voit lisätä yksinkertaisen Check Listin pienempiä, nopeasti rastitettavia vaiheita varten, jotka eivät ole täysiä osatehtäviä. Jos tarkistuslista ei ole kokonaan valmis, osatehtävää ei voi siirtää suljettuun tai valmiiseen tilaryhmään. Tilat heijastavat tällöin aina työn todellista tilaa.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'fi', $d128$Tietojen salaus$d128$, $d128$Integraatioiden käyttöoikeustunnusten salaus.$d128$, $d128$Kaikki integraatiotunnukset (esimerkiksi Google Drive tai muut kolmannen osapuolen autentikointitunnukset) tallennetaan salattuina, ei selvätekstinä tietokantaan. Jopa suoralla tietokantayhteydellä näitä arkaluonteisia tietoja ei voi lukea sellaisenaan.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'fi', $d128$Päivämäärä- ja aikaformaatit$d128$, $d128$Viikon alku, päivämäärämuoto/erotin, 12/24 tunnin kello.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Jokainen käyttäjä voi asettaa haluamansa viikon ensimmäisen päivän, päivämäärämuodon ja erottimen sekä valita 12- tai 24-tuntisen kellon. Nämä henkilökohtaiset asetukset ohittavat järjestelmän oletuksen, jonka ylläpitäjä on asettanut.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'fi', $d128$Kaksivaiheinen tunnistautuminen (MFA)$d128$, $d128$Ota TOTP käyttöön profiilissa.$d128$, $d128$Jokainen käyttäjä voi halutessaan ottaa kaksivaiheisen tunnistautumisen käyttöön profiilissaan TOTP:llä (todennussovellus, kuten Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Kun MFA on päällä, jokainen kirjautuminen pyytää salasanan lisäksi kertakoodin todennussovelluksesta.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'fi', $d128$Sähköpostin lisääminen tehtävään$d128$, $d128$Tuo sähköpostiteksti ja liitteet Gmailista; valitse lista, kansio ja tehtävä.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Mistään Gmailin sähköpostista laajennus voi lisätä sen valittuun tehtävään tai osatehtävään. Sähköpostin runko tallennetaan tekstitiedostona, ja liitteet voi valita erikseen. Lisätessä valitset tarkan kohteen listan, kansion, tehtävän ja osatehtävän kautta.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'fi', $d128$Sähköpostimallit$d128$, $d128$Muokkaa rekisteröinti-, salasanan nollaus- ja ilmoitusmalleja.$d128$, $d128$Kaikki järjestelmän automaattisesti lähettämät sähköpostit - rekisteröintivahvistus, salasanan nollaus, tiimikutsu ja muut järjestelmäilmoitukset - ovat muokattavissa HTML-malleina hallintapaneelissa, kukin kaikilla tuetuilla järjestelmäkielillä.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'fi', $d128$Early Bird -tarjous$d128$, $d128$Rajoitettu määrä alennettuja paikkoja ensimmäisille asiakkaille.$d128$, $d128$Ensimmäiset asiakkaat saavat rajoitetun määrän alennettuja paikkoja globaalista Early Bird -varannosta. Niin kauan kuin varannossa on paikkoja, vastikään ostettu paikka saa automaattisesti alennetun hinnan. Kun paikka on käyttämätön ja tilaus päättyy, se ei palaa varantoon.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'fi', $d128$Tiedoston lähettäminen sähköpostilla$d128$, $d128$Lähetä liite järjestelmästä sähköpostiosoitteeseen ja seuraa toimitusta.$d128$, $d128$Minkä tahansa osatehtävän tiedoston voi lähettää sähköpostitse mihin tahansa osoitteeseen järjestelmästä, avaamatta erillistä sähköpostisovellusta.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Lähettäessä voit lisätä aiheen ja viestin. Järjestelmä näyttää toimitustilan (lähetetty, toimitettu tai epäonnistunut) ja säilyttää täyden edelleenlähetyshistorian sekä mahdollisuuden lähettää uudelleen, jos toimitus epäonnistuu.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'fi', $d128$Tiedoston lataaminen$d128$, $d128$Sallitut tiedostotyypit, kokorajat, esikatselu (PDF, kuvat, txt).$d128$, $d128$Voit liittää tiedostoja tehtäväpuuhun, osatehtävien sisälle ja erilliseen Tiedostot-ikkunaan kansion tasolla.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Ylläpitäjä määrittää, mitä tiedostotyyppejä saa ladata (esimerkiksi PDF, Word, Excel, DWG-piirustukset, kuvat tai arkistot). Järjestelmä näyttää selkeän virheen, jos tiedosto ei täytä ehtoja. Kuvat, PDF ja tekstitiedostot voi esikatsella poistumatta järjestelmästä.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'fi', $d128$Tiedostotilan käyttö$d128$, $d128$Palvelimen ja pilvitallennuksen määrä sivupalkissa.$d128$, $d128$Asetusten yläpuolella sivupalkissa näet tiedostotilan kokonaiskäytön - tiedostot {SYSTEM_NAME}-palvelimella ja yhdistetyssä pilvessä, laskettuna erikseen. Näin näet selvästi, kuinka paljon tilaa eri tiedostot vievät, ja voit päättää, kannattaako siirtyä pilvitallennukseen.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'fi', $d128$Google Drive -integraatio$d128$, $d128$Yhdistä tili, tallenna tiedostot Driveen automaattisesti, nimeä uudelleen ja lataa.$d128$, $d128$Kun tiimin Google Drive -tili on yhdistetty, juuri ladatut tiedostot tallennetaan oletuksena kyseiseen Driveen {SYSTEM_NAME}-palvelimen sijaan. Se laskee tallennuskustannuksia ja pitää asiakirjat hallinnassasi.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Voit nimetä tiedoston uudelleen ja ladata sen {SYSTEM_NAME}-käyttöliittymästä, ja muutokset synkronoituvat Driven kanssa.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'fi', $d128$Asennus ja yhdistäminen$d128$, $d128$Asenna laajennus ja valtuuta tili.$d128$, $d128${SYSTEM_NAME} Gmail-laajennus asennetaan Chromeen, minkä jälkeen se pyytää yhdistämään sen {SYSTEM_NAME}-tiliisi suojatun tunnistautumispolun kautta.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Laajennuksella on oma istunto, joka on riippumaton sivuston kirjautumisesta, joten uloskirjautuminen {SYSTEM_NAME}-sivustolta ei katkaise laajennusta.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'fi', $d128$Integraatioiden määritys$d128$, $d128$Määritä Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$Hallintapaneelissa määrität yhdessä paikassa kaikki ulkoiset palvelut, joita tarvitaan täyteen toiminnallisuuteen: Google- ja Microsoft OAuth -kirjautuminen, Resend sähköpostille, Stripe laskutukseen, Sentry virheseurantaan ja Umami analytiikkaan. Jokaisen integraation voi kytkeä päälle tai pois, ja liittyvät ominaisuudet riippuvat tästä asetuksesta (esimerkiksi sähköpostikirjautuminen ei toimi ilman määritettyä Resendiä).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'fi', $d128$Uuden osatehtävän luominen sähköpostista$d128$, $d128$Valintaikkuna henkilön määräämiseen suoraan Gmailista.$d128$, $d128$Jos sähköpostista pitäisi tulla uusi tehtävä, laajennus voi tehdä sen Gmailista. Valintaikkunassa voit määrätä henkilön (haku nimen perusteella) ja liittää sähköpostitiedostoja.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'fi', $d128$Kalenteri-integraatio$d128$, $d128$Tilaa `.ics`-syöte Google/Apple Calendarissa eräpäiviä varten.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Tehtävät, joilla on eräpäivä, voivat näkyä Google- tai Apple Calendarissa tilaamalla henkilökohtaisen `.ics`-syötteen, joka luodaan käyttäjällesi. Syöte päivittyy, kun eräpäivät muuttuvat, joten kalenteri pysyy ajan tasalla ilman manuaalista synkronointia.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'fi', $d128$Kanban-tyylinen vedä ja pudota$d128$, $d128$Ryhmitelty taulukko: vedä tilaryhmien välillä vaihtaaksesi tilan.$d128$, $d128$Tehtävätaulukossa tilat on ryhmitelty sarakkeisiin tai ryhmäotsikoihin. Muutat tehtävän tilaa vetämällä sen toiseen ryhmään, kuten klassisella Kanban-taululla. Vedon aikana sininen viiva näyttää, mihin tehtävä laskeutuu.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'fi', $d128$Tiimin käyttäjien kutsuminen$d128$, $d128$Sähköpostikutsut, hyväksymis-/hylkäyspolku, kutsu-linkin uudelleenlähetys.$d128$, $d128$Lisäät ihmisiä tiimiin lähettämällä kutsun heidän sähköpostiinsa. Jos heillä on jo {SYSTEM_NAME}-tili, he saavat ilmoituksen sovelluksessa; jos ei, kutsu-linkki avaa rekisteröitymisen sähköposti valmiiksi täytettynä.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Kutsu on hyväksyttävä tai hylättävä - ketään ei lisätä automaattisesti. Kutsun ollessa odottavana voit lähettää sen uudelleen tai perua sen, ja voit kopioida linkin lähettääksesi sen toista kanavaa pitkin (ei vain sähköpostilla).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'fi', $d128$Tiimistä lähteminen ja käyttäjien poistaminen$d128$, $d128$Miten tiimin käyttäjä voi lähteä ja miten omistaja poistaa käyttäjiä.$d128$, $d128$Kuka tahansa tiimin käyttäjä paitsi omistaja voi milloin tahansa poistua tiimistä profiilistaan tai tiimisivulta. Omistaja tai käyttäjä, jolla on oikea käyttöoikeus, voi myös poistaa muita tiimistä. Tämä oikeus määritetään erikseen, eikä se ole oletuskäyttäjäroolin käytettävissä. Omistajaa ei voi poistaa, eikä hän voi lähteä siirtämättä omistajuutta.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'fi', $d128$Tilin luominen$d128$, $d128$Rekisteröidy sähköpostilla tai Googlella; salasanasäännöt ja vahvuustarkistus.$d128$, $d128$Voit luoda {SYSTEM_NAME}-tilin sähköpostilla ja salasanalla tai kirjautumalla Googlella. Sähköpostirekisteröinti edellyttää vähintään keskivahvaa salasanaa ja voi luoda turvallisen 16 merkin salasanan, jonka voit käyttää tai vaihtaa. Google-kirjautumisessa etu- ja sukunimi tulevat Google-profiilista. Sähköpostirekisteröinnin jälkeen osoite on vahvistettava ennen järjestelmän käyttöä.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'fi', $d128$Roolit ja käyttöoikeustasot$d128$, $d128$Järjestelmän oletusroolit, mukautetut roolit, tarkat oikeudet (kansiot, arkisto, tiedoston lataus, tilamuutokset).$d128$, $d128$Jokaisella tiimin käyttäjällä on rooli, joka määrittää, mitä hän saa tehdä, peruskäyttäjän oikeuksista täyteen ylläpitäjän käyttöoikeuteen.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roolit voi asettaa tarkasti: salli tai estä kansioiden luonti, arkiston katselu, tiedostojen lataaminen osatehtäviin, tilamuutokset ja muut tietyt toiminnot.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Järjestelmässä on useita oletusrooleja, ja tiimin omistaja voi myös luoda mukautettuja rooleja juuri niillä oikeuksilla, joita tiimi tarvitsee.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'fi', $d128$Maksullisten suunnitelmien luettelo$d128$, $d128$Luo suunnitelmia, liitä moduuleja, aseta hinnat.$d128$, $d128$Ylläpitäjä voi luoda ja hallita maksullisten suunnitelmien luetteloa: hinta, käytettävissä olevat moduulit ja käyttäjärajat. Suunnitelmia voi liittää tiimeihin, ja järjestelmä rajaa ominaisuudet tiimin aktiiviseen suunnitelmaan.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'fi', $d128$Navigoinnin yleiskuva$d128$, $d128$Sivupalkin puu (kansiot, listat, tehtävät), Koti-näkymä, tiiminvaihtaja.$d128$, $d128$Vasemmassa sivupalkissa näkyy kansioiden, listojen ja tehtävien puu. Voit avata, tiivistää ja järjestää sen uudelleen vetämällä.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Yläreunassa on tiiminvaihtaja, jos kuulut useampaan kuin yhteen tiimiin. Koti kerää sinulle määrätyt tehtävät listojen välillä, jotta näet, mitä kunkin päivän aikana pitää tehdä. Käyttäjävalikko (oikealla ylhäällä) avaa profiiliasetukset, ilmoitukset ja uloskirjautumisen.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'fi', $d128$Maksamaton tilauksen tila$d128$, $d128$Mitä käyttöoikeudelle tapahtuu, jos maksu epäonnistuu tai sitä ei uusita.$d128$, $d128$Jos tiimin maksu epäonnistuu tai tilaus on passiivinen, tavalliset käyttäjät näkevät rajoitetun, sumean näkymän ja estävän viestin. Tiimin omistaja näkee selkeän punaisen varoituspalkin ohjeineen laskutuksen korjaamiseen. Perusnavigointi, tiimin vaihto ja tiliasetukset pysyvät käytettävissä, jotta ongelma voidaan ratkaista ilman tietojen menetyksen riskiä.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'fi', $d128$OneDrive-integraatio$d128$, $d128$Sama idea kuin Google Drivessa: yhdistä ja synkronoi tiedostot.$d128$, $d128$Kuten Google Drive, myös Microsoft OneDrive voidaan yhdistää tiimitason tiedostotallennukseksi. Yhdistämisen jälkeen uudet tiedostot siirtyvät kyseiselle OneDrive-tilille, samalla mukavuudella ja hallinnalla kuin Google Drive -asetuksessa.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'fi', $d128$Ilmoitusasetukset$d128$, $d128$Ryhmitellyt asetukset kategorioittain; vanhat ilmoitukset siivotaan automaattisesti.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Ilmoitustyyppejä voi säätää ryhmitellyssä asetusikkunassa: tehtävätapahtumat, muistutukset ja tiimitapahtumat, kullakin oma päälle/pois-kytkin. Vanhemmat luetut ilmoitukset poistetaan 30 päivän kuluttua, jotta lista pysyy luettavana.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'fi', $d128$Ilmoitustyypit$d128$, $d128$Määräys, kommentit, tiedostot, tilamuutokset, tiimitapahtumat.$d128$, $d128$

Järjestelmä luo ilmoituksia tapahtumista, jotka koskevat sinua: sinulle määrätty tehtävä, tehtävän poisto sinulta, tiedoston lisäys, tilamuutos tai uusi osatehtävä valvonnassasi. Ne näkyvät kellokuvakkeessa lukemattomien määrän kanssa.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'fi', $d128$Mukautetut tilat malleissa$d128$, $d128$Jokaisella mallitehtävällä voi olla oma tilajoukko.$d128$, $d128$Jokaisella mallin tehtävällä voi olla eri tilajoukko kuin listan oletus. Esimerkiksi tuotantovaiheen tehtävä voi käyttää eri kulkua kuin toimitusvaiheen tehtävä.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Mukautetuilla tiloilla varustetut tehtävät on merkitty malliin, jotta ne on helppo huomata.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'fi', $d128$Ensimmäinen lista ja tehtävä$d128$, $d128$Peruspolku: luo lista, lisää tehtävä, vaihda tila.$d128$, $d128$Lista on {SYSTEM_NAME}-järjestelmän perusyksikkö. Se sisältää tehtävät yhtä projektia, prosessia tai aluetta varten. Listan luomisen jälkeen voit lisätä tehtäviä, kullakin vastuuhenkilö ja tila.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Muutat tehtävän tilaa yhdellä napsautuksella tai vetämällä sen tilaryhmien välillä taulukkonäkymässä.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Jos tehtävä on monimutkaisempi, jaa se osatehtäviin, joilla kullakin on oma tilakulku.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'fi', $d128$Ensimmäisen tiimin luominen$d128$, $d128$Miten luot tiimin, kutsut ensimmäiset käyttäjät ja miten omistajan rooli toimii.$d128$, $d128$Aloittaaksesi {SYSTEM_NAME}-järjestelmässä luot tiimin tai liityt siihen. Tuote on rakennettu jaettuun työhön, ei vain henkilökohtaiseen käyttöön. Kun luot tiimin, sinusta tulee sen omistaja, jolla on täysi pääsy ominaisuuksiin ja asetuksiin. Siitä eteenpäin kutsut kollegoita, luot ensimmäiset listat ja rakennat työn rakenteen. Yksi käyttäjä ilman muita tiimin käyttäjiä on ilmainen; toisen henkilön lisääminen tekee siitä maksullisen tiimin.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'fi', $d128$Yksityiset listat$d128$, $d128$Miten luot listan, jonka näkevät vain valitut tiimin käyttäjät.$d128$, $d128$Listan voi tehdä yksityiseksi, jotta se ei näy sivupalkin puussa käyttäjille, joilla ei ole suoraa pääsyä. Se auttaa arkaluonteisessa tiedossa tai pienessä tehtäväjoukossa, joka ei ole tarkoitettu koko tiimille. Jos ylläpitäjä kytkee ominaisuuden pois koko järjestelmästä, olemassa olevat yksityiset listat tulevat näkyviin tiimin sisällä.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'fi', $d128$Mallieditori$d128$, $d128$Nimetyt mallit kansioineen, tehtävineen ja osatehtävineen; peräkkäinen syöttö.$d128$, $d128$Tiimitasolla voit luoda uudelleenkäytettäviä malleja, joissa on valmis kansioiden, tehtävien ja osatehtävien rakenne. Se auttaa, kun samankaltaiset projektit alkavat samalla työsarjalla.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Mallieditorissa voit lisätä kohteita järjestyksessä ja määrätä jo mallitasolla henkilön ja tarkistuslistan kohdat.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'fi', $d128$Listan käyttöoikeustasot$d128$, $d128$Täysi muokkaus / muokkaus / kommentointi / vain katselu / ei pääsyä, listakohtaisesti.$d128$, $d128$Tiimiroolin lisäksi jokaiselle listalle voi asettaa käyttöoikeustason käyttäjä- tai roolikohtaisesti: täysi muokkaus, muokkaus, vain kommentointi, vain katselu tai ei pääsyä.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Esimerkiksi yksi projektivastaava voi hallita listaa täysin, kun muut tiimin käyttäjät vain katsovat sitä. Todellinen käyttöoikeus yhdistää tiimiroolin oikeudet ja kyseisen listan asetukset.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'fi', $d128$Listat ja kansiorakenne$d128$, $d128$Kansiot ja alikansiot listojen, tehtävien ja tiedostojen järjestämiseen.$d128$, $d128${SYSTEM_NAME} järjestää työn kansioilla ja alikansioilla listoja, tehtäviä ja tiedostoja varten - esimerkiksi projektin, asiakkaan tai osaston mukaan. Sivupalkin puussa voit vetää kohteita kansioon tai pois siitä. Rakenne voi olla niin syvä kuin organisaatio tarvitsee.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'fi', $d128$Istunnon hallinta$d128$, $d128$Kirjautuminen riippumaton sivuston tilistä; istunnon kesto.$d128$, $d128$Laajennus säilyttää kirjautumisistuntonsa paikallisesti selaimessa noin 30 päivää, olitpa kirjautuneena {SYSTEM_NAME}-sivustolle samassa välilehdessä tai et. Jos istunto on virheellinen tai kirjauduit ulos vain sivustolta, laajennus huomaa sen ja pyytää kirjautumaan uudelleen vasta, kun se on oikeasti tarpeen.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'fi', $d128$Istunnon käsittely$d128$, $d128$Muista minut, istunnon kesto, uloskirjautuminen.$d128$, $d128$Kirjautuessasi voit valita Muista minut, jotta istunto säilyy selaimen sulkemisen jälkeen. Ilman tätä valintaa istunto päättyy, kun suljet selaimen. Uloskirjautuminen sivustolta ei vaikuta erilliseen Gmail-laajennuksen istuntoon, joka pysyy aktiivisena omillaan.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'fi', $d128$Järjestelmämoduulit$d128$, $d128$Kytke ominaisuuksia päälle tai pois (yksityiset listat, tiedostot, mallit, automaatiot, kalenteri, pilvi-integraatiot).$d128$, $d128$Ylläpitäjä voi kytkeä järjestelmäominaisuuksia päälle tai pois globaalisti, esimerkiksi yksityiset listat, tiedoston lataus, tarkistuslistat, automaatiot, mallit, kalenteri-integraatio tai pilvitallennus. Pois kytketty moduuli katoaa käyttöliittymästä ja markkinointisivulta, joten hallitset, mitä kyseisessä asennuksessa tai maksullisessa suunnitelmassa on saatavilla.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'fi', $d128$Johdettu tila$d128$, $d128$Miten emotehtävän tila/edistyminen lasketaan osatehtävistä.$d128$, $d128$Osatehtäviä sisältävän tehtävän kokonaistila ja edistyminen lasketaan osatehtävien tiloista. Omistajan ei tarvitse päivittää emotehtävän tilaa käsin - se heijastaa aina, kuinka monta osatehtävää on valmiina.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'fi', $d128$Eräpäivät ja muistutukset$d128$, $d128$Aloitus-/eräpäivät, suhteelliset tarrat (tänään/jäljellä/myöhässä), sähköpostimuistutukset.$d128$, $d128$Jokaisella tehtävällä ja osatehtävällä voi olla aloituspäivä ja eräpäivä. Järjestelmä näyttää suhteellisen tarran (esimerkiksi "tänään", "3 päivää jäljellä" tai "2 päivää myöhässä") tilaryhmän mukaan. Jos ylläpitäjä on ottanut sen käyttöön, järjestelmä lähettää sähköpostimuistutuksia tulevista aloitus- tai eräpäivistä.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'fi', $d128$Tehtävien tilat$d128$, $d128$Järjestelmän tilaluettelo ja mukautetut tilat listakohtaisesti, mukaan lukien järjestys.$d128$, $d128$Jokaisella listalla on joukko tiloja tehtävävaiheille, järjestelmän oletusluettelosta täysin mukautettuihin tiloihin, joilla on oma nimi, väri ja järjestys.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Tilojen järjestys asetetaan listan asetuksissa. Se vaikuttaa siihen, miten tehtävät järjestetään näkymissä ja miten kokonaisedistyminen lasketaan.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'fi', $d128$Tehtävähistoria$d128$, $d128$Täysi muutosloki (tila, päivämäärät, vastuuhenkilöt, tiedostot, siirrot).$d128$, $d128$Jokainen tehtävä ja osatehtävä säilyttää täyden muutoslokin: tilamuutokset, päivämäärämuutokset, vastuuhenkilöiden lisäys ja poisto, otsikon ja kuvauksen muokkaukset, siirrot listojen välillä sekä tiedosto- ja tarkistuslistamuutokset. Näet aina, kuka muutti mitä ja milloin.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'fi', $d128$Kielen valinta$d128$, $d128$Järjestelmän oletuskieli, henkilökohtainen valinta, vieraan kielen tunnistus.$d128$, $d128$Kirjautuneelle käyttäjälle kieli tallennetaan profiiliin ja sitä käytetään kaikkialla, millä tahansa laitteella. Vieraalle se tulee selaimen evästeestä, tai jos evästettä ei ole, ylläpitäjän oletuskielestä. Voit vaihtaa kieltä milloin tahansa valitsimella, jossa näkyvät liput ja kielten täydet nimet.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'fi', $d128$Paikkojen ostaminen$d128$, $d128$Miten lisäät maksullisia paikkoja; automaattinen osto, kun kutsut uuden henkilön.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Jos kutsut jonkun eikä tiimillä ole vapaata maksettua paikkaa, järjestelmä tarjoaa ylimääräisen paikan ostamista ennen kutsun lähettämistä. Voit myös ostaa paikkoja etukäteen tiimin laskutussivulta ja valita kuukausi- tai vuosilaskutuksen.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'fi', $d128$Brändin mukauttaminen$d128$, $d128$Järjestelmän nimi, logo, favicon.$d128$, $d128$Ylläpitäjä voi asettaa järjestelmän nimen ja ladata logon sekä faviconin. Jos logoa ei ole ladattu, järjestelmä luo avataren nimen alkukirjaimista. Nämä muutokset näkyvät kaikkialla: selaimen välilehden otsikossa, sähköpostimalleissa ja julkisella markkinointisivulla.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'pl', $d128$Zarządzanie subskrypcją$d128$, $d128$Rozliczenie miesięczne lub roczne, faktury, rezygnacja.$d128$, $d128$Na stronie rozliczeń zespołu widzisz aktualny status subskrypcji, wybierasz rozliczenie miesięczne lub roczne i płacisz przez bezpieczną kasę Stripe. Jeśli płatne miejsce zwolni się (użytkownik zespołu zostanie usunięty), pozostaje dostępne do końca bieżącego cyklu rozliczeniowego, zamiast przepadać od razu.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'pl', $d128$Tworzenie podzadań$d128$, $d128$Podziel zadanie na podzadania, każde z własnym przepływem statusów.$d128$, $d128$Jeśli zadanie ma kilka kroków, które różne osoby mogą wykonać w różnym czasie, możesz podzielić je na podzadania. Każde podzadanie ma własny przepływ statusów, osobę odpowiedzialną, termin i załączniki - działa jak małe zadanie wewnątrz zadania nadrzędnego.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'pl', $d128$Archiwum$d128$, $d128$Archiwizuj ukończone i usunięte zadania/foldery, kodowanie kolorami, przywracanie.$d128$, $d128$Ukończone lub usunięte zadania, podzadania i foldery nie znikają od razu. Trafiają do archiwum, oddzielnie od aktywnej pracy. Zarchiwizowane elementy są oznaczone kolorem według ostatniego statusu, żeby szybko je rozróżnić, i w każdej chwili możesz przywrócić je do aktywnej listy.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'pl', $d128$Obsługiwane języki$d128$, $d128$Pełna lista tłumaczeń interfejsu i treści marketingowych (15 języków).$d128$, $d128$Interfejs i treści marketingowe {SYSTEM_NAME} są w pełni przetłumaczone na 15 języków, w tym łotewski, angielski i rosyjski. Podczas rozwoju system sprawdza, czy w żadnym obsługiwanym języku nie brakuje klucza tłumaczenia ani symbolu zastępczego.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'pl', $d128$Uwierzytelnianie$d128$, $d128$E-mail, logowanie Google, wymagania dotyczące hasła.$d128$, $d128${SYSTEM_NAME} obsługuje logowanie adresem e-mail i hasłem oraz kontem Google. Rejestracja i logowanie e-mailem wymagają wystarczająco silnego hasła i obejmują procedurę resetowania, gdy zostanie zapomniane.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'pl', $d128$Automatyzacje$d128$, $d128$Reguły, które automatycznie stosują szablon do nowego folderu.$d128$, $d128$Automatyzacje pozwalają systemowi działać samodzielnie w ustalonych warunkach. Dostępna automatyzacja stosuje wybrany szablon do każdego nowego folderu utworzonego na konkretnej liście. Każdy nowy folder projektu otrzymuje wtedy pełną strukturę bez ręcznego powtarzania konfiguracji.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'pl', $d128$Ochrona przed botami$d128$, $d128$Kontrole Cloudflare Turnstile w formularzach rejestracji i logowania.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Formularze rejestracji, logowania i resetowania hasła są chronione przez Cloudflare Turnstile. Blokuje automatyczne, nadużywające próby tworzenia kont lub logowania, pozostając nieinwazyjnym dla prawdziwych użytkowników.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'pl', $d128$Model cenowy$d128$, $d128$Pierwsze miejsce jest bezpłatne; płacisz za każdego dodatkowego użytkownika zespołu.$d128$, $d128$Pierwsze miejsce w zespole w {SYSTEM_NAME} (miejsce właściciela) jest zawsze bezpłatne. Płacisz tylko za każdego dodatkowego użytkownika zespołu ponad pierwsze miejsce. Jedna osoba może korzystać z systemu bezpłatnie bez limitu czasu; rozliczenia zaczynają się dopiero, gdy powstanie prawdziwy zespół.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'pl', $d128$Check List$d128$, $d128$Prosta lista kontrolna wewnątrz podzadania; musi być ukończona w 100% przed zamknięciem.$d128$, $d128$Wewnątrz podzadania możesz dodać prostą Check List na mniejsze, szybko odhaczane kroki, które nie są pełnymi podzadaniami. Jeśli lista kontrolna nie jest w pełni ukończona, podzadania nie można przenieść do grupy statusów zamkniętych lub ukończonych. Statusy zawsze odzwierciedlają wtedy rzeczywisty stan pracy.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'pl', $d128$Szyfrowanie danych$d128$, $d128$Szyfrowanie tokenów dostępu do integracji.$d128$, $d128$Wszystkie dane uwierzytelniające integracji (na przykład Google Drive lub inne tokeny uwierzytelniania stron trzecich) są przechowywane w postaci zaszyfrowanej, a nie jako zwykły tekst w bazie danych. Nawet przy bezpośrednim dostępie do bazy te wrażliwe dane nie są czytelne w oryginalnej postaci.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'pl', $d128$Formaty daty i godziny$d128$, $d128$Początek tygodnia, format/separator daty, czas 12/24-godzinny.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Każdy użytkownik może ustawić preferowany pierwszy dzień tygodnia, format i separator daty oraz wybrać czas 12- lub 24-godzinny. Te ustawienia osobiste zastępują domyślne ustawienia systemu określone przez administratora.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'pl', $d128$Uwierzytelnianie dwuskładnikowe (MFA)$d128$, $d128$Skonfiguruj TOTP w profilu.$d128$, $d128$Każdy użytkownik może opcjonalnie włączyć uwierzytelnianie dwuskładnikowe w profilu za pomocą TOTP (aplikacja uwierzytelniająca, na przykład Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Gdy MFA jest włączone, każde logowanie wymaga też jednorazowego kodu z aplikacji uwierzytelniającej, oprócz hasła.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'pl', $d128$Dodawanie e-maila do zadania$d128$, $d128$Importuj treść e-maila i załączniki z Gmail; wybierz listę, folder i zadanie.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Z dowolnej wiadomości w Gmail rozszerzenie może dodać ją do wybranego zadania lub podzadania. Treść e-maila jest zapisywana jako plik tekstowy, a załączniki możesz wybrać osobno. Przy dodawaniu wybierasz dokładne miejsce docelowe przez listę, folder, zadanie i podzadanie.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'pl', $d128$Szablony e-maili$d128$, $d128$Edytuj szablony rejestracji, resetowania hasła i powiadomień.$d128$, $d128$Wszystkie e-maile, które system wysyła automatycznie - potwierdzenie rejestracji, reset hasła, zaproszenie do zespołu i inne powiadomienia systemowe - są edytowalne jako szablony HTML w panelu administracyjnym, każdy dostępny w każdym obsługiwanym języku systemu.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'pl', $d128$Oferta Early Bird$d128$, $d128$Ograniczona liczba miejsc ze zniżką dla pierwszych klientów.$d128$, $d128$Pierwsi klienci otrzymują ograniczoną liczbę miejsc ze zniżką z globalnej puli Early Bird. Dopóki w puli są miejsca, nowo kupione miejsce automatycznie otrzymuje cenę zniżkową. Gdy miejsce jest niewykorzystane i subskrypcja się kończy, nie wraca do puli.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'pl', $d128$Wysyłanie pliku e-mailem$d128$, $d128$Wyślij załącznik z systemu na adres e-mail i śledź dostarczenie.$d128$, $d128$Dowolny plik przy podzadaniu można wysłać e-mailem na dowolny adres z systemu, bez otwierania osobnej aplikacji pocztowej.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Przy wysyłce możesz dodać temat i wiadomość. System pokazuje status dostarczenia (wysłano, dostarczono lub niepowodzenie) i przechowuje pełną historię przekazywania, z możliwością ponownego wysłania, jeśli dostarczenie się nie uda.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'pl', $d128$Przesyłanie plików$d128$, $d128$Dozwolone typy plików, limity rozmiaru, podgląd (PDF, obrazy, txt).$d128$, $d128$Możesz załączać pliki w drzewie zadań, wewnątrz podzadań oraz w osobnym oknie Pliki na poziomie folderu.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administrator ustala, które typy plików można przesyłać (na przykład PDF, Word, Excel, rysunki DWG, obrazy lub archiwa). System pokazuje wyraźny błąd, jeśli plik nie spełnia wymagań. Obrazy, PDF i pliki tekstowe można podglądać bez opuszczania systemu.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'pl', $d128$Zużycie pamięci na pliki$d128$, $d128$Objętość pamięci serwera i chmury w panelu bocznym.$d128$, $d128$Nad Ustawieniami w panelu bocznym widzisz łączne zużycie pamięci na pliki - pliki na serwerze {SYSTEM_NAME} i pliki w podłączonej chmurze, liczone osobno. Dzięki temu widać, ile miejsca zajmują różne pliki, i łatwiej zdecydować, czy przenieść je do chmury.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'pl', $d128$Integracja Google Drive$d128$, $d128$Podłącz konto, zapisuj pliki w Drive automatycznie, zmieniaj nazwę i pobieraj.$d128$, $d128$Gdy konto Google Drive zespołu jest podłączone, nowo przesłane pliki są domyślnie zapisywane na tym dysku Drive zamiast na serwerze {SYSTEM_NAME}. Obniża to koszt pamięci i zostawia dokumenty pod Twoją kontrolą.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Możesz zmienić nazwę pliku i pobrać go z interfejsu {SYSTEM_NAME}, a zmiany synchronizują się z Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'pl', $d128$Instalacja i połączenie$d128$, $d128$Zainstaluj rozszerzenie i autoryzuj konto.$d128$, $d128$Rozszerzenie Gmail {SYSTEM_NAME} instaluje się w Chrome, a następnie prosi o połączenie z kontem {SYSTEM_NAME} przez bezpieczny przepływ uwierzytelniania.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Rozszerzenie ma własną sesję, niezależną od logowania na stronie, więc wylogowanie z witryny {SYSTEM_NAME} nie odłącza rozszerzenia.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'pl', $d128$Konfiguracja integracji$d128$, $d128$Skonfiguruj Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$W panelu administracyjnym konfigurujesz w jednym miejscu wszystkie usługi zewnętrzne potrzebne do pełnej funkcjonalności: logowanie Google i Microsoft OAuth, Resend do e-maili, Stripe do rozliczeń, Sentry do śledzenia błędów i Umami do analityki. Każdą integrację można włączyć lub wyłączyć, a powiązane funkcje zależą od tej konfiguracji (na przykład logowanie e-mailem nie działa bez skonfigurowanego Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'pl', $d128$Tworzenie nowego podzadania z e-maila$d128$, $d128$Okno modalne do przypisania osoby bezpośrednio z Gmail.$d128$, $d128$Jeśli e-mail ma stać się nowym zadaniem, rozszerzenie może to zrobić z Gmail. Okno modalne pozwala przypisać osobę (wyszukiwanie na żywo po imieniu) i załączyć pliki z e-maila.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'pl', $d128$Integracja kalendarza$d128$, $d128$Subskrybuj kanał `.ics` w Google/Apple Calendar dla terminów.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Zadania z terminami mogą pojawiać się w Google lub Apple Calendar po zasubskrybowaniu osobistego kanału `.ics` wygenerowanego dla Twojego użytkownika. Kanał aktualizuje się, gdy terminy się zmieniają, więc kalendarz pozostaje aktualny bez ręcznej synchronizacji.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'pl', $d128$Przeciąganie w stylu Kanban$d128$, $d128$Tabela pogrupowana: przeciągnij między grupami statusów, aby zmienić status.$d128$, $d128$W tabeli zadań statusy są pogrupowane w kolumny lub nagłówki grup. Zmieniasz status zadania, przeciągając je do innej grupy, jak na klasycznej tablicy Kanban. Podczas przeciągania niebieska linia pokazuje, gdzie zadanie wyląduje.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'pl', $d128$Zapraszanie użytkowników zespołu$d128$, $d128$Zaproszenia e-mail, przepływ akceptacji/odrzucenia, ponowne wysłanie linku zaproszenia.$d128$, $d128$Dodajesz osoby do zespołu, wysyłając zaproszenie na ich e-mail. Jeśli mają już konto {SYSTEM_NAME}, dostają powiadomienie w aplikacji; jeśli nie, link zaproszenia otwiera rejestrację z wstępnie wypełnionym adresem e-mail.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Zaproszenie trzeba zaakceptować albo odrzucić - nikt nie jest dodawany automatycznie. Dopóki jest oczekujące, możesz je wysłać ponownie lub unieważnić, a także skopiować link, żeby wysłać go inną drogą (nie tylko e-mailem).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'pl', $d128$Opuszczanie zespołu i usuwanie użytkowników$d128$, $d128$Jak użytkownik zespołu może odejść i jak właściciel usuwa użytkowników.$d128$, $d128$Każdy użytkownik zespołu poza właścicielem może w każdej chwili opuścić zespół ze swojego profilu lub ze strony zespołu. Właściciel albo użytkownik z odpowiednim dostępem może też usuwać innych z zespołu. To uprawnienie konfiguruje się osobno i nie jest dostępne dla domyślnej roli użytkownika. Właściciela nie można usunąć i nie może odejść bez przekazania własności.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'pl', $d128$Tworzenie konta$d128$, $d128$Zarejestruj się e-mailem lub przez Google; reguły hasła i sprawdzanie siły.$d128$, $d128$Możesz utworzyć konto {SYSTEM_NAME} z e-mailem i hasłem albo logując się przez Google. Rejestracja e-mailem wymaga co najmniej hasła o średniej sile i może wygenerować bezpieczne 16-znakowe hasło, które możesz użyć lub wymienić. Przy logowaniu Google imię i nazwisko pochodzą z profilu Google. Po rejestracji e-mailem musisz potwierdzić adres, zanim zaczniesz korzystać z systemu.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'pl', $d128$Role i poziomy dostępu$d128$, $d128$Domyślne role systemowe, role niestandardowe, szczegółowy dostęp (foldery, archiwum, przesyłanie plików, zmiany statusu).$d128$, $d128$Każdy użytkownik zespołu ma rolę, która określa, co może robić, od podstawowych uprawnień użytkownika po pełny dostęp administratora.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Role można ustawić szczegółowo: zezwolić lub zabronić tworzenia folderów, przeglądania archiwum, przesyłania plików przy podzadaniach, zmian statusu i innych konkretnych działań.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

System dostarcza kilka ról domyślnych, a właściciel zespołu może też tworzyć role niestandardowe z dokładnie takimi uprawnieniami, jakich zespół potrzebuje.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'pl', $d128$Katalog planów płatnych$d128$, $d128$Twórz plany, przypinaj moduły, ustaw ceny.$d128$, $d128$Administrator może tworzyć i zarządzać katalogiem planów płatnych: cena, dostępne moduły i limity użytkowników. Plany można przypisywać zespołom, a system ogranicza funkcje do aktywnego planu zespołu.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'pl', $d128$Przegląd nawigacji$d128$, $d128$Drzewo w panelu bocznym (foldery, listy, zadania), widok Strona główna, przełącznik zespołów.$d128$, $d128$Lewy panel boczny pokazuje drzewo Twoich folderów, list i zadań. Możesz je rozwijać, zwijać i zmieniać kolejność przez przeciąganie.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Na górze jest przełącznik zespołów, jeśli należysz do więcej niż jednego. Strona główna zbiera zadania przypisane Tobie z różnych list, żebyś widział, co robić każdego dnia. Menu użytkownika (prawy górny róg) otwiera ustawienia profilu, powiadomienia i wylogowanie.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'pl', $d128$Stan nieopłaconej subskrypcji$d128$, $d128$Co dzieje się z dostępem, gdy płatność się nie uda lub nie zostanie odnowiona.$d128$, $d128$Jeśli płatność zespołu się nie powiedzie lub subskrypcja jest nieaktywna, zwykli użytkownicy widzą ograniczony, rozmazany widok z komunikatem blokującym. Właściciel zespołu widzi wyraźny czerwony pasek ostrzeżenia z informacją, jak naprawić rozliczenia. Podstawowa nawigacja, przełączanie zespołów i ustawienia konta pozostają dostępne, żeby problem dało się rozwiązać bez ryzyka utraty danych.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'pl', $d128$Integracja OneDrive$d128$, $d128$Ten sam pomysł co Google Drive: podłącz i synchronizuj pliki.$d128$, $d128$Podobnie jak Google Drive, Microsoft OneDrive można podłączyć jako pamięć plików na poziomie zespołu. Po podłączeniu nowe pliki trafiają na to konto OneDrive, z tą samą wygodą i kontrolą co w konfiguracji Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'pl', $d128$Ustawienia powiadomień$d128$, $d128$Ustawienia pogrupowane według kategorii; stare powiadomienia są czyszczone automatycznie.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Typy powiadomień można dostosować w oknie ustawień pogrupowanych: zdarzenia zadań, przypomnienia i zdarzenia zespołu, każde z własnym włącznikiem. Starsze przeczytane powiadomienia są usuwane po 30 dniach, żeby lista pozostała czytelna.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'pl', $d128$Typy powiadomień$d128$, $d128$Przypisanie, komentarze, pliki, zmiany statusu, zdarzenia zespołu.$d128$, $d128$

System tworzy powiadomienia o zdarzeniach, które Cię dotyczą: zadanie przypisane Tobie, zdjęte z Ciebie, dodany plik, zmiana statusu albo nowe podzadanie pod Twoją opieką. Pojawiają się przy ikonie dzwonka z liczbą nieprzeczytanych.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'pl', $d128$Niestandardowe statusy w szablonach$d128$, $d128$Każde zadanie w szablonie może mieć własny zestaw statusów.$d128$, $d128$Każde zadanie w szablonie może mieć inny zestaw statusów niż domyślny zestaw listy. Na przykład zadanie etapu produkcji może mieć inny przepływ niż zadanie etapu dostawy.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Zadania z niestandardowymi statusami są oznaczone w szablonie, żeby łatwo je zauważyć.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'pl', $d128$Pierwsza lista i zadanie$d128$, $d128$Podstawowy przepływ: utwórz listę, dodaj zadanie, zmień status.$d128$, $d128$Lista to podstawowa jednostka pracy w {SYSTEM_NAME}. Zawiera zadania jednego projektu, procesu lub obszaru. Po utworzeniu listy możesz dodawać zadania, każde z osobą odpowiedzialną i statusem.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Status zadania zmieniasz jednym kliknięciem albo przeciągając je między grupami statusów w widoku tabeli.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Jeśli zadanie jest bardziej złożone, podziel je na podzadania, każde z własnym przepływem statusów.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'pl', $d128$Tworzenie pierwszego zespołu$d128$, $d128$Jak utworzyć zespół, zaprosić pierwszych użytkowników i jak działa rola właściciela.$d128$, $d128$Żeby zacząć w {SYSTEM_NAME}, tworzysz zespół albo do niego dołączasz. Produkt jest zbudowany do wspólnej pracy, nie tylko do użytku osobistego. Gdy tworzysz zespół, stajesz się jego właścicielem z pełnym dostępem do funkcji i ustawień. Stamtąd zapraszasz współpracowników, tworzysz pierwsze listy i porządkujesz pracę. Jeden użytkownik bez innych użytkowników zespołu jest bezpłatny; dodanie drugiej osoby sprawia, że zespół staje się płatny.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'pl', $d128$Listy prywatne$d128$, $d128$Jak utworzyć listę widoczną tylko dla wybranych użytkowników zespołu.$d128$, $d128$Listę można uczynić prywatną, żeby nie pokazywała się w drzewie panelu bocznego użytkownikom bez bezpośredniego dostępu. Pomaga to przy poufnych informacjach albo małym podzbiorze zadań, które nie są przeznaczone dla całego zespołu. Jeśli administrator wyłączy tę funkcję w całym systemie, istniejące listy prywatne stają się widoczne wewnątrz zespołu.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'pl', $d128$Edytor szablonów$d128$, $d128$Nazwane szablony z folderami, zadaniami i podzadaniami; wprowadzanie sekwencyjne.$d128$, $d128$Na poziomie zespołu możesz tworzyć wielokrotnego użytku szablony z gotową strukturą folderów, zadań i podzadań. Pomaga to, gdy podobne projekty zaczynają się od tej samej sekwencji pracy.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Edytor szablonów pozwala dodawać elementy po kolei i już na poziomie szablonu przypisać osobę oraz pozycje listy kontrolnej.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'pl', $d128$Poziomy dostępu do listy$d128$, $d128$Pełna edycja / edycja / komentarz / tylko podgląd / brak dostępu, dla każdej listy.$d128$, $d128$Oprócz roli zespołowej każda lista może ustawić poziom dostępu dla użytkownika lub roli: pełna edycja, edycja, tylko komentarz, tylko podgląd albo brak dostępu.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Na przykład jeden kierownik projektu może mieć pełną kontrolę nad listą, a pozostali użytkownicy zespołu tylko ją przeglądają. Efektywny dostęp łączy uprawnienia roli zespołowej z ustawieniami tej listy.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'pl', $d128$Listy i struktura folderów$d128$, $d128$Foldery i podfoldery do organizacji list, zadań i plików.$d128$, $d128${SYSTEM_NAME} porządkuje pracę folderami i podfolderami dla list, zadań i plików - na przykład według projektu, klienta lub działu. W drzewie panelu bocznego możesz przeciągać elementy do folderu lub z niego. Struktura może być tak głęboka, jak organizacja potrzebuje.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'pl', $d128$Zarządzanie sesją$d128$, $d128$Logowanie niezależne od konta na stronie; długość sesji.$d128$, $d128$Rozszerzenie przechowuje sesję logowania lokalnie w przeglądarce przez około 30 dni, niezależnie od tego, czy jesteś zalogowany na stronie {SYSTEM_NAME} w tej samej karcie. Jeśli sesja jest nieważna albo wylogowałeś się tylko ze strony, rozszerzenie to zauważa i prosi o ponowne logowanie dopiero wtedy, gdy naprawdę trzeba.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'pl', $d128$Obsługa sesji$d128$, $d128$Zapamiętaj mnie, długość sesji, wylogowanie.$d128$, $d128$Przy logowaniu możesz wybrać Zapamiętaj mnie, żeby sesja została po zamknięciu przeglądarki. Bez tej opcji sesja kończy się, gdy zamkniesz przeglądarkę. Wylogowanie ze strony nie wpływa na osobną sesję rozszerzenia Gmail, która pozostaje aktywna samodzielnie.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'pl', $d128$Moduły systemu$d128$, $d128$Włączaj lub wyłączaj funkcje (listy prywatne, pliki, szablony, automatyzacje, kalendarz, integracje chmurowe).$d128$, $d128$Administrator może globalnie włączać lub wyłączać funkcje systemu, na przykład listy prywatne, przesyłanie plików, listy kontrolne, automatyzacje, szablony, integrację kalendarza albo pamięć w chmurze. Wyłączony moduł znika z interfejsu użytkownika i ze strony marketingowej, więc kontrolujesz, co jest dostępne w tej instalacji lub planie płatnym.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'pl', $d128$Status pochodny$d128$, $d128$Jak status/postęp zadania nadrzędnego jest liczony z podzadań.$d128$, $d128$Dla zadania z podzadaniami ogólny status i postęp są liczone ze statusów tych podzadań. Właściciel nie musi ręcznie aktualizować statusu nadrzędnego - zawsze odzwierciedla, ile podzadań jest ukończonych.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'pl', $d128$Terminy i przypomnienia$d128$, $d128$Daty rozpoczęcia/terminy, etykiety względne (dziś/zostało/po terminie), przypomnienia e-mail.$d128$, $d128$Każde zadanie i podzadanie może mieć datę rozpoczęcia i termin. System pokazuje etykietę względną (na przykład "dziś", "zostały 3 dni" albo "2 dni po terminie") w zależności od grupy statusów. Jeśli administrator to włączył, system wysyła e-mailem przypomnienia o zbliżających się datach rozpoczęcia lub terminach.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'pl', $d128$Statusy zadań$d128$, $d128$Katalog statusów systemowych i statusy niestandardowe na listę, w tym kolejność.$d128$, $d128$Każda lista ma zestaw statusów dla etapów zadania, od domyślnego katalogu systemowego po w pełni niestandardowe statusy z własną nazwą, kolorem i kolejnością.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Kolejność statusów ustawia się w ustawieniach listy. Wpływa na to, jak zadania sortują się w widokach i jak liczony jest ogólny postęp.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'pl', $d128$Historia zadania$d128$, $d128$Pełny dziennik zmian (status, daty, osoby, pliki, przeniesienia).$d128$, $d128$Każde zadanie i podzadanie przechowuje pełny dziennik zmian: zmiany statusu, zmiany dat, dodawanie i usuwanie osób odpowiedzialnych, edycje tytułu i opisu, przeniesienia między listami oraz zmiany plików i listy kontrolnej. Zawsze możesz zobaczyć, kto co zmienił i kiedy.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'pl', $d128$Wybór języka$d128$, $d128$Domyślny język systemu, wybór osobisty, wykrywanie języka gościa.$d128$, $d128$Dla zalogowanego użytkownika język jest zapisany w profilu i używany wszędzie, na każdym urządzeniu. Dla gościa pochodzi z ciasteczka przeglądarki, a jeśli go nie ma - z języka domyślnego administratora. Język możesz zmienić w każdej chwili przełącznikiem, który pokazuje flagi i pełne nazwy języków.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'pl', $d128$Kupowanie miejsc$d128$, $d128$Jak dodać płatne miejsca; automatyczny zakup przy zapraszaniu nowej osoby.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Jeśli zapraszasz kogoś, a zespół nie ma wolnego opłaconego miejsca, system proponuje kupno dodatkowego miejsca przed wysłaniem zaproszenia. Możesz też kupić miejsca z wyprzedzeniem na stronie rozliczeń zespołu, wybierając rozliczenie miesięczne lub roczne.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'pl', $d128$Dostosowywanie marki$d128$, $d128$Nazwa systemu, logo, favicon.$d128$, $d128$Administrator może ustawić nazwę systemu oraz wgrać logo i favicon. Jeśli logo nie zostało wgrane, system generuje awatar z pierwszych liter nazwy. Te zmiany widać wszędzie: w tytule karty przeglądarki, w szablonach e-maili i na publicznej stronie marketingowej.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'lt', $d128$Prenumeratos valdymas$d128$, $d128$Mėnesinis arba metinis atsiskaitymas, sąskaitos, atšaukimas.$d128$, $d128$Komandos atsiskaitymų puslapyje matote dabartinę prenumeratos būseną, galite rinktis mėnesinį arba metinį atsiskaitymą ir apmokėti per saugų Stripe mokėjimo langą. Jei mokama vieta atsilaisvina (komandos naudotojas pašalinamas), ji lieka prieinama iki einamojo atsiskaitymo ciklo pabaigos, o ne prarandama iš karto.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'lt', $d128$Použduočių kūrimas$d128$, $d128$Padalykite užduotį į použduotis, kiekviena su savo būsenų seka.$d128$, $d128$Jei užduotis turi kelis žingsnius, kuriuos skirtingi žmonės gali atlikti skirtingu metu, ją galima padalyti į použduotis. Kiekviena použduotis turi savo būsenų seką, vykdytoją, terminą ir priedus - ji veikia kaip maža užduotis tėvinės užduoties viduje.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'lt', $d128$Archyvas$d128$, $d128$Užbaigtų ir ištrintų užduočių / aplankų archyvavimas, spalvinis žymėjimas, atkūrimas.$d128$, $d128$Užbaigtos ar ištrintos užduotys, použduotys ir aplankai nedingsta iš karto. Jie patenka į archyvą, atskirai nuo aktyvaus darbo. Archyvuoti elementai pažymėti spalva pagal paskutinę būseną, todėl juos lengva atskirti, ir bet kada galite atkurti juos į aktyvų sąrašą.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'lt', $d128$Palaikomos kalbos$d128$, $d128$Visas sąsajos ir rinkodaros vertimų sąrašas (15 kalbų).$d128$, $d128${SYSTEM_NAME} sąsaja ir rinkodaros turinys visai išversti į 15 kalbų, įskaitant latvių, anglų ir rusų. Kuriant sistemą tikrinama, kad nė vienoje palaikomoje kalboje netrūktų vertimo rakto ar vietos rezervavimo žymės.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'lt', $d128$Autentifikacija$d128$, $d128$El. paštas, prisijungimas su Google, slaptažodžio reikalavimai.$d128$, $d128${SYSTEM_NAME} palaiko prisijungimą el. paštu ir slaptažodžiu bei su Google paskyra. Registracijai ir prisijungimui el. paštu reikalingas pakankamai stiprus slaptažodis, o pamiršus yra atkūrimo eiga.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'lt', $d128$Automatizavimas$d128$, $d128$Taisyklės, kurios automatiškai pritaiko šabloną naujam aplankui.$d128$, $d128$Automatizavimas leidžia sistemai veikti pačiai pagal nustatytas sąlygas. Galimas automatizavimas pritaiko pasirinktą šabloną bet kuriam naujam aplankui, sukurtam konkrečiame sąraše. Kiekvienas naujas projekto aplankas tada gauna visą struktūrą, nereikia kartoti sąrankos ranka.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'lt', $d128$Apsauga nuo robotų$d128$, $d128$Cloudflare Turnstile patikros registracijos ir prisijungimo formose.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registracijos, prisijungimo ir slaptažodžio atkūrimo formos apsaugotos su Cloudflare Turnstile. Jis blokuoja automatizuotus, piktavališkus paskyrų kūrimo ar prisijungimo bandymus ir lieka nepastebimas tikriems naudotojams.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'lt', $d128$Kainodaros modelis$d128$, $d128$Pirmoji vieta nemokama; mokate už kiekvieną papildomą komandos naudotoją.$d128$, $d128$Pirmoji komandos vieta {SYSTEM_NAME} (savininko vieta) visada nemokama. Mokate tik už kiekvieną papildomą komandos naudotoją virš pirmosios vietos. Vienas žmogus gali naudotis sistema nemokamai be laiko limito; atsiskaitymas prasideda tik tada, kai susiformuoja tikra komanda.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'lt', $d128$Check List$d128$, $d128$Paprastas Check List použduotyje; prieš uždarant jis turi būti atliktas 100 %.$d128$, $d128$Použduotyje galite pridėti paprastą Check List smulkesniems, greitai pažymimiems žingsniams, kurie nėra visaverbės použduotys. Jei Check List nėra visiškai atliktas, použduoties negalima perkelti į uždarytų ar užbaigtų būsenų grupę. Būsenos tada visada atspindi tikrą darbo padėtį.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'lt', $d128$Duomenų šifravimas$d128$, $d128$Integracijų prieigos raktų šifravimas.$d128$, $d128$Visi integracijų prisijungimo duomenys (pavyzdžiui, Google Drive ar kitų trečiųjų šalių autentifikavimo žetonai) saugomi šifruoti, ne kaip paprastas tekstas duomenų bazėje. Net turint tiesioginę prieigą prie duomenų bazės šie jautrūs duomenys nėra skaitomi kaip yra.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'lt', $d128$Datos ir laiko formatai$d128$, $d128$Savaitės pradžia, datos formatas / skyriklis, 12/24 val. laikas.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Kiekvienas naudotojas gali nustatyti pageidaujamą savaitės pirmąją dieną, datos formatą ir skyriklį bei rinktis 12 arba 24 valandų laiką. Šie asmeniniai nustatymai pakeičia administratoriaus nustatytą sistemos numatytąją reikšmę.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'lt', $d128$Dviejų veiksnių autentifikacija (MFA)$d128$, $d128$TOTP nustatymas profilyje.$d128$, $d128$Kiekvienas naudotojas profilyje gali pasirinktinai įjungti dviejų veiksnių autentifikaciją naudodamas TOTP (autentifikatoriaus programėlę, pavyzdžiui, Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Kai MFA įjungta, kiekvienas prisijungimas papildomai prašo vienkartinio kodo iš autentifikatoriaus programėlės, be slaptažodžio.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'lt', $d128$El. laiško pridėjimas prie užduoties$d128$, $d128$Importuokite laiško tekstą ir priedus iš Gmail; pasirinkite sąrašą, aplanką ir užduotį.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Iš bet kurio laiško Gmail papildinys gali pridėti jį prie pasirinktos užduoties ar použduoties. Laiško turinys išsaugomas kaip tekstinis failas, o priedus galite rinktis atskirai. Pridėdami pasirenkate tikslią paskirtį per sąrašą, aplanką, užduotį ir použduotį.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'lt', $d128$El. laiškų šablonai$d128$, $d128$Redaguokite registracijos, slaptažodžio atkūrimo ir pranešimų šablonus.$d128$, $d128$Visi laiškai, kuriuos sistema siunčia automatiškai - registracijos patvirtinimas, slaptažodžio atkūrimas, kvietimas į komandą ir kiti sistemos pranešimai - redaguojami kaip HTML šablonai administravimo skydelyje, kiekvienas visomis palaikomomis sistemos kalbomis.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'lt', $d128$Early Bird pasiūlymas$d128$, $d128$Ribotas skaičius vietų su nuolaida pirmiesiems klientams.$d128$, $d128$Pirmieji klientai gauna ribotą skaičių vietų su nuolaida iš visuotinio Early Bird fondo. Kol fonde yra vietų, naujai įsigyta vieta automatiškai gauna kainą su nuolaida. Kai vieta nenaudojama ir prenumerata baigiasi, ji į fondą negrįžta.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'lt', $d128$Failo siuntimas el. paštu$d128$, $d128$Išsiųskite priedą iš sistemos el. pašto adresu ir stebėkite pristatymą.$d128$, $d128$Bet kurį použduoties failą galima išsiųsti bet kuriuo adresu iš sistemos, neatidarant atskiros pašto programos.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Siunčiant galite pridėti temą ir žinutę. Sistema rodo pristatymo būseną (išsiųsta, pristatyta ar nepavyko) ir saugo visą persiuntimo istoriją, o jei pristatymas nepavyksta, galima siųsti iš naujo.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'lt', $d128$Failų įkėlimas$d128$, $d128$Leidžiami failų tipai, dydžio ribos, peržiūra (PDF, vaizdai, txt).$d128$, $d128$Failus galite prisegti užduočių medyje, použduotyse ir atskirame Failų lange aplanko lygiu.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administratorius nustato, kokių tipų failus galima įkelti (pavyzdžiui, PDF, Word, Excel, DWG brėžinius, vaizdus ar archyvus). Sistema rodo aiškią klaidą, jei failas neatitinka. Vaizdus, PDF ir tekstinius failus galima peržiūrėti neišeinant iš sistemos.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'lt', $d128$Failų saugyklos naudojimas$d128$, $d128$Serverio ir debesijos saugyklos apimtis šoninėje juostoje.$d128$, $d128$Virš Nustatymų šoninėje juostoje matote bendrą failų saugyklos naudojimą - failai {SYSTEM_NAME} serveryje ir failai prijungtame debesyje skaičiuojami atskirai. Tai aiškiai parodo, kiek vietos užima skirtingi failai, ir padeda spręsti, ar perkelti į debesijos saugyklą.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'lt', $d128$Google Drive integracija$d128$, $d128$Prijunkite paskyrą, išsaugokite failus Drive automatiškai, pervadinkite ir atsisiųskite.$d128$, $d128$Kai komandos Google Drive paskyra prijungta, naujai įkelti failai pagal numatymą saugomi tame Drive, o ne {SYSTEM_NAME} serveryje. Tai mažina saugyklos kainą ir palieka dokumentus jūsų kontroliuojamus.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Failą galite pervadinti ir atsisiųsti iš {SYSTEM_NAME} sąsajos, o pakeitimai sinchronizuojami su Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'lt', $d128$Diegimas ir prijungimas$d128$, $d128$Įdiekite papildinį ir autorizuokite paskyrą.$d128$, $d128${SYSTEM_NAME} Gmail papildinys įdiegiamas Chrome, tada prašo prijungti jį prie {SYSTEM_NAME} paskyros per saugią autentifikavimo eigą.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Papildinys turi savo sesiją, nepriklausomą nuo svetainės prisijungimo, todėl atsijungimas nuo {SYSTEM_NAME} svetainės neatjungia papildinio.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'lt', $d128$Integracijų konfigūracija$d128$, $d128$Nustatykite Google / Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$Administravimo skydelyje vienoje vietoje konfigūruojate visas išorines paslaugas, reikalingas visai funkcijai: Google ir Microsoft OAuth prisijungimą, Resend el. paštui, Stripe atsiskaitymams, Sentry klaidų sekimui ir Umami analitikai. Kiekvieną integraciją galima įjungti arba išjungti, o susijusios funkcijos priklauso nuo tos sąrankos (pavyzdžiui, prisijungimas el. paštu neveikia be sukonfigūruoto Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'lt', $d128$Naujos použduoties kūrimas iš laiško$d128$, $d128$Langas, kuriame asmenį priskiriate tiesiai iš Gmail.$d128$, $d128$Jei laiškas turi tapti nauja užduotimi, papildinys tai gali padaryti iš Gmail. Lange galite priskirti asmenį (gyva paieška pagal vardą) ir prisegti laiško failus.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'lt', $d128$Kalendoriaus integracija$d128$, $d128$Prenumeruokite asmeninį `.ics` srautą Google / Apple Calendar terminams.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Užduotys su terminais gali atsirasti Google arba Apple Calendar prenumeruojant asmeninį `.ics` srautą, sugeneruotą jūsų naudotojui. Srautas atnaujinamas keičiantis terminams, todėl kalendorius lieka aktualus be rankinio sinchronizavimo.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'lt', $d128$Kanban stiliaus vilkimas$d128$, $d128$Sugrupuota lentelė: vilkite tarp būsenų grupių, kad pakeistumėte būseną.$d128$, $d128$Užduočių lentelėje būsenos sugrupuotos į stulpelius arba grupių antraštes. Užduoties būseną keičiate vilkdami ją į kitą grupę, kaip klasikinėje Kanban lentoje. Velkant mėlyna linija parodo, kur užduotis nusileis.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'lt', $d128$Komandos naudotojų kvietimas$d128$, $d128$Kvietimai el. paštu, priėmimo / atmetimo eiga, kvietimo nuorodos pakartotinis siuntimas.$d128$, $d128$Žmones į komandą pridedate siųsdami kvietimą jų el. paštu. Jei jie jau turi {SYSTEM_NAME} paskyrą, gauna pranešimą sistemoje; jei ne, kvietimo nuoroda atidaro registraciją su iš anksto užpildytu el. paštu.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Kvietimą reikia priimti arba atmesti - niekas nepridedamas automatiškai. Kol jis laukia, galite siųsti iš naujo arba atšaukti, ir galite nukopijuoti nuorodą, kad nusiųstumėte kitu kanalu (ne tik el. paštu).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'lt', $d128$Išėjimas iš komandos ir naudotojų šalinimas$d128$, $d128$Kaip komandos naudotojas išeina ir kaip savininkas šalina naudotojus.$d128$, $d128$Bet kuris komandos naudotojas, išskyrus savininką, gali bet kada išeiti iš komandos iš profilio arba komandos puslapio. Savininkas arba naudotojas su tinkama prieiga gali pašalinti ir kitus iš komandos. Ta teisė konfigūruojama atskirai ir nėra prieinama numatytajai naudotojo rolei. Savininko pašalinti negalima, ir jis negali išeiti neperdavęs nuosavybės.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'lt', $d128$Paskyros kūrimas$d128$, $d128$Registracija el. paštu arba Google; slaptažodžio taisyklės ir stiprumo tikrinimas.$d128$, $d128${SYSTEM_NAME} paskyrą galite sukurti el. paštu ir slaptažodžiu arba prisijungdami su Google. Registracijai el. paštu reikalingas bent vidutinio stiprumo slaptažodis; sistema gali sugeneruoti saugų 16 simbolių slaptažodį, kurį galite naudoti arba pakeisti. Prisijungiant su Google vardas ir pavardė paimami iš Google profilio. Po registracijos el. paštu adresą reikia patvirtinti prieš naudojantis sistema.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'lt', $d128$Rolės ir prieigos lygiai$d128$, $d128$Numatytosios sistemos rolės, pasirinktinės rolės, detalioji prieiga (aplankai, archyvas, failų įkėlimas, būsenos keitimas).$d128$, $d128$Kiekvienas komandos naudotojas turi rolę, kuri nustato, ką jis gali daryti - nuo pagrindinių naudotojo teisių iki visos administratoriaus prieigos.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roles galima nustatyti detaliai: leisti arba drausti aplankų kūrimą, archyvo peržiūrą, failų įkėlimą použduotyse, būsenų keitimą ir kitus konkrečius veiksmus.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Sistema pateikiama su keliomis numatytosiomis rolėmis, o komandos savininkas gali kurti ir pasirinktines roles su būtent tomis teisėmis, kurių komandai reikia.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'lt', $d128$Mokamų planų katalogas$d128$, $d128$Kurkite planus, priskirkite modulius, nustatykite kainas.$d128$, $d128$Administratorius gali kurti ir valdyti mokamų planų katalogą: kainą, galimus modulius ir naudotojų ribas. Planus galima priskirti komandoms, o sistema apriboja funkcijas pagal komandos aktyvų planą.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'lt', $d128$Navigacijos apžvalga$d128$, $d128$Šoninės juostos medis (aplankai, sąrašai, užduotys), Pradžios vaizdas, komandos perjungiklis.$d128$, $d128$Kairėje šoninėje juostoje matote savo aplankų, sąrašų ir užduočių medį. Galite jį išskleisti, suskleisti ir pertvarkyti vilkdami.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Viršuje yra komandos perjungiklis, jei priklausote daugiau nei vienai komandai. Pradžia surenka jums priskirtas užduotis iš visų sąrašų, kad matytumėte, ką daryti kiekvieną dieną. Naudotojo meniu (viršuje dešinėje) atidaro profilio nustatymus, pranešimus ir atsijungimą.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'lt', $d128$Neapmokėtos prenumeratos būsena$d128$, $d128$Kas nutinka prieigai, jei mokėjimas nepavyksta arba nepratęsiamas.$d128$, $d128$Jei komandos mokėjimas nepavyksta arba prenumerata neaktyvi, paprasti naudotojai mato ribotą, išblurintą vaizdą su blokuojančia žinute. Komandos savininkas mato aiškią raudoną įspėjimo juostą su nurodymais, kaip sutvarkyti atsiskaitymą. Pagrindinė navigacija, komandos perjungimas ir paskyros nustatymai lieka prieinami, kad problemą būtų galima išspręsti neprarandant duomenų.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'lt', $d128$OneDrive integracija$d128$, $d128$Ta pati idėja kaip Google Drive: prijunkite ir sinchronizuokite failus.$d128$, $d128$Kaip ir Google Drive, Microsoft OneDrive galima prijungti kaip komandos lygio failų saugyklą. Prijungus nauji failai keliauja į tą OneDrive paskyrą, su tuo pačiu patogumu ir kontrole kaip Google Drive sąrankoje.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'lt', $d128$Pranešimų nustatymai$d128$, $d128$Sugrupuoti nustatymai pagal kategoriją; seni pranešimai valomi automatiškai.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Pranešimų tipus galima reguliuoti sugrupuotame nustatymų lange: užduočių įvykiai, priminimai ir komandos įvykiai, kiekvienas su savo įjungimo / išjungimo jungikliu. Senesni perskaityti pranešimai ištrinami po 30 dienų, kad sąrašas liktų skaitomas.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'lt', $d128$Pranešimų tipai$d128$, $d128$Priskyrimas, komentarai, failai, būsenos keitimai, komandos įvykiai.$d128$, $d128$

Sistema kuria pranešimus apie įvykius, kurie jus paliečia: jums priskirta užduotis, ji nuimta nuo jūsų, pridėtas failas, pakeista būsena arba nauja použduotis jūsų stebimoje vietoje. Jie atsiranda prie varpelio piktogramos su neperskaitytų skaičiumi.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'lt', $d128$Pasirinktinės būsenos šablonuose$d128$, $d128$Kiekviena šablono užduotis gali turėti savo būsenų rinkinį.$d128$, $d128$Kiekviena užduotis šablone gali turėti kitą būsenų rinkinį nei sąrašo numatytasis. Pavyzdžiui, gamybos etapo užduotis gali naudoti kitą eigą nei pristatymo etapo užduotis.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Užduotys su pasirinktinėmis būsenomis šablone pažymėtos, kad būtų lengva jas pastebėti.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'lt', $d128$Pirmasis sąrašas ir užduotis$d128$, $d128$Pagrindinė eiga: sukurkite sąrašą, pridėkite užduotį, pakeiskite būseną.$d128$, $d128$Sąrašas yra pagrindinis darbo vienetas {SYSTEM_NAME}. Jame laikomos vieno projekto, proceso ar srities užduotys. Sukūrę sąrašą galite pridėti užduotis, kiekvieną su vykdytoju ir būsena.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Užduoties būseną keičiate vienu spustelėjimu arba vilkdami ją tarp būsenų grupių lentelės vaizde.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Jei užduotis sudėtingesnė, padalykite ją į použduotis, kiekvieną su savo būsenų seka.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'lt', $d128$Pirmosios komandos kūrimas$d128$, $d128$Kaip sukurti komandą, pakviesti pirmuosius naudotojus ir kaip veikia savininko rolė.$d128$, $d128$Kad pradėtumėte {SYSTEM_NAME}, sukuriate komandą arba prie jos prisijungiate. Produktas sukurtas bendram darbui, ne tik asmeniniam naudojimui. Sukūrę komandą tampate jos savininku su visa prieiga prie funkcijų ir nustatymų. Tada kviečiate kolegas, kuriate pirmuosius sąrašus ir struktūruojate darbą. Vienas naudotojas be kitų komandos naudotojų yra nemokamas; pridėjus antrą žmogų komanda tampa mokama.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'lt', $d128$Privatūs sąrašai$d128$, $d128$Kaip sukurti sąrašą, matomą tik pasirinktiems komandos naudotojams.$d128$, $d128$Sąrašą galima padaryti privatų, kad jis nerodomas šoninės juostos medyje naudotojams be tiesioginės prieigos. Tai padeda su jautria informacija arba nedidele užduočių dalimi, neskirta visai komandai. Jei administratorius šią funkciją išjungia visai sistemai, esami privatūs sąrašai tampa matomi komandoje.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'lt', $d128$Šablonų rengyklė$d128$, $d128$Įvardyti šablonai su aplankais, užduotimis ir použduotimis; nuoseklus įvedimas.$d128$, $d128$Komandos lygiu galite kurti pakartotinai naudojamus šablonus su paruošta aplankų, užduočių ir použduočių struktūra. Tai padeda, kai panašūs projektai prasideda ta pačia darbų seka.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Šablonų rengyklė leidžia pridėti elementus paeiliui ir jau šablono lygiu priskirti asmenį bei Check List punktus.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'lt', $d128$Sąrašo prieigos lygiai$d128$, $d128$Visas redagavimas / redagavimas / komentavimas / tik peržiūra / be prieigos, kiekvienam sąrašui.$d128$, $d128$Be komandos rolės kiekvienas sąrašas gali nustatyti prieigos lygį naudotojui ar rolei: visas redagavimas, redagavimas, tik komentavimas, tik peržiūra arba be prieigos.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Pavyzdžiui, vienas projekto vadovas gali turėti visą sąrašo kontrolę, o kiti komandos naudotojai jį tik peržiūri. Galutinė prieiga sujungia komandos rolės teises su to sąrašo nustatymais.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'lt', $d128$Sąrašai ir aplankų struktūra$d128$, $d128$Aplankai ir poaplankiai sąrašams, užduotims ir failams tvarkyti.$d128$, $d128${SYSTEM_NAME} darbą tvarko aplankais ir poaplankiais sąrašams, užduotims ir failams - pavyzdžiui, pagal projektą, klientą ar skyrių. Šoninės juostos medyje elementus galite įvilkti į aplanką arba išvilkti iš jo. Struktūra gali būti tokia gili, kokios reikia organizacijai.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'lt', $d128$Sesijos valdymas$d128$, $d128$Prisijungimas nepriklausomas nuo svetainės paskyros; sesijos trukmė.$d128$, $d128$Papildinys saugo prisijungimo sesiją vietoje naršyklėje apie 30 dienų, nesvarbu, ar toje pačioje kortelėje esate prisijungę prie {SYSTEM_NAME} svetainės. Jei sesija negalioja arba atsijungėte tik svetainėje, papildinys tai pastebi ir prašo prisijungti iš naujo tik tada, kai to tikrai reikia.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'lt', $d128$Sesijos tvarkymas$d128$, $d128$Prisiminti mane, sesijos trukmė, atsijungimas.$d128$, $d128$Prisijungdami galite pasirinkti Prisiminti mane, kad sesija išliktų uždarius naršyklę. Be šios parinkties sesija baigiasi uždarius naršyklę. Atsijungimas nuo svetainės nepaveikia atskiros Gmail papildinio sesijos, kuri lieka aktyvi savaime.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'lt', $d128$Sistemos moduliai$d128$, $d128$Įjunkite arba išjunkite funkcijas (privatūs sąrašai, failai, šablonai, automatizavimas, kalendorius, debesijos integracijos).$d128$, $d128$Administratorius gali visoje sistemoje įjungti arba išjungti funkcijas, pavyzdžiui, privačius sąrašus, failų įkėlimą, Check List, automatizavimą, šablonus, kalendoriaus integraciją ar debesijos saugyklą. Išjungtas modulis dingsta iš naudotojo sąsajos ir rinkodaros puslapio, todėl kontroliuojate, kas prieinama toje įdiegyje ar mokamame plane.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'lt', $d128$Išvestinė būsena$d128$, $d128$Kaip tėvinės užduoties būsena / eiga skaičiuojama iš použduočių.$d128$, $d128$Užduočiai su použduotimis bendra būsena ir eiga skaičiuojamos iš tų použduočių būsenų. Savininkui nereikia tėvinės būsenos atnaujinti ranka - ji visada atspindi, kiek použduočių atlikta.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'lt', $d128$Terminai ir priminimai$d128$, $d128$Pradžios / termino datos, santykinės žymos (šiandien / liko / vėluoja), priminimai el. paštu.$d128$, $d128$Kiekviena užduotis ir použduotis gali turėti pradžios datą ir terminą. Sistema rodo santykinę žymą (pavyzdžiui, "šiandien", "liko 3 dienos" arba "vėluoja 2 dienos") pagal būsenų grupę. Jei administratorius tai įjungęs, sistema siunčia priminimus el. paštu apie artėjančias pradžios ar termino datas.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'lt', $d128$Užduočių būsenos$d128$, $d128$Sistemos būsenų katalogas ir pasirinktinės būsenos kiekvienam sąrašui, įskaitant tvarką.$d128$, $d128$Kiekvienas sąrašas turi būsenų rinkinį užduočių etapams - nuo sistemos numatytojo katalogo iki visiškai pasirinktinių būsenų su savu pavadinimu, spalva ir tvarka.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Būsenų tvarka nustatoma sąrašo nustatymuose. Ji veikia, kaip užduotys rikiuojamos vaizduose ir kaip skaičiuojama bendra eiga.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'lt', $d128$Užduoties istorija$d128$, $d128$Visas pakeitimų žurnalas (būsena, datos, vykdytojai, failai, perkėlimai).$d128$, $d128$Kiekviena užduotis ir použduotis saugo visą pakeitimų žurnalą: būsenos keitimai, datų keitimai, vykdytojų pridėjimas ir šalinimas, pavadinimo ir aprašymo taisymai, perkėlimai tarp sąrašų bei failų ir Check List pakeitimai. Visada matote, kas ką ir kada pakeitė.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'lt', $d128$Kalbos pasirinkimas$d128$, $d128$Sistemos numatytoji kalba, asmeninis pasirinkimas, svečio kalbos nustatymas.$d128$, $d128$Prisijungusiam naudotojui kalba saugoma profilyje ir naudojama visur, bet kuriame įrenginyje. Svečiui ji ateina iš naršyklės slapuko, o jei jo nėra - iš administratoriaus numatytosios kalbos. Kalbą bet kada galite pakeisti perjungikliu, kuris rodo vėliavas ir visus kalbų pavadinimus.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'lt', $d128$Vietų pirkimas$d128$, $d128$Kaip pridėti mokamas vietas; automatinis pirkimas kviečiant naują žmogų.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Jei kviečiate ką nors ir komanda neturi laisvos mokamos vietos, sistema pasiūlo nupirkti papildomą vietą prieš siunčiant kvietimą. Vietas galite pirkti ir iš anksto komandos atsiskaitymų puslapyje, rinkdamiesi mėnesinį arba metinį atsiskaitymą.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'lt', $d128$Prekės ženklo pritaikymas$d128$, $d128$Sistemos pavadinimas, logotipas, favicon.$d128$, $d128$Administratorius gali nustatyti sistemos pavadinimą ir įkelti logotipą bei favicon. Jei logotipas neįkeltas, sistema sugeneruoja avatarą iš pavadinimo pirmųjų raidžių. Šie pakeitimai matomi visur: naršyklės kortelės pavadinime, el. laiškų šablonuose ir viešame rinkodaros puslapyje.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'et', $d128$Tellimuse haldamine$d128$, $d128$Igakuine või aastane arveldus, arved, tühistamine.$d128$, $d128$Meeskonna arvelduslehel näed praegust tellimuse olekut, saad valida igakuise või aastase arvelduse ning maksta turvalises Stripe kassas. Kui tasuline koht vabaneb (meeskonna kasutaja eemaldatakse), jääb see kättesaadavaks kuni jooksva arveldustsükli lõpuni, mitte ei kao kohe.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'et', $d128$Alamülesannete loomine$d128$, $d128$Jaga ülesanne alamülesanneteks, igaühel oma olekuvoog.$d128$, $d128$Kui ülesandel on mitu sammu, mida erinevad inimesed saavad teha eri aegadel, saad selle jagada alamülesanneteks. Igal alamülesandel on oma olekuvoog, täitja, tähtaeg ja manused - see toimib nagu väike ülesanne peaülesande sees.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'et', $d128$Arhiiv$d128$, $d128$Lõpetatud ja kustutatud ülesannete/kaustade arhiveerimine, värvikood, taastamine.$d128$, $d128$Lõpetatud või kustutatud ülesanded, alamülesanded ja kaustad ei kao kohe. Need lähevad arhiivi, aktiivsest tööst eraldi. Arhiveeritud kirjed on värvikoodiga viimase oleku järgi, et neid oleks kiire eristada, ja saad need igal ajal aktiivsesse nimekirja taastada.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'et', $d128$Toetatud keeled$d128$, $d128$Täielik kasutajaliidese ja turunduse tõlgete loend (15 keelt).$d128$, $d128${SYSTEM_NAME} kasutajaliides ja turundussisus on täielikult tõlgitud 15 keelde, sh läti, inglise ja vene. Arenduse ajal kontrollib süsteem, et üheski toetatud keeles ei puuduks tõlkevõtit ega kohatäidet.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'et', $d128$Autentimine$d128$, $d128$E-post, Google'iga sisselogimine, paroolinõuded.$d128$, $d128${SYSTEM_NAME} toetab sisselogimist e-posti ja parooliga ning Google kontoga. E-posti registreerimine ja sisselogimine nõuavad piisavalt tugevat parooli ning unustamise korral on taastamise voog.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'et', $d128$Automaatika$d128$, $d128$Reeglid, mis rakendavad uuele kaustale automaatselt malli.$d128$, $d128$Automaatika laseb süsteemil tegutseda ise kindlaksmääratud tingimustes. Saadaval olev automaatika rakendab valitud malli igale uuele kaustale, mis luuakse kindlas nimekirjas. Iga uus projektikaust saab siis täieliku struktuuri, ilma et seadistust käsitsi kordama peaks.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'et', $d128$Botikaitse$d128$, $d128$Cloudflare Turnstile kontrollid registreerimis- ja sisselogimisvormidel.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registreerimise, sisselogimise ja parooli taastamise vormid on kaitstud Cloudflare Turnstile'iga. See blokeerib automatiseeritud, kuritarvituslikud konto loomise või sisselogimise katsed, jäädes päris kasutajatele märkamatuks.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'et', $d128$Hinnastamismudel$d128$, $d128$Esimene koht on tasuta; maksad iga lisanduva meeskonnakasutaja eest.$d128$, $d128$Esimene meeskonnakoht {SYSTEM_NAME}-is (omaniku koht) on alati tasuta. Maksad ainult iga lisanduva meeskonnakasutaja eest üle esimese koha. Üks inimene saab süsteemi tasuta kasutada ilma ajalimiidita; arveldus algab alles siis, kui tekib päris meeskond.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'et', $d128$Check List$d128$, $d128$Lihtne Check List alamülesandes; enne sulgemist peab see olema 100% tehtud.$d128$, $d128$Alamülesande sisse saad lisada lihtsa Check List'i väiksemate, kiiresti märgistatavate sammude jaoks, mis ei ole täisväärtuslikud alamülesanded. Kui Check List ei ole täielikult tehtud, ei saa alamülesannet viia suletud või lõpetatud olekute gruppi. Olekud peegeldavad siis alati töö tegelikku seisu.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'et', $d128$Andmete krüpteerimine$d128$, $d128$Integratsiooni juurdepääsutokenite krüpteerimine.$d128$, $d128$Kõik integratsiooni mandaadid (näiteks Google Drive või muude kolmandate osapoolte autentimistokenid) salvestatakse krüpteeritult, mitte lihttekstina andmebaasis. Isegi otsese andmebaasi juurdepääsu korral ei ole need tundlikud andmed sellisena loetavad.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'et', $d128$Kuupäeva- ja kellaajavormingud$d128$, $d128$Nädala algus, kuupäevavorming/eraldaja, 12/24-tunnine aeg.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Iga kasutaja saab määrata eelistatud nädala esimese päeva, kuupäevavormingu ja eraldaja ning valida 12- või 24-tunnise kellaaja. Need isiklikud seaded tühistavad administraatori määratud süsteemi vaikeväärtuse.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'et', $d128$Kaheastmeline autentimine (MFA)$d128$, $d128$TOTP seadistamine profiilis.$d128$, $d128$Iga kasutaja saab profiilis soovi korral sisse lülitada kaheastmelise autentimise TOTP abil (autentimisrakendus, näiteks Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Kui MFA on sisse lülitatud, küsib iga sisselogimine lisaks paroolile ka ühekordset koodi autentimisrakendusest.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'et', $d128$E-kirja lisamine ülesandele$d128$, $d128$Impordi kirja tekst ja manused Gmailist; vali nimekiri, kaust ja ülesanne.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Mis tahes Gmaili kirjast saab laiendus lisada selle valitud ülesandele või alamülesandele. Kirja sisu salvestatakse tekstifailina ja manuseid saad valida eraldi. Lisamisel valid täpse sihtkoha nimekirja, kausta, ülesande ja alamülesande kaudu.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'et', $d128$E-kirja mallid$d128$, $d128$Muuda registreerimise, parooli taastamise ja teavituste malle.$d128$, $d128$Kõik kirjad, mida süsteem automaatselt saadab - registreerimise kinnitus, parooli taastamine, meeskonnakutse ja muud süsteemiteated - on administreerimispaneelis muudetavad HTML-mallidena, igaüks kõigis toetatud süsteemikeeltes.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'et', $d128$Early Bird pakkumine$d128$, $d128$Piiratud arv soodushinnaga kohti esimestele klientidele.$d128$, $d128$Esimesed kliendid saavad piiratud arvu soodushinnaga kohti globaalsest Early Bird fondist. Kuni selles fondis on kohti, saab äsja ostetud koht automaatselt soodushinna. Kui koht on kasutamata ja tellimus lõpeb, fondi see tagasi ei lähe.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'et', $d128$Faili saatmine e-postiga$d128$, $d128$Saada manus süsteemist e-posti aadressile ja jälgi kohaletoimetamist.$d128$, $d128$Mis tahes alamülesande faili saab süsteemist saata mis tahes aadressile, ilma eraldi meilirakendust avamata.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Saatmisel saad lisada teema ja sõnumi. Süsteem näitab kohaletoimetamise olekut (saadetud, kohale toimetatud või ebaõnnestunud) ning hoiab täielikku edastamise ajalugu, koos võimalusega saata uuesti, kui kohaletoimetamine ebaõnnestub.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'et', $d128$Failide üleslaadimine$d128$, $d128$Lubatud failitüübid, mahupiirangud, eelvaade (PDF, pildid, txt).$d128$, $d128$Faile saad manustada ülesannete puus, alamülesannetes ja eraldi Failide aknas kausta tasemel.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administraator määrab, milliseid failitüüpe tohib üles laadida (näiteks PDF, Word, Excel, DWG joonised, pildid või arhiivid). Süsteem näitab selget viga, kui fail ei vasta. Pilte, PDF-e ja tekstifaile saab eelvaadata süsteemist lahkumata.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'et', $d128$Failisalvestuse kasutus$d128$, $d128$Serveri ja pilvesalvestuse maht külgribalt.$d128$, $d128$Seadete kohal külgribal näed failisalvestuse kogukasustust - {SYSTEM_NAME} serveris olevad failid ja ühendatud pilves olevad failid loetakse eraldi. Nii on selge, kui palju ruumi erinevad failid võtavad, ja saad otsustada, kas minna pilvesalvestusele.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'et', $d128$Google Drive integratsioon$d128$, $d128$Ühenda konto, salvesta failid Drive'i automaatselt, nimeta ümber ja laadi alla.$d128$, $d128$Kui meeskonna Google Drive konto on ühendatud, salvestatakse äsja üles laaditud failid vaikimisi sellesse Drive'i, mitte {SYSTEM_NAME} serverisse. See vähendab salvestuskulu ja hoiab dokumendid sinu kontrolli all.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Faili saad ümber nimetada ja alla laadida {SYSTEM_NAME} kasutajaliidesest ning muudatused sünkroonitakse Drive'iga.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'et', $d128$Paigaldamine ja ühendamine$d128$, $d128$Paigalda laiendus ja autoriseeri konto.$d128$, $d128${SYSTEM_NAME} Gmail'i laiendus paigaldatakse Chrome'i, seejärel palub see ühendada see sinu {SYSTEM_NAME} kontoga turvalise autentimisvoo kaudu.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Laiendusel on oma seanss, veebisaidi sisselogimisest sõltumatu, seega {SYSTEM_NAME} saidilt väljalogimine ei katkesta laiendust.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'et', $d128$Integratsiooni seadistus$d128$, $d128$Seadista Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$Administreerimispaneelis seadistad ühes kohas kõik välisteenused, mida täielikuks toimimiseks vaja: Google ja Microsoft OAuth sisselogimine, Resend e-posti jaoks, Stripe arvelduseks, Sentry veajälgimiseks ja Umami analüütikaks. Iga integratsiooni saab sisse või välja lülitada ning seotud funktsioonid sõltuvad sellest seadistusest (näiteks e-postiga sisselogimine ei tööta ilma seadistatud Resendita).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'et', $d128$Uue alamülesande loomine kirjast$d128$, $d128$Moodal isiku määramiseks otse Gmailist.$d128$, $d128$Kui kirjast peaks saama uus ülesanne, saab laiendus seda teha Gmailist. Moodal laseb määrata isiku (elav otsing nime järgi) ja manustada kirja faile.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'et', $d128$Kalendriintegratsioon$d128$, $d128$Telli `.ics` voog Google/Apple Calendarisse tähtaegade jaoks.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Tähtaegadega ülesanded võivad ilmuda Google või Apple Calendarisse, tellides isikliku `.ics` voo, mis on genereeritud sinu kasutajale. Voog uueneb tähtaegade muutumisel, seega püsib kalender ajakohane ilma käsitsi sünkroonita.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'et', $d128$Kanban-stiilis lohistamine$d128$, $d128$Rühmitatud tabel: oleku muutmiseks lohista olekugruppide vahel.$d128$, $d128$Ülesannete tabelis on olekud rühmitatud veergudesse või rühmapealkirjadesse. Ülesande olekut muudad, lohistades selle teise rühma, nagu klassikalisel Kanban-tahvlil. Lohistamise ajal näitab sinine joon, kuhu ülesanne maandub.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'et', $d128$Meeskonnakasutajate kutsumine$d128$, $d128$E-posti kutsed, nõustumise/keeldumise voog, kutselingi uuesti saatmine.$d128$, $d128$Inimesi lisad meeskonda, saates kutse nende e-postile. Kui neil on juba {SYSTEM_NAME} konto, saavad nad rakendusesisese teavituse; kui mitte, avab kutselink registreerimise eeltäidetud e-postiga.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Kutse tuleb vastu võtta või sellest keelduda - kedagi ei lisata automaatselt. Kuni see on ootel, saad selle uuesti saata või tühistada ning lingi kopeerida, et saata see teise kanali kaudu (mitte ainult e-postiga).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'et', $d128$Meeskonnast lahkumine ja kasutajate eemaldamine$d128$, $d128$Kuidas meeskonnakasutaja lahkub ja kuidas omanik kasutajaid eemaldab.$d128$, $d128$Iga meeskonnakasutaja peale omaniku saab meeskonnast igal ajal lahkuda profiilist või meeskonnalehelt. Omanik või õige juurdepääsuga kasutaja saab teisi meeskonnast ka eemaldada. See õigus on seadistatud eraldi ja vaikimisi kasutajarollile pole saadaval. Omanikku ei saa eemaldada ega saa ta lahkuda ilma omandit üle andmata.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'et', $d128$Konto loomine$d128$, $d128$Registreeru e-posti või Google'iga; paroolireeglid ja tugevuse kontroll.$d128$, $d128${SYSTEM_NAME} konto saad luua e-posti ja parooliga või Google'iga sisse logides. E-posti registreerimine nõuab vähemalt keskmise tugevusega parooli ning võib genereerida turvalise 16-tähelise parooli, mida saad kasutada või asendada. Google'iga sisselogimisel tulevad ees- ja perekonnanimi Google profiilist. Pärast e-posti registreerimist pead aadressi kinnitama enne süsteemi kasutamist.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'et', $d128$Rollid ja juurdepääsutasemed$d128$, $d128$Süsteemi vaikimisi rollid, kohandatud rollid, täpne juurdepääs (kaustad, arhiiv, failide üleslaadimine, olekumuudatused).$d128$, $d128$Igal meeskonnakasutajal on roll, mis määrab, mida ta tohib teha, alates põhilistest kasutajaõigustest kuni täieliku administraatori juurdepääsuni.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Rolle saab määrata detailselt: lubada või keelata kaustade loomine, arhiivi vaatamine, failide üleslaadimine alamülesannetele, olekumuudatused ja muud konkreetsed toimingud.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Süsteemiga tuleb mitu vaikimisi rolli ning meeskonna omanik saab luua ka kohandatud rolle täpselt nende õigustega, mida meeskond vajab.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'et', $d128$Tasuliste plaanide kataloog$d128$, $d128$Loo plaane, seo mooduleid, määra hindu.$d128$, $d128$Administraator saab luua ja hallata tasuliste plaanide kataloogi: hind, saadaolevad moodulid ja kasutajapiirangud. Plaane saab määrata meeskondadele ning süsteem piirab funktsioone meeskonna aktiivse plaani järgi.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'et', $d128$Navigeerimise ülevaade$d128$, $d128$Külgriba puu (kaustad, nimekirjad, ülesanded), avalehe vaade, meeskonnalüliti.$d128$, $d128$Vasak külgriba näitab sinu kaustade, nimekirjade ja ülesannete puud. Saad seda laiendada, ahendada ja lohistades ümber järjestada.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Üleval on meeskonnalüliti, kui kuulud rohkem kui ühte meeskonda. Avaleht kogub sulle määratud ülesanded nimekirjade lõikes, et näeksid iga päev, mida teha. Kasutajamenüü (üleval paremal) avab profiiliseaded, teavitused ja väljalogimise.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'et', $d128$Tasumata tellimuse olek$d128$, $d128$Mis juhtub juurdepääsuga, kui makse ebaõnnestub või seda ei uuendata.$d128$, $d128$Kui meeskonna makse ebaõnnestub või tellimus on passiivne, näevad tavakasutajad piiratud, hägustatud vaadet koos blokeeriva teatega. Meeskonna omanik näeb selget punast hoiatusriba juhistega arvelduse parandamiseks. Põhiline navigeerimine, meeskonna vahetamine ja konto seaded jäävad kättesaadavaks, et probleem saaks lahendatud ilma andmekadudeta.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'et', $d128$OneDrive integratsioon$d128$, $d128$Sama idee nagu Google Drive: ühenda ja sünkrooni faile.$d128$, $d128$Nagu Google Drive, saab Microsoft OneDrive ühendada meeskonnataseme failisalvestusena. Pärast ühendamist lähevad uued failid sellesse OneDrive kontosse, sama mugavuse ja kontrolliga nagu Google Drive seadistuses.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'et', $d128$Teavituste seaded$d128$, $d128$Rühmitatud seaded kategooria järgi; vanad teavitused koristatakse automaatselt.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Teavituste tüüpe saab kohandada rühmitatud seadete aknas: ülesandesündmused, meeldetuletused ja meeskonnasündmused, igaühel oma sisse/välja lüliti. Vanemad loetud teavitused kustutatakse 30 päeva pärast, et nimekiri püsiks loetav.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'et', $d128$Teavituste tüübid$d128$, $d128$Määramine, kommentaarid, failid, olekumuudatused, meeskonnasündmused.$d128$, $d128$

Süsteem loob teavitusi sündmuste kohta, mis sind puudutavad: sulle määratud ülesanne, sinult eemaldatud ülesanne, lisatud fail, olekumuudatus või uus alamülesanne sinu jälgitavas harus. Need ilmuvad kellaikoonil koos lugemata arvuga.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'et', $d128$Kohandatud olekud mallides$d128$, $d128$Igal malliülesandel võib olla oma olekute komplekt.$d128$, $d128$Igal ülesandel mallis võib olla nimekirja vaikeolekutest erinev olekute komplekt. Näiteks tootmisetapi ülesanne võib kasutada teist voogu kui tarneetapi ülesanne.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Kohandatud olekutega ülesanded on mallis märgitud, et neid oleks lihtne märgata.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'et', $d128$Esimene nimekiri ja ülesanne$d128$, $d128$Põhivoog: loo nimekiri, lisa ülesanne, muuda olekut.$d128$, $d128$Nimekiri on {SYSTEM_NAME} põhiline tööüksus. See hoiab ühe projekti, protsessi või valdkonna ülesandeid. Pärast nimekirja loomist saad lisada ülesandeid, igaühel täitja ja olek.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Ülesande olekut muudad ühe klõpsuga või lohistades seda olekugruppide vahel tabelivaates.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Kui ülesanne on keerulisem, jaga see alamülesanneteks, igaühel oma olekuvoog.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'et', $d128$Esimese meeskonna loomine$d128$, $d128$Kuidas luua meeskond, kutsuda esimesed kasutajad ja kuidas omaniku roll töötab.$d128$, $d128${SYSTEM_NAME}-iga alustamiseks lood meeskonna või liitud sellega. Toode on loodud ühiseks tööks, mitte ainult isiklikuks kasutuseks. Meeskonna loomisel saad selle omanikuks täieliku juurdepääsuga funktsioonidele ja seadetele. Sealt kutsud kolleege, lood esimesed nimekirjad ja struktureerid töö. Üks kasutaja ilma teiste meeskonnakasutajateta on tasuta; teise inimese lisamine teeb sellest tasulise meeskonna.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'et', $d128$Privaatsed nimekirjad$d128$, $d128$Kuidas luua nimekiri, mis on nähtav ainult valitud meeskonnakasutajatele.$d128$, $d128$Nimekirja saab teha privaatseks, et see ei ilmuks külgriba puus kasutajatele ilma otsese juurdepääsuta. See aitab tundliku teabe või väikese ülesannete alamhulga puhul, mis pole kogu meeskonnale mõeldud. Kui administraator lülitab selle funktsiooni kogu süsteemi jaoks välja, muutuvad olemasolevad privaatsed nimekirjad meeskonnas nähtavaks.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'et', $d128$Malliredaktor$d128$, $d128$Nimega mallid kaustade, ülesannete ja alamülesannetega; järjestikune sisestus.$d128$, $d128$Meeskonna tasemel saad luua korduvkasutatavaid malle valmis kaustade, ülesannete ja alamülesannete struktuuriga. See aitab, kui sarnased projektid algavad sama tööjärjestusega.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Malliredaktor laseb lisada kirjeid järjest ning juba malli tasemel määrata isiku ja Check List punkte.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'et', $d128$Nimekirja juurdepääsutasemed$d128$, $d128$Täisredigeerimine / redigeerimine / kommentaar / ainult vaatamine / juurdepääsuta, nimekirja kaupa.$d128$, $d128$Lisaks meeskonnarollile saab iga nimekiri määrata juurdepääsutaseme kasutaja või rolli kaupa: täisredigeerimine, redigeerimine, ainult kommentaar, ainult vaatamine või juurdepääsuta.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Näiteks võib ühel projektijuhil olla nimekirja üle täielik kontroll, samal ajal kui teised meeskonnakasutajad seda ainult vaatavad. Tegelik juurdepääs ühendab meeskonnarolli õigused selle nimekirja seadetega.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'et', $d128$Nimekirjad ja kaustastruktuur$d128$, $d128$Kaustad ja alamkaustad nimekirjade, ülesannete ja failide korraldamiseks.$d128$, $d128${SYSTEM_NAME} korraldab tööd kaustade ja alamkaustadega nimekirjade, ülesannete ja failide jaoks - näiteks projekti, kliendi või osakonna järgi. Külgriba puus saad kirjeid kausta lohistada või sealt välja. Struktuur võib olla nii sügav, kui organisatsioon vajab.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'et', $d128$Seansi haldamine$d128$, $d128$Sisselogimine veebisaidi kontost sõltumatu; seansi pikkus.$d128$, $d128$Laiendus hoiab sisselogimisseanssi kohalikult brauseris umbes 30 päeva, olenemata sellest, kas oled samas sakis {SYSTEM_NAME} saidile sisse logitud. Kui seanss on kehtetu või logisid välja ainult veebisaidil, märkab laiendus seda ja palub uuesti sisse logida ainult siis, kui seda tegelikult vaja on.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'et', $d128$Seansi käsitlemine$d128$, $d128$Jäta mind meelde, seansi pikkus, väljalogimine.$d128$, $d128$Sisselogimisel saad valida „Jäta mind meelde“, et seanss püsiks pärast brauseri sulgemist. Ilma selle valikuta lõpeb seanss brauseri sulgemisel. Veebisaidilt väljalogimine ei mõjuta eraldi Gmail'i laienduse seanssi, mis jääb iseenesest aktiivseks.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'et', $d128$Süsteemimoodulid$d128$, $d128$Funktsioonide sisse- või väljalülitamine (privaatsed nimekirjad, failid, mallid, automaatika, kalender, pilveintegratsioonid).$d128$, $d128$Administraator saab süsteemi funktsioone globaalselt sisse või välja lülitada, näiteks privaatsed nimekirjad, failide üleslaadimine, Check List, automaatika, mallid, kalendriintegratsioon või pilvesalvestus. Väljalülitatud moodul kaob kasutajaliidesest ja turunduslehelt, seega kontrollid, mis on selles paigalduses või tasulises plaanis saadaval.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'et', $d128$Tuletatud olek$d128$, $d128$Kuidas peaülesande olek/edenemine arvutatakse alamülesannetest.$d128$, $d128$Alamülesannetega ülesande üldine olek ja edenemine arvutatakse nende alamülesannete olekutest. Omanikul ei ole vaja peaülesande olekut käsitsi uuendada - see peegeldab alati, kui paljud alamülesanded on tehtud.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'et', $d128$Tähtajad ja meeldetuletused$d128$, $d128$Algus-/tähtajad, suhtelised sildid (täna/jäänud/üle tähtaja), e-posti meeldetuletused.$d128$, $d128$Igal ülesandel ja alamülesandel võib olla alguskuupäev ja tähtaeg. Süsteem näitab suhtelist silti (näiteks "täna", "3 päeva jäänud" või "2 päeva üle tähtaja") olenevalt olekugrupist. Kui administraator on selle sisse lülitanud, saadab süsteem e-posti meeldetuletusi eelseisvate algus- või tähtaegade kohta.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'et', $d128$Ülesannete olekud$d128$, $d128$Süsteemi olekukataloog ja kohandatud olekud nimekirja kaupa, sh järjekord.$d128$, $d128$Igal nimekirjal on olekute komplekt ülesannete etappideks, alates süsteemi vaikekataloogist kuni täielikult kohandatud olekuteni oma nime, värvi ja järjekorraga.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Olekute järjekord määratakse nimekirja seadetes. See mõjutab, kuidas ülesanded vaadetes sorditakse ja kuidas üldine edenemine arvutatakse.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'et', $d128$Ülesande ajalugu$d128$, $d128$Täielik muudatuste logi (olek, kuupäevad, täitjad, failid, teisaldamised).$d128$, $d128$Iga ülesanne ja alamülesanne hoiab täielikku muudatuste logi: olekumuudatused, kuupäevamuudatused, täitjate lisamine ja eemaldamine, pealkirja ja kirjelduse muudatused, nimekirjade vahel teisaldamised ning faili- ja Check List muudatused. Alati näed, kes mida millal muutis.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'et', $d128$Keele valik$d128$, $d128$Süsteemi vaikekeel, isiklik valik, külalise keele tuvastus.$d128$, $d128$Sisselogitud kasutajal hoitakse keelt profiilis ja kasutatakse kõikjal, mis tahes seadmes. Külalisele tuleb see brauseri küpsisest või kui seda pole, administraatori vaikekeelest. Keelt saad igal ajal muuta lülitiga, mis näitab lippe ja keelte täisnimesid.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'et', $d128$Kohtade ostmine$d128$, $d128$Kuidas lisada tasulisi kohti; automaatne ost uue inimese kutsumisel.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Kui kutsud kellegi ja meeskonnal pole vaba tasulist kohta, pakub süsteem enne kutse saatmist osta lisakoha. Kohti saad osta ka ette meeskonna arvelduslehelt, valides igakuise või aastase arvelduse.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'et', $d128$Brändi kohandamine$d128$, $d128$Süsteemi nimi, logo, favicon.$d128$, $d128$Administraator saab määrata süsteemi nime ning üles laadida logo ja faviconi. Kui logo pole üles laaditud, genereerib süsteem avatari nime esimestest tähtedest. Need muudatused ilmuvad kõikjal: brauseri saki pealkirjas, e-kirja mallides ja avalikul turunduslehel.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'it', $d128$Gestione dell'abbonamento$d128$, $d128$Fatturazione mensile o annuale, fatture, disdetta.$d128$, $d128$Nella pagina di fatturazione del team vedi lo stato attuale dell'abbonamento, puoi scegliere tra fatturazione mensile e annuale e pagare tramite un checkout Stripe sicuro. Se un posto a pagamento si libera (un utente del team viene rimosso), resta disponibile fino alla fine del ciclo di fatturazione in corso invece di andare perso subito.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'it', $d128$Creazione delle sottoattività$d128$, $d128$Suddividi un'attività in sottoattività, ciascuna con il proprio flusso di stati.$d128$, $d128$Se un'attività ha diversi passaggi che persone diverse possono svolgere in momenti diversi, puoi suddividerla in sottoattività. Ogni sottoattività ha il proprio flusso di stati, assegnatario, scadenza e allegati - funziona come una piccola attività dentro l'attività padre.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'it', $d128$Archivio$d128$, $d128$Archivia attività/cartelle completate ed eliminate, codice colore, ripristino.$d128$, $d128$Attività, sottoattività e cartelle completate o eliminate non scompaiono subito. Vanno nell'archivio, separato dal lavoro attivo. Gli elementi archiviati sono contrassegnati per colore in base all'ultimo stato, così li distingui in fretta, e puoi ripristinarli nell'elenco attivo in qualsiasi momento.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'it', $d128$Lingue supportate$d128$, $d128$Elenco completo delle traduzioni di interfaccia e marketing (15 lingue).$d128$, $d128$L'interfaccia e i contenuti di marketing di {SYSTEM_NAME} sono tradotti integralmente in 15 lingue, tra cui lettone, inglese e russo. In fase di sviluppo il sistema verifica che in nessuna lingua supportata manchi una chiave di traduzione o un segnaposto.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'it', $d128$Autenticazione$d128$, $d128$E-mail, accesso con Google, requisiti della password.$d128$, $d128${SYSTEM_NAME} consente l'accesso con e-mail e password e con un account Google. Registrazione e accesso via e-mail richiedono una password sufficientemente robusta e includono un flusso di reimpostazione se viene dimenticata.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'it', $d128$Automazioni$d128$, $d128$Regole che applicano automaticamente un modello a una nuova cartella.$d128$, $d128$Le automazioni fanno agire il sistema da solo in condizioni prestabilite. L'automazione disponibile applica un modello scelto a qualsiasi nuova cartella creata in un elenco specifico. Ogni nuova cartella di progetto ottiene così la struttura completa senza ripetere la configurazione a mano.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'it', $d128$Protezione dai bot$d128$, $d128$Controlli Cloudflare Turnstile sui moduli di registrazione e accesso.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

I moduli di registrazione, accesso e reimpostazione password sono protetti con Cloudflare Turnstile. Blocca tentativi automatici e abusivi di creazione account o accesso, restando discreto per gli utenti reali.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'it', $d128$Modello di prezzo$d128$, $d128$Il primo posto è gratuito; paghi per ogni utente del team in più.$d128$, $d128$Il primo posto del team in {SYSTEM_NAME} (il posto del proprietario) è sempre gratuito. Paghi solo per ogni utente del team aggiuntivo oltre il primo posto. Una persona può usare il sistema gratis senza limiti di tempo; la fatturazione inizia solo quando si forma un team reale.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'it', $d128$Check List$d128$, $d128$Un Check List semplice in una sottoattività; deve essere al 100% prima della chiusura.$d128$, $d128$Dentro una sottoattività puoi aggiungere un Check List semplice per passaggi più piccoli, da spuntare in fretta, che non sono sottoattività complete. Se il Check List non è completamente fatto, la sottoattività non può passare a un gruppo di stati chiusi o completati. Gli stati riflettono così sempre lo stato reale del lavoro.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'it', $d128$Crittografia dei dati$d128$, $d128$Crittografia dei token di accesso delle integrazioni.$d128$, $d128$Tutte le credenziali di integrazione (ad esempio Google Drive o altri token di autenticazione di terze parti) sono archiviate crittografate, non in testo semplice nel database. Anche con accesso diretto al database questi dati sensibili non sono leggibili così come sono.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'it', $d128$Formati di data e ora$d128$, $d128$Inizio settimana, formato/separatore della data, orario 12/24 ore.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Ogni utente può impostare il primo giorno della settimana preferito, il formato e il separatore della data e scegliere l'orario a 12 o 24 ore. Queste impostazioni personali sovrascrivono il valore predefinito di sistema impostato dall'amministratore.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'it', $d128$Autenticazione a due fattori (MFA)$d128$, $d128$Configura TOTP nel profilo.$d128$, $d128$Ogni utente può attivare facoltativamente l'autenticazione a due fattori nel profilo usando TOTP (un'app autenticatore come Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

Quando MFA è attiva, ogni accesso chiede anche un codice monouso dall'app autenticatore, oltre alla password.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'it', $d128$Aggiungere un'e-mail a un'attività$d128$, $d128$Importa testo e allegati da Gmail; scegli elenco, cartella e attività.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Da qualsiasi e-mail in Gmail l'estensione può aggiungerla a un'attività o sottoattività scelta. Il corpo del messaggio viene salvato come file di testo e gli allegati si possono scegliere a parte. In fase di aggiunta scegli la destinazione esatta tramite elenco, cartella, attività e sottoattività.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'it', $d128$Modelli e-mail$d128$, $d128$Modifica i modelli di registrazione, reimpostazione password e notifiche.$d128$, $d128$Tutte le e-mail che il sistema invia automaticamente - conferma di registrazione, reimpostazione password, invito al team e altri avvisi di sistema - sono modificabili come modelli HTML nel pannello di amministrazione, ciascuno disponibile in ogni lingua di sistema supportata.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'it', $d128$Offerta Early Bird$d128$, $d128$Un numero limitato di posti scontati per i primi clienti.$d128$, $d128$I primi clienti ottengono un numero limitato di posti scontati da un pool globale Early Bird. Finché restano posti in quel pool, un posto appena acquistato riceve automaticamente il prezzo scontato. Quando un posto è inutilizzato e l'abbonamento termina, non torna nel pool.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'it', $d128$Invio di un file via e-mail$d128$, $d128$Invia un allegato dal sistema a un indirizzo e-mail e tieni traccia della consegna.$d128$, $d128$Qualsiasi file su una sottoattività può essere inviato a qualsiasi indirizzo dal sistema, senza aprire un'app di posta separata.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

In fase di invio puoi aggiungere oggetto e messaggio. Il sistema mostra lo stato di consegna (inviato, consegnato o non riuscito) e conserva uno storico completo degli inoltri, con la possibilità di reinviare se la consegna fallisce.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'it', $d128$Caricamento file$d128$, $d128$Tipi di file ammessi, limiti di dimensione, anteprima (PDF, immagini, txt).$d128$, $d128$Puoi allegare file nell'albero delle attività, nelle sottoattività e in una finestra File separata a livello di cartella.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

L'amministratore definisce quali tipi di file si possono caricare (ad esempio PDF, Word, Excel, disegni DWG, immagini o archivi). Il sistema mostra un errore chiaro se un file non corrisponde. Immagini, PDF e file di testo si possono anteprimare senza uscire dal sistema.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'it', $d128$Utilizzo dello spazio file$d128$, $d128$Volume di archiviazione server e cloud nella barra laterale.$d128$, $d128$Sopra Impostazioni nella barra laterale vedi l'uso totale dello spazio file - i file sul server {SYSTEM_NAME} e i file nel cloud collegato, conteggiati separatamente. Così è chiaro quanto spazio occupano i diversi file e aiuta a decidere se passare all'archiviazione cloud.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'it', $d128$Integrazione Google Drive$d128$, $d128$Collega un account, salva i file su Drive in automatico, rinomina e scarica.$d128$, $d128$Quando l'account Google Drive del team è collegato, i file appena caricati vengono salvati di default su quel Drive invece che sul server {SYSTEM_NAME}. Riduce il costo di archiviazione e tiene i documenti sotto il tuo controllo.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Puoi rinominare e scaricare un file dall'interfaccia {SYSTEM_NAME} e le modifiche si sincronizzano con Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'it', $d128$Installazione e collegamento$d128$, $d128$Installa l'estensione e autorizza l'account.$d128$, $d128$L'estensione Gmail di {SYSTEM_NAME} si installa in Chrome, poi chiede di collegarla al tuo account {SYSTEM_NAME} con un flusso di autenticazione sicuro.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

L'estensione ha una sessione propria, indipendente dall'accesso al sito, quindi uscire dal sito {SYSTEM_NAME} non disconnette l'estensione.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'it', $d128$Configurazione delle integrazioni$d128$, $d128$Configura Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$Nel pannello di amministrazione configuri in un unico punto tutti i servizi esterni necessari al funzionamento completo: accesso OAuth Google e Microsoft, Resend per l'e-mail, Stripe per la fatturazione, Sentry per il tracciamento errori e Umami per l'analisi. Ogni integrazione si può attivare o disattivare e le funzioni collegate dipendono da quella configurazione (ad esempio l'accesso via e-mail non funziona senza un Resend configurato).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'it', $d128$Creare una nuova sottoattività da un'e-mail$d128$, $d128$Una finestra per assegnare una persona direttamente da Gmail.$d128$, $d128$Se un'e-mail deve diventare una nuova attività, l'estensione può farlo da Gmail. Una finestra consente di assegnare una persona (ricerca in tempo reale per nome) e di allegare i file dell'e-mail.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'it', $d128$Integrazione calendario$d128$, $d128$Iscriviti a un feed `.ics` in Google/Apple Calendar per le scadenze.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Le attività con scadenze possono comparire in Google o Apple Calendar iscrivendosi a un feed `.ics` personale generato per il tuo utente. Il feed si aggiorna quando cambiano le scadenze, così il calendario resta attuale senza sincronizzazione manuale.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'it', $d128$Trascinamento in stile Kanban$d128$, $d128$Tabella raggruppata: trascina tra i gruppi di stato per cambiare stato.$d128$, $d128$Nella tabella delle attività gli stati sono raggruppati in colonne o intestazioni di gruppo. Cambi lo stato di un'attività trascinandola in un altro gruppo, come in una classica bacheca Kanban. Durante il trascinamento una linea blu indica dove atterrerà l'attività.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'it', $d128$Invito degli utenti del team$d128$, $d128$Inviti via e-mail, flusso accetta/rifiuta, reinvio del link di invito.$d128$, $d128$Aggiungi persone a un team inviando un invito alla loro e-mail. Se hanno già un account {SYSTEM_NAME}, ricevono una notifica nell'app; in caso contrario il link di invito apre la registrazione con l'e-mail precompilata.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

L'invito va accettato o rifiutato - nessuno viene aggiunto automaticamente. Finché è in attesa puoi reinviarlo o revocarlo, e puoi copiare il link per inviarlo tramite un altro canale (non solo e-mail).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'it', $d128$Uscire da un team e rimuovere utenti$d128$, $d128$Come un utente del team può uscire e come un proprietario rimuove gli utenti.$d128$, $d128$Qualsiasi utente del team tranne il proprietario può lasciare il team in qualsiasi momento dal profilo o dalla pagina del team. Un proprietario o un utente con l'accesso giusto può anche rimuovere altri dal team. Quel permesso è configurato a parte e non è disponibile al ruolo utente predefinito. Il proprietario non può essere rimosso e non può uscire senza trasferire la proprietà.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'it', $d128$Creazione di un account$d128$, $d128$Registrati con e-mail o Google; regole della password e controllo della robustezza.$d128$, $d128$Puoi creare un account {SYSTEM_NAME} con e-mail e password, o accedendo con Google. La registrazione via e-mail richiede almeno una password di robustezza media e può generare una password sicura di 16 caratteri che puoi usare o sostituire. Con l'accesso Google nome e cognome arrivano dal profilo Google. Dopo la registrazione via e-mail devi confermare l'indirizzo prima di usare il sistema.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'it', $d128$Ruoli e livelli di accesso$d128$, $d128$Ruoli di sistema predefiniti, ruoli personalizzati, accesso granulare (cartelle, archivio, caricamento file, cambi di stato).$d128$, $d128$Ogni utente del team ha un ruolo che definisce cosa può fare, dai diritti utente di base all'accesso amministratore completo.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

I ruoli si possono impostare nel dettaglio: consentire o negare la creazione di cartelle, la visualizzazione dell'archivio, il caricamento file sulle sottoattività, i cambi di stato e altre azioni specifiche.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Il sistema include diversi ruoli predefiniti e il proprietario del team può anche creare ruoli personalizzati con esattamente i diritti di cui il team ha bisogno.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'it', $d128$Catalogo dei piani a pagamento$d128$, $d128$Crea piani, associa moduli, imposta i prezzi.$d128$, $d128$Un amministratore può creare e gestire il catalogo dei piani a pagamento: prezzo, moduli disponibili e limiti utente. I piani si possono assegnare ai team e il sistema limita le funzioni al piano attivo del team.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'it', $d128$Panoramica della navigazione$d128$, $d128$Albero della barra laterale (cartelle, elenchi, attività), vista Home, selettore team.$d128$, $d128$La barra laterale sinistra mostra un albero di cartelle, elenchi e attività. Puoi espanderlo, comprimerlo e riordinarlo trascinando.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

In alto c'è un selettore team se appartieni a più di un team. Home raccoglie le attività assegnate a te tra gli elenchi, così vedi cosa fare ogni giorno. Il menu utente (in alto a destra) apre impostazioni del profilo, notifiche e disconnessione.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'it', $d128$Stato di abbonamento non pagato$d128$, $d128$Cosa succede all'accesso se il pagamento fallisce o non viene rinnovato.$d128$, $d128$Se il pagamento di un team fallisce o l'abbonamento è inattivo, gli utenti normali vedono una vista limitata e sfocata con un messaggio di blocco. Il proprietario del team vede un chiaro banner di avviso rosso con come sistemare la fatturazione. Navigazione di base, cambio team e impostazioni account restano disponibili così il problema si può risolvere senza rischiare la perdita di dati.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'it', $d128$Integrazione OneDrive$d128$, $d128$La stessa idea di Google Drive: collega e sincronizza i file.$d128$, $d128$Come Google Drive, Microsoft OneDrive si può collegare come archiviazione file a livello di team. Dopo il collegamento i nuovi file vanno su quell'account OneDrive, con la stessa comodità e controllo della configurazione Google Drive.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'it', $d128$Impostazioni delle notifiche$d128$, $d128$Impostazioni raggruppate per categoria; le vecchie notifiche vengono pulite automaticamente.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

I tipi di notifica si possono regolare in una finestra di impostazioni raggruppate: eventi attività, promemoria ed eventi del team, ciascuno con il proprio interruttore on/off. Le notifiche lette più vecchie vengono eliminate dopo 30 giorni così l'elenco resta leggibile.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'it', $d128$Tipi di notifica$d128$, $d128$Assegnazione, commenti, file, cambi di stato, eventi del team.$d128$, $d128$

Il sistema crea notifiche per gli eventi che ti riguardano: un'attività assegnata a te, tolta da te, un file aggiunto, un cambio di stato o una nuova sottoattività sotto la tua supervisione. Compaiono sull'icona della campana con un conteggio non letto.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'it', $d128$Stati personalizzati nei modelli$d128$, $d128$Ogni attività del modello può avere il proprio set di stati.$d128$, $d128$Ogni attività in un modello può avere un set di stati diverso da quello predefinito dell'elenco. Ad esempio un'attività di fase produttiva può usare un flusso diverso da un'attività di fase di consegna.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Le attività con stati personalizzati sono contrassegnate nel modello così sono facili da individuare.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'it', $d128$Primo elenco e attività$d128$, $d128$Flusso di base: crea un elenco, aggiungi un'attività, cambia stato.$d128$, $d128$Un elenco è l'unità di lavoro di base in {SYSTEM_NAME}. Contiene le attività di un progetto, processo o area. Dopo aver creato un elenco puoi aggiungere attività, ciascuna con un assegnatario e uno stato.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Cambi lo stato di un'attività con un clic o trascinandola tra i gruppi di stato nella vista tabella.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Se un'attività è più complessa, suddividila in sottoattività, ciascuna con il proprio flusso di stati.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'it', $d128$Creazione del primo team$d128$, $d128$Come creare un team, invitare i primi utenti e come funziona il ruolo di proprietario.$d128$, $d128$Per iniziare in {SYSTEM_NAME} crei o entri in un team. Il prodotto è pensato per il lavoro condiviso, non solo per l'uso personale. Quando crei un team ne diventi proprietario con accesso completo a funzioni e impostazioni. Da lì inviti i colleghi, crei i primi elenchi e strutturi il lavoro. Un utente senza altri utenti del team è gratuito; aggiungere una seconda persona rende il team a pagamento.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'it', $d128$Elenchi privati$d128$, $d128$Come creare un elenco visibile solo a utenti del team selezionati.$d128$, $d128$Un elenco può essere reso privato così non compare nell'albero della barra laterale per gli utenti senza accesso diretto. Serve per informazioni sensibili o un sottoinsieme di attività non destinate a tutto il team. Se un amministratore disattiva questa funzione per l'intero sistema, gli elenchi privati esistenti diventano visibili nel team.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'it', $d128$Editor dei modelli$d128$, $d128$Modelli con nome con cartelle, attività e sottoattività; inserimento sequenziale.$d128$, $d128$A livello di team puoi creare modelli riutilizzabili con una struttura pronta di cartelle, attività e sottoattività. Serve quando progetti simili partono con la stessa sequenza di lavoro.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

L'editor dei modelli consente di aggiungere elementi in sequenza e di assegnare già una persona e voci Check List a livello di modello.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'it', $d128$Livelli di accesso all'elenco$d128$, $d128$Modifica completa / modifica / commento / sola visualizzazione / nessun accesso, per elenco.$d128$, $d128$Oltre al ruolo del team, ogni elenco può impostare un livello di accesso per utente o ruolo: modifica completa, modifica, solo commento, sola visualizzazione o nessun accesso.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Ad esempio un responsabile di progetto può avere il controllo completo di un elenco mentre gli altri utenti del team lo vedono soltanto. L'accesso effettivo combina i diritti del ruolo di team con le impostazioni di quell'elenco.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'it', $d128$Elenchi e struttura delle cartelle$d128$, $d128$Cartelle e sottocartelle per organizzare elenchi, attività e file.$d128$, $d128${SYSTEM_NAME} organizza il lavoro con cartelle e sottocartelle per elenchi, attività e file - ad esempio per progetto, cliente o reparto. Nell'albero della barra laterale puoi trascinare gli elementi in una cartella o fuori. La struttura può essere profonda quanto serve all'organizzazione.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'it', $d128$Gestione della sessione$d128$, $d128$Accesso indipendente dall'account del sito; durata della sessione.$d128$, $d128$L'estensione mantiene la sessione di accesso in locale nel browser per circa 30 giorni, che tu sia o meno connesso al sito {SYSTEM_NAME} nella stessa scheda. Se la sessione non è valida, o hai solo effettuato l'uscita sul sito, l'estensione se ne accorge e chiede di accedere di nuovo solo quando serve davvero.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'it', $d128$Gestione della sessione di accesso$d128$, $d128$Ricordami, durata della sessione, disconnessione.$d128$, $d128$All'accesso puoi scegliere Ricordami così la sessione resta dopo la chiusura del browser. Senza quell'opzione la sessione termina quando chiudi il browser. La disconnessione dal sito non influisce sulla sessione separata dell'estensione Gmail, che resta attiva da sola.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'it', $d128$Moduli di sistema$d128$, $d128$Attiva o disattiva le funzioni (elenchi privati, file, modelli, automazioni, calendario, integrazioni cloud).$d128$, $d128$Un amministratore può attivare o disattivare globalmente le funzioni di sistema, ad esempio elenchi privati, caricamento file, Check List, automazioni, modelli, integrazione calendario o archiviazione cloud. Un modulo disattivato scompare dall'interfaccia utente e dalla pagina di marketing, così controlli cosa è disponibile in quella installazione o piano a pagamento.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'it', $d128$Stato derivato$d128$, $d128$Come stato e avanzamento dell'attività padre si calcolano dalle sottoattività.$d128$, $d128$Per un'attività con sottoattività, stato complessivo e avanzamento si calcolano da quegli stati delle sottoattività. Il proprietario non deve aggiornare a mano lo stato padre - riflette sempre quante sottoattività sono fatte.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'it', $d128$Scadenze e promemoria$d128$, $d128$Date di inizio/scadenza, etichette relative (oggi/rimasti/in ritardo), promemoria e-mail.$d128$, $d128$Ogni attività e sottoattività può avere una data di inizio e una scadenza. Il sistema mostra un'etichetta relativa (ad esempio "oggi", "3 giorni rimasti" o "2 giorni di ritardo") in base al gruppo di stato. Se l'amministratore l'ha attivato, il sistema invia promemoria e-mail sulle date di inizio o scadenza imminenti.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'it', $d128$Stati delle attività$d128$, $d128$Catalogo stati di sistema e stati personalizzati per elenco, incluso l'ordine.$d128$, $d128$Ogni elenco ha un set di stati per le fasi delle attività, dal catalogo predefinito di sistema a stati interamente personalizzati con nome, colore e ordine propri.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

L'ordine degli stati si imposta nelle impostazioni dell'elenco. Influisce su come le attività si ordinano nelle viste e su come si calcola l'avanzamento complessivo.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'it', $d128$Cronologia dell'attività$d128$, $d128$Registro completo delle modifiche (stato, date, assegnatari, file, spostamenti).$d128$, $d128$Ogni attività e sottoattività tiene un registro completo delle modifiche: cambi di stato, cambi di date, aggiunta e rimozione di assegnatari, modifiche a titolo e descrizione, spostamenti tra elenchi e modifiche a file e Check List. Puoi sempre vedere chi ha cambiato cosa e quando.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'it', $d128$Scelta della lingua$d128$, $d128$Lingua predefinita di sistema, scelta personale, rilevamento lingua per gli ospiti.$d128$, $d128$Per un utente connesso la lingua è salvata sul profilo e usata ovunque, su qualsiasi dispositivo. Per un ospite arriva da un cookie del browser o, se non c'è, dalla lingua predefinita dell'amministratore. Puoi cambiare lingua in qualsiasi momento con il selettore, che mostra bandiere e nomi completi delle lingue.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'it', $d128$Acquisto di posti$d128$, $d128$Come aggiungere posti a pagamento; acquisto automatico quando si invita qualcuno di nuovo.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Se inviti qualcuno e il team non ha un posto a pagamento libero, il sistema propone di acquistare un posto extra prima di inviare l'invito. Puoi anche acquistare posti in anticipo dalla pagina di fatturazione del team, scegliendo fatturazione mensile o annuale.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'it', $d128$Personalizzazione del brand$d128$, $d128$Nome del sistema, logo, favicon.$d128$, $d128$Un amministratore può impostare il nome del sistema e caricare logo e favicon. Se non viene caricato un logo, il sistema genera un avatar dalle prime lettere del nome. Queste modifiche compaiono ovunque: titolo della scheda del browser, modelli e-mail e pagina di marketing pubblica.$d128$),
  ('1796db29-7e87-4678-801e-c2a6e6e197c1', 'sv', $d128$Prenumerationshantering$d128$, $d128$Månads- eller årsfakturering, fakturor, uppsägning.$d128$, $d128$På teamets faktureringssida ser du den aktuella prenumerationsstatusen, kan välja mellan månads- och årsfakturering och betala via en säker Stripe-kassa. Om en betald plats frigörs (en team-användare tas bort) förblir den tillgänglig till slutet av den pågående faktureringsperioden i stället för att förloras direkt.

![Screenshot 2026-09-01 at 11.07.30](/api/docs/images/8a5b176f-39a2-4cb6-bc33-1e691fa0ceed)
$d128$),
  ('6ab96854-7846-479a-ada1-fa0251bfc991', 'sv', $d128$Skapa deluppgifter$d128$, $d128$Dela upp en uppgift i deluppgifter, var och en med eget statusflöde.$d128$, $d128$Om en uppgift har flera steg som olika personer kan göra vid olika tillfällen kan du dela upp den i deluppgifter. Varje deluppgift har eget statusflöde, tilldelad person, förfallodatum och bilagor - den fungerar som en liten uppgift inuti den överordnade uppgiften.

![Screenshot 2026-09-01 at 10.14.39](/api/docs/images/f09e6dc2-10c1-42f5-99c6-dff3003810ef)
$d128$),
  ('d7c89ff5-9d54-4d31-a3fa-04bca9a7ed48', 'sv', $d128$Arkiv$d128$, $d128$Arkivera slutförda och borttagna uppgifter/mappar, färgkodning, återställning.$d128$, $d128$Slutförda eller borttagna uppgifter, deluppgifter och mappar försvinner inte direkt. De hamnar i arkivet, skilt från aktivt arbete. Arkiverade objekt är färgkodade efter sin senaste status så att du snabbt ser skillnad, och du kan när som helst återställa dem till den aktiva listan.

![Screenshot 2026-08-31 at 11.39.23](/api/docs/images/b636c832-a802-4178-ae6f-11819bcd9bbb)$d128$),
  ('54c891b8-9463-4117-8634-ba230ba10b1a', 'sv', $d128$Språk som stöds$d128$, $d128$Fullständig lista över gränssnitts- och marknadsöversättningar (15 språk).$d128$, $d128${SYSTEM_NAME}-gränssnittet och marknadsföringsinnehållet är helt översatta till 15 språk, däribland lettiska, engelska och ryska. Under utvecklingen kontrollerar systemet att ingen översättningsnyckel eller platshållare saknas i något språk som stöds.

![Screenshot 2026-09-01 at 11.14.36](/api/docs/images/0f66c529-21a0-4b59-9efa-12f1830e4d76)
$d128$),
  ('68d7c5a3-16f7-42aa-bb0a-74547055c20d', 'sv', $d128$Autentisering$d128$, $d128$E-post, inloggning med Google, lösenordskrav.$d128$, $d128${SYSTEM_NAME} stöder inloggning med e-post och lösenord samt med ett Google-konto. E-postregistrering och inloggning kräver ett tillräckligt starkt lösenord och har ett återställningsflöde om det glöms bort.

![Screenshot 2026-09-01 at 11.10.42](/api/docs/images/7dd47a3c-8f55-48a5-8d30-565e6b53d28b)
$d128$),
  ('62ca9b86-f5c9-4f74-9063-3bac0f1bad0e', 'sv', $d128$Automatiseringar$d128$, $d128$Regler som automatiskt tillämpar en mall på en ny mapp.$d128$, $d128$Automatiseringar låter systemet agera själv under angivna villkor. Den tillgängliga automatiseringen tillämpar en vald mall på varje ny mapp som skapas i en viss lista. Varje ny projektmapp får då hela strukturen utan att du upprepar inställningen för hand.

![Screenshot 2026-09-01 at 10.27.16](/api/docs/images/776fde74-2886-4654-bdfd-c96e63a08aa2)
$d128$),
  ('e223536b-346c-417a-9ac9-388130758ed6', 'sv', $d128$Botskydd$d128$, $d128$Cloudflare Turnstile-kontroller på registrerings- och inloggningsformulär.$d128$, $d128$![Screenshot 2026-09-01 at 11.12.58](/api/docs/images/40f3b1ad-e920-4178-81e5-acd23a41c18d)

Registrerings-, inloggnings- och lösenordsåterställningsformulären skyddas med Cloudflare Turnstile. Det blockerar automatiserade, missbrukande försök att skapa konto eller logga in, och är diskret för riktiga användare.

![Screenshot 2026-09-01 at 11.13.57](/api/docs/images/8a0f255d-7bef-40f5-88d8-b2640a62062a)
$d128$),
  ('26569bc2-8db2-42a3-aa75-718ad59b1d9f', 'sv', $d128$Prismodell$d128$, $d128$Första platsen är gratis; du betalar för varje extra team-användare.$d128$, $d128$Den första teamplatsen i {SYSTEM_NAME} (ägarens plats) är alltid gratis. Du betalar bara för varje extra team-användare utöver den första platsen. En person kan använda systemet gratis utan tidsgräns; faktureringen börjar först när ett riktigt team bildas.$d128$),
  ('b94470cf-c23d-4e0e-a6f0-1162b4e620c9', 'sv', $d128$Check List$d128$, $d128$En enkel Check List i en deluppgift; den måste vara 100 % klar före stängning.$d128$, $d128$I en deluppgift kan du lägga till en enkel Check List för mindre, snabbt avbockningsbara steg som inte är fullständiga deluppgifter. Om Check List inte är helt klar kan deluppgiften inte flyttas till en stängd eller slutförd statusgrupp. Statusarna speglar då alltid arbetets verkliga läge.

![Screenshot 2026-09-01 at 10.15.50](/api/docs/images/1c0d8ebe-f28d-411d-b146-02db4e805a6a)
$d128$),
  ('138e667e-4a7e-4599-9b1e-a462be0fb6a7', 'sv', $d128$Datakryptering$d128$, $d128$Kryptering av åtkomsttoken för integrationer.$d128$, $d128$Alla integrationsuppgifter (till exempel Google Drive eller andra tredjeparts-autentiseringstoken) lagras krypterade, inte som klartext i databasen. Även med direkt databasåtkomst går dessa känsliga data inte att läsa som de är.$d128$),
  ('c1030d33-7501-4bc5-ae6e-36828c45747c', 'sv', $d128$Datum- och tidsformat$d128$, $d128$Veckostart, datumformat/avgränsare, 12/24-timmars tid.$d128$, $d128$![Screenshot 2026-09-01 at 11.14.49](/api/docs/images/7c9541fd-89e7-4c46-b30f-f3ad7877d129)

Varje användare kan ställa in önskad första veckodag, datumformat och avgränsare samt välja 12- eller 24-timmarstid. Dessa personliga inställningar åsidosätter systemets standardvärde som administratören har angett.

![Screenshot 2026-09-01 at 11.14.59](/api/docs/images/3078d381-8bd8-4e31-89f6-4a979eeb6470)
$d128$),
  ('f139ce5b-744d-4614-85b3-5e8627c133b4', 'sv', $d128$Tvåfaktorsautentisering (MFA)$d128$, $d128$Konfigurera TOTP i profilen.$d128$, $d128$Varje användare kan valfritt slå på tvåfaktorsautentisering i profilen med TOTP (en autentiseringsapp som Google Authenticator).

![Screenshot 2026-09-01 at 11.11.08](/api/docs/images/713101d5-ddcc-4186-bb1b-3729006cf642)

När MFA är på begär varje inloggning också en engångskod från autentiseringsappen, utöver lösenordet.

![Screenshot 2026-09-01 at 11.11.16](/api/docs/images/085c73f1-cea7-4588-ad94-5d358ef2d9c7)
$d128$),
  ('93e8d9d7-d31d-4f05-a752-2c4ddbc093c3', 'sv', $d128$Lägga till ett e-postmeddelande i en uppgift$d128$, $d128$Importera e-posttext och bilagor från Gmail; välj lista, mapp och uppgift.$d128$, $d128$![Screenshot 2026-09-01 at 10.46.39](/api/docs/images/b9534082-b223-4faf-9f4f-2a0f8631f1c4)

Från valfritt meddelande i Gmail kan tillägget lägga till det i en vald uppgift eller deluppgift. Meddelandetexten sparas som textfil och bilagor kan du välja separat. När du lägger till väljer du exakt destination via lista, mapp, uppgift och deluppgift.

![Screenshot 2026-09-01 at 10.47.12](/api/docs/images/5b306d4d-2cfc-47c6-807f-3f4e8357ab65)
$d128$),
  ('878ea930-5803-4af2-bffe-64eecc8a4cdd', 'sv', $d128$E-postmallar$d128$, $d128$Redigera mallar för registrering, lösenordsåterställning och aviseringar.$d128$, $d128$Alla e-postmeddelanden som systemet skickar automatiskt - registreringsbekräftelse, lösenordsåterställning, teaminbjudan och andra systemmeddelanden - kan redigeras som HTML-mallar i adminpanelen, var och en tillgänglig på alla systemspråk som stöds.$d128$),
  ('837b958e-2962-4645-892f-f5d1cab0cacf', 'sv', $d128$Early Bird-erbjudande$d128$, $d128$Ett begränsat antal rabatterade platser för de första kunderna.$d128$, $d128$De första kunderna får ett begränsat antal rabatterade platser från en global Early Bird-pool. Så länge platser finns kvar i poolen får en nyinköpt plats automatiskt det rabatterade priset. När en plats är oanvänd och prenumerationen avslutas återgår den inte till poolen.$d128$),
  ('3deab368-2b04-4003-ac1a-1a025f1ca4a1', 'sv', $d128$Skicka en fil med e-post$d128$, $d128$Skicka en bilaga från systemet till en e-postadress och följ leveransen.$d128$, $d128$Vilken fil som helst på en deluppgift kan e-postas till valfri adress från systemet, utan att öppna ett separat e-postprogram.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/b6cfd566-76ae-4f7e-9f65-62bccbd24e43)

Vid utskick kan du lägga till ämne och meddelande. Systemet visar leveransstatus (skickad, levererad eller misslyckad) och sparar en fullständig vidarebefordringshistorik, med möjlighet att skicka igen om leveransen misslyckas.

![Screenshot 2026-09-01 at 10.40.16](/api/docs/images/0769c9e4-61ab-45e2-98e9-d191170af484)
$d128$),
  ('a6281076-651e-47cb-be84-9aecc9d55755', 'sv', $d128$Filuppladdning$d128$, $d128$Tillåtna filtyper, storleksgränser, förhandsvisning (PDF, bilder, txt).$d128$, $d128$Du kan bifoga filer i uppgiftsträdet, i deluppgifter och i ett separat Fil-fönster på mappnivå.

![Screenshot 2026-09-01 at 10.33.16](/api/docs/images/7904ee2d-0d7d-4e49-9f1b-b910dde41e0a)

Administratören anger vilka filtyper som får laddas upp (till exempel PDF, Word, Excel, DWG-ritningar, bilder eller arkiv). Systemet visar ett tydligt fel om en fil inte stämmer. Bilder, PDF och textfiler kan förhandsvisas utan att lämna systemet.

![Screenshot 2026-09-01 at 10.33.34](/api/docs/images/e0e1b9f0-e957-46cf-bc8f-717db5c9796c)
$d128$),
  ('c4b382f6-8ca0-436f-9d4d-c855619b2c65', 'sv', $d128$Filutrymmesanvändning$d128$, $d128$Server- kontra molnlagringsvolym i sidofältet.$d128$, $d128$Ovanför Inställningar i sidofältet ser du den totala filutrymmesanvändningen - filer på {SYSTEM_NAME}-servern och filer i det anslutna molnet, räknade var för sig. Det gör tydligt hur mycket utrymme olika filer tar och hjälper dig att avgöra om du ska flytta till molnlagring.

![Screenshot 2026-09-01 at 10.36.19](/api/docs/images/edaa226c-10a6-4742-87b3-8d555f142a75)
$d128$),
  ('35573948-b1c8-44c0-9b3a-aa087592abbc', 'sv', $d128$Google Drive-integration$d128$, $d128$Anslut ett konto, spara filer till Drive automatiskt, byt namn och ladda ner.$d128$, $d128$När teamets Google Drive-konto är anslutet sparas nyligen uppladdade filer som standard till den Drive i stället för {SYSTEM_NAME}-servern. Det sänker lagringskostnaden och håller dokumenten under din kontroll.

![Screenshot 2026-09-01 at 10.33.53](/api/docs/images/6b4605b2-fa3b-44e4-b236-344dc7693fc6)

![Screenshot 2026-09-01 at 10.35.08](/api/docs/images/40bbe164-2193-40d5-ad30-c898b7a2d4c6)

Du kan byta namn på och ladda ner en fil från {SYSTEM_NAME}-gränssnittet, och ändringar synkas med Drive.

![Screenshot 2026-09-01 at 10.36.56](/api/docs/images/e2e9bd5a-f94c-493f-8dcd-d6f6f78385c7)
$d128$),
  ('1d681d31-9a9a-4c43-9141-27a15b3da405', 'sv', $d128$Installation och anslutning$d128$, $d128$Installera tillägget och auktorisera kontot.$d128$, $d128${SYSTEM_NAME} Gmail-tillägget installeras i Chrome och ber sedan dig att ansluta det till ditt {SYSTEM_NAME}-konto via ett säkert autentiseringsflöde.

![Screenshot 2026-09-01 at 10.42.36](/api/docs/images/f65dcc76-fc15-404d-927d-cfec341b1046)

Tillägget har en egen session, oberoende av webbplatsinloggningen, så utloggning från {SYSTEM_NAME}-sajten kopplar inte från tillägget.

![Screenshot 2026-09-01 at 10.43.02](/api/docs/images/60bcfc28-aa7b-4045-a616-f51d2d964cce)
$d128$),
  ('e4909c13-2e31-43e5-8508-b95ed2e97f32', 'sv', $d128$Integrationskonfiguration$d128$, $d128$Konfigurera Google/Microsoft OAuth, Resend, Stripe, Sentry, Umami.$d128$, $d128$I adminpanelen konfigurerar du alla externa tjänster som behövs för full funktion på ett ställe: Google- och Microsoft OAuth-inloggning, Resend för e-post, Stripe för fakturering, Sentry för felspårning och Umami för analys. Varje integration kan slås på eller av, och relaterade funktioner beror på den inställningen (till exempel fungerar inte e-postinloggning utan en konfigurerad Resend).$d128$),
  ('ea9b9910-cb0c-455a-8b62-5590983f0a72', 'sv', $d128$Skapa en ny deluppgift från ett e-postmeddelande$d128$, $d128$En dialog för att tilldela en person direkt från Gmail.$d128$, $d128$Om ett e-postmeddelande ska bli en ny uppgift kan tillägget göra det från Gmail. En dialog låter dig tilldela en person (livesökning på namn) och bifoga e-postfiler.

![Screenshot 2026-09-01 at 10.47.21](/api/docs/images/17a77421-4969-4fc9-b1a8-d9cfff5153e6)
$d128$),
  ('3555e4ac-bdbc-4b7a-8790-6dd03a8c05ea', 'sv', $d128$Kalenderintegration$d128$, $d128$Prenumerera på ett `.ics`-flöde i Google/Apple Calendar för förfallodatum.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.55](/api/docs/images/df1983d9-4ea4-4f2a-bd3e-84f7df9e3ebd)

Uppgifter med förfallodatum kan visas i Google eller Apple Calendar genom att prenumerera på ett personligt `.ics`-flöde som genereras för din användare. Flödet uppdateras när förfallodatum ändras, så kalendern hålls aktuell utan manuell synk.

![Screenshot 2026-09-01 at 10.53.29](/api/docs/images/45ca6cb7-a867-488a-86ba-905ec7868a32)
$d128$),
  ('4ed86632-908e-48b1-bbc9-e0e107761aa7', 'sv', $d128$Kanban-stil dra och släpp$d128$, $d128$En grupperad tabell: dra mellan statusgrupper för att ändra status.$d128$, $d128$I uppgiftstabellen är statusar grupperade i kolumner eller grupphuvuden. Du ändrar en uppgifts status genom att dra den till en annan grupp, som en klassisk Kanban-tavla. Under dragningen visar en blå linje var uppgiften landar.

![Screenshot 2026-08-31 at 11.38.19](/api/docs/images/a0b4535f-2eec-45b1-98c8-10e786c1026d)
$d128$),
  ('75058910-b5c9-48cb-9e49-8baf7116ee72', 'sv', $d128$Bjuda in team-användare$d128$, $d128$E-postinbjudningar, acceptera/avböj-flöde, skicka inbjudningslänken igen.$d128$, $d128$Du lägger till personer i ett team genom att skicka en inbjudan till deras e-post. Om de redan har ett {SYSTEM_NAME}-konto får de en avisering i appen; annars öppnar inbjudningslänken registreringen med e-posten ifylld.

![Screenshot 2026-08-31 at 06.32.32](/api/docs/images/5abd81b9-41ba-4cc4-ba7b-e4c444ab0c5f)

Inbjudan måste accepteras eller avböjas - ingen läggs till automatiskt. Medan den väntar kan du skicka den igen eller återkalla den, och du kan kopiera länken för att skicka den via en annan kanal (inte bara e-post).$d128$),
  ('aba60121-247d-4a74-ab65-facccb396079', 'sv', $d128$Lämna ett team och ta bort användare$d128$, $d128$Hur en team-användare kan lämna, och hur en ägare tar bort användare.$d128$, $d128$Alla team-användare utom ägaren kan lämna teamet när som helst från profilen eller teamsidan. En ägare eller en användare med rätt åtkomst kan också ta bort andra från teamet. Den behörigheten konfigureras separat och är inte tillgänglig för standardanvändarrollen. Ägaren kan inte tas bort och kan inte lämna utan att överföra ägarskapet.$d128$),
  ('80e45603-e3da-4daf-b980-fab9b31c3a6b', 'sv', $d128$Skapa ett konto$d128$, $d128$Registrera med e-post eller Google; lösenordsregler och styrkekontroll.$d128$, $d128$Du kan skapa ett {SYSTEM_NAME}-konto med e-post och lösenord, eller genom att logga in med Google. E-postregistrering kräver minst ett lösenord av medelhållfasthet och kan generera ett säkert 16-teckenlösenord som du kan använda eller byta ut. Med Google-inloggning kommer för- och efternamn från Google-profilen. Efter e-postregistrering måste du bekräfta adressen innan du använder systemet.

![Screenshot 2026-08-31 at 05.59.32](/api/docs/images/b41a0c63-6cdc-4a4f-ad79-466afc79451b)
$d128$),
  ('9817c53f-43b3-4e22-9ce9-c771c3b72183', 'sv', $d128$Roller och åtkomstnivåer$d128$, $d128$Standardroller i systemet, anpassade roller, detaljerad åtkomst (mappar, arkiv, filuppladdning, statusändringar).$d128$, $d128$Varje team-användare har en roll som definierar vad de får göra, från grundläggande användarrättigheter till full adminåtkomst.

![Screenshot 2026-08-31 at 06.34.10](/api/docs/images/cba0cae5-54f2-4d65-bdcc-4e890e09e11d)

Roller kan ställas in i detalj: tillåta eller neka mappkapande, arkivvisning, filuppladdning på deluppgifter, statusändringar och andra specifika åtgärder.

![Screenshot 2026-08-31 at 06.35.04](/api/docs/images/79e6e7b0-0192-4c5a-a4d2-d4fbf06acc41)

Systemet levereras med flera standardroller, och en teamägare kan också skapa anpassade roller med exakt de rättigheter som teamet behöver.

![Screenshot 2026-08-31 at 06.35.15](/api/docs/images/9aabdea8-e33b-4c6d-9f03-c562abdf9b04)
$d128$),
  ('faf81b1f-20ee-48e3-8fd9-e3f8b8fe14f7', 'sv', $d128$Katalog över betalplaner$d128$, $d128$Skapa planer, koppla moduler, sätt priser.$d128$, $d128$En administratör kan skapa och hantera katalogen över betalplaner: pris, tillgängliga moduler och användargränser. Planer kan tilldelas team, och systemet begränsar funktionerna till teamets aktiva plan.$d128$),
  ('2cd3f481-139b-420a-8f38-14da51c28090', 'sv', $d128$Navigeringsöversikt$d128$, $d128$Sidofältets träd (mappar, listor, uppgifter), Hem-vyn, teamväxlare.$d128$, $d128$Vänster sidofält visar ett träd med dina mappar, listor och uppgifter. Du kan expandera, komprimera och ordna om det genom att dra.

![Screenshot 2026-08-31 at 06.30.04](/api/docs/images/8a33ee29-6bcb-49a9-86da-0dd4c7492eb9)

Överst finns en teamväxlare om du tillhör mer än ett team. Hem samlar uppgifter som tilldelats dig över listor så att du ser vad som ska göras varje dag. Användarmenyn (uppe till höger) öppnar profilinställningar, aviseringar och utloggning.$d128$),
  ('2f85cb30-9000-4f0a-8788-d5796bc00512', 'sv', $d128$Obetald prenumerationsstatus$d128$, $d128$Vad som händer med åtkomsten om betalningen misslyckas eller inte förnyas.$d128$, $d128$Om ett teams betalning misslyckas eller prenumerationen är inaktiv ser vanliga användare en begränsad, suddig vy med ett blockerande meddelande. Teamägaren ser en tydlig röd varningsbanner med hur faktureringen åtgärdas. Grundläggande navigering, teamväxling och kontoinställningar förblir tillgängliga så att problemet kan lösas utan risk för dataförlust.
$d128$),
  ('9c47cff1-8c5c-41f5-9dba-0a185a27a12d', 'sv', $d128$OneDrive-integration$d128$, $d128$Samma idé som Google Drive: anslut och synka filer.$d128$, $d128$Precis som Google Drive kan Microsoft OneDrive anslutas som fillagring på teamnivå. Efter anslutning går nya filer till det OneDrive-kontot, med samma bekvämlighet och kontroll som Google Drive-installationen.$d128$),
  ('529df2b9-90a5-4a74-88c4-0c873c1f928b', 'sv', $d128$Aviseringsinställningar$d128$, $d128$Grupperade inställningar per kategori; gamla aviseringar rensas automatiskt.$d128$, $d128$![Screenshot 2026-09-01 at 10.52.24](/api/docs/images/2d293197-2ec3-4dbd-a484-2c4ed022b25e)

Aviseringstyper kan justeras i ett grupperat inställningsfönster: uppgiftshändelser, påminnelser och teamhändelser, var och en med egen på/av-knapp. Äldre lästa aviseringar raderas efter 30 dagar så att listan förblir läsbar.

![Screenshot 2026-09-01 at 10.52.33](/api/docs/images/f6244058-2a50-4279-8d15-296021c35bd2)
$d128$),
  ('c7e53c5b-986e-4857-9dbf-4ac4c7e3362a', 'sv', $d128$Aviseringstyper$d128$, $d128$Tilldelning, kommentarer, filer, statusändringar, teamhändelser.$d128$, $d128$

Systemet skapar aviseringar för händelser som påverkar dig: en uppgift tilldelad till dig, borttagen från dig, en fil tillagd, en statusändring eller en ny deluppgift under din bevakning. De visas på klockikonen med ett oläst antal.

![Screenshot 2026-09-01 at 11.01.47](/api/docs/images/e300625b-8d71-4bc0-8daf-1e44cfc37f45)
$d128$),
  ('96873e5c-b532-4e39-9381-f07214a600b2', 'sv', $d128$Anpassade statusar i mallar$d128$, $d128$Varje malluppgift kan ha sin egen uppsättning statusar.$d128$, $d128$Varje uppgift i en mall kan ha en annan statusuppsättning än listans standard. Till exempel kan en uppgift i produktionsfasen använda ett annat flöde än en uppgift i leveransfasen.

![Screenshot 2026-09-01 at 10.25.11](/api/docs/images/1b93b3f5-c030-4d52-bf42-6ac044687c1a)

Uppgifter med anpassade statusar markeras i mallen så att de är lätta att upptäcka.

![Screenshot 2026-09-01 at 10.26.18](/api/docs/images/3a38cf8c-103c-4a09-ae9c-dce42473dfaf)
$d128$),
  ('cd6b0963-90e6-481f-ad7b-b1dd1254f1e0', 'sv', $d128$Första listan och uppgiften$d128$, $d128$Grundflöde: skapa en lista, lägg till en uppgift, ändra status.$d128$, $d128$En lista är den grundläggande arbetsenheten i {SYSTEM_NAME}. Den rymmer uppgifter för ett projekt, en process eller ett område. Efter att du skapat en lista kan du lägga till uppgifter, var och en med en tilldelad person och en status.

![Screenshot 2026-08-31 at 06.08.03](/api/docs/images/3a34b16a-b804-4cd7-ad08-c348e2e62d1c)

Du ändrar en uppgifts status med ett klick eller genom att dra den mellan statusgrupper i tabellvyn.

![Screenshot 2026-08-31 at 06.08.19](/api/docs/images/c633b565-6698-4e49-8da3-06a29cb8657d)

Om en uppgift är mer komplex, dela upp den i deluppgifter, var och en med eget statusflöde.

![Screenshot 2026-08-31 at 06.08.29](/api/docs/images/a97c4255-f0be-4395-a5ea-ae004773abcf)
$d128$),
  ('5ad2ab2d-f88a-4fc3-9670-cf6a5bdb4514', 'sv', $d128$Skapa ditt första team$d128$, $d128$Hur du skapar ett team, bjuder in de första användarna och hur ägarrollen fungerar.$d128$, $d128$För att komma igång i {SYSTEM_NAME} skapar du eller går med i ett team. Produkten är byggd för delat arbete, inte bara personligt bruk. När du skapar ett team blir du dess ägare med full åtkomst till funktioner och inställningar. Därifrån bjuder du in kollegor, skapar de första listorna och strukturerar arbetet. En användare utan andra team-användare är gratis; att lägga till en andra person gör det till ett betalt team.

![Screenshot 2026-08-31 at 06.05.09](/api/docs/images/d403ba72-d876-4369-acfc-cdab5c104006)
$d128$),
  ('dd51ab1d-d50d-4aa2-b851-d55d4b900952', 'sv', $d128$Privata listor$d128$, $d128$Hur du skapar en lista som bara syns för utvalda team-användare.$d128$, $d128$En lista kan göras privat så att den inte visas i sidofältets träd för användare utan direkt åtkomst. Det hjälper vid känslig information eller en liten delmängd uppgifter som inte är avsedda för hela teamet. Om en administratör stänger av funktionen för hela systemet blir befintliga privata listor synliga i teamet.

![Screenshot 2026-08-31 at 06.45.33](/api/docs/images/b9b16db8-e5ad-4b6f-af7e-9df0d791a296)$d128$),
  ('975e7f7c-e7b9-4bd5-b2cf-6e9bf1025e0b', 'sv', $d128$Mallredigerare$d128$, $d128$Namngivna mallar med mappar, uppgifter och deluppgifter; sekventiell inmatning.$d128$, $d128$På teamnivå kan du skapa återanvändbara mallar med en färdig struktur av mappar, uppgifter och deluppgifter. Det hjälper när liknande projekt startar med samma arbetssekvens.

![Screenshot 2026-09-01 at 10.22.53](/api/docs/images/e5a312e3-c75f-4601-8b5a-67bab9e22894)

Mallredigeraren låter dig lägga till objekt i följd och redan på mallnivå tilldela en person och Check List-poster.

![Screenshot 2026-09-01 at 10.23.25](/api/docs/images/4d29aeea-6746-4f0b-88f9-f944e3d2bfc0)
$d128$),
  ('99814011-85f8-4ee2-91e1-a4207605d9b7', 'sv', $d128$Listans åtkomstnivåer$d128$, $d128$Full redigering / redigering / kommentar / endast visning / ingen åtkomst, per lista.$d128$, $d128$Utöver teamrollen kan varje lista ange en åtkomstnivå per användare eller roll: full redigering, redigering, endast kommentar, endast visning eller ingen åtkomst.

![Screenshot 2026-08-31 at 06.44.03](/api/docs/images/d50e6f35-807b-4eba-8b84-d12a49baead3)

Till exempel kan en projektledare ha full kontroll över en lista medan andra team-användare bara visar den. Effektiv åtkomst kombinerar teamrollens rättigheter med den listans inställningar.

![Screenshot 2026-08-31 at 06.44.12](/api/docs/images/69cbd4ef-f0ca-4a51-90a2-845cb58b8d4c)
$d128$),
  ('0176db78-e35c-4489-8277-f9c22cd371ec', 'sv', $d128$Listor och mappstruktur$d128$, $d128$Mappar och undermappar för att organisera listor, uppgifter och filer.$d128$, $d128${SYSTEM_NAME} organiserar arbetet med mappar och undermappar för listor, uppgifter och filer - till exempel efter projekt, kund eller avdelning. I sidofältets träd kan du dra objekt in i en mapp eller ut ur den. Strukturen kan vara så djup som organisationen behöver.

![Screenshot 2026-08-31 at 11.31.38](/api/docs/images/47938c08-293d-467e-a87c-9113975efdf8)
$d128$),
  ('304bb26a-6a85-4bf9-bd4a-19d9e6ab2433', 'sv', $d128$Sessionshantering$d128$, $d128$Inloggning oberoende av webbplatskontot; sessionens längd.$d128$, $d128$Tillägget behåller inloggningssessionen lokalt i webbläsaren i ungefär 30 dagar, oavsett om du är inloggad på {SYSTEM_NAME}-sajten i samma flik. Om sessionen är ogiltig, eller du bara loggade ut på webbplatsen, märker tillägget det och ber dig logga in igen bara när det verkligen behövs.$d128$),
  ('e1c6bcc5-2f6c-4a52-9144-0143ed54c449', 'sv', $d128$Sessionshantering vid inloggning$d128$, $d128$Kom ihåg mig, sessionens längd, utloggning.$d128$, $d128$När du loggar in kan du välja Kom ihåg mig så att sessionen finns kvar efter att webbläsaren stängts. Utan det alternativet slutar sessionen när du stänger webbläsaren. Utloggning från webbplatsen påverkar inte Gmail-tilläggets separata session, som förblir aktiv på egen hand.$d128$),
  ('7a25e07d-a9cf-4eb6-8bd4-a56adc3c0c48', 'sv', $d128$Systemmoduler$d128$, $d128$Slå på eller av funktioner (privata listor, filer, mallar, automatiseringar, kalender, molnintegrationer).$d128$, $d128$En administratör kan slå på eller av systemfunktioner globalt, till exempel privata listor, filuppladdning, Check List, automatiseringar, mallar, kalenderintegration eller molnlagring. En avstängd modul försvinner från användargränssnittet och marknadsföringssidan, så du styr vad som är tillgängligt i den installationen eller betalplanen.$d128$),
  ('2dc1c7ce-47ea-47ef-b003-f780bad978f9', 'sv', $d128$Härledd status$d128$, $d128$Hur en överordnad uppgifts status/förlopp beräknas från deluppgifter.$d128$, $d128$För en uppgift med deluppgifter beräknas övergripande status och förlopp från de deluppgifternas statusar. Ägaren behöver inte uppdatera den överordnade statusen för hand - den speglar alltid hur många deluppgifter som är klara.

![Screenshot 2026-09-01 at 10.15.07](/api/docs/images/a4c5795c-cc1c-41f3-846d-d6c5aa0d4bf0)
$d128$),
  ('d7edb2ab-126d-4d0f-b5ce-2650b2a52308', 'sv', $d128$Förfallodatum och påminnelser$d128$, $d128$Start-/förfallodatum, relativa etiketter (idag/kvar/försenad), e-postpåminnelser.$d128$, $d128$Varje uppgift och deluppgift kan ha ett startdatum och ett förfallodatum. Systemet visar en relativ etikett (till exempel "idag", "3 dagar kvar" eller "2 dagar försenad") beroende på statusgruppen. Om administratören har aktiverat det skickar systemet e-postpåminnelser om kommande start- eller förfallodatum.

![Screenshot 2026-09-01 at 10.21.43](/api/docs/images/76248fc6-0356-4fef-9518-748e15fcc557)
$d128$),
  ('0fa583a0-ddbd-4b8d-ba4d-44b26af3391c', 'sv', $d128$Uppgiftsstatusar$d128$, $d128$Systemets statuskatalog och anpassade statusar per lista, inklusive ordning.$d128$, $d128$Varje lista har en uppsättning statusar för uppgiftsstadier, från systemets standardkatalog till helt anpassade statusar med eget namn, färg och ordning.

![Screenshot 2026-08-31 at 11.36.19](/api/docs/images/aaa57529-e845-4da4-be05-08433bb7c6ad)

![Screenshot 2026-08-31 at 11.36.43](/api/docs/images/4e75934a-8742-42f1-bf1a-831c94dd8258)

Statusordningen ställs in i listinställningarna. Den påverkar hur uppgifter sorteras i vyer och hur det övergripande förloppet beräknas.

![Screenshot 2026-08-31 at 11.34.40](/api/docs/images/0e37f963-c21b-48ce-9957-e19dd18f7d28)
$d128$),
  ('481232d2-2d8d-4b03-bce1-1ed4e70b7f41', 'sv', $d128$Uppgiftshistorik$d128$, $d128$Fullständig ändringslogg (status, datum, tilldelade, filer, flyttar).$d128$, $d128$Varje uppgift och deluppgift sparar en fullständig ändringslogg: statusändringar, datumändringar, tillägg och borttagning av tilldelade personer, redigeringar av titel och beskrivning, flyttar mellan listor samt fil- och Check List-ändringar. Du kan alltid se vem som ändrade vad och när.

![Screenshot 2026-08-31 at 11.40.33](/api/docs/images/462164aa-d42a-4a16-a46a-3348363433d7)
$d128$),
  ('3e3a1b2c-72f4-496a-bfa5-f1cbc2514234', 'sv', $d128$Språkval$d128$, $d128$Systemets standardspråk, personligt val, språkgissning för gäster.$d128$, $d128$För en inloggad användare lagras språket på profilen och används överallt, på valfri enhet. För en gäst kommer det från en webbläsarcookie, eller om ingen finns, från administratörens standardspråk. Du kan byta språk när som helst med växlaren, som visar flaggor och fullständiga språknamn.$d128$),
  ('9163e47c-f128-4d99-902b-b3c27a732a66', 'sv', $d128$Köpa platser$d128$, $d128$Hur du lägger till betalplatser; automatiskt köp när du bjuder in någon ny.$d128$, $d128$

![Screenshot 2026-09-01 at 11.08.07](/api/docs/images/ce01391c-635b-40e1-a35b-ceeef5533981)
Om du bjuder in någon och teamet saknar en ledig betald plats erbjuder systemet att köpa en extra plats innan inbjudan skickas. Du kan också köpa platser i förväg från teamets faktureringssida och välja månads- eller årsfakturering.

![Screenshot 2026-09-01 at 11.08.11](/api/docs/images/65f8b226-d9a8-4eda-95fe-a36770a41bb0)
$d128$),
  ('67632825-b32a-4eaf-a18c-6986a4b9b249', 'sv', $d128$Varumärkesanpassning$d128$, $d128$Systemnamn, logotyp, favicon.$d128$, $d128$En administratör kan ange systemnamnet och ladda upp en logotyp och favicon. Om ingen logotyp laddas upp genererar systemet en avatar från namnets första bokstäver. Dessa ändringar syns överallt: webbläsarflikens titel, e-postmallar och den publika marknadsföringssidan.$d128$)
on conflict (article_id, language_code) do update
set
  title = excluded.title,
  slogan = excluded.slogan,
  content = excluded.content;
