# Changelog

## Unreleased

- (none)

## v0.1.0

**GitHub drošības pārbaudes**

- Trīs GitHub Actions pie katra push/PR: secret scan (gitleaks), atkarību audits (`npm run audit:check`) un security smoke (typecheck, lint, build, galvenes, `eval()`)
- `package.json` overrides pin `postcss` / `sharp` un citas tranzitīvās HIGH atkarības; HTTPS vidē HSTS
- `security-check.md` sākotnējais audits (**6.5 / 10**)

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
