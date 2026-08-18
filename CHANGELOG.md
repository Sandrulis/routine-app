# Changelog

## Unreleased

- (none)

## v0.1.2

**Komandas dati Postgres, admin panelis un statusa krāsas**

- Saraksti, uzdevumi, faili un paziņojumi Postgres ar RLS; `/admin` `is_admin` lietotājiem; UI lv / en / ru
- Apakšuzdevumu aplīši kokā un Saraksta logā ņem statusa krāsu; Saraksta logā arī teksts
- Admin lietotāju pēdējā tiešsaiste no `team_members.last_online_at` (zaļš punkts / min / h / d)

## v0.1.1

**Google pieslēgšanās, obligāta komanda un saraksta skats**

- Login un signup: **Turpināt ar Google** caur Supabase OAuth (`/auth/callback`); e-pasta forma joprojām frontend
- Pieslēgtam lietotājam bez komandas bloķējošs **Jauna komanda** modālis; rangs **Īpašnieks**; saraksti un biedri per user + team
- Saraksta lapa: **Uzdevumi** | **Faili** augšā, **Saraksts** pilnā platumā ar horizontāliem uzdevumu blokiem (cik ietilpst); apakšuzdevuma Saglabāt paliek modālī

## v0.1.0

**GitHub drošības pārbaudes un Supabase setup**

- Trīs GitHub Actions pie katra push/PR: secret scan (gitleaks), atkarību audits (`npm run audit:check`) un security smoke (typecheck, lint, build, galvenes, `eval()`)
- `package.json` overrides pin `postcss` / `sharp` un citas tranzitīvās HIGH atkarības; HTTPS vidē HSTS
- `security-check.md` sākotnējais audits (**6.5 / 10**)
- `.env.example` ar Supabase URL/atslēgām; `npm run db:test` un `npm run db:migrate` (Postgres pooler, `eu-west-2`)

## v0.0.4

**Publiskā landing lapa, auth un sīkdatnes**

- `/` ir landing ar dashboard vizuāli, pārdošanas blokiem un CTA; galvene un saturs vienā platumā (`max-w-6xl`)
- Ienākt, reģistrēties, aizmirsi paroli - pagaidām frontend bez backend; sānjoslas Sākums atver `/dashboard`
- Privātums, noteikumi un sīkdatņu politika ar fiksētu satura sānjoslu; piekrišanas popup
- Kājene arī lietotnē (bez rāmja un fona): legal saites un sīkdatņu iestatījumi

## v0.0.3

**Apakšuzdevuma pielikumi, komandas pārslēdzējs un paziņojumi**

- Pielikumi ar drag-and-drop vai pārlūkošanu; kartītes ar `...` (Apskatīt, Pārsaukt, Dzēst); klikšķis uz kartītes arī atver apskati; dzēšana ar apstiprinājumu
- Nosaukums treknāks, bez rāmja; sākuma un termiņa datumi atver kalendāru; piezīmes raksta aprakstā
- Sānjoslas galvenē komandas pārslēdzējs: avatārs atver sarakstu, pievienošana / labošana / dzēšana, krāsa un logotips; hover uz avatāra rāda nosaukuma tooltip
- Vienota statusa poga tabulā un modālī (krāsains nosaukums, nākamais statuss, ķeksītis uz Gatavs, izkrītošs picker)
- Apakšuzdevuma galvenē pirms aizvēršanas: **izveidots DATUMS** (`dd.mm.yy`)
- Satura joslas labajā malā zvaniņš: paziņojumu panelis, nerakstīto skaits, atzīmēt visus kā lasītus

## v0.0.2

**Sarakstu skati, uzdevumu koks un apakšuzdevumu tabula**

- Sānjoslā **Saraksts** atver visu uzdevumu kopsavilkumu; projekts atver 3 logus; uzdevums atver apakšuzdevumu tabulu
- Koks rāda tikai sarakstus un ligzdotus uzdevumus (`fas fa-list-check`); apakšuzdevumi paliek tabulā un modālī
- Apakšuzdevumam ir statuss, cilvēki, datumi, komentāri, faili un vēsture

## v0.0.1

**Sānjosla, saraksti un komandas sākums**

- ClickUp stila sānjosla: Sākums, Saraksts, Komanda, Uzstādījumi, lietotāja izvēlne
- Sarakstu koks: saraksts → uzdevums → apakšuzdevums; hover pluszīme pievieno nākamo līmeni
- Saraksta izskats: ikona vai iniciāļi, fona krāsa; hover laikā ikonas vietā sakļaušanas bultiņa
- Komandas biedriem labajā pusē pēdējā tiešsaistes zīme (`min` / `h` / `d` / `m`, zaļš aplītis līdz 1 min)
- Komandas todo board ar piešķiršanu, filtru un drag-and-drop
- Lokālais webserveris uz porta **3120**
