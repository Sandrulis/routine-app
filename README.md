# Routine

Komandas darba rīks ar publisku landing lapu un sānjoslas lietotni. Gaišs Next.js frontend.

**Current version:** `0.1.15`

## Palaist

```bash
npm install
npm run dev
```

Atver [http://localhost:3120](http://localhost:3120).

## Kas iekšā

- **Landing** — `/` ar dashboard vizuāli, pārdošanas blokiem, Ienākt / Reģistrēties un sīkdatņu popup; ielogotam uzreiz `/dashboard`
- **Auth** — `/login`, `/signup`, `/forgot-password`; e-pasts pagaidām frontend, **Turpināt ar Google** caur Supabase; **Atcerēties mani** (noklusējums) tur sesiju 30 dienas; ielogotam `/` ved uz dashboard
- **Legal** — `/privacy`, `/terms`, `/cookies` ar fiksētu satura sānjoslu; kājene arī lietotnē
- **Sānjosla** — Sākums ved uz `/dashboard` (Mani uzdevumi, ja ir piesaistīti, tad darbs pa sarakstiem); sadalītie uzdevumi un apakšuzdevumi pēc statusa pretēji picker (aktīvākie vispirms, TO DO beigās); kokā var ievilkt mapē, iznest ārā vai nomest zem pēdējās mapes; uzdevuma/mapes `...` → **Arhivēt**; apgrieztiem nosaukumiem overflow tooltip
- **Trīs skati** — Saraksts (kopsavilkums + arhīva poga labajā malā), projekts (Uzdevumi | Faili augšā, Saraksts zem tiem ar mapēm un arhīvu), uzdevums (apakšuzdevumu tabula)
- Sānjoslas koks rāda sarakstus, uzdevumus un apakšuzdevumus; apakšuzdevumu aplītis un Saraksta loga teksts ir statusa krāsā
- Saraksta `...` → **Statusi** — sistēmas statusi visiem sarakstiem un komandas statusi tikai šim sarakstam; **Automatizācijas** — piem. jaunai mapei automātiski pielietot šablonu
- **Komanda** — biedru uzaicināšana (e-pasts jaunam lietotājam, in-app paziņojums reģistrētam); apstiprinājums/noraidījums paziņojumos vai `/invite/{token}`; pending biedri `/team`, bet ne sānjoslā; resend, kopēt linku, noņemt; biedrs var pats pamest komandu (ne īpašnieks); bez komandas — dashboard ar jaunas komandas pogu un paziņojumu hintu; lomas ar pieejām; `...` → **Šabloni** (`/templates`)
- **Sarakstu pieejas** — sākumā noklusējuma līmenis visiem; pēc izvēles pielāgo katrai lomai (pilna labošana, labot, komentēt, tikai skatīt); privātam sarakstam arī biedriem
- **Komandu lomas un pieejas** — katrai lomai definē sadaļu redzamību un darbības (saraksti, uzdevumi, šabloni, faili, komandas pārvaldība); divkolonnu izkārtojums, toggle automātiski saglabā
- **Admin** — `/admin` `is_admin` lietotājiem (lietotāji, komandas, lomas, statusi, failu tipi, valodas, tulkojumi, uzstādījumi); `/admin/settings`: nosaukums, slogans, logotips/favicon vai iniciāļu avatārs, datumu/laika noklusējums; pārlūka cilne `Sākums | Routine` (no `generateMetadata`, nevis klienta pārrakstīšanas)
- **Personīgā informācija** — lietotāja izvēlnē modālis vārda un uzvārda maiņai (sinhronizē profilu visās komandās)
- **Paziņojumu uzstādījumi** — lietotāja izvēlnē vai zvaniņa paneļa settings pogā; grupēts modālis (Uzdevumi / Atgādinājumi / Komanda) ar ikonām; toggle automātiski saglabā
- **Personīgie uzstādījumi** — `/settings/profile`: nedēļas sākums, datuma formāts/atdalītājs, 12/24 h; lietotāja vērtība pārspēj sistēmas; tukšs lauks = sistēmas noklusējums
- **Faili** — kokā un apakšuzdevumos tikai atļautie paplašinājumi (sākumā pdf, dwg, Word, Excel); ikona un krāsa no `/admin/file-types`; sānjoslā failu vietas summa
- Ceļa joslā aiz paziņojumiem valodas kods, ja ir vairākas aktīvas valodas; bez izvēles rāda sistēmas noklusējumu
- Apakšuzdevuma tabula: viena tabula ar statusu grupām un zilu drop līniju; arhīvs pie Pievienot (aktīva poga sarkanīga); pabeigtajiem un dzēstajiem viegls rindas fons; fade-out, dzēšana/atjaunošana, pārvietošana; sarakstā klikšķis atver modāli; statuss saglabājas uzreiz; sākuma/termiņa datumi rāda atlikušās vai kavētās dienas pēc statusa grupas (Nav sākts / Aktīvs / Slēgts); modālī **vēsture** ar visām izmaiņām (statuss, datumi, piesaistītie, kontrolsaraksts, faili u.c.)
- **Check List** apakšuzdevuma modalī pirms pielikumiem; slēgto statusu tikai pie 100%; zem statusa pogas zaļa progresa josla
- Satura joslā **paziņojumi** (zvaniņš labajā malā) — personīgie brīdinājumi par uzdevumiem, kur esi iesaistīts, un komandas uzaicinājumi ar Apstiprināt / Noraidīt
- Kamēr dati ielādējas, rādās **Ielādē…** ar spinneri (lapas, sānjosla, paziņojumi), ne tukšs saturs
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

Kopē `.env.example` uz `.env.local`. `NEXT_PUBLIC_SUPABASE_URL` ir projekta hosts (`https://….supabase.co`), bez `/rest/v1/`.

Tehniskā dokumentācija: [DEVELOPER.md](DEVELOPER.md). Drošības audits: [`security-check.md`](security-check.md). Izmaiņu vēsture: [CHANGELOG.md](CHANGELOG.md).
