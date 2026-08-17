# Routine

Komandas darba rīks ar publisku landing lapu un sānjoslas lietotni. Gaišs Next.js frontend.

**Current version:** `0.0.4`

## Palaist

```bash
npm install
npm run dev
```

Atver [http://localhost:3120](http://localhost:3120).

## Kas iekšā

- **Landing** — `/` ar dashboard vizuāli, pārdošanas blokiem, Ienākt / Reģistrēties un sīkdatņu popup
- **Auth** — `/login`, `/signup`, `/forgot-password` (pagaidām frontend, bez backend)
- **Legal** — `/privacy`, `/terms`, `/cookies` ar fiksētu satura sānjoslu; kājene arī lietotnē
- **Sānjosla** — Sākums ved uz `/dashboard` (komandas todo board)
- **Trīs skati** — Saraksts (kopsavilkums), projekts (3 logi), uzdevums (apakšuzdevumu tabula)
- Sānjoslas koks rāda sarakstus un ligzdotos uzdevumus; apakšuzdevumi paliek tabulā
- **Komanda** — biedri, uzaicināšana, pēdējā tiešsaistes laika zīme
- Apakšuzdevuma modālis: apraksts, datumi, atbildīgie, statuss, pielikumi
- Satura joslā **paziņojumi** (zvaniņš labajā malā)
- Dati pagaidām `localStorage` - bez datubāzes

## Skripti

| Komanda | Apraksts |
|---|---|
| `npm run dev` | Izstrāde, ports **3120** |
| `npm run start` | Produkcijas serveris, ports **3120** |
| `npm run build` | Produkcijas būve |
| `npm run typecheck` | TypeScript pārbaude |
| `npm run lint` | ESLint |

Tehniskā dokumentācija: [DEVELOPER.md](DEVELOPER.md). Izmaiņu vēsture: [CHANGELOG.md](CHANGELOG.md).
