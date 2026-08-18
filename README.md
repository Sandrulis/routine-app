# Routine

Komandas darba rīks ar publisku landing lapu un sānjoslas lietotni. Gaišs Next.js frontend.

**Current version:** `0.1.11`

## Palaist

```bash
npm install
npm run dev
```

Atver [http://localhost:3120](http://localhost:3120).

## Kas iekšā

- **Landing** — `/` ar dashboard vizuāli, pārdošanas blokiem, Ienākt / Reģistrēties un sīkdatņu popup
- **Auth** — `/login`, `/signup`, `/forgot-password`; e-pasts pagaidām frontend, **Turpināt ar Google** caur Supabase
- **Legal** — `/privacy`, `/terms`, `/cookies` ar fiksētu satura sānjoslu; kājene arī lietotnē
- **Sānjosla** — Sākums ved uz `/dashboard` (Mani uzdevumi un darbs pa sarakstiem); sadalītie uzdevumi un apakšuzdevumi pēc statusa pretēji picker (aktīvākie vispirms, TO DO beigās); kokā var ievilkt mapē vai iznest ārā; apgrieztiem nosaukumiem overflow tooltip
- **Trīs skati** — Saraksts (kopsavilkums), projekts (Uzdevumi | Faili augšā, Saraksts zem tiem ar mapēm un arhīvu), uzdevums (apakšuzdevumu tabula)
- Sānjoslas koks rāda sarakstus, uzdevumus un apakšuzdevumus; apakšuzdevumu aplītis un Saraksta loga teksts ir statusa krāsā
- Saraksta `...` → **Statusi** — sistēmas statusi visiem sarakstiem un komandas statusi tikai šim sarakstam
- **Komanda** — pieslēgtam lietotājam bez komandas bloķējošs izveides modālis; lomas ar sānjoslas un darbību pieejām; biedri un saraksti kopīgi Postgres
- **Sarakstu pieejas** — sākumā noklusējuma līmenis visiem; pēc izvēles pielāgo katrai lomai (pilna labošana, labot, komentēt, tikai skatīt); privātam sarakstam arī biedriem
- **Admin** — `/admin` `is_admin` lietotājiem (lietotāji, komandas, lomas, statusi, valodas, tulkojumi); UI lv / en / ru
- Ceļa joslā aiz paziņojumiem valodas kods, ja ir vairākas aktīvas valodas; bez izvēles rāda sistēmas noklusējumu
- Apakšuzdevuma tabula: viena tabula ar statusu grupām un zilu drop līniju; arhīvs pie Pievienot (aktīva poga sarkanīga); pabeigtajiem un dzēstajiem viegls rindas fons; fade-out, dzēšana/atjaunošana, pārvietošana; sarakstā klikšķis atver modāli; statuss saglabājas uzreiz; Saglabāt paliek modālī pārējiem laukiem
- **Check List** apakšuzdevuma modalī pirms pielikumiem; slēgto statusu tikai pie 100%; zem statusa pogas zaļa progresa josla
- Satura joslā **paziņojumi** (zvaniņš labajā malā)
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
