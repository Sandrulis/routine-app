# Sistēmas drošības uzlabojumi — routine-app

**Pašreizējā atzīme:** **8.9 / 10**  
**Iepriekšējā pilnā pārbaude:** 8.8 / 10 (2026-08-23)  
**Šī izpilde:** 2026-09-10 (extension lockout, JSON-LD escape, failu `nosniff`, MIME PE/HTML disguise, production bez service-role šifrēšanas fallback)  
**Atlikušais līdz 9.0:** H2 pilns HttpOnly (klienta Supabase lasa `document.cookie`).

Šis fails ir uzskaites saraksts. Statuss: `pending` / `done` / `accepted`.

---

## Kopsavilkums

2026-08-20 ieviesti visi HIGH/MIDDLE/LOW ieteikumi, izņemot pilnu HttpOnly sesiju (apzināts kompromiss). 2026-09-10: extension login lockout, JSON-LD escape, failu `nosniff` + stingrāka MIME, production šifrēšana tikai ar `INTEGRATION_SECRETS_KEY`. E-pasta auth ir īsts, noslēpumi šifrēti `enc:v1:`, Drive/OneDrive pārbauda `work_list_has_access`, kalendāra ICS ir `private, no-store` bez aprakstiem un ar token hash, MFA ir obligāta admin panelim, audit log raksta mutācijas.

| Lai sasniegtu | Jāaizver vismaz |
|---|---|
| **8.0** | H1, H3, H5, H6 |
| **8.5** | visi HIGH (H2 īstermiņa) |
| **8.8** | CSP nonce + OAuth/token hash (bez pilna HttpOnly) |
| **8.9** | Extension lockout, JSON-LD escape, failu nosniff/MIME, dedicated secrets key |
| **9.0** | H2 HttpOnly |

---

---

## Kas jau ir labi (neatkārtot)

Šīs kontroles ir ieviestas un jāuztur, nevis jāpārbūvē.

| Kontrole | Kur | Statuss |
|---|---|---|
| Drošības galvenes (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS ja `NEXT_PUBLIC_SITE_URL` ir https) | `next.config.ts` | done |
| `(app)` maršrutu aizsardzība bez sesijas → `/login` | `proxy.ts` + `updateSession` | done |
| Darba dati Postgres, `anon` deny, `is_team_member` / `work_list_has_access` | `005`–`022` un tālāk | done |
| Privātie saraksti (`can_view_work_list`) | `013`, `019`, `022` | done |
| OAuth CSRF state + `httpOnly` sīkdatne, drošs `next` redirects | `oauth-login-state.ts`, `safe-redirect-path.ts` | done |
| Google login prasa `verified_email` | `google-oauth/oauth.ts` | done |
| `site_integrations` un Drive/OneDrive tokeni: RLS deny authenticated/anon | `064`, `066`, `067` | done |
| Lietotājs nevar pats uzlikt `is_admin` (nav `users_update_own`) | `003`, `008` | done |
| Pirmais reģistrētais = admin ar advisory lock | `002_users_is_admin.sql` | done |
| Nav `eval()`; JSON-LD `dangerouslySetInnerHTML` ar `<` escape | `jsonLdScriptHtml`, smoke CI | done |
| Secret scan (gitleaks), `npm audit` HIGH+, security smoke | `.github/workflows/` | done |
| Uzaicinājuma pieņemšana pārbauda e-pastu / `invited_user_id` | `044`, `049` | done |
| Kalendāra token 256 biti; uzaicinājuma token 192 biti | `calendar/token.ts`, `team/actions.ts` | done |
| Drive mapju `..` sanitizācija | `sanitizeDrivePathParts` | done |

---

## HIGH — darīt pirmām kārtām

Ietekmē kontu pārņemšanu, privātu failu noplūdi vai noslēpumu izgūšanu no DB.

### H1. E-pasta login/signup nav īsts

- **Statuss:** done
- **Kur:** `app/components/login-form.tsx`, `signup-form.tsx` — `handleSubmit` rāda veiksmi un dzen uz `/dashboard` **bez** `signInWithPassword` / `signUp`. Proxy pēc tam atgriež uz `/login`, ja nav sesijas.
- **Risks:** viltus drošības sajūta; nav paroles politikas, nav rate limit, nav lockout; kad kāds “pieslēgs” formu, viegli palaist garām aizsardzību.
- **Ko darīt:**
  1. Vai nu **noņemt** e-pasta/paroles laukus, kamēr backend nav gatavs, vai ieviest īstu Supabase email+password (vai magic link).
  2. Rate limit (IP + e-pasts), lockout pēc N neveiksmēm, e-pasta apstiprinājums.
  3. `forgot-password` jāsaista ar `resetPasswordForEmail`, nevis tukšu UI.

### H2. Sesijas sīkdatnes nav HttpOnly

- **Statuss:** done (īstermiņa) / pending (pilns HttpOnly)
- **Piezīme:** `httpOnly` paliek `false`, jo `createBrowserClient` lasa `document.cookie`. Ieviests: remember noklusējums izslēgts, production `Secure`, CSP `script-src` ar nonce (`proxy.ts`, bez `'unsafe-inline'`). Pilns HttpOnly = visi DB vaicājumi uz serveri.
- **Kur:** `app/lib/auth/remember-session.ts` — `httpOnly: false` apzināti, lai pārlūka Supabase klients lasītu `document.cookie`.
- **Risks:** jebkurš XSS nozog sesiju. CSP vairs neļauj `'unsafe-inline'` skriptiem (nonce), bet bez HttpOnly XSS joprojām nozog cookie.
- **Ko darīt:**
  1. Pāriet uz servera-only sesiju (HttpOnly cookie) + RLS caur server actions / Route Handlers, **vai**
  2. Īstermiņā (izdarīts): saīsināt sesiju bez “Atcerēties mani”, CSP `script-src` ar nonce (bez `'unsafe-inline'`), stingrāka XSS hygiene.
  3. `SameSite=Lax` atstāt; production `Secure` jau nāk no Supabase cookie options, pārbaudīt ka tas vienmēr ir ieslēgts HTTPS.

### H3. Noslēpumi un OAuth refresh tokeni plaintext Postgres

- **Statuss:** done
- **Piezīme (2026-09-10):** production `encryptSecret` vairs nekrīt atpakaļ uz `SUPABASE_SERVICE_ROLE_KEY` - vajag `INTEGRATION_SECRETS_KEY`. Decrypt joprojām mēģina veco service-role atslēgu, lai nenozaudētu esošos tokenus.
- **Kur:**
  - `site_integrations.client_secret` (Google/Microsoft client secret, Resend API key, Sentry DSN)
  - `team_google_drive_integrations.refresh_token` / `access_token`
  - `team_onedrive_integrations.refresh_token` / `access_token`
- **Risks:** service role noplūde, DB dumps, `pg_dump`, admin kļūda → visi tenantu Drive/OneDrive un e-pasta sūtīšana.
- **Ko darīt:**
  1. Šifrēt at rest ar `pgsodium` / Supabase Vault (vai aplikācijas slāņa envelope encryption).
  2. Nolasīt tikai serverī; nekad neselektēt `client_secret` / tokenus admin UI atbildē (statusam pietiek ar `hasClientSecret`).
  3. Rotācija: Drive reconnect pēc secret rotācijas; dokumentēt incidentu plānu.

### H4. Microsoft OAuth neseko e-pasta verifikāciju

- **Statuss:** done (verified email) / accepted (klusā sasaistīšana pēc e-pasta)
- **Kur:** `app/lib/integrations/microsoft-oauth/oauth.ts` — `pickVerifiedMicrosoftEmail` prasa `email_verified`. `completeOAuthSignIn` (`oauth-session.ts`) pēc verificēta e-pasta ielaiž esošā kontā un saplūdina providera metadatus.
- **Risks:** verificēts OAuth e-pasts = tas pats cilvēks; klusā sasaistīšana ir UX (viens konts, vairāki login veidi), ne konta pārņemšana bez verifikācijas.
- **Ko darīt:**
  1. Graph/ID token: prasīt verificētu e-pastu — **izdarīts**.
  2. Nesasaistīt OAuth providera kontus tikai pēc e-pasta, ja lietotājs jau pastāv ar citu provideri — **accepted**: Google/Microsoft jau ir verificējuši e-pastu; prasīt esošo sesiju salauztu “ielogoties ar Google, ja jau ir parole”.
  3. Google jau pārbauda `verified_email` — atstāt.

### H5. Drive / OneDrive API apiet privāto sarakstu RLS

- **Statuss:** done
- **Kur:** `app/api/google-drive/content/route.ts`, `rename/route.ts`, `upload/route.ts`, `app/api/onedrive/upload/route.ts` — `createAdminClient()` + `assertTeamMember` (jebkurš komandas biedrs). RLS `can_view_work_list` / `work_list_has_access` netiek pārbaudīts.
- **Risks:** komandas biedrs bez privātā saraksta pieejas var lejupielādēt vai pārsaukt failu, ja zina `fileId` (paziņojums, noplūdis URL, minējums mazāk ticams).
- **Ko darīt:**
  1. Pēc faila rindu ielādes pārbaudīt `work_list_has_access(list_id, 'view'|'edit')` ar **lietotāja** klientu, nevis tikai team membership.
  2. Upload: pārbaudīt, ka `teamId` + ceļš atbilst sarakstam, kuram ir `edit`.
  3. Rename: tas pats `edit` līmenis kā `task_files_update` RLS.

### H6. Kalendāra ICS ir publisks “capability URL” ar uzdevumu tekstu

- **Statuss:** done
- **Kur:** `app/calendar/[token]/route.ts` — `Cache-Control: public, max-age=300`; `loadCalendarFeedByToken` ar service role ielādē `title` + `description`. Token glabājas plaintext; `user_calendar_integrations` SELECT atgriež `feed_token` īpašniekam (OK), bet URL noplūst vēsturē, logos, kopīgotā kalendārā.
- **Risks:** URL noplūde = visi piešķirtie uzdevumi ar aprakstiem; CDN/proxy var kešot privātu ICS.
- **Ko darīt:**
  1. `Cache-Control: private, no-store` (vai `private, max-age=60`).
  2. ICS bez `description` (vai īsā kopsavilkuma) — tituls + datums pietiek.
  3. DB glabāt `sha256(token)`, nevis pašu tokenu; rādīt URL tikai ģenerēšanas brīdī.
  4. Rotācija jau ir (`regenerateCalendarFeedToken`) — UI jāuzsver, ka vecais URL kļūst nederīgs.

---

## MIDDLE — nākamais vilnis

### M1. Uzaicinājuma `token` redzams visiem komandas biedriem

- **Statuss:** done
- **Kur:** `044_team_invitations.sql` — `team_invitations_select` `using (invited_user_id = auth.uid() or is_team_member(team_id))`. Klients var `select token`.
- **Ko darīt:** kolonna `token` nav SELECT authenticated (tikai service role / RPC); UI “kopēt saiti” caur server action, kas atgriež URL īpašniekam/inviter. Alternatīva: hash at rest.

### M2. `SECURITY DEFINER` ar `search_path = public`

- **Statuss:** done (īstermiņa)
- **Kur:** uzaicinājumu funkcijas pēc `073_security_hardening.sql` ir `search_path = pg_catalog, public` (ne vairs tikai `public`). Jaunākās funkcijas lieto `search_path = ''`.
- **Risks:** ja `public` kļūst rakstāms uzbrucējam, definer funkcijas ar `public` path var izsaukt viltojušus objektus. `pg_catalog` vispirms samazina šo logu.
- **Ko darīt:** ideāli visām definer funkcijām `set search_path = ''` un kvalificēt `public.*`. Atlikušais higiēnas solis, ne 9.0 bloķētājs.

### M3. Failu saturs plaintext `task_files.content` / `list_files.content`

- **Statuss:** done
- **Kur:** `005_work_data.sql`, `work-data.ts` ielādē `content` visiem pieejamajiem failiem klientā.
- **Risks:** DB dumps un jebkurš ar saraksta view redz failu baitus; lieli data URL palielina noplūdes apjomu.
- **Ko darīt:** noklusējums jau ir Drive-only (`store_on_server = false`). Stingrāk: Storage bucket ar signed URL, nevis `text` kolonna; nesūtīt visus `content` `fetchTeamWorkspace` laikā.

### M4. Nav rate limit

- **Statuss:** done
- **Kur:** login, OAuth callback, `preview_team_invitation` (anon), kalendāra GET, extension attach, invite e-pasts. **2026-09-10:** `/api/extension/login` lieto to pašu `readAuthLockout` / `recordAuthFailure` kā web login (ne tikai IP/e-pasta rate limit).
- **Ko darīt:** Upstash / middleware limiter; kalendāram un invite preview — per-IP; invite e-pastam jau ir brīdinājums, pievienot lokālu throttle.

### M5. Nav MFA un nav admin audit log

- **Statuss:** done
- **Ko darīt:** Supabase MFA vismaz `is_admin`; tabula `admin_audit_events` (kas, kad, kāda darbība: integrācijas, lietotāju dzēšana, `is_admin` maiņa).

### M6. Chrome extension CORS atļauj jebkuru `chrome-extension://`

- **Statuss:** done (apzināts dizains, ne ID allowlist)
- **Kur:** `app/lib/extension/cors.ts` — atspoguļo derīgu 32 simbolu Chrome extension ID; `canonicalHostRedirectRules()` izlaiž `/api/extension/*`; `proxy.ts` pievieno CORS galvenes hosta 301.
- **Kāpēc ne allowlist:** CORS nav auth. Privātie `/api/extension/*` prasa Bearer. `CHROME_EXTENSION_IDS` production vidē slēdza visus origīnus, ja saraksts bija tukšs vai novecojis, un Chrome rādīja “No Access-Control-Allow-Origin”.

### M7. CSP `'unsafe-inline'` + nepilns `connect-src`

- **Statuss:** done
- **Kur:** `app/lib/security/csp.ts` + `proxy.ts` — CSP ar `x-nonce`; Umami skripts pēc hidratācijas kopē dokumenta nonce. `connect-src` allowlist (Supabase, Google/Microsoft OAuth, Umami, Sentry).
- **Piezīme:** nonce ceļš ir done. HttpOnly sesija paliek atsevišķs H2 punkts.

### M8. Failu MIME uzticas klientam

- **Statuss:** done
- **Kur:** upload routes + `mimeMatchesBytes`. **2026-09-10:** noraida PE (`MZ`) un HTML disguise; nezināmam tipam vairs nav `return true`, ja sniffed ir image/pdf. Content routes (`work-files`, Drive, OneDrive) sūta `X-Content-Type-Options: nosniff`.
- **Ko darīt:** servera puses paplašinājuma + magic-bytes pārbaude; HTML/SVG kā lejupielāde (`attachment`), ne `inline`; PDF iframe `sandbox`.

### M9. 30 dienu “Atcerēties mani” pēc noklusējuma

- **Statuss:** done
- **Kur:** `parseRememberSession` — ja cookie nav `0`, atcerēšanās ir **true**.
- **Ko darīt:** noklusējums session cookie (līdz pārlūka aizvēršanai); 30 dienas tikai ar ķeksi. Admin sesijai īsāks TTL.

### M10. CI API auth ir tikai WARN

- **Statuss:** done
- **Kur:** `.github/workflows/security-smoke.yml` — API bez `getCurrentUser|requireAuth` nenosit build.
- **Ko darīt:** FAIL, ja `route.ts` eksportē GET/POST bez auth helpera; izņēmums tikai `calendar/[token]` ar komentāru.

---

## LOW — higiēna un aizsardzība dziļumā

### L1. `preview_team_invitation` pieejams `anon`

- **Statuss:** done
- **Piezīme:** vajadzīgs invite lapai. Token ir garš, bet RPC atklāj e-pastu un komandas nosaukumu.
- **Ko darīt:** rate limit + neuzrādīt pilnu e-pastu (maskēt).

### L2. Permissions-Policy šaura

- **Statuss:** done
- **Ko darīt:** pievienot `payment=()`, `usb=()`, `interest-cohort=()` u.c.

### L3. Fiktīvā login veiksmes ziņa

- **Statuss:** done (saistīts ar H1)
- **Ko darīt:** kamēr e-pasta auth nav, nerādīt “Veiksmīgi ienāci”.

### L4. Sentry DSN klientā

- **Statuss:** done
- **Kur:** `SentryInit` ar DSN no `site_integrations`.
- **Ko darīt:** `sendDefaultPii: false`, scrub e-pastus/tokenus; DSN nav noslēpums, bet PII ir.

### L5. Umami skripts bez SRI

- **Statuss:** done
- **Ko darīt:** `integrity` + fiksēts script URL; CSP `script-src` hash.

### L6. Backup / retention / piekļuve DB

- **Statuss:** done
- **Ko darīt:** dokumentēt Supabase PITR, kas drīkst `SUPABASE_SERVICE_ROLE_KEY`, rotācija, production `NEXT_PUBLIC_SITE_URL` https (HSTS).

### L7. `console.error` ar provider kļūdām

- **Statuss:** done
- **Ko darīt:** nestrīpot tokenus/e-pastus servera logā.

### L8. System admin redz visus sarakstus

- **Statuss:** accepted (by design)
- **Kur:** `work_list_has_access` atgriež `full_edit` ja `current_user_is_admin()`.
- **Ko darīt:** nav jānoņem; audit log (M5) kad admin atver cita tenant datus.

### L9. JSON-LD `dangerouslySetInnerHTML`

- **Statuss:** done
- **Kur:** `landing-json-ld.tsx`, `public-page-json-ld.tsx` caur `jsonLdScriptHtml` (`JSON.stringify` + `<` → `\u003c`).
- **Ko darīt:** nesūtīt neapstrādātu JSON `<script>` tagā.

---

## Atzīmes skala (iekšējai kalibrācijai)

| Balles | Nozīme |
|---|---|
| 5–6 | Prototips, dati pārlūkā vai bez RLS |
| **7.0** | RLS + proxy + OAuth + CI; integrāciju noslēpumi un faili vēl vāji |
| **8.5** | Šifrēti tokeni, Drive list access, kalendārs privāts, īsts auth, MFA+audit, rate limit |
| **8.9 (tagad)** | Extension lockout, JSON-LD escape, failu nosniff/MIME, dedicated encrypt key; paliek HttpOnly |
| 9.0 | MFA, audit, Vault, rate limit, HttpOnly vai līdzvērtīgs XSS modelis |
| 10 | Ārējs pentests + formāla programma (ne tikai kods) |

---

## Izpildes secība (ieteicamā)

1. **H5** — Drive/OneDrive list-access (īss kods, augsts datu risks)
2. **H6** — ICS `private` cache + bez description
3. **H1** — noņemt vai ieviest e-pasta auth
4. **H4** — Microsoft verified email + nesasaistīt providera kontus klusi
5. **H3** — Vault / šifrēšana tokeniem
6. **H2** — HttpOnly ceļš vai CSP nonce
7. **M1, M2, M4, M6** — uzaicinājumi, search_path, rate limit, extension CORS (Bearer, ne ID allowlist)
8. Pārējie MIDDLE/LOW

Pēc katra aizvērta punkta: atzīmē `done`, īsa piezīme (PR/commits), un ja atzīme mainās — atjaunini augšējo **Pašreizējā atzīme**.
