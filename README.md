# Routine

Komandas darba rīks ar publisku landing lapu un sānjoslas lietotni. Gaišs Next.js frontend.

**Current version:** `0.2.5`

## Palaist

```bash
npm install
npm run dev
```

Atver [http://localhost:3120](http://localhost:3120).

## Kas iekšā

- **Landing** — `/` ar dashboard vizuāli; fīču kartītes un hero teksts tikai no ieslēgtajiem frontend moduļiem (izslēgtie netiek pieminēti); Ienākt (un Reģistrēties, ja Resend aktīvs) un sīkdatņu popup; ielogotam uzreiz `/dashboard`
- **SEO / Search Console** — `/robots.txt` un `/sitemap.xml`; kanoniskie URL no `NEXT_PUBLIC_SITE_URL`; privātās lapas `noindex`; HTML tag verifikācija ar `GOOGLE_SITE_VERIFICATION`
- **Auth** — `/login`, `/signup`, `/forgot-password`, `/update-password`, `/auth/confirm`; e-pasts un parole tikai ja **Resend** ir konfigurēts un aktīvs (bez tā nav Reģistrēties joslā, signup saites loginā un Atcerēties mani; `/signup` uz `/login`); login/signup pogas nāk no publiska RPC (`public_sign_in_methods`), nevis service role; reģistrācijas apstiprinājums un paroles atjaunošana iet kā HTML e-pasts no admin šabloniem (ne Supabase noklusējuma); **Turpināt ar Google** / **Turpināt ar Microsoft** (ja admin ieslēdzis OAuth) signupā bez noteikumu ķeksīša; **Atcerēties mani** tikai loginā, pēc noklusējuma izslēgts (30 dienas ar ķeksi); ielogotam `/` ved uz dashboard
- **Gmail spraudnis** — Chrome unpacked `extensions/gmail`: bez URL/Client ID; popup rāda kontu un komandas; custom login vai Google; Gmail savienojums saglabājas sistēmā; origini `tasqin.com` / `www.tasqin.com` / `localhost:3120`; admin modulis **Gmail spraudnis**
- **MFA** — profilā pēc izvēles visiem; ja ieslēgta, pie ielogošanās TOTP modālis; sistēmas adminam MFA obligāta `/admin`
- **Legal** — `/privacy`, `/terms`, `/cookies` ar fiksētu satura sānjoslu; kājene arī lietotnē
- **Sānjosla** — Sākums ved uz `/dashboard` (Mani uzdevumi, ja ir piesaistīti, tad darbs pa sarakstiem); sadalītie uzdevumi un apakšuzdevumi pēc statusa pretēji picker (aktīvākie vispirms, TO DO beigās); kokā var ievilkt mapē, iznest ārā vai nomest zem pēdējās mapes; uzdevuma/mapes `...` → **Arhivēt**; rindas fona aizpildījums rāda progresu (pabeigtie + esošie); apgrieztiem nosaukumiem overflow tooltip
- **Trīs skati** — Saraksts (kopsavilkums ar `done/total` un vienu joslu; mape summē uzdevumus), projekts (Uzdevumi | Faili augšā, Saraksts zem tiem ar mapēm, progresu un arhīvu; Uzdevumi bloka arhīvs pārslēdz visas Saraksts kartītes), uzdevums (apakšuzdevumu tabula ar progresu virsrakstā)
- Sānjoslas koks rāda sarakstus, uzdevumus un apakšuzdevumus; apakšuzdevumu aplītis un Saraksta loga teksts ir statusa krāsā
- Saraksta `...` → **Statusi** — sistēmas statusi visiem sarakstiem un komandas statusi tikai šim sarakstam; **Automatizācijas** (ja ieslēgts modulis) — piem. jaunai mapei automātiski pielietot šablonu
- **Komanda** — biedru uzaicināšana (HTML e-pasts ar `/invite/{token}`, in-app paziņojums reģistrētam); apstiprinājums/noraidījums paziņojumos vai uzaicinājuma lapā (tur arī Reģistrēties); pending biedri `/team`, bet ne sānjoslā; resend, kopēt linku, noņemt; biedrs var pats pamest komandu (ne īpašnieks); bez komandas — dashboard ar jaunas komandas pogu un paziņojumu hintu; lomas ar pieejām; `...` → **Šabloni** (`/templates`, ja ieslēgts modulis), **Google Drive Integrācija** (ja `module_google_drive` + failu augšupielāde; noklusējumā faili uz Drive, pēc izvēles arī Routine serverī), **OneDrive** (ja ieslēgts) — assignee, checklist, custom apakšuzdevumu statusi, automātiska saglabāšana
- **Sarakstu pieejas** — sākumā noklusējuma līmenis visiem; pēc izvēles pielāgo katrai lomai (pilna labošana, labot, komentēt, tikai skatīt); privātu sarakstu (tikai izvēlētajiem biedriem/lomām) var ieslēgt, ja aktīvs privāto sarakstu modulis
- **Komandu lomas un pieejas** — katrai lomai definē sadaļu redzamību un darbības (saraksti, uzdevumi, šabloni, faili, komandas pārvaldība); divkolonnu izkārtojums, toggle automātiski saglabā
- **Admin** — `/admin` `is_admin` lietotājiem; joslā trīs kategorijas (**Cilvēki**, **Katalogs**, **Sistēma**) ar hover dropdown (lietotāji, komandas, lomas, statusi, failu tipi, valodas, tulkojumi, **moduļi**, **maksas plāni**, **integrācijas**, **e-pasta šabloni**, uzstādījumi); `/admin/email-templates` — HTML šabloni (reģistrācija, parole, uzaicinājums, sistēmas paziņojumi) visās valodās ar priekšskatījumu; `/admin/integrations` — Google/Microsoft OAuth, Resend, Umami, Sentry; aktīvs Umami ielādē skriptu `<head>` (pageview pēc statistikas piekrišanas); aktīvs Sentry ķer klienta kļūdas; `/admin/modules` ieslēdz/izslēdz privātos sarakstus, failu augšupielādi, Google Drive, **Gmail spraudni**, Check List, automatizācijas un šablonus; `/admin/payment-plans` — plānu katalogs, cenas, izmēģinājums un Early Bird; `/admin/settings`: nosaukums, slogans, logotips/favicon vai iniciāļu avatārs, datumu/laika noklusējums; pārlūka cilne `Sākums | Routine` (no `generateMetadata`, nevis klienta pārrakstīšanas)
- **Personīgā informācija** — lietotāja izvēlnē modālis vārda un uzvārda maiņai (sinhronizē profilu visās komandās)
- **Paziņojumu uzstādījumi** — lietotāja izvēlnē vai zvaniņa paneļa settings pogā; grupēts modālis (Uzdevumi / Atgādinājumi / Komanda) ar ikonām; toggle automātiski saglabā
- **Kalendāra integrācija** — lietotāja izvēlnē (ja `module_calendar` + Apple vai Google); `.ics` abonēšana piesaistītajiem uzdevumiem ar termiņu (bez apraksta teksta)
- **Personīgie uzstādījumi** — `/settings/profile`: nedēļas sākums, datuma formāts/atdalītājs, 12/24 h; lietotāja vērtība pārspēj sistēmas; tukšs lauks = sistēmas noklusējums
- **Faili** — kokā un apakšuzdevumos tikai atļautie paplašinājumi (sākumā pdf, dwg, Word, Excel, png/jpg/jpeg/gif/webp, txt/html, zip/rar); ikona un krāsa no `/admin/file-types`; augšupielādē progressa logs; ar Drive — noklusējumā saturs Cloud, opcionāli arī serverī; pārsaukšana atjaunina arī Drive nosaukumu (paplašinājumu mainīt nevar); klikšķis: bildes/PDF/txt → priekšskatījuma modālis, Excel u.c. → lejupielāde; ielādes laikā overlay ar spinneri; PDF bez sānjoslas; e-pasta `.txt` rāda kā e-pastu; apakšuzdevuma pielikumos izmērs, apgrieztam nosaukumam tooltip, X dzēš pēc apstiprinājuma, `...` → Lejupielādēt; sānjoslā failu vietas summa (tooltip: Serveris / Cloud); mapes **Faili** logs ietver arī apakšuzdevumu pielikumus; paperclip aiz nosaukuma tabulā un mapes Sarakstā, ja ir pielikumi; ja failu modulis izslēgts, upload, Failu logs un Failu vieta nav
- Ceļa joslā pirms katra posma tipa ikona (saraksts, mape, uzdevums, fails); aiz paziņojumiem valodas kods, ja ir vairākas aktīvas valodas; bez izvēles rāda sistēmas noklusējumu
- Apakšuzdevuma tabula: viena tabula ar statusu grupām un zilu drop līniju; arhīvs pie Pievienot (aktīva poga sarkanīga); pabeigtajiem un dzēstajiem viegls rindas fons; fade-out, dzēšana/atjaunošana, pārvietošana; aiz nosaukuma paperclip, ja ir pielikumi (arī mapes Saraksta skatā); zem nosaukuma un pārvietošanas izvēlnē mapes/saraksta **PATH**, ja uzdevums nav saraksta saknē; sarakstā klikšķis atver modāli; statuss saglabājas uzreiz; sākuma/termiņa datumi rāda atlikušās vai kavētās dienas pēc statusa grupas (Nav sākts / Aktīvs / Slēgts); modālī **vēsture** ar izmaiņu žurnālu (bez komentāriem), ritināma pret kreiso kolonnu ar fade/bultiņām
- **Check List** apakšuzdevuma modalī pirms pielikumiem; tukšs sākumā sakļauts; slēgto statusu tikai pie 100% (ja Check List modulis ieslēgts); zem statusa pogas zaļa progresa josla
- Satura joslā **paziņojumi** (zvaniņš labajā malā) — personīgie brīdinājumi par uzdevumiem, kur esi iesaistīts (arī piešķiršana no šablona/automatizācijas), un komandas uzaicinājumi ar Apstiprināt / Noraidīt; ja Resend ir aktīvs, tos pašus notikumus (izņemot uzaicinājumu, kam ir savs šablons) sūta arī e-pastā
- Kamēr dati ielādējas, rādās **Ielādē…** ar spinneri (lapas, sānjosla, paziņojumi), ne tukšs saturs; pēc ielogošanās vispirms nāk sarakstu čaula, failu saturs un uzdevuma vēsture - tikai atverot
- Darba dati Postgres (`teams`, `work_lists`, `work_tasks`, …); Google sesija un `public.users` caur Supabase

## Skripti

| Komanda | Apraksts |
|---|---|
| `npm run dev` | Izstrāde, ports **3120** |
| `npm run start` | Produkcijas serveris, ports **3120** |
| `npm run build` | Produkcijas būve |
| `npm run typecheck` | TypeScript pārbaude |
| `npm run lint` | ESLint |
| `npm run audit:check` | HIGH/CRITICAL atkarību pārbaude |
| `npm run db:test` | Pieslēgums Supabase Postgres un `public` tabulu saraksts |
| `npm run db:migrate` | Pending `supabase/migrations/*.sql` |

Kopē `.env.example` uz `.env.local`. `NEXT_PUBLIC_SUPABASE_URL` ir projekta hosts (`https://….supabase.co`), bez `/rest/v1/`. Produkcijā `NEXT_PUBLIC_SITE_URL` = viens kanoniskais hosts (`https://tasqin.com` vai `https://www.tasqin.com`). Vercel env: bez pēdiņām, `SUPABASE_SERVICE_ROLE_KEY` ir **service_role** (ne anon). Pārlūka kods lasa `NEXT_PUBLIC_*` tikai kā statisku `process.env.NEXT_PUBLIC_…` (citādi MFA/klients redz tukšu env). Pēc `NEXT_PUBLIC_*` izmaiņām **Redeploy**. Detalizēti: [DEVELOPER.md](DEVELOPER.md#vercel).

Tehniskā dokumentācija: [DEVELOPER.md](DEVELOPER.md). Drošības audits: [`security-check.md`](security-check.md), uzlabojumu saraksts: [`system_security_upgrades.md`](system_security_upgrades.md). Izmaiņu vēsture: [CHANGELOG.md](CHANGELOG.md).
