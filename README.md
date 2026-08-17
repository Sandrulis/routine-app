# Routine

Komandas darba rīks ar publisku landing lapu un sānjoslas lietotni. Gaišs Next.js frontend.

**Current version:** `0.1.1`

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
- **Sānjosla** — Sākums ved uz `/dashboard` (komandas todo board); apgrieztiem nosaukumiem overflow tooltip
- **Trīs skati** — Saraksts (kopsavilkums), projekts (Uzdevumi | Faili augšā, Saraksts zem tiem), uzdevums (apakšuzdevumu tabula)
- Sānjoslas koks rāda sarakstus un ligzdotos uzdevumus; apakšuzdevumi paliek tabulā
- **Komanda** — pieslēgtam lietotājam bez komandas bloķējošs izveides modālis; rangs Īpašnieks; biedri per user + team
- Apakšuzdevuma modālis: apraksts, datumi, atbildīgie, statuss, pielikumi; Saglabāt neatver citu lapu
- Satura joslā **paziņojumi** (zvaniņš labajā malā)
- Dati pagaidām `localStorage` (scoped per user + team); Google sesija un `public.users` caur Supabase

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
