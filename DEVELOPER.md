# Routine - izstrādātāja dokumentācija

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Geist, Font Awesome
- `@dnd-kit` drag-and-drop
- Ports: **3120**
- i18n: `t(key, fallback, params)`; katalogs `messages.ts` (lv + en, landing bundlē) un `messages-{code}.ts` (pārējās valodas — `loadMessages()` dynamic import); JSON avots `app/lib/i18n/_catalog/` + `scripts/sync-i18n-catalogs.mjs`; admin/e-pasti lieto `allMessages`; klients saņem tikai aktīvās valodas tabulu + overlay (`TranslationsProvider`); `interpolate` ir `app/lib/i18n/interpolate.ts`; `site_translations` ir overlay
- Ja aktīvas valodas > 1, galvenē `LanguageSwitcher` `variant="menu"` rāda karogu (izvēlnē karogs + nosaukums, noklusējums pirmais, tad alfabēts). UI valoda: `users.language_code` (apzināta izvēle), citādi viesu cookie ar `routine-app-language-chosen`, citādi sistēmas noklusējuma valoda.
- Datumi UI: `useDisplayPreferences().formatDate()` / `formatDateTime()`. Efektīvās preferences: lietotāja (`users.week_start_day`, `date_format`, `date_separator`, `time_format`) ja norādītas, citādi `site_settings`. Noklusējums: pirmdiena, `d.m.Y`, `.`, 24 h. DB paliek ISO `YYYY-MM-DD`.
- Favicon: `app/layout.tsx` `<head>` + `generateMetadata.icons` no `siteHeadIconUrl` (`favicon_url` → `logo_url` → iniciāļu SVG ar `logo_color`).
- Document title: `lapas nosaukums | sistēmas nosaukums` (`app/lib/document-title.ts`). Fallback nosaukums `DEFAULT_SYSTEM_NAME` ir **TASQIN** (cookie, repo un esošo Drive/OneDrive mapju ceļi paliek `Routine`). Root `generateMetadata.title.template`. Katrai `(app)` un mārketinga lapai `generateMetadata` (`app/lib/page-metadata.ts`); dinamiskajiem maršrutiem DB vaicājumi `document-title-server.ts`. Next.js pēc ielādes vairs nepārraksta title ar tikai sistēmas nosaukumu.
- Skaitļu formatēšana UI: `app/lib/format/numbers.ts` — `addThousandSeparators`, `formatInteger`, `formatEuro`; maksas plānu cenas caur `formatPlanEuro` (`payment-plans/helpers.ts`).

## Kopīgie helperi

Atkārtotas utilītas ir centralizētas — jaunām funkcijām vispirms pārbaudi, vai kanons jau eksistē:

| Modulis | Funkcijas | Lietojums |
|---|---|---|
| `actions/action-result.ts` | `ActionResult<T>` | Server action atbildes (`ok` / `error`) |
| `auth/oauth-cookie-options.ts` | `oauthCookieOptions` | httpOnly OAuth state cookies (Drive, OneDrive, Gmail, admin configure) |
| `auth/oauth-origin.ts` | `resolveOAuthOrigin` | OAuth redirect origin no klienta / `NEXT_PUBLIC_SITE_URL` |
| `cloud-storage/sanitize-folder-path.ts` | `sanitizeCloudFolderPath`, `LEGACY_CLOUD_FOLDER` | Drive/OneDrive mapju ceļi |
| `cloud-storage/parse-path-parts.ts` | `parsePathParts` | Upload route FormData JSON ceļi |
| `dnd/pointer-y-from-event.ts` | `pointerYFromEvent` | `@dnd-kit` drop līnija (koks, uzdevumu tabula) |
| `format/numbers.ts` | `addThousandSeparators`, `formatInteger`, `formatEuro` | Tūkstošu atdalītājs (atstarpe) |
| `http/parse-cookie-header.ts` | `parseCookieHeader` | Server `Cookie` header parsēšana |
| `i18n/localized-values.ts` | `parseLocalizedValues`, `normalizeLocalizedValues`, `resolveLocalizedValue`, `emptyLocalizedValuesForCodes` | Valodu vērtību `Record<string, string>` (plāni, e-pasti, admin formas) |
| `lists.ts` | `parseIdList`, `parseStatusGroupMap` | ID masīvi un statusu grupu overrides no JSON |
| `list-statuses.ts` | `parseStatusLabels`, `normalizeStatusLabels`, `primaryStatusLabel` | Statusu etiķetes (admin + saraksti) |
| `file-types.ts` | `fileExtensionFromName` | Paplašinājums no faila nosaukuma (UI + security caur `fileExtensionOf`) |

Provider-specifiskie OAuth moduļi (`google-drive/`, `onedrive/`, `integrations/*-oauth/`) joprojām ir atsevišķi; kopīgās cookie/origin utilītas ir augstāk.

## Sānjosla

`app/components/app-nav.tsx` — fiksēta kreisā josla. Galvenē `TeamSwitcher`: kreisajā avatārs (iniciāļi / logotips), pa labi nosaukums un amats (`teamRankLabel`). Apgrieztiem nosaukumiem `OverflowTooltip`. Klikšķis uz avatāra atver komandu sarakstu un **Pievienot jaunu komandu**. Hover uz rindas rāda `...` (Labot / Dzēst) pirms ķeksīša; pēdējo komandu dzēst nevar. Bez komandas klikšķis uz pārslēdzēja atver komandas izveides modāli (nav bloķējoša); dashboard rāda tukšo stāvokli ar pogu un paziņojumu hintu.

| Rinda | Saturs |
|---|---|
| Sākums | `/dashboard` `DashboardHomePage` — Mani uzdevumi (tikai ja ir piesaistīti) un darbs pa sarakstiem; bez komandas — tukšs stāvoklis + jaunas komandas poga |
| Saraksts | `/lists` visu uzdevumu kopsavilkums; chevron izver koku |
| Saraksts (bērns) | `/lists/[listId]` projekta logi: Uzdevumi | Faili augšā, Saraksts pilnā platumā |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` apakšuzdevumu tabula; ikona `fas fa-list-check` |
| Komanda | `/team` biedri ar pēdējo tiešsaistes zīmi; pending ar resend / kopēt linku / noņemt; pats biedrs var **Pamest komandu**; `...` → lomas, šabloni (ja `module_templates`) un Google Drive (ja `module_google_drive` + `module_file_upload`) |
| Atrast kļūdu? / Pieprasīt funkciju / Atsauksmes | virs Failu vietas; `SiteFeedbackModals`; e-pasts uz `legal_email` (Resend, Reply-To = lietotājs); funkcijām publisks saraksts + UP balsis (`088`) |
| Failu vieta | koka + apakšuzdevumu failu `size` summa (`sumFileStorageBuckets` / `formatFileSize`); tooltipā **Serveris** / **Cloud** (tikai ja > 0); rādās tikai ja `module_file_upload` |
| Lietotājs | avatars, **Personīgā informācija** (modālis: vārds, uzvārds), **Personīgie uzstādījumi** (`/settings/profile`), parole, iziet (ved uz `/`) |

Koks: **Saraksts → mape (`kind: "folder"`) vai uzdevumu saraksts (`kind: "task"`) vai fails → apakšuzdevumi (`kind: "subtask"`)**. Apakšuzdevuma rinda rāda `StatusTreeDot` (fons un apmale = statusa krāsa: `todo` pelēks, `in_progress` oranžs, `done` zaļš). Saraksta, mapes, uzdevuma un apakšuzdevuma rindai `WorkProgressFill` - fona aizpildījums pēc `workProgressById` / `listProgress` (pabeigtie un arhivētie kopā ar aktīvajiem).

Uzvedība:

- **Saraksts** nosaukums atver kopsavilkumu; chevron tikai izver koku.
- Saraksta rindā rāda ikonu vai iniciāļus ar krāsu; hover laikā ikonas vietā ir sakļaušanas bultiņa.
- Uzdevuma rindā `fas fa-list-check`; hover laikā ikonas vietā chevron.
- Apakšuzdevuma rindā krāsains aplītis; hover neaizstāj ar chevron. Klikšķis uz nosaukuma vai rindas atver apakšuzdevuma modāli; klikšķis uz statusa ikonas atver statusa izvēlni (`StatusPickerDropdown`). `...` arī ietver **Statuss**.
- Saraksta `+` atver izveides formu, ja loma ļauj veidot sarakstus un saraksta pieeja ir **pilna labošana**. Mapes `+` — mape, uzdevumu saraksts, **Pievienot šablonu** vai faila augšupielāde. Uzdevuma `+` atver apakšuzdevuma modāli (tikai `full_edit`).
- Komandas `...`: **Komandas lomas**, **Šabloni** (`/templates`) — šabloni tikai ja `module_templates` ir ieslēgts; **Google Drive Integrācija** (`/team/google-drive`) — tikai ja `module_google_drive` un `module_file_upload` ir ieslēgti.
- Saraksta `...` ar `canEditList`: **Labot**, **Statusi** (`ListStatusesModal`), **Automatizācijas** (`ListAutomationsModal`, tikai ja `module_automations`), **Dzēst**.
- Uzdevuma/mapes `...` ar `canEditTasks`: **Labot**, **Arhivēt** (`fas fa-folder-open`), **Dzēst**. Arhivēšana (`setWorkItemArchived`) uzliek `archived_at` visam apakškokam; arhivētie pazūd no koka un aktīvā saraksta.
- Faila rinda atver `/lists/[listId]/files/[fileId]`; ikona un krāsa no `file_type_extensions` (`FileIcon` / `useFileTypes`).
- Augšupielāde kokā un apakšuzdevumos: tikai ja `module_file_upload`; tikai katalogā esoši paplašinājumi (`isAllowedFileName`); `input accept` + toast `files.upload.rejected`; progressa overlay (`FileUploadOverlay`, XHR procenti uz Drive). Izslēgtam modulim faili kokā un apakšuzdevumā slēpti; mapes **Faili** logs un faila URL redirect.
- Vilkšana (`NavTreeDnd`, `app/components/nav-tree-dnd.tsx`): mapes, uzdevumus un failus var ievilkt mapē (mapes rinda iezīmējas), iznest ārā (uz saraksta nosaukumu vai kaimiņu) vai nomest **pēc pēdējā brāļa**, arī ja tas ir mape (`NavTreeEndDrop` + mapes rinda: augšējā/apakšējā trešdaļa = before/after, vidus = inside). Drop līnija ir `fixed` portal virs overlay (`z-1100`); overlay paliek blakus kursoram. Loģika: `app/lib/nav-tree-move.ts`. Apakšuzdevumi paliek zem sava uzdevuma. Mapi nevar ielikt sevī.

Vecie `/projects` ceļi novirza uz `/lists`.

## Publiskās lapas

Route group `app/(marketing)/` - bez sānjoslas. Galvene `SiteHeader` (sistēmas nosaukums + logotips vai iniciāļu avatārs no `site_settings`), kājene `SiteFooter`. Publiskais saturs un galvene ir `max-w-6xl`. Kājene bez rāmja un fona; tā pati kājene ir arī lietotnē (`AppShell`, `variant="app"`).

| Ceļš | Saturs |
|---|---|
| `/` | Landing (`LandingPage` + `LandingAppPreview`); H1/title 15 valodās, sekundārais CTA `#features`; hero eagers, zem fold `next/dynamic` + `LazyOnVisible`; hash saites `smooth-scroll.ts`; fīčas un hero no `resolveLandingPageContent` (ieslēgtie frontend moduļi); ielogotam `redirect("/dashboard")` |
| `/login` | Ienākt (`LoginForm`) |
| `/signup` | Reģistrēties (`SignupForm`) |
| `/forgot-password` | Aizmirsi paroli (`ForgotPasswordForm`) |
| `/auth/confirm` | E-pasta saites apstiprinājums (`token_hash` + `type`: signup / recovery) → sesija, tad `/dashboard` vai `/update-password` |
| `/update-password` | Jauna parole pēc e-pasta saites (`UpdatePasswordForm`) |
| `/privacy` | Privātuma politika |
| `/terms` | Lietošanas noteikumi |
| `/cookies` | Sīkdatņu politika + iestatījumu poga |

Auth: `/login` un `/signup` metodes (e-pasts, Google, Microsoft) nāk no RPC `public_sign_in_methods()` (`080`, `getPublicSignInMethods`) ar anon atslēgu — tikai `is_configured AND is_enabled` karogi, bez noslēpumiem. Service role login pogām nav vajadzīgs. E-pasta Ienākt iet caur Supabase `signInWithPassword` ar IP+e-pasta rate limit **un tikai ja Resend ir konfigurēts un aktīvs** (`isEmailPasswordAuthEnabled` vispirms RPC `email`, citādi From + API Key). Reģistrācija: `generateLink({ type: "signup" })` + HTML e-pasts no admin šablona `signup` (`sendSignupConfirmationEmail`); apstiprinājums `/auth/confirm?token_hash&type=signup` (`verifyOtp`). Uzaicinājuma signup: `/signup?invite={token}` ar Vārds/Uzvārds, bloķētu e-pastu un `account_exists` preview (`085`). Paroles lauki: `PasswordInput` (rādīt/paslēpt). Paroles atjaunošana: `generateLink({ type: "recovery" })` + šablons `password_reset`; saite ved uz `/auth/confirm` ar `next=/update-password`. Esošam apstiprinātam e-pastam signup un nezināmam e-pastam reset joprojām rāda vispārīgu veiksmi (nav enumerācijas). Bez Resend: e-pasta lauki nav, galvenē nav Reģistrēties, loginā nav signup saites un Atcerēties mani, `/signup` `redirect("/login")`; server actions atgriež `errors.auth_email_disabled`. **Cloudflare Turnstile** (`092`, `public_turnstile_config`, `requireTurnstileToken`): ja integrācija ir konfigurēta un **Aktīva**, e-pasta reģistrācija un Google ienākšana **bez komandas** prasa derīgu tokenu (jauns Google konts vai lietotājs bez `team_members`). Esošs Google lietotājs ar komandu ienāk bez Turnstile. Ja tokena nav, Google callback novirza uz `/login?pending=google` (vai signup) ar **Turnstile modāli** (`OAuthPendingTurnstileModal`); tokenu verificē vienreiz (`turnstileAlreadyVerified`). Google/Microsoft OAuth profilā ielasa `given_name`/`family_name` (vai sadala no `name`) un ieraksta auth metadata + `users.name`. Site Key publiski caur RPC; Secret tikai serverī. Login e-pasts, paroles atjaunošana un Microsoft OAuth Turnstile neprasa. Bez Turnstile auth strādā kā iepriekš. **Turpināt ar Google** / **Turpināt ar Microsoft** paliek neatkarīgi (admin **Integrācijas** OAuth): pogas ved uz GET `/auth/google-oauth/sign-in?next=…` / `/auth/microsoft-oauth/sign-in?next=…` (login forma nodod `?next=` no URL); callback `/auth/google-oauth/callback`, `/auth/microsoft-oauth/callback` — pēc profila no Google/Microsoft tiek izveidots vai atrasts Supabase Auth lietotājs un sesija. Microsoft pieprasa verificētu e-pastu (OIDC / `id_token`, bez `userPrincipalName`). Pogas rādās tikai ja attiecīgā integrācija ir konfigurēta un **Aktīva**. Signupā OAuth **neprasa** noteikumu ķeksīti (tas paliek tikai e-pasta reģistrācijai). **Atcerēties mani** rādās tikai `/login` e-pasta formā; pēc noklusējuma izslēgts: bez ķeksīša sesija līdz pārlūka aizvēršanai; ar ķeksi 30 dienas (`httpOnly: false`, lai browser Supabase klients lasītu cookie; production HTTPS `Secure`). Ielogotam `proxy` `/`, `/login`, `/signup` un `/forgot-password` novirza uz `/dashboard`; neautentificēts lietotājs no aizsargātiem app ceļiem uz `/login`; landing `app/(marketing)/page.tsx` arī `redirect("/dashboard")`, ja ir sesija. Iziet ved uz `/`. Publiskajā galvenē ielogotam rādās **Atvērt lietotni**. MFA (TOTP) ir opcija `/settings/profile` visiem; ja faktoram ir `verified` un sesija nav `aal2`, lietotne rāda `MfaVerifyModal` pirms app čaulas. `is_admin` pie `/admin` bez MFA tiek novirzīts enroll (`?mfa=required`); ar MFA, bet bez AAL2 - admin modālis. Paroles maiņa (`updatePasswordAction`) prasa `getCurrentUser` (CI `actions.ts` auth-guard).

Legal teksti: `app/lib/legal/documents.ts`. Privātuma pārziņa e-pasts nāk no `site_settings.legal_email` (`getPrivacyPolicyContent(t, settings.legalEmail)`); tukšs lauks izlaiž kontakta teikumu. Tā pati adrese saņem sānjoslas kļūdu ziņojumus, funkciju pieprasījumus un atsauksmes (`submitUserFeedbackAction`). UI: `LegalDocumentView` ar **Saturs** sānjoslu (`sticky` zem galvenes): klikšķis ritina uz sadaļu, josla paliek redzama visā dokumentā.

## Google Search Console

Indeksējamās lapas: `/`, `/privacy`, `/terms`, `/cookies`, `/login`, `/signup`. Pārējais (dashboard, saraksti, komanda, admin, iestatījumi, uzaicinājumi, paroles atjaunošana, `/api/`, `/auth/`, kalendārs) ir `noindex` + `robots.txt` `Disallow` + `X-Robots-Tag: noindex, nofollow`.

| Ko GSC vajag | Kur tas ir |
|---|---|
| Kanoniskais hosts | `NEXT_PUBLIC_SITE_URL` (https, bez trailing slash, viens hosts - `www` vai bez) |
| `robots.txt` | `/robots.txt` (`app/robots.ts`) |
| Sitemap | `/sitemap.xml` (`app/sitemap.ts`) |
| HTML tag verifikācija | `GOOGLE_SITE_VERIFICATION` (meta `google-site-verification`; drīkst ielīmēt arī visu meta tagu) |
| Canonical / OG URL | `canonicalMetadata()` + root `metadataBase`; publiskajām lapām self-canonical pēc valodas (`/`, `/en`, `/de`, …) |
| hreflang | `alternates.languages` visām `LANGUAGE_CODES` + `x-default` caur `localePath()` / `proxy.ts`; norvēģu Bokmål ir `nb-NO` (URL paliek `/no`) |
| JSON-LD | landing `LandingJsonLd` (Organization, WebSite, SoftwareApplication + additionalType WebApplication, FAQPage) |

1. Produkcijā iestati `NEXT_PUBLIC_SITE_URL` uz **vienu** kanonisko hostu (`https://tasqin.com` vai `https://www.tasqin.com`, bez trailing slash) - tas pats, ko pievieno GSC. Spraudnis zina abus (`KNOWN_SITE_ORIGINS`).
2. Search Console → pievieno **URL prefix** īpašumu ar to pašu URL (vai Domain īpašumu caur DNS).
3. Ownership → **HTML tag**: ielīmē `content` vērtību (vai visu meta rindu) env `GOOGLE_SITE_VERIFICATION` un redeplojo.
4. Pēc deploy atver `{NEXT_PUBLIC_SITE_URL}/robots.txt` un `{NEXT_PUBLIC_SITE_URL}/sitemap.xml` - sitemap rādītajiem URL jāsākas ar to pašu origin.
5. GSC → Sitemaps → pievieno `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`.
6. URL Inspection uz `/` - jābūt `index, follow` un canonical uz to pašu origin. Pārbaudi arī `/en` un citu valodu prefiksus. Dashboard URL - `noindex`.

Publiskās lapas (`/`, `/privacy`, `/terms`, `/cookies`, `/login`, `/signup`) ir indeksējamas visās `LANGUAGE_CODES` valodās. Noklusējums ir `lv` bez prefiksa; pārējās ir `/{code}` (piem. `/en/privacy`, `/it`, `/sv`). `/lv` 308 uz versiju bez prefiksa. App maršruti paliek bez valodas prefiksa. `proxy.ts` iestata `x-ui-language`, lai title/description/canonical/H1 atbilstu URL, nevis tikai sīkdatnei. Norvēģu Bokmål: HTML `lang` un hreflang ir `nb-NO`, Open Graph `nb_NO`, publiskais ceļš `/no`. Sitemap iekļauj landing un legal lapas visās valodās; login/signup paliek ārpus sitemap. OG/Twitter attēls 1200×630 (`app/opengraph-image.tsx` / `app/twitter-image.tsx`). `meta keywords` netiek izvadīts.

Neiesniedz GSC uzaicinājumu, paroles vai API ceļus. Ja Resend nav aktīvs, `/signup` novirza uz `/login` - tas GSC ir normāli.

URL ceļos vārdus atdala ar defisi (`/forgot-password`, `/admin/file-types`), ne pasvītru: Google defisi uzskata par vārdu atdalītāju.

## Sīkdatņu piekrišana

`CookieConsentProvider` root layoutā. Popup, kamēr nav lēmuma; iestatījumus var atvērt kājenē vai `/cookies`.

- Cookie: `routine-app-cookie-consent` (versija 1, 180 dienas)
- Kategorijas: `necessary`, `preferences`, `analytics`, `marketing`
- `analytics` piekrišana: Umami `umami.track()` (`UmamiAnalytics`); skripts ielādējas pēc hidratācijas arī bez piekrišanas (`data-auto-track="false"`)
- Sentry nav sīkdatņu kategorija: ielādējas, kad integrācija ir aktīva
- `routine-app-list-window-order` raksta tikai ar `preferences` piekrišanu
- Pieslēgšanās sesija un `routine-app-remember-session` ir **obligātās** sīkdatnes (`app/lib/auth/remember-session.ts`); 30 dienas, ja Atcerēties mani

## Skati

| Klikšķis | Lapa | UI |
|---|---|---|
| Sākums | `/dashboard` | `DashboardHomePage` — Mani uzdevumi tikai tad, ja ir piesaistīti (bez slēgtiem); tad atdalītājs un sarakstu kopsavilkums; grupēšana pēc statusa pretēji picker; apakšuzdevuma klikšķis atver modāli |
| Saraksts | `/lists` | `ListsOverviewPage` — kartītes ar uzdevumiem, apakšuzdevumiem un progresu; klikšķis atver `SubtaskDetailModal` uz vietas |
| Projekts (saraksts) | `/lists/[listId]` | `ListDetailPage` + `ListSummary` — kopsavilkums ar `done/total` un vienu joslu (`work-progress.tsx`); labajā malā arhīva poga (`fas fa-archive`) rāda tikai arhivētos uzdevumus/mapes; aiz nosaukuma `WorkItemArchiveButton` (`fa-folder-open` / `fa-folder`) |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` | Mape: `ListWindowsBoard` (Uzdevumi/Saraksts ar progresu; Faili logs + apakšuzdevumu pielikumi no apakškoka; Sarakstā paperclip pie pielikumiem). Uzdevums: `GroupedSubtaskTables` / `SubtaskTable` — viena tabula ar statusu galvenēm un `done/total` pie nosaukuma, apakšuzdevumu arhīvs, pārvietošana, mīkstā dzēšana; aiz nosaukuma paperclip ja ir pielikumi; aiz nosaukuma arhivēšanas ikona |
| Fails | `/lists/[listId]/files/[fileId]` | `FileDetailPage` — priekšskatījums, lejupielāde, pārsaukšana, dzēšana |
| Apakšuzdevums | uzdevuma ceļš vai saraksta skats + modālis | `SubtaskDetailModal` — lauki kreisajā, Check List pirms pielikumiem, vēsture labajā |
| Šabloni | `/templates`, `/templates/[templateId]` | `TemplatesPage` / `TemplateDetailPage` + `TemplateTreeEditor` — mapes, uzdevumi, apakšuzdevumi, DnD; mapes `+` → Pievienot šablonu; `requireFrontendModule(module_templates)`
| Google Drive | `/team/google-drive` | Komandas OAuth, mapes ceļš, auto-upload un **Glabāt failus Google Drive** (noklusējumā bez servera `content`); `requireFrontendModules(module_google_drive, module_file_upload)` |
| Personīgie uzstādījumi | `/settings/profile` | lasāms profila kopsavilkums + datumu/laika preferences (nedēļas sākums, formāts, atdalītājs, 12/24 h); vārdu/uzvārdu labo lietotāja izvēlnē |
| Administrācija | `/admin` | kategoriju izvēlne ar hover dropdown (Cilvēki, Katalogs, Sistēma); tikai `is_admin` |

Ceļa josla: `app/components/page-breadcrumb.tsx`. Katram posmam ikona pēc tipa (`workItemIcon` mapei/uzdevumam/apakšuzdevumam, `ListBadge` sarakstam, `FileIcon` failam) - arī vecākiem posmiem, ne tikai aktuālajam. Labajā malā `AdminPanelButton` (`fas fa-users-cog`, tikai `is_admin`), `NotificationsMenu` (zvaniņš) un valodas kods, ja aktīvas valodas > 1.

Progress (`app/lib/lists.ts` + `work-progress.tsx`): uzdevums = slēgto apakšuzdevumu skaits / visi nedzēstie (arī arhivētie); mape = bērnu progresu summa; saraksts = sakņu summa. UI: `WorkProgressLabel` (`done/total`), `WorkProgressBar` (viena josla zem kartītes), `WorkProgressFill` sānjoslā. Dzēstie neskaitās.

Ielāde: `LoadingState` (`app/components/loading-state.tsx`, `fas fa-circle-notch fa-spin`) lapās, sānjoslā, paziņojumos un admin čaulā, kamēr store `isReady` vai fetch nav pabeigts. Tukšs stāvoklis rādās tikai pēc ielādes.

## Administrācijas panelis

`/admin` — satura joslā ar **kategoriju izvēlni** (`admin-submenu.tsx`): Cilvēki, Katalogs, Sistēma; hover (vai pieskāriens) atver dropdown ar sadaļām (Sistēmā arī **E-pasta šabloni** pēc Integrācijām). Aktīvā kategorija ir izcelta, aktuālā lapa dropdownā ar ķeksīti. Ikona pie paziņojumiem rādās tikai ielogotam lietotājam ar `public.users.is_admin = true`. `/admin` novirza uz `/admin/users`. Pirms paneļa: TOTP MFA (ja nav ieslēgta — `/settings/profile?mfa=required`; ja sesija nav AAL2 — `MfaVerifyModal` uz vietas). Ielogošanās MFA (visiem, kam TOTP ir ieslēgts) jau ir `aal2`, tāpēc admin parasti vairs neprasa otru kodu. Mutācijas raksta `admin_audit_events`.

| Ceļš | Saturs |
|---|---|
| `/admin/users` | Visi `public.users`: pievienot, labot, dzēst; `is_admin` slēdzis; pēdējā tiešsaiste; UI valodas kods |
| `/admin/teams` | Visas `teams`: pievienot, labot, dzēst (kaskāde uz darba datiem) |
| `/admin/roles` | Sistēmas noklusējuma lomas un pieejas (`system_default_roles`); jaunām komandām |
| `/admin/statuses` | Uzdevumu statusu katalogs (`task_statuses`): nosaukums katrā valodā, krāsa, grupa, kārtojums |
| `/admin/file-types` | Atļautie failu paplašinājumi (`file_type_extensions`): paplašinājums, MIME, Font Awesome ikona, krāsa; CRUD |
| `/admin/languages` | `site_languages`: pievienot, labot nosaukumu, aktīva/noklusējuma, dzēst |
| `/admin/translations` | `site_translations` + `messages.ts` atslēgas: meklēšana, pievienot, labot, dzēst (koda atslēgas dzēst nevar) |
| `/admin/modules` | `site_frontend_modules`: atslēga, ieslēgts/izslēgts, dzēšana (`AdminFrontendModulesForm`) |
| `/admin/payment-plans` | `site_payment_plans` katalogs: ieslēgums, izmēģinājums, Early Bird limīts, `max_members`, cenas, frontend moduļi plānā (`AdminPaymentPlansForm`) |
| `/admin/integrations` | `site_integrations`: Google/Microsoft OAuth (login/signup); Cloudflare Turnstile (Site Key + Secret); Resend, Umami, Sentry; Client ID/Secret, OAuth pārbaude vai Saglabāt, **Aktīva** slēdzis; sakļaujamas kartiņas (`AdminIntegrationsPage`) |
| `/admin/email-templates` | HTML e-pasta šabloni (`signup`, `password_reset`, `invite`, `notification`) visās sistēmas valodās: temats, teksts, pogas teksts, iframe priekšskatījums (`AdminEmailTemplatesForm`); saglabā `site_translations` |
| `/admin/cron-jobs` | `site_cron_jobs`: ieslēgt/izslēgt cron darbus (optimistisks slēdzis + `ToggleSwitch` `busy`) un kopēt `cron-job.org` saiti (`AdminCronJobsForm`); `GET/POST /api/cron/[jobKey]?token=` palaiž atgādinājumus. cron-job.org: **reizi stundā**. Sākums no 8:00 un termiņš no 9:00 lietotāja laika joslā; katrā palaišanā līdz 1000 lietotājiem (`089`, `091`) |
| `/admin/settings` | `site_settings`: sistēmas nosaukums, juridiskais e-pasts (`legal_email`, privātuma politika un lietotāju kļūdu/atsauksmju/funkciju e-pasti), slogans, logotips/favicon (data URL) vai iniciāļu avatārs ar `logo_color`, nedēļas sākums, datuma formāts/atdalītājs, 12/24 h; ja Resend konfigurēts — From/Reply-To (`AdminSettingsForm` + `saveSiteSettingsAction`); hinti zem laukiem |

- Servera vārti: `requireAdmin()` layoutā un `admin/actions.ts`
- Klienta pārbaude: `useIsAdmin()` caur RPC `current_user_is_admin()` (ikona)
- Lietotāju saraksts caur ielogotā admin sesiju (RLS `008_admin_list_access.sql`); jauna lietotāja izveide ar service role
- Valodas, tulkojumi, uzstādījumi caur to pašu sesiju (RLS `010_site_admin_session_access.sql`); `site_*` SELECT arī `anon`
- Migrācijas: `003` admin RPC, `006` valodas/tulkojumi/uzstādījumi, `007` RU, `008` admin list access, `009` `users` aktivitātes lauki, `010` site admin session RLS, `011` `users.language_code`, `081` komandas izveidotāja owner INSERT, `082` extra `site_languages`, `083` `it`/`sv`, `012`/`016`/`018` statusi, `017`/`020`/`021` lomas, `013`/`014`/`019` privāti saraksti, `022`/`023` sarakstu pieeju līmeņi, `024` `work_tasks.deleted_at`, `025` kataloga statusa check, `027`/`028`/`030` saraksta statusi, `029` `work_tasks.checklists`, `031` `team_status_labels`, `032` failu `size` backfill, `033`/`035` display preferences, `034` `file_type_extensions`, `036`/`037` sistēmas logotips/favicon un `logo_color`, `038` `work_tasks.archived_at`, `039` `work_templates` / `work_template_items`, `040` šablona `kind: folder` un ligzdots koks, `041` `work_list_automations` (trigger + action uz sarakstu), `044`–`049` komandas uzaicinājumi (tabula, RPC accept/reject, paziņojumi, self-leave, explicit accept, reject fix), `050` `set_current_user_name` (lietotājs maina savu vārdu), `051_team_permissions_extended` (komandu lomu pieejas UI + efektīvais list access), `051_task_activities_extended` un `052_task_activities_reordered` (apakšuzdevumu vēsture), `053` `user_notification_preferences`, `054` paplašināti `app_notifications.kind`, `055` `work_task_statuses` + uzdevuma statusu layout lauki, `056` šablona assignee/checklist, `057` šablona custom statusi, `058` `site_frontend_modules` (`module_templates`, `module_automations`), `059` `module_private_list` + RPC `publish_all_private_work_lists`, `060` `module_file_upload`, `061` `module_checklist`, `062` `site_payment_plans` + `site_payment_plan_modules` + `teams` plāna kolonnas, `063` `touch_current_member_online`, `064` `module_google_drive` + `team_google_drive_integrations`, `065` `user_calendar_integrations` + `module_calendar` / `module_calendar_apple` / `module_calendar_google`, `066` `module_onedrive` + `team_onedrive_integrations`, `067`/`068`/`069` `site_integrations` (`google_oauth`, `microsoft_oauth`, Resend/Umami/Sentry), `070` Drive `store_on_server` + `google_drive_file_id` uz `list_files` / `task_files`, `071` attēlu paplašinājumi (`png`/`jpg`/`jpeg`/`gif`/`webp`) `file_type_extensions`, `072` `txt`/`html` failu tipi, `073_workspace_speed` (`has_content`, `team_id` indeksi, RPC reorder / `set_task_assignees` / `update_tasks_status`), `074` kalendāra tokenu šifrēšana, `075` zip/rar, `076` `has_content` backfill, `077_email_templates` (`find_auth_user_by_email` RPC + HTML šablonu seed `site_translations`), `078`/`079` `module_gmail_plugin` + `user_gmail_connections`, `080` `public_sign_in_methods()` (anon login karogi bez noslēpumiem), `084` `site_settings.legal_email`, `085` invite preview `account_exists`, `086`/`087` `file_forwarded` + Resend email id, `088` `site_user_feedback` / `site_feature_votes` + `toggle_feature_vote`, `089` `site_cron_jobs` + `app_notifications.kind` `start`, `090` `rate_limit_buckets` / hashed invite un cron tokeni, `091` `site_settings.timezone` / `users.timezone` + RPC `set_current_user_timezone`, `092_turnstile_integration` (`turnstile` + `public_turnstile_config`), `093_payment_plan_max_members`

## Cron jobs

Atgādinājumi par apakšuzdevuma sākumu un termiņu. Admin ieslēdz darbu `/admin/cron-jobs` un iekopē URL [cron-job.org](https://cron-job.org).

**Grafiks:** abām saitēm **Every hour** (ne reizi dienā). 8:00 (sākums) un 9:00 (termiņš) ir lietotāja vietējais rīts, ne servera pulkstenis. Otro darbu var likt 5–10 min vēlāk. HTTP limits 30 palaišanas/stundā uz IP; `maxDuration` 60 s.

**Loģika** (`app/lib/cron-jobs/run.ts`, `timezone.ts`):

- Darbu atslēgas: `subtask_start_reminder` (sākums), `subtask_due_reminder` (termiņš)
- Sākums: vietējā stunda ≥ `CRON_START_HOUR` (8), `start_date` ≤ šodien, statuss vēl nav sākts
- Termiņš: vietējā stunda ≥ `CRON_DUE_HOUR` (9), `due_date` = šodien, nav slēgts
- Līdz `CRON_USER_BATCH_LIMIT` (1000) lietotājiem palaišanā; pārējie nākamajā stundā
- Dublēšanu bloķē `app_notifications` (`kind` `start` / `due`) tajā pašā vietējā dienā
- Laika josla: `users.timezone` (`TimezoneSync` → `saveCurrentUserTimezoneAction` → RPC `set_current_user_timezone`); ja nav — `site_settings.timezone` (`Europe/Riga`)
- Auth: `?token=` vai `Authorization: Bearer` pret hashed tokenu `site_cron_jobs` (`findEnabledCronJobByToken`); nav sesijas cookie. Security smoke to atļauj `app/api/cron/*` (`findEnabledCronJobByToken`)

## Frontend moduļi

Globāli feature flagi tabulā `public.site_frontend_modules` (`module_key` + `is_enabled` + `sort_order`). Admin UI: `/admin/modules` (`admin-frontend-modules-form.tsx`), tikai `is_admin`. App layout ielādē ieslēgtās atslēgas un iedod `FrontendModulesProvider` (`app/lib/frontend-modules/context.tsx`). Publiskā landing `(marketing)/layout.tsx` ielādē tās pašas atslēgas (`getEnabledFrontendModuleKeys` ar service role, jo anon RLS slēdz tabulu) un iedod to pašu provider. `resolveLandingPageContent` (`app/lib/landing/features.ts`) rāda tikai ieslēgto moduļu kartītes un pielāgo hero/preview tekstu; izslēgtie netiek pieminēti. Klients: `useFrontendModules().isEnabled(key)`. Serveris: `isFrontendModuleEnabled` / `requireFrontendModule` (izslēgtam šablonu maršrutam redirect uz `/dashboard`).

| Atslēga | Ieslēgts | Izslēgts |
|---|---|---|
| `module_private_list` | `ListFormModal` rāda **Privāts saraksts** slēdzi un biedru/lomu izvēli | Slēdzis pazūd; visi `work_lists.is_private` kļūst `false` (RPC `publish_all_private_work_lists`); UI tos rāda kā publiskus |
| `module_file_upload` | Augšupielāde kokā, apakšuzdevumos, mapes **Faili** logs, sānjoslas **Failu vieta** | Nav upload; esošie faili kokā un apakšuzdevumā slēpti; Failu logs izņemts no window order; Failu vieta pazūd; faila URL redirect |
| `module_google_drive` | Komandas `...` → **Google Drive Integrācija**; `/team/google-drive`; faili uz Drive (noklusējumā bez servera `content`, opcionāli spoguļojums); admin slēdzis ieslēdzams tikai ja Google OAuth integrācija ir konfigurēta un ieslēgta | Izvēlnes opcijas nav; maršruts redirect uz `/dashboard`; Drive sync nenotiek. Prasa arī `module_file_upload` |
| `module_gmail_plugin` | Gmail Chrome spraudnis (`extensions/gmail` `0.4.17`): sesija, komandu pārslēgšana, e-pasta pievienošana. **Turpināt ar Google** → `/auth/gmail-plugin/login` (ne `/login`) → done ar bootstrap ticket → `POST /api/extension/bootstrap-from-ticket`. **Atjaunot Gmail** → ticket bridge `/auth/gmail-plugin/bridge?t=…` → `/start` (Gmail OAuth); production vajag `INTEGRATION_SECRETS_KEY`. Admin slēdzis tikai ja Google OAuth ir ieslēgts. Gmail OAuth tokeni `user_gmail_connections` (service role). Redirect `/auth/google-oauth/callback` | Spraudnis rāda, ka modulis izslēgts |
| `module_onedrive` | Komandas `...` → **OneDrive Integrācija**; `/team/onedrive`; pēc faila pievienošanas kopija uz OneDrive, ja komanda ir pieslēgusi kontu. Admin slēdzis ieslēdzams tikai ja Microsoft OAuth integrācija ir konfigurēta un ieslēgta | Izvēlnes opcijas nav; maršruts redirect uz `/dashboard`; OneDrive sync nenotiek. Prasa arī `module_file_upload` |
| `module_checklist` | Check List lietojams; slēgto statusu bloķē nepabeigti punkti | Sadaļa vienmēr sakļauta (`forceCollapsed`); slēgto statusu **nebloķē** |
| `module_automations` | Saraksta `...` → **Automatizācijas**; `lists-store` izpilda statusa/čeklistes/apakšuzdevumu noteikumus | Izvēlnes opcijas nav; esošie noteikumi **neizpildās** |
| `module_templates` | Komandas `...` → **Šabloni**; `/templates` pieejams; mapes `+` var pielietot šablonu | Šablonus nevar atvērt/veidot; pat ja automatizācijas ir ieslēgtas, **Mapes izveide → šablons** (`folder_created`) nerādās `ListAutomationsModal` un neizpildās `parent-create-flow` |
| `module_calendar` | Lietotāja dropup rāda **Kalendāra integrāciju**, ja ieslēgts arī Apple vai Google apakšmodulis | Izvēlnes opcijas nav; `.ics` plūsma paliek tukša |
| `module_calendar_apple` | Izvēlē Apple Calendar un `webcal://…ics` abonēšana | Apple karte UI nav |
| `module_calendar_google` | Izvēlē Google Calendar; tas pats HTTPS `.ics` (Google “From URL” / `calendar.google.com?cid=`) | Google karte UI nav |

Lib: `app/lib/frontend-modules/` (`keys.ts`, `repository.ts`, `context.tsx`, `access.ts`). Zināmo atslēgu etiķetes UI atkārtoti izmanto `lists.private.label`, `team.access.actions.files_upload`, `nav.google_drive`, `nav.gmail_plugin`, `subtasks.checklist.title`, `nav.templates`, `lists.automations.title`, `calendar.integration.title`, `calendar.provider.apple`, `calendar.provider.google`.

Plūsma: `GET /calendar/{token}.ics` (`app/calendar/[token]/route.ts`). Apple: `webcal://`. Google Calendar **neizmanto** Calendar API OAuth — oficiāli abonē HTTPS iCalendar URL (`From URL` vai `calendar.google.com/calendar/r?cid=`). Google atjauno plūsmu lēni (stundas). Token hash DB (`feed_token_hash`); ICS `Cache-Control: private, no-store`, bez uzdevumu `description`. ICS lasa service role. Pilno ICS URL UI rāda tikai ģenerēšanas/rotācijas brīdī (`calendar.integration.feed_once` / `feed_hidden`).

## Maksas plāni

Admin apakšizvēlne (`admin-submenu.tsx`, `is_admin`) → `/admin/payment-plans` (`admin-payment-plans-form.tsx`). CRUD un iestatījumi: `admin/actions.ts` + `app/lib/payment-plans/` (`helpers.ts`, `repository.ts`, `team-plan.ts`). Cenas UI: `formatPlanEuro` → `formatEuro` no `app/lib/format/numbers.ts` (atstarpe kā tūkstošu atdalītājs).

| Iestatījums | Kur | Uzvedība |
|---|---|---|
| Ieslēgt maksas plānus | `site_settings.payment_plans_enabled` | Toggle; **ieslēgts** — komandas frontend moduļi no aktīvā plāna; **izslēgts** — visi globāli ieslēgtie moduļi visām komandām |
| Izmēģinājums | `trial_plan_id` + `trial_days` (1–365) | Plāns jaunām komandām; piešķiršana reģistrācijā vēl nav pieslēgta |
| Early Bird | `early_bird_limit` | 0 = izslēgts; piešķirto skaits = `teams.payment_plan_is_early_bird` |
| Katalogs | `site_payment_plans` | `name_values` / `description_values` visās sistēmas valodās; `is_free` (`094`, vienmēr aktīvs bez maksas); `max_members` (`093`, 1–10 000); opcionālas mēneša / ceturkšņa / gada cenas (tukšs = 0); Early Bird cenas. Seed: `free`, `paid` |
| Moduļi plānā | `site_payment_plan_modules` | Atzīmē tikai globāli ieslēgtos `site_frontend_modules` |

Komandai kolonnas `payment_plan_id` / `payment_plan_until` / `payment_plan_paid` / `payment_plan_is_trial` / `payment_plan_is_early_bird` (`062`). Piešķiršana: `/admin/teams` (`AdminTeamPlanModal` + `updateAdminTeamPaymentPlanAction`). Aktīvs plāns = kataloga `is_free`, vai ir `plan_id` un (`paid` **vai** `is_trial`) un `until` tukšs vai ≥ šodien. App layout ielādē globālos moduļus + plānu katalogu; `TeamScopedFrontendModules` filtrē pēc `currentTeam.paymentPlan`. Biedru limita enforcement pie uzaicināšanas vēl nav. Tabulas SELECT `anon`/`authenticated`; raksta tikai admin (`current_user_is_admin`).

## Paziņojumi

`app/components/notifications-menu.tsx` — satura joslas zvaniņš atver paneli.

- Nerakstīto skaits uz zvana; **Atzīmēt visus kā lasītus**
- Klikšķis uz ieraksta atzīmē kā lasītu un atver `href` (uzdevums)
- **`fetchVisibleNotifications`** — personīgie in-app paziņojumi: `recipient_id === selfMemberId`; uzaicinājumi pēc `target_user_id`; noraidījumi uzaicinātājam
- **Iesaistītie** saņem brīdinājumus par uzdevumu/apakšuzdevumu notikumiem: uzdevuma un (apakšuzdevumam) vecāka piesaistītie; lomas izvērstas uz biedriem (`task-notifications.ts` → `appendNotifications`). Jauns uzdevums/apakšuzdevums ar assignee (šablons, automatizācija) sūta `assigned` caur `notificationsForInitialAssignees` (`addTask` var uzreiz saņemt `assigneeIds` / `checklists`)
- **`kind`:** `assigned`, `unassigned`, `comment`, `file`, `status_changed`, `task_updated`, `due` (tips gatavs; automātiska ģenerēšana vēl nav), `team_invite`, `team_invite_rejected`
- Triggeri: `lists-store` (`updateTask`, `addTask`, komentārs, fails, pārvietošana), dashboard todo (`team-todo-board`), komandas uzaicinājums (`team/actions.ts`); **aktors pats netiek informēts**
- **`appendNotifications`** pirms insert filtrē pēc `user_notification_preferences` (trūkstoša rinda = ieslēgts); pēc insert `sendNotificationEmailsAction` sūta HTML e-pastu (šablons `notification`), izņemot `team_invite` (tam ir uzaicinājuma šablons). Resend izslēgts = tikai in-app
- **Paziņojumu uzstādījumi** (`notification-settings-modal.tsx`) — grupēts modālis ar 3 sekcijām (Uzdevumi, Atgādinājumi, Komanda) un ikonām katram veidam; toggle automātiski saglabā serverī (bez Saglabāt pogas); pieejams no `user-menu.tsx` un zvaniņa paneļa (`notifications-menu.tsx` settings poga headerī)
- **`team_invite`** — komandas uzaicinājums reģistrētam lietotājam (`target_user_id`); panelī **Apstiprināt** / **Noraidīt** (`accept_team_invitation` / `reject_team_invitation` RPC); servera pusē respektē preference
- **`team_invite_rejected`** — uzaicinātājam pēc noraidījuma; `href` satur noraidītā e-pastu
- Bez aktīvas komandas paziņojumus lasa pēc `target_user_id` (uzaicinājumi redzami arī dashboard tukšajā stāvoklī)
- Lasītu paziņojumu **dzēšana**: hover rāda × pogu (`dismiss`); automātiska tīrīšana vecākiem par 30 dienām (`deleteOldNotifications`) katrā fetch reizē
- Nav dummy seed; tipi `app/lib/notifications.ts`, preference `app/lib/notification-preferences.ts`
- Stāvoklis: `app/lib/use-notifications.ts` lasa/raksta/dzēš `app_notifications` tabulu

## Apakšuzdevuma modālis

`app/components/subtask-detail-modal.tsx` + `AppModal` (`dirty` no nosaukuma, apraksta, datumiem, atbildīgajiem — **statuss un čeklisti dirty neskaita**). Statusa maiņa esošam apakšuzdevumam `updateTask` uzreiz. Čeklisti esošam uzdevumam persistējas uzreiz (tekstam debounce). Saglabāt **neaizver** modāli un nepāriet uz citu lapu; aizver X / ESC / Atcelt. Pēc jauna apakšuzdevuma izveides paliek edit mode. Poga **Pievienot jaunu** (tikai plus + tooltip `actions.add_new`) rādās, kad ir nosaukums un Saglabāt nav aktīvs; klikšķis atver tukšu formu tajā pašā modālī. `headerMeta` rāda `izveidots {date}` no aktivitātes `kind === "created"` (`useDisplayPreferences().formatDate`); jaunam nesaglabātam apakšuzdevumam datums nav. `headerSubtitle` rāda `TaskLocationPath` (`getSubtaskLocationSegments` / `getParentTaskLocationSegments`) — saraksts un mapes līdz vecākam uzdevumam, katram posmam tipa ikona. Atverams arī no saraksta loga un `/lists` kopsavilkuma, bez navigācijas. Divkolonnu izkārtojums: kreisā kolonna nosaka augstumu; vēsture labajā ir `absolute` pret kreiso un ritinās iekšēji (`ScrollableHistoryList` — fade + chevron, kad ir overflow).

| Lauks | Uzvedība |
|---|---|
| Nosaukums | Trekns, lielāks teksts, bez rāmja un fona |
| Apraksts | Piezīmes |
| Sākums / Termiņš | `DateCell` — klikšķis atver pārlūka datuma izvēli (`showPicker`); zem datuma relatīvais hints caur `taskDateRelativeHint` (`app/lib/task-date-display.ts`) pēc statusa grupas: **sākums** — `not_started` rāda atlicis/kavē līdz startam, `active` tikai kavējumu; **termiņš** — `not_started`/`active` atlicis vai kavē, `closed` tikai kavējumu; `disabled`, ja nav `canEditTasks` |
| Statuss | `StatusControl` — krāsaina poga; nākamais (`fa-angle-right`) un Check. Tabulā bez hover tikai nosaukums, hover rāda `>` / Check / pārvietot / dzēst (bez animācijas). Klikšķis uz nosaukuma atver picker. `comment` līmenī statusu drīkst mainīt izpildītājs. Ja ir čeklista punkti, zem pogas zaļa progresa josla; slēgto grupu un Check tikai pie 100% |
| Projekts, atbildīgie | Saraksta badge, `AssigneeCell` (izvēlne `createPortal` uz `document.body`, lai netiktu nogriezta tabulā) |
| Check List | `TaskChecklists` — pirms pielikumiem; unikāls React `key` (`checklists-…`, atsevišķi no `attachments-…`); vairāki saraksti ar nosaukumu; nākamais tukšais punkts parādās pēc teksta; atzīmēšana ar ķeksīti. Tukšs sākumā sakļauts (izvēršams); ar vismaz vienu sarakstu atvērts. `forceCollapsed` ja `module_checklist` izslēgts. Struktūru labo `canEditTasks`; punktus atzīmē arī `canChangeStatus` |
| Pielikumi | `TaskAttachments` — tikai ja `module_file_upload`; drag-and-drop vai **pārlūko**; zem zonas `files.upload.allowed_types`; `accept` no kataloga; kartītes ar ikonu/krāsu; apgrieztam nosaukumam `OverflowTooltip` (pilns vārds + paplašinājums); X augšējā labajā stūrī dzēš caur `ConfirmModal`; `disabled` bez `edit` / `full_edit`. Tukšs sākumā sakļauts (izvēršams); ar failiem atvērts |
| Faila `...` | `CreateItemMenu`: Apskatīt, Lejupielādēt, Pārsaukt, Dzēst. Klikšķis uz kartītes arī atver apskati. Izvēlne ar `data-app-modal-ignore-backdrop`, lai neaizvērtu apakšuzdevuma modāli |
| Dzēst failu | Tikai `ConfirmModal` (`files.delete.*`) |
| Pārsaukt failu | `NameFormModal` (`files.edit.*`) |
| Apskatīt failu | `FilePreview` ligzdotā `AppModal` |
| Vēsture | Labā kolonna, `taskActivities`; katrs ieraksts caur `formatTaskActivityText` (`app/lib/format-task-activity-text.ts`). Logošana centralizēta: `updateTask` → `buildTaskUpdateActivityEvents` (`app/lib/build-task-activity-events.ts`); atsevišķi `moveSubtask`, failu dzēšana/pārsaukšana, `reorderTasks`. Fiksē statusu, datumu (no → uz), piesaistīto pievienošanu/noņemšanu, nosaukumu, aprakstu, kontrolsaraksta punktus, pārvietošanu pie cita uzdevuma, paslēpšanu/atjaunošanu, failus un kārtību. Statusu nosaukumi no kataloga (`labelFor`); laiks `RelativeTime`. **Nav** komentāra ievades (`addTaskComment` UI nav); vecie `kind=comment` ieraksti vēsturē paliek |

Failu metadati: `TaskFile` / `ListFile` (`size`, `hasContent`, `googleDriveFileId`, …). Saturs Postgres `content` (data URL, līdz `MAX_STORED_FILE_BYTES`, 1.5 MB) vai tikai Drive (`google_drive_file_id`, `store_on_server = false`). Atļautie paplašinājumi: `file_type_extensions` (sākumā pdf, dwg, Office + attēli + txt/html + zip/rar; `071`/`072`/`075`); `app/lib/file-types.ts` + `FileTypesProvider`. Ikona/krāsa: `FileIcon`. Progress: `FileUploadOverlay`. Klikšķis: `FileViewerProvider` — bildes/PDF/txt modālī (`isBrowserPreviewableFile`), pārējie lejupielādējas; kamēr notiek ielāde/lejupielāde, rādās overlay ar spinneri un faila nosaukumu. PDF: `blob:` iframe bez `sandbox` un `#navpanes=0`. E-pasta `.txt`/`.html`: `buildEmailPreviewDocument`. Apakšuzdevuma kartītēs `formatFileSize`.

## Saraksti un uzdevumi

Hierarhija: **Saraksts → mape / uzdevumu saraksts / fails → apakšuzdevumi tikai zem uzdevumu saraksta**.

- Tipi: `app/lib/lists.ts` (`WorkTaskKind`: `folder` \| `task` \| `subtask`)
- Stāvoklis: `app/lib/lists-store.tsx` — `fetchTeamWorkspace` čaula (saraksti, uzdevumi, metadati, statusi; **bez** `content`, aktivitātēm, notifs, todos); `PGRST303` / `JWT issued at future` atkārto 0.4s / 1s / 2s (`withJwtClockSkewRetry` `work-data.ts`); `ListsDataContext` + `ListsActionsContext`. Failu saturs: `ensureTaskFileContent` / `ensureListFileContent`. Aktivitātes: `useTaskActivities` pēc atvērta uzdevuma. Pieslēgtam lietotājam bez komandas tukšs koks. `addTask` optimistiski atjauno UI; DB inserti rindā pēc `parent_id` (`pendingTaskInsertsRef`). Apakšuzdevumu izmaiņas ieraksta `task_activities` caur `buildTaskUpdateActivityEvents` (`updateTask`) un atsevišķās funkcijās (`moveSubtask`, failu operācijas, `reorderTasks`)
- Šabloni (`work_templates` / `work_template_items`): `TemplatesProvider` lādē tikai `/templates` vai `ensureLoaded()` (create-flow, automatizācijas). `kind` `folder` | `task` | `subtask` (`040`); redaktors `TemplateTreeEditor` + `template-tree-move.ts`. Uzdevumam assignee, checklist un custom apakšuzdevumu statusi (`056`–`057`); `TemplateDetailPage` automātiski saglabā. `applyTemplate` rekursīvi izveido koku. Tukšās rindas tikai UI (`prepareTemplateEditorItems`); DB `sanitizeTemplateItems`. Tiešsaistes touch: `touchMemberOnline` (90 s, bez lokāla members rewrite)
- Automatizācijas (`work_list_automations`, `041`): saraksta līmeņa noteikumi ar `trigger_kind` + `action_kind`. UI: `ListAutomationsModal` no saraksta `...` (tikai `module_automations`). Izpilde `lists-store` `updateTask` (statuss, čeklistes, visi apakšuzdevumi) palaižas tikai ja automatizāciju modulis ir ieslēgts. Pāris `folder_created` → `apply_template`: rādās un izpildās (`parent-create-flow.tsx` pēc tiešas mapes izveides) tikai ja **abi** `module_automations` un `module_templates` ir ieslēgti — **netrigerējas** manuālā šablona pielietošanā vai rekursīvā mapju veidošanā no šablona. CRUD: `lists-store` `addListAutomation` / `updateListAutomation` / `deleteListAutomation`; helperi `app/lib/list-automations.ts`. DB insert secība: skat. `pendingTaskInsertsRef` pie `addTask`
- Arhīvs (`archived_at`, atšķirīgs no apakšuzdevumu `deleted_at`): `setWorkItemArchived` arhivē uzdevumu vai mapi ar visiem pēcnācējiem; noņemšana no arhīva atjauno arī senčus, lai vienums atkal būtu kokā. Aktīvais koks un `getListTasks` slēpj arhivētos; `archivedListTasks` rāda arhīva saknes. UI: `WorkItemArchiveButton` (`fa-folder-open` aktīvam, `fa-folder` arhivētam); saraksta lapā `fas fa-archive` pārslēdz kopsavilkumu
- Saraksta faili kokā: `app/lib/list-files.ts` — augšupielāde tikai `file_type_extensions` katalogā
- Jauns/labot sarakstu: `ListFormModal` — izskats, **noklusējuma pieeja**; slēdzis **Pielāgot katrai lomai** parāda lomu līmeņus un paslēpj globālo izvēli; **Privāts saraksts** slēdzis (un biedru izvēle) tikai ja `module_private_list` ir ieslēgts
- Apakšuzdevumu tabula (`SubtaskTable` + `GroupedSubtaskTables`): viena tabula ar `groupByStatus` galvenēm iekšā; pie Pievienot arhīva poga (`IconActionButton` `variant="delete"`, aktīva paliek sarkanīga) rāda aktīvos **un** arhivētos; pabeigšana fade-out vietā; miskaste aiz Check (`deleted_at`, nav statusa katalogā); klikšķis uz dzēstā atjauno; zem nosaukuma `TaskLocationPath` (`getSubtaskLocationSegments`; saraksta nosaukums tikai, ja tabulā ir vairāki `listId`; pie katra posma tipa ikona); **Pārvietot** (`fa-exchange-alt`) atver `MoveSubtaskModal` — mērķiem mapē vai citā sarakstā PATH zem nosaukuma (`MoveSubtaskDestinationButton`, bez saitēm); tas pats masveida joslā; slēgtajiem/dzēstajiem **rindai** viegls fons (`fadeHexColor` 0.88; dzēstajiem `#ef4444`); statusa pogai atsevišķi blāvs fons; zem statusa `RelativeTime` un, ja ir čeklista punkti, zaļa progresa josla; jaunam uzdevumam `statusChangedAt` = izveides laiks; `reorderable={false}` (Sākums) slēpj kārtību, bet statusu joprojām var vilkt
- Vilkšana: `app/components/task-drop-line.tsx` (`TaskDropLine`, `dropHintFromEvent`, `frozenSortingStrategy`, `groupedStatusCollisionDetection`). Vilkšanas laikā saraksts neslīd; drop ir bieza zila līnija. Starp statusu grupām vilkšana **tikai maina statusu**, nesamaina vietām ar cita grupas pēdējo uzdevumu
- Kopsavilkums (`ListSummary` Sākumā un `/lists`) un uzdevuma apakšuzdevumu tabula: tā pati secība kā sānjoslas kokā (`sortTasksLikeNavTree` / `compareTasksByStatusPriority` — vispirms grupa slēgts → aktīvs → nav sākts, tad kataloga indekss, tad `sortOrder`). `SubtaskTable` vienmēr kārto pati. Pretēji picker. Slēgtie paliek ārpus aktīvā saraksta
- Gmail browse (`listExtensionSubtasksForTask`): tā pati statusa prioritāte kā UI, ne tikai `sort_order`
- Projekta **Saraksts** logs: uzdevumu kartītes `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` tādā pašā statusa secībā. Mape rāda nested uzdevumus un to apakšuzdevumus (`OverviewSubtaskList`); grupēšana pēc statusa; aplītis hover rāda check + tooltip `status.complete_ask` (pabeidz / atver atpakaļ); arhīva poga kartītē parāda pabeigtos, progresa josla paliek. Apakšuzdevumam ar pielikumiem `fa-paperclip` aiz nosaukuma. Klikšķis uz apakšuzdevuma iet caur `ListWindowsBoard` `onOpenSubtask` → vienu `SubtaskDetailModal` lapā (`TaskDetailPage`). Apakšuzdevuma aplītis un nosaukums ir statusa krāsā. Logs **Faili**: tiešie `list_files` + `task_files` no `getDescendantSubtasks` (klikšķis: bildes/PDF/txt modālī, pārējie lejupielādējas caur FileViewerProvider). Logs **Uzdevumi** paliek vilktā `sortOrder` secībā; tā arhīva poga (`handleTasksArchiveChange`) sinhronizē arhīvu visām Saraksts loga kartītēm (`overviewArchiveById`), bet katru kartīti var pārslēgt atsevišķi

## Sarakstu pieejas

`app/lib/list-access.ts` — līmeņi `full_edit` | `edit` | `comment` | `view`. Noklusējums jaunam un esošam sarakstam: **`full_edit`**. Īpašnieks, `is_admin` un izveidotājs vienmēr `full_edit`.

| Līmenis | UI | RLS (`work_list_has_access`) |
|---|---|---|
| `full_edit` | Veidot uzdevumus, labot iestatījumus, dzēst sarakstu | task INSERT, list DELETE, list_files INSERT |
| `edit` | Labot uzdevumus un saraksta iestatījumus | list UPDATE, task DELETE, faili/assignees |
| `comment` | Komentēt; izpildītājs var mainīt statusu | task UPDATE, `task_activities` `kind=comment` |
| `view` | Tikai lasīšana | SELECT caur `can_view_work_list` |

Prioritāte: biedra rinda (`work_list_viewers.access_level`) → lomas rinda (`work_list_viewer_roles`) → `work_lists.default_access_level`. Privātam sarakstam bez rindas pieeja ir `null` (neredz). Publiskam sarakstam lomu rindas ir līmeņa override. UI: `resolveListAccessLevel` + `listAccessCapabilities` (pēc tam tiek apvienots ar komandas lomu pieejām caur `resolveEffectiveListAccess`, kas papildus ANDo ar `team` sadaļu redzamību (`nav.lists`) un darbībām (`lists.edit`, `lists.delete`, `tasks.manage`)). Bez lomu slēdža lomu rindas nesaglabā (visi manto noklusējumu).

## Statusa kontrole

`app/components/status-control.tsx` — vienots `WorkTaskStatus` redaktors tabulā un apakšuzdevuma modālī.

- Krāsas un nosaukumi no `useTaskStatuses(listId)`: sistēmas `task_statuses` plus šī saraksta `list_statuses`. Bez `listId` (Sākums) saplūdina visus sarakstu statusus etiķetēm. `useSystemTaskStatuses()` ir tikai katalogs.
- Fallback `todo` pelēks, `in_progress` oranžs, `done` zaļš
- Slēgtās grupas statusiem (`done` u.c.) poga ir **blāva**: `fadeHexColor` sajauc krāsu ar baltu, teksts paliek statusa krāsā
- Dzēstajiem (`deletedAt`) etiķete `status.deleted`, krāsa `#ef4444` ar to pašu blāvo fonu; Check poga `bg-red-100 text-red-600`
- Koka / Saraksta loga aplītis: `statusDotClassName` (fons + apmale tās pašas); teksts: `statusTextClassName`
- Picker portal `z-80`, `data-app-modal-ignore-backdrop`; ESC aizver tikai picker
- Nākamais statuss: `nextStatusId` pēc kataloga `sort_order` (ne tikai todo → in_progress → done)
- Sākuma / saraksta kopsavilkuma grupēšana ir **pretēja** picker: `statusesByPriorityDesc` (piem. IZM → IN PROGRESS → TO DO). Picker paliek Nav sākts → Aktīvs → Slēgts
- `work_tasks.status` ir brīvs teksts pēc `025_work_tasks_catalog_status.sql` (noņemts check tikai uz todo / in_progress / done)
- Tabulā `revealActionsOnHover`: bez hover tikai statusa nosaukums; hover (vai atvērts picker / pārvietošana) rāda `>` un trailing pogas, vieta rezervēta, bez animācijas
- Zem pogas `RelativeTime` (`app/components/relative-time.tsx`, `getLastOnlineDisplay`); tooltipā precīzais `dd.mm.yy hh:mm`
- Ja apakšuzdevumam ir čeklista punkti (`work_tasks.checklists`) **un** `module_checklist` ir ieslēgts, zem statusa pogas zaļa progresa josla (`checklistProgress`). Slēgtās grupas statusus un Pabeigt bloķē, kamēr `taskHasIncompleteChecklists`; **aktīvās** (un nav sākts) grupas statusus var mainīt arī ar nepabeigtiem punktiem. `updateTask` noraida slēgto statusu, ja punkti nav izpildīti. Check List moduli izslēdzot bloķēšana **nav**.

Saraksta statusi: `ListStatusesModal` (`app/components/list-statuses-modal.tsx`) no saraksta `...`. Sistēmas statusi ir lasāmi; komanda var pārsaukt sistēmas statusu šai komandai (`team_status_labels`). Komanda pievieno / labo / dzēš / kārto tikai šī saraksta ierakstus (`list_statuses`, ID `lsts-…`). Dzēšot savu statusu, uzdevumi ar to atgriežas uz `todo`. Nav sākts un slēgts paliek singleton grupas. Rakstīšana: `work_list_has_access(list_id, 'edit')`. CRUD: `lists-store` `addListStatus` / `updateListStatus` / `deleteListStatus` / `reorderListStatuses` / `renameSystemStatus`.

## Komanda un pēdējā tiešsaiste

- Biedri: `app/lib/team.ts`, `app/lib/team-store.tsx`, servera darbības `app/lib/team/actions.ts`
- Komandas (`WorkTeam`): `id`, `name`, `initials`, `icon`, `color`, `logoUrl`; CRUD `addTeam` / `updateTeam` / `deleteTeam` / `selectTeam`
- Pieslēgtam lietotājam komandas un biedri nāk no Postgres (`teams`, `team_members`); `currentUser` nāk tikai no sesijas (`getUser()`), dummy biedri (Anna u.c.) netiek rādīti
- UI gaida auth sesiju pirms komandas/sarakstu ielādes; `INITIAL_SESSION` ar `user=null` netiek izmantots kā gatava sesija
- Jauna komanda: izveidotājs kļūst **Īpašnieks** (`OWNER_TEAM_ROLE` / `teams.rank.owner`); rangs zem vārda, komandas nosaukuma un modālī tikai ja ir komanda
- Lomas: `team_roles` (komandai) + `system_default_roles` (admin `/admin/roles`, seed jaunām komandām). Pieejas `TeamPermissionSet` (`nav` + `actions`) — `app/lib/team-permissions.ts`. `nav` kontrolē sadaļu redzamību (dashboard/lists/team/templates/settings), `actions` kontrolē darbības (lists.create/edit/delete, tasks.manage, saraksta statusi/automatizācijas, failu augšupielāde, šabloni, komandas invite/noņemt/dzēst u.c.). Īpašniekam un `is_admin` visas pieejas. UI: `TeamRolesModal` no sānjoslas; katrai lomai saraksta ikona atver `TeamRoleAccessModal` (`TeamPermissionFields` ar divkolonnu izkārtojumu); toggle automātiski saglabā (bez Saglabāt pogas)
- UI: `app/components/team-switcher.tsx`; jauna/labot komanda caur `NameFormModal` (`showLogo` + `showIcons={false}`); bez komandas modālis nav bloķējošs, atveras no pārslēdzēja vai dashboard pogas (`REQUEST_CREATE_TEAM_EVENT`)

### Uzaicinājumi (`044`–`049`)

| Solis | Kas notiek |
|---|---|
| Uzaicināt (`inviteTeamMemberAction`) | `team_members` rinda ar `user_id = null`, `team_invitations` `pending`, unikāls `token` |
| Jaunam e-pastam | Ja Resend aktīvs: HTML šablons `invite` ar `/invite/{token}` (nav `inviteUserByEmail`, lai nebūtu dubulta Supabase vēstule). Bez Resend: jaunu e-pastu nevar uzaicināt |
| Reģistrētam lietotājam | In-app `team_invite` paziņojums (`target_user_id`); HTML uzaicinājuma e-pasts, ja Resend aktīvs |
| Apstiprināt | Paziņojumos, `/invite/{token}` vai RPC `accept_team_invitation` → `user_id` tiek iestatīts |
| Nav konta | Preview `account_exists = false` (`085`) → redirect `/signup?invite={token}`: Vārds/Uzvārds/Parole, e-pasts disabled+prefill; metadata `given_name` / `family_name` / `name` / `full_name` |
| Noraidīt | Paziņojumos vai `/invite/{token}` → RPC `reject_team_invitation`; pending `team_members` rinda dzēsta; uzaicinātājam `team_invite_rejected` |
| Pending UI | `/team` un `/team/[id]`: resend, kopēt linku, noņemt; sānjoslā tikai apstiprinātie (`confirmedTeamMembers`) |

**Explicit accept:** kamēr uzaicinājums ir `pending`, `users_link_team_members` **nepiesaista** biedru pēc e-pasta; nav auto-accept trigera. Lietotājs redz komandas datus tikai pēc apstiprinājuma (`is_team_member` prasa `user_id = auth.uid()`).

**Pamest komandu:** apstiprināts biedrs (ne īpašnieks) var pats aiziet — `removeTeamMemberAction` self-leave, UI `TeamLeaveSection` (`/team`, `/settings/profile`).

**E-pasts:** ar Resend HTML uzaicinājums tiek izveidots bez Supabase Auth invite. Ja Auth konta nav, `/invite/{token}` novirza uz `/signup?invite=…` (nevis tukšu „Reģistrēties”). Bez Resend jaunu (nereģistrētu) e-pastu nevar uzaicināt; reģistrētam lietotājam pietiek ar in-app `team_invite` paziņojumu. Esošam pending uzaicinājumam var kopēt `/invite/{token}` linku.

- Attēlojums: `app/components/member-last-online.tsx`, loģika `app/lib/last-online.ts`

| Intervāls | Attēlojums |
|---|---|
| ≤ 1 min | zaļš aplītis |
| < 60 min | `{n} min` |
| ≥ 60 min | `{n} h` |
| ≥ 24 h | `{n} d` |
| ≥ 30 dienas | `{n} m` |

Aktīvais lietotājs raksta `last_online_at` DB ik pēc 90 s (`touchMemberOnline` → RPC `touch_current_member_online`, `063`), bez lokāla `members` pārraksta. Relatīvais laiks UI: `NowProvider` / `useNow()` (60 s), ne katrs komponents ar savu interval. Sānjoslā aktuālais lietotājs rādās kā tiešsaistē. Admin lietotāju tabulā avots paliek `team_members.last_online_at` (ne `last_sign_in_at`).

## Project structure

```
proxy.ts                          # Sesijas refresh, ielogota novirzīšana, publisko lapu valodas prefiksi (`/en`, `/de`, …); `/lv` → `/`; kanoniskā hosta 301 ar CORS, ja Origin ir `chrome-extension://`
next.config.ts                    # CSP/HSTS; `canonicalHostRedirectRules()` izlaiž `/api/extension/*`
app/
  layout.tsx                      # Root: i18n, cookie consent, Umami/Sentry, SEO metadata; TimezoneSync (pārlūka IANA josla)
  robots.ts                       # /robots.txt — publiskās lapas, bloķē app/API
  sitemap.ts                      # /sitemap.xml — landing + legal × visām LANGUAGE_CODES
  fontawesome.css                 # FA solid/regular/brands (ne `all.min.css`)
  (marketing)/
    layout.tsx                    # SiteHeader/Footer + FrontendModulesProvider (landing fīčas)
    page.tsx                      # Landing; ielogotam redirect /dashboard; JSON-LD
    login/ signup/ forgot-password/ update-password/ auth/confirm/
    invite/[token]/               # Komandas uzaicinājuma landing; bez konta → `/signup?invite=`
    privacy/ terms/ cookies/
  (app)/
    layout.tsx                    # AppProviders + sānjosla; MFA vārteja (AAL2); enabled frontend module keys
    dashboard/page.tsx            # Sākums: Mani uzdevumi + saraksti
    lists/                        # Kopsavilkums, 3 logi, uzdevums, fails
    team/ settings/ projects/ templates/
    admin/                        # users, teams, roles, statuses, file-types, languages, translations, modules, payment-plans, integrations, email-templates, settings

  globals.css                     # Zinc light theme; `--radius-*` uz pusi
  components/
    site-header.tsx               # Publiskā galvene; sistēmas logo/iniciāļi; ielogotam Atvērt lietotni; Reģistrēties tikai ar Resend
    site-footer.tsx               # Publiskā kājene
    landing-page.tsx              # Landing: H1, problem, features, audiences, FAQ; zem fold lazy (`landing-below-fold`, `lazy-on-visible`); hash `smooth-scroll`
    landing-json-ld.tsx           # schema.org Organization / WebSite / SoftwareApplication / FAQPage
    landing-app-preview.tsx       # Hero dashboard vizuālis (moduļu fīčas tikai ja ieslēgtas)
    login-form.tsx                # Ienākt; e-pasts/Atcerēties/signup saite tikai ar Resend; Google/Microsoft; PasswordInput
    signup-form.tsx               # Reģistrēties; `?invite=` → Vārds/Uzvārds, bloķēts e-pasts; noteikumi tikai e-pasta formai
    password-input.tsx            # Parole + rādīt/paslēpt acu ikona
    google-auth-button.tsx        # Turpināt ar Google / Microsoft
    admin-integrations-page.tsx   # /admin/integrations: Google + Microsoft OAuth, Turnstile, Resend, Umami, Sentry
    turnstile-widget.tsx          # Cloudflare Turnstile (explicit render) e-pasta signup
    oauth-pending-turnstile.tsx   # Google bez komandas: Turnstile modālis pēc OAuth
    admin-email-templates-form.tsx # /admin/email-templates: HTML šabloni + priekšskatījums
    admin-cron-jobs-form.tsx      # /admin/cron-jobs: ieslēgt darbus (loading uz slēdža), kopēt cron-job.org saiti
    timezone-sync.tsx             # Pārlūka IANA josla → users.timezone (RPC)
    auth-session-from-url.tsx     # /auth/confirm: verifyOtp no token_hash; hash redirect PKCE
    remember-me-checkbox.tsx      # Atcerēties mani (noklusējums izslēgts; 30 dienas ar ķeksi)
    forgot-password-form.tsx      # Aizmirsi paroli (forma tikai ar Resend)
    work-progress.tsx             # done/total, josla, sānjoslas fona aizpildījums
    update-password-form.tsx      # Jauna parole pēc e-pasta saites; PasswordInput
    mfa-settings-card.tsx         # TOTP enroll/verify/unenroll profilā (visiem)
    mfa-verify-modal.tsx          # TOTP pie ielogošanās un admin sesijas
    legal-document-view.tsx       # Legal lapas + fiksēta satura TOC
    cookie-consent-provider.tsx   # Piekrišanas stāvoklis
    cookie-consent-dialog.tsx     # Popup un iestatījumi
    umami-analytics.tsx           # Skripts pēc hidratācijas; pageview pēc analytics piekrišanas
    sentry-init.tsx               # @sentry/browser, kad DSN aktīvs
    app-nav.tsx                   # Sānjosla; apakšā bug / feature / feedback saites virs Failu vietas
    site-feedback-modals.tsx      # Kļūda, funkcijas pieprasījums (saraksts + UP), atsauksme; e-pasts uz legal_email
    user-menu.tsx                 # Lietotāja drop-up: personīgā info, uzstādījumi, paziņojumu prefs, kalendārs, parole, iziet
    calendar-integration-modal.tsx # Apple/Google .ics abonēšana
    personal-info-modal.tsx       # Vārda un uzvārda rediģēšana
    notification-settings-modal.tsx # In-app (un e-pasta) paziņojumu veidu slēdži (grupēts, auto-save)
    change-password-modal.tsx     # Paroles maiņa (email login); PasswordInput
    profile-settings-view.tsx     # /settings/profile: profils + display preferences
    nav-tree-dnd.tsx              # Koka DnD: mapē / ārā / zem pēdējā, drop līnija
    work-item-archive-button.tsx  # Arhivēt / noņemt no arhīva (mapes ikona)
    list-statuses-modal.tsx       # Saraksta Statusi (sistēma + komandas)
    list-automations-modal.tsx    # Saraksta automatizācijas (mapes izveide → šablons, ja `module_templates`)
    team-switcher.tsx             # Komandas pārslēdzējs, CRUD
    team-invite-modal.tsx         # Uzaicināt biedru (e-pasts, loma; norāde, ja Resend izslēgts)
    team-member-page.tsx          # Biedra profils; pending: resend/link/remove; leave
    team-leave-section.tsx        # Pamest komandu (profils, biedra lapa)
    app-shell.tsx                 # Layout ar sānjoslu
    dashboard-home-page.tsx       # Sākums: Mani uzdevumi (ja ir) + saraksti
    lists-overview-page.tsx       # Saraksta kopsavilkums
    list-detail-page.tsx          # Saraksta kopsavilkums + arhīva skats
    list-form-modal.tsx           # Jauns/labot sarakstu + pieejas; privāts slēdzis pēc `module_private_list`
    list-summary.tsx              # Uzdevumu kartītes ar progresu, statusu grupām + arhīva ikona
    list-windows-board.tsx        # Uzdevumi | Faili + Saraksts ar progresu, paperclip, DnD; `onOpenSubtask` → lapas modalim
    templates-page.tsx            # Komandas šablonu saraksts
    template-detail-page.tsx      # Šablona nosaukums + apraksts + koks; auto-save
    template-tree-editor.tsx      # Šablona koks: mapes/uzdevumi/apakšuzdevumi, assignee, checklist, statusi, DnD
    template-task-statuses-modal.tsx # Šablona uzdevuma custom apakšuzdevumu statusi
    parent-create-flow.tsx        # Mapes/saraksta +: mape, uzdevums, šablons (ja `module_templates`), fails
    task-detail-page.tsx          # Mape/uzdevums/apakšuzdevums; viens `SubtaskDetailModal` (URL + board)
    grouped-subtask-tables.tsx    # Viena tabula ar statusu grupām
    subtask-table.tsx             # Tabula, DateCell, AssigneeCell portal, arhīvs, rindas fons, PATH
    task-location-path.tsx        # Saraksta/mapes/uzdevuma ceļš ar tipa ikonu zem nosaukuma (saites vai teksts)
    task-drop-line.tsx            # Zila drop līnija, frozen sort, grupu collision
    move-subtask-modal.tsx        # Apakšuzdevuma pārvietošana pie cita uzdevuma
    move-subtask-destination-button.tsx # Pārvietošanas mērķis ar PATH zem nosaukuma
    subtask-detail-modal.tsx      # Apakšuzdevuma modālis; unikāli checklist/attachments key; vēsture; failu pārsūtīšana
    forward-task-file-modal.tsx   # Resend: pārsūtīt pielikumu; From/Reply-To = Vārds Uzvārds <…>; HTML galvene ar (e-pasts); vēsture `file_forwarded`
    task-checklists.tsx           # Check List pirms pielikumiem; tukšs sakļauts; forceCollapsed
    status-control.tsx            # Statusa poga, picker, čeklista josla
    relative-time.tsx             # Relatīvais laiks (min / h / d / m)
    loading-state.tsx             # Ielādes spinneris lapās, kokā un modāļos
    team-roles-modal.tsx          # Komandas lomu saraksts
    team-role-access-modal.tsx    # Pieejas pašai lomai
    team-permission-fields.tsx    # Nav + actions slēdži
    admin-roles-manager.tsx       # Sistēmas noklusējuma lomas
    admin-statuses-manager.tsx    # Uzdevumu statusu katalogs
    admin-file-types-manager.tsx  # Failu paplašinājumu CRUD
    task-attachments.tsx          # Pielikumu drop zona, kartītes; `…` → view/download/forward/rename/delete; tukšs sakļauts
    file-icon.tsx                 # Faila ikona + krāsa no kataloga
    file-preview.tsx              # Faila priekšskatījums
    create-item-menu.tsx          # Darbību izvēlne
    confirm-modal.tsx             # Dzēšanas apstiprinājums
    name-form-modal.tsx           # Nosaukums, izskats, logotips
    list-appearance-picker.tsx    # Ikona / krāsa (showIcons)
    file-detail-page.tsx          # Saraksta faila skats
    page-breadcrumb.tsx           # Ceļa josla + admin ikona + zvaniņš + valoda
    admin-panel-button.tsx        # Administrācijas panelis (is_admin)
    admin-panel-shell.tsx         # /admin čaula + virsraksts
    admin-submenu.tsx             # Cilvēki / Katalogs / Sistēma hover dropdown
    admin-users-manager.tsx       # Lietotāju CRUD
    admin-teams-manager.tsx       # Komandu CRUD
    admin-languages-form.tsx      # Valodu CRUD
    admin-translations-manager.tsx # Tulkojumu CRUD
    admin-settings-form.tsx       # Sistēmas uzstādījumi + logo/favicon
    admin-frontend-modules-form.tsx # Frontend moduļu atslēgas + slēdži
    admin-payment-plans-form.tsx  # Maksas plānu katalogs, max_members, cenas, izmēģinājums, Early Bird
    admin-team-plan-modal.tsx     # /admin/teams: piešķirt komandai maksas plānu
    admin-teams-manager.tsx       # Komandu saraksts + plāna kolonna
    branding-image-field.tsx      # Logo/favicon drop zona
    language-switcher.tsx         # Valodas pārslēdzējs (lv / en / ru)
    notifications-menu.tsx        # Paziņojumu panelis
    list-badge.tsx                # Saraksta ikona / iniciāļi / logotips
    member-last-online.tsx        # Tiešsaistes zīme
    team-todo-board.tsx           # Komandas kanban (nav Sākuma lapa)
  lib/
    actions/action-result.ts      # ActionResult<T> server action atbildēm
    auth/oauth-cookie-options.ts  # Kopīgs httpOnly OAuth cookie options
    auth/oauth-origin.ts          # resolveOAuthOrigin
    cloud-storage/                # sanitizeCloudFolderPath, parsePathParts (Drive/OneDrive upload)
    dnd/pointer-y-from-event.ts   # @dnd-kit pointer Y drop hintiem
    format/numbers.ts             # addThousandSeparators, formatInteger, formatEuro
    http/parse-cookie-header.ts   # Server Cookie header → {name, value}[]
    consent/cookie-consent.ts     # Piekrišanas modelis
    document-title.ts             # Pārlūka cilnes formāts `lapa | sistēma`
    document-title-server.ts      # DB nosaukumi dinamiskajam generateMetadata
    page-metadata.ts              # translatedPageMetadata / resolvedPageMetadata helperi
    seo/                          # site URL, known origins, robots/sitemap ceļi, canonical / noindex
    landing/features.ts           # Landing fīčas un hero teksts pēc frontend moduļiem
    env/read-env.ts               # Env trim + pēdiņu noņemšana (Vercel paste)
    extension/                    # CORS, cookie, sesija, Gmail OAuth/connection, i18n
    cron-jobs/                    # tipi, repository, timezone (8:00/9:00, 1000 user batch), executeCronJob
    legal/documents.ts            # Privacy / terms / cookies teksti
    lists.ts                      # Sarakstu/uzdevumu tipi, krāsas, location PATH, parseIdList, parseStatusGroupMap, `workProgressById` / `listProgress`
    task-checklists.ts            # Čeklistu tipi, progress, incomplete helper
    list-statuses.ts              # Saraksta statusu tipi un kataloga merge
    list-automations.ts           # Automatizāciju tipi, mapRow, activeFolderCreatedTemplateAutomations
    frontend-modules/             # keys, repository, context, requireFrontendModule
    calendar/                     # ICS plūsma, token, user calendar integration
    google-drive/                 # OAuth, status, Drive upload, team settings actions
    payment-plans/                # helpers + repository + team-plan (katalogs, cenas, trial, Early Bird, moduļu filtrs)
    task-date-display.ts          # Sākuma/termiņa relatīvais hints pēc statusa grupas (DateCell)
    nav-tree-move.ts              # Koka drop: mape / ārā / secība / grupas beigas
    list-access.ts                # Saraksta pieeju līmeņi un resolve
    lists-store.tsx               # Saraksti/uzdevumi; data vs actions context; čaulas ielāde
    templates.ts                  # Šablonu tipi, sanitize / prepare editor, koka helperi
    template-tree-move.ts         # Šablona DnD placement (mape / secība / apakšuzdevums)
    templates-store.tsx           # Šabloni lazy (`/templates` vai ensureLoaded)
    list-windows.ts               # Logu kārtība (preferences cookie)
    list-files.ts                 # Saraksta faili kokā; persist DB; size helpers
    file-types.ts                 # Atļautie paplašinājumi, MIME, ikona, krāsa
    file-types-context.tsx        # Katalogs klientam (accept, validācija)
    task-activity.ts              # Vēstures tipi un apakšuzdevumu pielikumi
    build-task-activity-events.ts # Diff → TaskActivity[] (statuss, datumi, assignees, checklist, …)
    format-task-activity-text.ts  # Vēstures ierakstu teksts UI (lv/en/ru caur t(); t.sk. file_forwarded)
    team.ts                       # Biedru, lomu un WorkTeam tipi; canLeaveTeam, canInvite…
    team-store.tsx                # Komandas, biedri un lomas no Postgres
    team/actions.ts               # invite / accept / reject / resend / remove / leave
    team/send-invite-email.ts     # Resend HTML invite; bez Resend jaunu e-pastu nesūta (esošam — in-app)
    team-permissions.ts           # Nav + actions pieeju modelis
    last-online.ts                # min / h / d / m
    task-statuses.tsx             # Statusu katalogs + saraksta merge
    notifications.ts              # Paziņojumu tipi, appendNotifications, e-pasta trigger
    notification-preferences.ts   # Lietotāja preference kinds un defaults
    task-notifications.ts         # Kam sūtīt paziņojumus par uzdevumu notikumiem
    email/                        # HTML šabloni, build HTML, Resend sūtīšana (auth + paziņojumi + forward-task-file + user feedback)
    feedback/                     # Bug / feature / feedback actions: saglabā DB, e-pasts uz legal_email, feature UP balsis
    use-notifications.ts          # Paziņojumi no Postgres
    team-todo.ts                  # Todo tipi
    db/work-data.ts               # Komandas darba CRUD; čaulas fetch; PGRST303 retry; RPC reorder/assignees
    db/fetch-all-rows.ts          # PostgREST lapošana (1000 rindu)
    db/import-local-work.ts       # Vienreizējs localStorage → DB imports
    clear-legacy-demo-storage.ts  # Veco dummy localStorage atslēgu tīrīšana
    format-display-date.ts        # datums/laiks pēc display preferences
    site-admin/display-preferences.ts # tipi, merge (lietotājs > sistēma)
    site-admin/branding.ts        # logo/favicon data URL, iniciāļu favicon SVG
    i18n/messages.ts              # lv + en katalogs (serveris)
    i18n/messages-*.ts            # ru, de, fr, es, nl, da, no, fi, pl, lt, et, it, sv katalogi
    i18n/_catalog/                # JSON avots extra valodām
    i18n/interpolate.ts           # `{param}` aizvietošana (klienta bundle)
    i18n/localized-values.ts      # parseLocalizedValues, resolveLocalizedValue, …
    i18n/                          # language, server overlay + table klientam
    site-admin/                   # Admin CRUD repository, tipi
    supabase/                     # env, browser/server/admin klienti, session refresh
    auth/                         # actions (generateLink + Resend HTML), email-password, auth-confirm-link, MFA, OAuth, remember-session
    integrations/                 # Google/Microsoft OAuth (site_integrations); public-sign-in.ts / public-turnstile.ts RPC karogi
    users/ensure-profile.ts       # public.users rinda pēc OAuth
    users/display-name.ts         # vārda sadalījums/apvienošana (first + last → name)
    users/display-preferences.ts  # efektīvās UI datumu preferences
    users/actions.ts              # personīgā info + display preferences + timezone server actions
    users/require-admin.ts        # /admin + MFA enroll vārteja + audit
    users/admin-audit.ts          # admin_audit_events
    users/use-is-admin.tsx        # is_admin RPC + profils klientā
    security/                     # rate-limit, turnstile, secret-box, file-bytes, log-error, hash-token
app/auth/gmail-plugin/            # login (Google OAuth ielogošanās) / bridge / start / done; callback aliases vai `/auth/google-oauth/callback`
app/api/extension/                # config, session, login, refresh, gmail-access, gmail-bridge-ticket, browse, attach-email; CORS `extension/cors.ts`
app/api/cron/                     # GET/POST `/api/cron/[jobKey]` — token auth, stundas batch atgādinājumi
app/auth/callback/route.ts        # E-pasta magic link / PKCE code → session
app/auth/google-oauth/sign-in/route.ts # GET Google login/signup sākums (`?next=`, `?errorPage=`, `?turnstile=`)
app/auth/google-oauth/callback/route.ts # Google login, admin konfigurācija, Gmail spraudnis
app/auth/microsoft-oauth/sign-in/route.ts # GET Microsoft login/signup sākums (`?turnstile=`)
app/auth/microsoft-oauth/callback/route.ts # Microsoft login + admin konfigurācija
app/auth/google-drive/callback/route.ts # Drive OAuth code → team refresh token
app/auth/onedrive/callback/route.ts # OneDrive OAuth code → team refresh token
scripts/                          # audit-check.mjs, apply-migrations.mjs, test-supabase.mjs, sync-i18n-catalogs.mjs
supabase/migrations/              # 001–094: shēma, admin, work data, Drive, drošība, ielādes ātrums, e-pasta šabloni, Gmail spraudnis, publiskie login karogi, extra valodas, legal_email, invite preview `account_exists`, `file_forwarded` vēsture, Resend email id indekss, user feedback + feature votes, cron jobs, hashed tokeni, timezone batchi, Turnstile, payment plan max_members, free/paid plānu seed
.github/workflows/                # secret-scan.yml, security-audit.yml, security-smoke.yml
.gitleaks.toml                    # default rules + i18n translation key allowlist
.cursor/rules/                    # README bump, commits
security-check.md                 # Drošības audits (v0.1.0)
system_security_upgrades.md       # HIGH/MIDDLE/LOW uzskaite (v0.2.0)
system_speed_upgrades.md          # Ielādes ātruma uzskaite
extensions/gmail/                 # Chrome MV3: e-pasta pievienošana apakšuzdevumam
```

## CI / Security checks

Trīs GitHub Actions darbplūsmas palaižas pie katra push un pull request:

| Workflow | File | Ko pārbauda |
|----------|------|-------------|
| **Secret scan** | `.github/workflows/secret-scan.yml` | gitleaks — API keys, tokens, paroles git vēsturē |
| **Security audit** | `.github/workflows/security-audit.yml` | `npm run audit:check` — HIGH un CRITICAL atkarības |
| **Security smoke** | `.github/workflows/security-smoke.yml` | TypeScript, lint, production build, `requireAdmin` / `getCurrentUser` uz `actions.ts`, API `getCurrentUser`/`requireAuth`/`getExtensionAuth` (izņēmums: `extension/login`, `refresh`, `config`; `app/api/cron/*` ar `findEnabledCronJobByToken`), nav `eval()`, drošības galvenes |

> `GITLEAKS_LICENSE` repo secret ir vajadzīgs tikai **organization** kontiem. Šis repo pieder individuālam kontam, tāpēc scan strādā arī privātam repo bez licences.

`.gitleaks.toml` paplašina noklusējuma noteikumus (`useDefault = true`) un pievieno i18n atslēgu allowlist, lai `generic-api-key` nesajauktu `legal.privacy.retention.p1` ar credential. Lokāli:

```bash
gitleaks detect --redact -v --exit-code=2 --log-opts=-1
```

`npm run audit:check` (`scripts/audit-check.mjs`) krīt pie katra HIGH/CRITICAL advisory, izņemot `ACCEPTED_ADVISORIES`. Tranzitīvās atkarības pinotas caur `overrides` (`postcss`, `sharp`, `uuid`, `js-yaml`, `nanoid`, `brace-expansion`).

Pilns audits: **`security-check.md`** (vēsturiskā atzīme **6.5 / 10**, v0.1.0). v0.2.0 uzlabojumi: **`system_security_upgrades.md`** (atzīme **8.5 / 10**; HttpOnly sesija paliek atklāta, jo browser Supabase lasa cookie).

## Supabase

Kopē `.env.example` uz `.env.local`. URL ir tikai projekta hosts (`https://PROJECT_REF.supabase.co`), **ne** `/rest/v1/`.

| Mainīgais | Kur ņemt |
|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (secret) — `eyJ…` JWT vai jaunais `sb_secret_…`. Vajadzīgs adminam, OAuth sesijai un e-pastiem. Login **pogas** nāk no `public_sign_in_methods` (anon). **Ne** `anon` / `sb_publishable_`. Neliec pēdiņas. Rotācija nozīmē arī `INTEGRATION_SECRETS_KEY` pārskatīšanu, ja noslēpumi ir šifrēti ar atvasinātu atslēgu. |
| `INTEGRATION_SECRETS_KEY` | Aplikācijas slāņa AES atslēga (`enc:v1:`) Drive/OneDrive/OAuth/Resend noslēpumiem. Ģenerē ar `openssl rand -base64 32`. Produkcijā **tā pati** vērtība kā lokāli, vai atstāj tukšu (atšifrēšana mēģina arī `SUPABASE_SERVICE_ROLE_KEY`). Jauna nejauša atslēga Vercel slēpj e-pasta login, kamēr noslēpumi paliek šifrēti ar veco. |
| `CHROME_EXTENSION_IDS` | Nav vajadzīgs CORS. `/api/extension/*` atspoguļo derīgu `chrome-extension://` Origin; privātie API prasa Bearer. |
| `NEXT_PUBLIC_SITE_URL` | Publiskais origin. Local: `http://localhost:3120`. Production: viens kanoniskais hosts (`https://tasqin.com` vai `https://www.tasqin.com`, bez `/` beigās). Canonical, sitemap, robots, HSTS, auth saites. Spraudnis zina abus (`KNOWN_SITE_ORIGINS`). |
| `UMAMI_SCRIPT_INTEGRITY` | Neobligāts SRI (`sha384-...`) Umami skriptam. |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console HTML tag `content` (meta `google-site-verification`; drīkst ielīmēt arī visu tagu). |
| `SUPABASE_DB_PASSWORD` | Settings → Database → Database password |
| `SUPABASE_DB_REGION` | Connection string reģions (šim projektam `eu-west-2`) |
| `DATABASE_URL` | Optional: pilns pooler URI, ja parole/hosts neiet cauri |

```bash
npm run db:test      # Postgres pieslēgums + public tabulu saraksts
npm run db:migrate   # pending faili no supabase/migrations/
```

Lietotne lasa sarakstus, uzdevumus, komandas, todo, paziņojumus un failus no Postgres (migrācija `005_work_data.sql` un tālākās). RLS: `is_team_member(team_id)` / `is_team_owner(team_id)`; saraksta darbībām papildus `work_list_has_access(list_id, min_level)` (`022`). Anon piekļuve liegta. Komandas biedri ar `team_members.user_id = auth.uid()` redz tos pašus datus, ja saraksts nav privāts vai viņiem ir viewer/lomas rinda. `public.users` paliek konta profils + `is_admin`; komandas loma ir `team_members.role` / `role_id` → `team_roles`. Migrācijas `001`–`004`: `is_admin`, pirmais reģistrētais ir admin, `current_user_is_admin()`, noņemts liekais `users.role` / `manager_id` un vecās neizmantotās project/task tabulas. `db:test` apstiprina API projektu, bet Postgres pieprasa pareizu datubāzes paroli (ne `anon` atslēgu).

## Vercel

Login/signup Google un e-pasta **pogas** nāk no `public_sign_in_methods` ar anon atslēgu (migrācija `080`). Tās **pazūd**, ja RPC nav uzlikts vai Resend/OAuth nav `is_configured` un `is_enabled`. Service role joprojām vajadzīgs adminam, OAuth lietotāja izveidei un Resend sūtīšanai. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` pārlūkā jābūt statiski ieinlainotiem (`getSupabasePublicEnv`); citādi MFA met “Supabase env is missing”.

Settings → Environment Variables → **Production** (un Preview, ja lieto preview URL). Vērtības **bez** `"` / `'`. `NEXT_PUBLIC_*` ieliek pirms būves vai pēc tam **Redeploy**.

| Name | Obligāts | Piezīme |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | jā | viens kanoniskais hosts (`https://www.tasqin.com` vai `https://tasqin.com`), bez `/`. Spraudnis vispirms prasa www. |
| `NEXT_PUBLIC_SUPABASE_URL` | jā | `https://PROJECT.supabase.co`, ne `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | jā | API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | jā | API → `service_role` (`eyJ…` vai `sb_secret_…`). Admin/OAuth/e-pasts. Login pogas: RPC, ne šī atslēga. |
| `INTEGRATION_SECRETS_KEY` | ieteicams | Tā pati kā `.env.local`, vai atstāj tukšu. **Neģenerē jaunu** Vercel, ja DB jau ir `enc:v1:` rindas. |
| `GOOGLE_SITE_VERIFICATION` | GSC | HTML tag `content` |
| `CHROME_EXTENSION_IDS` | nav | CORS vairs neizmanto; var atstāt tukšu vai dzēst no Vercel |

Neliec Vercel: `RESEND_*`, `SENTRY_DSN`, `UMAMI_WEBSITE_ID`, `TURNSTILE_*`, Google/Microsoft Client ID - tos iestati **Admin → Integrācijas** pēc pirmā deploy, tad **Aktīva**. `PORT`, `DATABASE_URL`, `SUPABASE_DB_PASSWORD` ir tikai lokālajām migrācijām.

Pēc env saglabāšanas: Deployments → **Redeploy**. Vercel Function logs: `Supabase admin env` (trūkst service role) vai `decryptSecret failed` (nepareiza `INTEGRATION_SECRETS_KEY`). Google Cloud redirect URI jābūt arī `https://tasqin.com/auth/google-oauth/callback`.

`readEnv()` (`app/lib/env/read-env.ts`) noņem wrapping quotes un `NEXT_PUBLIC_*` lasa no statiska `process.env.NEXT_PUBLIC_…` kartes (Next.js citādi neieinlaino pārlūkā). `decryptSecret` mēģina `INTEGRATION_SECRETS_KEY`, tad `SUPABASE_SERVICE_ROLE_KEY`, tad dev fallback.

## Google OAuth

Admin **Integrācijas** (`/admin/integrations`): Client ID/Secret glabājas `site_integrations` (`google_oauth`); OAuth pārbaude, login/signup un Gmail spraudnis iet caur `/auth/google-oauth/callback` (`listGoogleOAuthRedirectUrls` rāda visus `KNOWN_SITE_ORIGINS`); **Aktīva** slēdzis vienmēr redzams (pirms konfigurācijas izslēgts un bloķēts; pēc — ieslēdz/izslēdz login bez credentials dzēšanas). Fallback env: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.

Login/signup **neizmanto** Supabase Authentication → Providers → Google. Pēc Google profila (`openid email profile`) aplikācija ar service role izveido vai atrod Supabase Auth lietotāju un iestata sesiju (`generateLink` + `verifyOtp`).

1. Google Cloud → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web application)
2. Authorized JavaScript origins: `http://localhost:3120`, `https://tasqin.com` un `https://www.tasqin.com`
3. Authorized redirect URI (gan local, gan production):
   - `/auth/google-oauth/callback` (login/signup **un** Gmail spraudnis)
   - `/auth/google-drive/callback`
   - `/auth/gmail-plugin/callback` (nav obligāts; vecā Gmail plūsma)
4. Admin → Integrācijas → ielīmē Client ID/Secret → **Konfigurēt ar Google** → ieslēdz **Aktīva**

Sesijas sīkdatnes ir **obligātās** (ePrivacy izņēmums autentifikācijai). **Atcerēties mani** ir tikai loginā un pēc noklusējuma **izslēgts** (sesija līdz pārlūka aizvēršanai); ar ķeksīti sesija ilgst **30 dienas**. Production HTTPS uzliek `Secure`. Sīkdatnes paliek lasāmas klientam (`httpOnly: false`), jo pārlūka Supabase klients lasa `document.cookie` — pilns HttpOnly prasa pārcelt visus DB vaicājumus uz serveri. Ielogotam lietotājam `/`, `/login` un `/signup` ved uz `/dashboard`. Signup un paroles atjaunošanas saites apstiprina `/auth/confirm`. `/auth/callback` paliek PKCE / magic link plūsmām, nevis Google login.

**Dublējumi un atslēgu rotācija:** Supabase Dashboard ieslēdz PITR (Point-in-Time Recovery) uz maksas plāniem. `service_role` un `INTEGRATION_SECRETS_KEY` rotē tikai pēc plāna: vispirms jauna atslēga env, tad reconnect Drive/OneDrive un atkārtota integrāciju saglabāšana, lai rindiņas tiek pāršifrētas. Vecu `pg_dump` ar plaintext tokeniem pēc H3 vairs nepietiek, ja atslēga paliek slepena.

## Microsoft OAuth

Admin **Integrācijas**: `microsoft_oauth` Client ID/Secret; **Aktīva** (tāpat kā Google: redzams vienmēr, ieslēdzams pēc konfigurācijas) rāda **Turpināt ar Microsoft** login/signup un ļauj ieslēgt `module_onedrive`. Login iet caur `/auth/microsoft-oauth/callback` (tā pati plūsma kā Google: profils → Supabase lietotājs → sesija). Komandas OneDrive pieslēgšanai atsevišķi `/auth/onedrive/callback` ar `Files.ReadWrite`. Fallback env: `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET`.

## Resend / Umami / Sentry / Turnstile

Admin **Integrācijas** kartiņas (`turnstile`, `resend`, `umami`, `sentry`) - Saglabāt credentials → **Aktīva**.

| Integrācija | Lauki | Kad aktīva |
|---|---|---|
| **Turnstile** | Site Key + Secret Key | E-pasta reģistrācija un Google ienākšana bez komandas prasa Cloudflare `siteverify`; Site Key publiski caur `public_turnstile_config()` (`092`); Secret tikai serverī (`requireTurnstileToken`); fallback env `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| **Resend** | From e-pasts + Reply-To + API Key | `sendResendEmail()` ar `reply_to` (integrācijas Reply-To, ja nav override) un opcionāliem `attachments` (base64); e-pasta login/signup/forgot (`isEmailPasswordAuthEnabled`); HTML šabloni `/admin/email-templates`; komandas uzaicinājums jaunam e-pastam tikai ja aktīvs (esošam lietotājam pietiek ar in-app); **Pārsūtīt failu** (`forwardTaskFileAction`): From = `Vārds Uzvārds <Resend From>` (`fromName` pārraksta iestrādāto sistēmas nosaukumu), Reply-To = `Vārds Uzvārds <lietotāja e-pasts>`, HTML galvene = vārds uzvārds `(e-pasts)`, tēma = PATH, pielikums ≤ 25 MB; pēc sūtīšanas `task_activities` `file_forwarded` ar `resendEmailId` + `deliveryStatus`; bounce/failed → sarkans vēstures teksts + **Nosūtīt vēlreiz**; statusu atjauno webhook `POST /api/webhooks/resend` (`RESEND_WEBHOOK_SECRET`) un/vai poll atverot apakšuzdevumu; sānjoslas **Atrast kļūdu?** / **Pieprasīt funkciju** / **Atsauksmes** (`submitUserFeedbackAction`) sūta uz `legal_email`, Reply-To = lietotāja e-pasts; From = `client_id` (verificēts Resend domēns, ne `@gmail.com`); Reply-To = `configured_account_email` (var būt Gmail); validācija `resend/from-email.ts`; From/Reply-To arī `/admin/settings`; fallback env `RESEND_FROM_EMAIL`, `RESEND_API_KEY` |
| **Umami** | Website ID + Script URL (noklusējums `https://cloud.umami.is/script.js`) | `UmamiAnalytics` ielādē skriptu pēc hidratācijas ar dokumenta CSP `nonce` (`data-auto-track="false"`); pageview pēc **analytics** piekrišanas; env `UMAMI_WEBSITE_ID`, `UMAMI_SCRIPT_URL` |
| **Sentry** | Environment (opcionāli) + DSN | Root `layout.tsx` `SentryInit` (`@sentry/browser`, **tikai klienta** kļūdas); CSP `connect-src` `*.sentry.io`, `*.ingest.sentry.io`, `*.ingest.de.sentry.io`, `*.ingest.us.sentry.io`; env `SENTRY_ENVIRONMENT`, `SENTRY_DSN` |

### E-pasta šabloni

Admin **Sistēma → E-pasta šabloni** (`/admin/email-templates`). Četri `kind`: `signup`, `password_reset`, `invite`, `notification`. Katrā valodā (`lv` / `en` / `ru`) rediģē tematu, tekstu un pogas tekstu; placeholderi `{name}`, `{system}`, `{team}`, `{inviter}`, `{title}`, `{message}`, `{link}`. HTML ģenerē `build-email-html.ts` (tabulas layout + CTA; `buildSimpleEmailHtml` bez pogas — failu pārsūtīšanai (`headerLabel` = sūtītājs)). Seed un saglabāšana: `site_translations` (`email.template.{kind}.{subject|body|button}`); `app/lib/email/templates.ts` (tipi/fallback, client-safe), `templates-server.ts` (DB). Ja Resend nav aktīvs, forma rāda brīdinājumu ar saiti uz Integrācijām; sūtīšana notiek tikai ar aktīvu Resend.

Sentry nav HTML/DNS verifikācija kā Search Console. Pārbaude ir pirmais events sentry.io:

1. sentry.io → jauns **Browser JavaScript** projekts → Client Keys (DSN).
2. Admin **Integrācijas** → Sentry: Environment (`production` / `development`, tukšs = `production`) + DSN → **Saglabāt** → **Aktīva**.
3. Pārlādē lapu (Sentry ielādējas bez sīkdatņu piekrišanas).
4. DevTools → Network → `ingest`: pēc kļūdas `POST` uz `*.ingest.sentry.io` (200).
5. Konsolē: `setTimeout(() => { throw new Error("Routine Sentry test"); }, 0);`
6. sentry.io **Issues** pēc ~1 minūtes rāda `Routine Sentry test` ar to pašu Environment.

## Google Drive (komandas faili)

Kad `module_google_drive` un `module_file_upload` ir ieslēgti, komandas `...` rāda **Google Drive Integrācija**. Lapa `/team/google-drive`: pieslēgt Google kontu (`drive.file`), mapes ceļš, slēdzis sūtīt failus uz Drive un **Glabāt failus Google Drive** (noklusējumā ieslēgts → `store_on_server = false`: Routine glabā metadatus + `google_drive_file_id`, bez `content`; izķeksēts → saturs arī DB). Konfigurēt var īpašnieks / `team.settings.edit`. Refresh token: `team_google_drive_integrations` (tikai service role). Credentials no admin **Google OAuth** (`site_integrations`); fallback env: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`. Redirect URI: `/auth/google-drive/callback` (tam pašam Google OAuth klientam). Google Cloud: ieslēgt Drive API. Augšupielāde: `POST /api/google-drive/upload` (XHR progress); Drive-only priekšskatījums/lejupielāde: `GET /api/google-drive/content?kind=list|task&id=…` (`download=1` → `Content-Disposition: attachment`); pārsaukšana: `POST /api/google-drive/rename`. UI overlay: `FileUploadOverlay`. Faila pārsaukšanā paplašinājums ir fiksēts (`renameKeepingExtension` / `NameFormModal` `nameSuffix`).

## OneDrive (komandas faili)

Kad `module_onedrive` un `module_file_upload` ir ieslēgti, komandas `...` rāda **OneDrive Integrācija**. Lapa `/team/onedrive`: pieslēgt Microsoft kontu (`Files.ReadWrite`), mapes ceļš un slēdzis sūtīt jaunos failus uz OneDrive. `module_onedrive` admin slēdzis ieslēdzams tikai ja **Microsoft OAuth** ir konfigurēts un ieslēgts (`/admin/integrations`). Credentials glabājas `site_integrations` (`microsoft_oauth`); fallback env: `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET`. Redirect URI login/konfigurācijai: `/auth/microsoft-oauth/callback`; komandas pieslēgšanai: `/auth/onedrive/callback`. Refresh token: `team_onedrive_integrations`. Pēc faila pievienošanas klients sūta `POST /api/onedrive/upload`.

## Chrome extension (Gmail)

Mapē `extensions/gmail` — unpacked Chrome MV3 (`manifest` `0.4.17`, permission `scripting`). Popup: balta kartīte, avatars, vārds/uzvārds, e-pasts, **Iziet** tikai ikona augšējā labajā stūrī, centrēts loading, komandu pārslēgšana, Drive brīdinājums zem select, Gmail statuss kā ikona ar tooltip; bez URL/Client ID ievades; `12px` noapaļojums, `{SYSTEM_NAME}` no `getExtensionStrings(language, systemName)`. **Ikona** (`icons/icon{16,48,128}.png`) ir statiska — noklusējums kā vietnes favicon bez logo (`logo_color` black, `#18181b`); pārģenerēt: `node extensions/gmail/scripts/generate-icons.mjs` (opcija `--color midnight` u.c.). Zinātie origini (`KNOWN_SITE_ORIGINS` / `APP_ORIGIN_CANDIDATES`): `https://www.tasqin.com` (pirmais), `https://tasqin.com`, `http://localhost:3120`. **`getAppBase()`:** ja ir derīga sesija kādā originā — to izmanto; bez sesijas (Login) preferē production, ne `localhost`, pat ja lokālais serveris atbild uz `/api/extension/config`. Sesija ir spraudņa paša: `chrome.storage.local` (`extensionAuth` + `refresh_token`), API ar Bearer un `credentials: omit`. Vietnes cookie tikai bootstrap, ja storage tukšs un lietotājs nav izgājis no spraudņa; **Iziet** spraudnī nenoņem vietnes cookies. Cookie bootstrap lasa arī Supabase `base64-` chunked `sb-*-auth-token`. Alarm ~45 min atjauno access tokenu (~30 dienas). Custom login (`POST /api/extension/login` ar `remember: true`) vai Google (`GET /auth/gmail-plugin/login` → Google konta izvēle → `/auth/gmail-plugin/done?logged_in=1`; done lapa rāda «Ienāci» tikai ar reālu cookie sesiju un ieliek `data-routine-bootstrap-ticket`; `plugin-auth.js` apmaina ticket pret sesiju caur `POST /api/extension/bootstrap-from-ticket` vai `GET /api/extension/bootstrap-session`, background arī lasa ticket no tabas ar `chrome.scripting`). **Atjaunot Gmail:** `POST /api/extension/gmail-bridge-ticket` → `GET /auth/gmail-plugin/bridge?t=…` iestata pārlūka sesiju → `/auth/gmail-plugin/start` (Gmail OAuth). Ja bridge neizdodas, fallback `/start` + cookie sync; ja nonāk pie `/login?next=/auth/gmail-plugin/start`, login OAuth nodod `next` atpakaļ pie Gmail OAuth. Publisks `GET /api/extension/config` (logo, valoda, vai e-pasts/Google ieslēgts, `loginPath`). Ja Gmail nav savienots, **Savienot Gmail** (`/auth/gmail-plugin/start`) iet caur to pašu `/auth/google-oauth/callback` kā login (vecais `/auth/gmail-plugin/callback` paliek aliases); tokeni `user_gmail_connections` (service role, RLS deny). Komandai bez Google Drive — popup rāda sarkanu brīdinājumu un Gmailā TASQIN pogas nav. Ja Drive ir pieslēgts, Gmailā inline logo poga → modālis → saraksts / mape / uzdevums → apakšuzdevums. E-pasts un pielikumi caur **Gmail API** (`gmail.readonly`, piekļuves tokens no `GET /api/extension/gmail-access`); limīts 25 MB. Sesijas access tokenu spraudnis atjauno ar `POST /api/extension/refresh` (tāpēc vairs “neizmet” pēc ~1 h). `proxy` `/api/extension/` apstrādā CORS (OPTIONS 204); kanoniskā hosta 301 šos ceļus izlaiž. UI valoda no sesijas. Sk. `extensions/gmail/README.md`.

**CORS.** Chrome bloķē `fetch` no `chrome-extension://<id>`, ja atbildē nav `Access-Control-Allow-Origin`. `app/lib/extension/cors.ts` atspoguļo jebkuru derīgu 32 simbolu extension ID (`[a-p]{32}`); CORS nav piekļuves kontrole — privātie maršruti joprojām prasa Bearer. `CHROME_EXTENSION_IDS` / `NEXT_PUBLIC_CHROME_EXTENSION_IDS` netiek lasīti. Apex `tasqin.com` Vercel 308 uz `www.tasqin.com` **bez** CORS galvenēm; `canonicalHostRedirectRules()` izlaiž `/api/extension/*`, un `proxy.ts` `/api/extension/*` pievieno CORS (OPTIONS 204, kļūdām arī). Spraudnis **nekad** neizsauc apex — pārraksta uz `www.tasqin.com` (`preferLiveOrigin`, `redirect: "manual"`).

**Reload / content script.** Pēc `chrome://extensions` → **Reload** vecā Gmail cilne zaudē kontekstu (`Extension context invalidated` pie `content.js` `sendMessage`). `content.js` `send()` to ķer un rāda `errors.extension_context_invalidated` (pārlādē Gmail ar F5). Pēc spraudņa Reload vienmēr **F5** Gmailā.

## Dati

Darba dati dzīvo **Postgres**, ne pārlūkā un ne sīkdatnēs. Komandas biedri redz kopīgos sarakstus, mapes, uzdevumus un apakšuzdevumus. CRUD: `app/lib/db/work-data.ts`; sākuma ielāde `fetchTeamWorkspace` / `fetchUserTeams` (čaula, lapota ar `fetchAllRows`, bez `content`/aktivitātēm; `PGRST303` clock-skew retry). Failu saturs pēc atvēršanas; aktivitātes `fetchTaskActivities(taskId)`. Pārkārtošana un assignees: RPC (`073`). Vecie `localStorage` dati (ja tādi bija pirms `005`) vienreiz tiek importēti ar `importLocalWorkIfNeeded` (karogs `routine-app-db-import-v1:{userId}`; ja karogs ir, importu izlaiž).

`public.users` ir konta profils + `is_admin` + `language_code` + `timezone` (IANA, `091`; `TimezoneSync` no pārlūka) + nullable display preferences (`week_start_day`, `date_format`, `date_separator`, `time_format`; `null` = sistēmas noklusējums no `site_settings`). Vārds glabājas vienā `name` kolonnā; lietotājs to maina ar **Personīgā informācija** modāli (`PersonalInfoModal` → `saveUserPersonalInfoAction` → RPC `set_current_user_name`, kas atjaunina arī visus `team_members` ar `user_id = auth.uid()`; pēc tam `auth.updateUser` ar `given_name` / `family_name`). Komandas biedra loma ir `team_members.role` / `role_id` (katalogs `team_roles`). Uzaicināts biedrs sākumā ir bez `user_id` un paliek ārpus komandas datiem, kamēr neapstiprina uzaicinājumu (paziņojumos vai `/invite/{token}`). Esošam reģistrētam lietotājam nosūta in-app `team_invite` paziņojumu; automātiska piesaiste pēc e-pasta (`users_link_team_members`) netiek veikta, kamēr uzaicinājums ir `pending`.

RLS (`005_work_data.sql`): `authenticated` drīkst SELECT/INSERT/UPDATE/DELETE tikai savas komandas rindās (`is_team_member`); komandas dzēšana / biedru uzaicināšana - `is_team_owner`. Saraksta satura rakstīšanu sašaurina `work_list_has_access` (`022`). `anon` policy ir deny.

| Tabula | Saturs |
|---|---|
| `teams` | Komandas (`team-…`); `payment_plan_id` / `until` / `paid` / `is_trial` / `is_early_bird` (`062`) |
| `team_members` | Biedri; apstiprinātam `user_id = auth.uid()`; pending uzaicinājumam `user_id` null |
| `team_invitations` | Uzaicinājumi (`pending` / `accepted` / `rejected`), `token`, `invited_user_id` |
| `team_roles` | Komandas lomas un `permissions` JSON |
| `system_default_roles` | Admin noklusējuma lomas jaunām komandām |
| `task_statuses` | Uzdevumu statusu katalogs (nosaukumi, krāsa, grupa) |
| `file_type_extensions` | Atļautie failu tipi (paplašinājums, MIME, ikona, krāsa); SELECT authenticated, raksta `is_admin` |
| `site_settings` | Sistēmas nosaukums, slogans, `legal_email` (privātuma pārziņa kontakti un lietotāju kļūdu/atsauksmju/funkciju e-pasti, `084`), `logo_url` / `favicon_url` (data URL), `logo_color`, datumu/laika noklusējums (`week_start_day`, `date_format`, `date_separator`, `time_format`), `timezone` (`Europe/Riga`, cron fallback, `091`); `payment_plans_enabled`, `trial_plan_id`, `trial_days`, `early_bird_limit` (`062`) |
| `site_cron_jobs` | Cron darbi (`subtask_start_reminder`, `subtask_due_reminder`): ieslēgts, hashed `secret_token`, pēdējā palaišana (`089`); RLS deny authenticated |
| `site_user_feedback` | Lietotāju kļūdu ziņojumi, funkciju pieprasījumi un atsauksmes (`kind`, `title`, `body`, `vote_count`; `088`); SELECT: `feature` visiem authenticated, pārējie tikai autoram |
| `site_feature_votes` | Funkciju pieprasījumu UP balsis (`request_id` + `user_id`); RPC `toggle_feature_vote` (`088`) |
| `site_payment_plans` | Maksas plānu katalogs (nosaukumi visās valodās, `is_free` `094`, cenas, Early Bird cenas, `max_members` `093`; seed `free` / `paid`) |
| `site_payment_plan_modules` | Frontend moduļi katrā plānā |
| `site_integrations` | Sistēmas integrācijas (`google_oauth`, `microsoft_oauth`, `resend`, `umami`, `sentry`): credentials, konfigurēts/ieslēgts (`067`–`069`); RLS deny authenticated; publiskie login karogi `public_sign_in_methods()` (`080`) |
| `list_statuses` | Komandas statusi vienam sarakstam (`lsts-…`) |
| `team_status_labels` | Komandas overlay sistēmas statusu nosaukumiem |
| `work_lists` | Saraksti (`kind`, `is_private`, `default_access_level`, `created_by`) |
| `work_list_viewers` | Privāta saraksta biedri + `access_level` |
| `work_list_viewer_roles` | Saraksta lomu pieeja + `access_level` |
| `work_tasks` | Mapes, uzdevumi, apakšuzdevumi (`kind` + `parent_id` + `deleted_at` + `archived_at`; `status` = kataloga ID; `checklists` JSONB; `hidden_status_ids`, `status_order`, `status_group_overrides` — uzdevuma līmeņa apakšuzdevumu statusu layout, `055`) |
| `work_task_statuses` | Custom apakšuzdevumu statusi zem konkrēta uzdevuma (`wtst-…`, `055`) |
| `work_templates` | Komandas šabloni (`tmpl-…`) |
| `work_template_items` | Šablona koks: mape / uzdevums / apakšuzdevums (`tpli-…`, `040`); `assignee_ids`, `checklists`, `task_statuses`, statusu layout (`056`–`057`) |
| `work_list_automations` | Saraksta automatizācijas (`lauto-…`): trigger (`folder_created`), action (`apply_template`), `template_id`, `enabled` (`041`) |
| `task_assignees` | Uzdevuma atbildīgie (`member_id`); `set_task_assignees` RPC (`073`) |
| `task_activities` | Apakšuzdevumu vēsture (`kind`: izveide, statuss, assignee_added/removed, datumi, title, description, checklist, moved, hidden, restored, faili, reordered, comment); diff lauki `from_date_value`, `from_parent_id`, `previous_text`, `metadata` jsonb (`051`–`052`) |
| `task_files` | Apakšuzdevumu pielikumi; `content` un/vai `google_drive_file_id` (`070`); `has_content` (`073`) |
| `list_files` | Saraksta faili kokā; `content` un/vai `google_drive_file_id` (`070`); `has_content` (`073`) |
| `team_google_drive_integrations` | Komandas Drive OAuth tokeni, mapes ceļš, `store_on_server` (`064`, `070`); RLS deny authenticated |
| `team_onedrive_integrations` | Komandas OneDrive OAuth tokeni un mapes ceļš (`066`); RLS deny authenticated |
| `user_gmail_connections` | Lietotāja Gmail OAuth tokeni spraudnim (`078`); RLS deny authenticated (lasa service role) |
| `app_notifications` | In-app paziņojumi (`assigned`, `unassigned`, `comment`, `file`, `status_changed`, `task_updated`, `start`, `due`, `team_invite`, `team_invite_rejected`); `recipient_id` mērķa biedrs; uzaicinājumam `target_user_id`, `invitation_id` (`054`, `089`) |
| `user_notification_preferences` | Lietotāja in-app paziņojumu slēdži (`user_id`, `kind`, `enabled`; trūkstoša rinda = ieslēgts) (`053`) |
| `team_todos` | Komandas kanban (`TeamTodoBoard`), nav Sākuma lapa |

localStorage paliek tikai UI preferencei:

| Atslēga | Saturs |
|---|---|
| `routine-app-current-team-id` | Aktīvā komanda (`:userId`) |
| `routine.timezone` | Pēdējā sinhronizētā IANA josla (`TimezoneSync`); lai RPC netiktu saukts katrā ielādē |
| `routine-app-nav-trees` | Sānjoslas sakļaušanas stāvoklis |

Cookie `routine-app-cookie-consent` saglabā sīkdatņu piekrišanu (180 dienas). Cookie `routine-app-remember-session` (`1`/`0`) ir obligātā: vai Atcerēties mani ir ieslēgts. Supabase auth sīkdatnes paliek 30 dienas, ja `1`; bez tā - sesijas sīkdatnes. Cookie `routine-app-list-window-order` saglabā 3 logu kārtību katrā sarakstā, ja atļautas preferenču sīkdatnes. Cookie `routine-app-language` + `routine-app-language-chosen` saglabā viesu apzināto UI valodu; bez `chosen` rāda sistēmas noklusējumu, pēc ielogošanās izvēle nonāk `users.language_code`.

## Versioning & commits

Commit ziņojums beidzas ar `. vX.Y.Z`, kas sakrīt ar `package.json` versiju. README update: patch +0.0.1 pēc noklusējuma caur `.cursor/rules/readme-version-update.mdc`.

Pirms release:

```bash
npm run typecheck
npm run lint
npm run build
```

GitHub Actions pēc push palaiž secret scan, atkarību auditu un security smoke — lokālās pārbaudes joprojām ir pirmais vārti.

## Roadmap

- Lielāku pielikumu serverī bez Drive (tagad data URL līdz 1.5 MB; Drive-primary jau ļauj lielākus failus Cloud)
- Papildu automatizācijas (uzdevuma izveide, statusa maiņa, termiņi)
- Atkārtojami rutīnas uzdevumi
