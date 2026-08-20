# Changelog

## Unreleased

- (none)

## v0.2.0

- Drošība: īsta e-pasta pieteikšanās/reģistrācija/paroles atjaunošana, rate limit, šifrēti integrāciju tokeni (`enc:v1:`), Drive/OneDrive saraksta pieeja, kalendāra ICS bez aprakstiem un ar token hash (`073`/`074`)
- MFA: parastajam lietotājam opcija profilā; adminam TOTP pie `/admin` kā modālis (bez novirzes uz profilu katru sesiju)
- Auth: **Atcerēties mani** pēc noklusējuma izslēgts; Microsoft login tikai ar verificētu e-pastu; uzaicinājuma `token` nav SELECT authenticated
- Gmail Chrome extension: Gmail API pielikumiem (OAuth), failu limīts līdz 25 MB ar Drive lieliem failiem; `txt`/`html` (`072`)
- Gmail Chrome extension MVP (`extensions/gmail`): logo Gmailā, e-pasta pievienošana apakšuzdevumam; API `/api/extension/*`
- Ātrāka pirmā ielāde: darbvieta bez failu `content`, aktivitātēm un unused notifs/todos; saturs un vēsture pēc vajadzības; PostgREST lapošana (`073`)
- Mazāk pārzīmēšanas: `ListsContext` dati/darbības, šabloni tikai `/templates`, last-online bez visiem biedriem, kopīgs `now` taimeris
- Mazāks bundle un rakstīšana: Font Awesome bez `all.min.css`, i18n viena valoda no servera, `dynamic()` smagajiem skatiem, RPC pārkārtošanai un assignees
- Google Drive: noklusējumā faili glabājas Drive (`store_on_server` = false); opcija saglabāt saturu arī Routine serverī; `google_drive_file_id` uz `list_files` / `task_files`; priekšskatījums caur `/api/google-drive/content` (`070`)
- Augšupielādes overlay ar progresu (koks, Faili logs, apakšuzdevuma pielikumi); Drive upload caur XHR ar procentiem
- Atļautie failu tipi: arī attēli (png, jpg, jpeg, gif, webp) — seed `071` + noklusējums `file-types.ts`
- Apakšuzdevumu pielikumu `...` izvēlnē **Lejupielādēt**; Drive-first lejupielāde; DB ieraksts tiek sagaidīts pirms fails ir pieejams
- Faila pārsaukšana sinhronizē nosaukumu arī Google Drive (`POST /api/google-drive/rename`); paplašinājumu pārsaukt nevar (fiksēts sufikss formā)
- Klikšķis uz failu: bildes/PDF → priekšskatījuma modālis; Excel u.c. → lejupielāde (`FileViewerProvider`); uzreiz overlay ar spinneri (Atver / Lejupielādē), kamēr saturs ielādējas
- PDF priekšskatījums: CSP `frame-src` atļauj `blob:`; `data:` PDF pārvērš uz blob iframe
- Apakšuzdevumiem ar pielikumiem `fa-paperclip` aiz nosaukuma: tabula un mapes **Saraksts** skatā
- Mapes **Faili** logs rāda arī apakšuzdevumu pielikumus no mapes apakškoka; klikšķis caur `FileViewerProvider`
- Sānjoslas **Failu vieta**: skaita arī Cloud-only failus; tooltipā Serveris / Cloud (bez nulles rindām)
- Auth: sesijas sīkdatnes `httpOnly: false` (klienta Supabase lasa cookie); neautentificēts lietotājs no app ceļiem uz `/login`

## v0.1.18

- Ceļa joslā un uzdevuma PATH pirms katra posma rāda tipa ikonu: saraksts, mape, uzdevums, apakšuzdevums vai fails
- Projekta skatā Uzdevumi bloka arhīva poga vienlaikus pārslēdz arhīvu visām Saraksts bloka kartītēm; katru kartīti joprojām var mainīt atsevišķi
- `module_google_drive`: komandas `...` → Google Drive Integrācija; pieslēgts konts sūta jaunos failus uz Drive
- `module_onedrive`: komandas `...` → OneDrive Integrācija; pieslēgts konts sūta jaunos failus uz OneDrive
- Admin **Integrācijas** (`/admin/integrations`): Google/Microsoft OAuth (login/signup caur pašu OAuth, ne Supabase Google provider), Resend, Umami, Sentry; sakļaujamas kartiņas; **Aktīva** slēdzis vienmēr redzams (pirms konfigurācijas bloķēts)
- Admin moduļi: `module_google_drive` / `module_onedrive` slēdzis bloķēts, kamēr attiecīgā OAuth integrācija nav konfigurēta un ieslēgta (tooltip)
- Kalendāra integrācija: lietotāja dropup, `module_calendar` + Apple/Google, `.ics` plūsma piesaistītajiem uzdevumiem ar termiņu
- Labojums: apakšuzdevuma modālī vairs nedublējas Check List (`TaskChecklists` / `TaskAttachments` unikāli React `key`; mapes skatā viens `SubtaskDetailModal` caur `onOpenSubtask`)

## v0.1.17

**Admin apakšizvēlne**

- `/admin` josla: trīs kategorijas (Cilvēki, Katalogs, Sistēma); hover vai pieskāriens atver dropdown ar sadaļām
- Aktīvā kategorija ir izcelta; aktuālā lapa dropdownā ar ķeksīti

**Frontend moduļi**

- Admin `/admin/modules` — globāli feature flagi (`site_frontend_modules`); pieeja tikai no admin apakšizvēlnes
- `module_private_list`: ieslēgts — sarakstu var padarīt privātu; izslēgts — slēdzis pazūd un visi privātie saraksti kļūst publiski
- `module_file_upload`: ieslēgts — augšupielāde kokā, apakšuzdevumos un mapes Failu logā; izslēgts — nav upload, esošie faili kokā/modālī slēpti, Failu logs un Failu vieta pazūd
- `module_checklist`: ieslēgts — Check List lietojams; izslēgts — sadaļa vienmēr sakļauta un nepabeigti punkti nebloķē slēgto statusu
- `module_automations`: ieslēgts — saraksta `...` rāda Automatizācijas; izslēgts — opcijas nav un noteikumi neizpildās
- `module_templates`: ieslēgts — komandas `...` rāda Šablonus; izslēgts — šablonus nevar veidot, un Mapes izveide → šablons automatizācijā nerādās pat tad, ja automatizācijas ir ieslēgtas
- Migrācijas `058`–`061`

**Maksas plāni**

- Admin `/admin/payment-plans` (apakšizvēlne pie `is_admin`) — globāls katalogs: ieslēgums, izmēģinājums jaunām komandām, Early Bird slotu limīts, opcionālas mēneša/ceturkšņa/gada un Early Bird cenas (EUR), frontend moduļi katrā plānā
- Migrācija `062` (`site_payment_plans`, `site_payment_plan_modules`, `teams` plāna kolonnas); ieslēgums vēl neierobežo lietotnes moduļus un komandai plānu piešķir UI vēl nav

**Tiešsaiste**

- `last_online_at` heartbeat iet caur RPC `touch_current_member_online` (`063`), lai atjauninājums nestrādātu pret `anon` GRANT ierobežojumu

**Apakšuzdevuma modālis**

- Tukšs Check List un Pielikumi sākumā sakļauti (izvēršami); ar saturu atveras
- Vēsture nesastiepj logu: augstums pēc kreisās kolonnas, iekšējais scroll ar fade un bultiņām
- Vēsturē vairs nav komentāra lauka — tikai izmaiņu žurnāls

**Šabloni, automatizācija un paziņojumi**

- Šablona redaktors: uzdevumam/apakšuzdevumam assignee un checklist; custom apakšuzdevumu statusi (`TemplateTaskStatusesModal`); violeta atzīme uzdevumiem ar custom statusiem; izmaiņas saglabājas automātiski (bez Saglabāt pogas); migrācijas `056`–`057`
- Šablona/automatizācijas pielietošana: piesaistītie saņem `assigned` paziņojumu jau uzdevuma izveides brīdī (`notificationsForInitialAssignees`)
- Labojums: `work_task_statuses` un statusu layout saglabāšana gaida vecāka uzdevuma DB insert (`pendingTaskInsertsRef`)
- Apakšuzdevuma PATH zem nosaukuma (tabula, modālis) un pārvietošanas izvēlnē, ja mērķis ir citā mapē vai sarakstā (`TaskLocationPath`)

## v0.1.16

**Lint tīrīšana**

- ESLint bez erroriem un warningiem: hook dependencies, neizmantoti importi, `team-store` memoization, attēlu lint izņēmumi dinamiskiem avotiem

## v0.1.15

**Komandas uzaicinājumi, pamešana un dashboard bez komandas**

- Biedru uzaicināšana ar e-pastu (jaunam lietotājam) un in-app `team_invite` paziņojumu (reģistrētam); apstiprinājums/noraidījums paziņojumos vai `/invite/{token}`
- Reģistrēts lietotājs netiek automātiski pievienots komandai — jāapstiprina uzaicinājums; noraidījumā uzaicinātājs saņem `team_invite_rejected`
- Pending biedri redzami `/team`, bet ne sānjoslas kokā; resend, kopēt uzaicinājuma linku, noņemt biedru
- Biedrs var pats pamest komandu (`/team`, personīgie uzstādījumi); komandas īpašnieks nevar
- Bez aktīvas komandas dashboard rāda skaidru tukšo stāvokli (jauna komanda + paziņojumu hints), ne bloķējošu modāli
- Labojums: uzaicinājuma noraidīšana vairs nesalūst DB kaskādē; migrācijas `044`–`049`
- Lietotāja izvēlnē **Personīgā informācija** — modālis vārda un uzvārda rediģēšanai; sinhronizē `public.users`, `team_members` un auth metadata; RPC `set_current_user_name` (`050`)
- Apakšuzdevuma **vēsture** fiksē visas izmaiņas: statuss, datumi (no → uz), piesaistīto pievienošana/noņemšana, nosaukums, apraksts, kontrolsaraksts, pārvietošana, paslēpšana/atjaunošana, faili, kārtība; centralizēta logošana `lists-store` + `build-task-activity-events.ts`; UI `format-task-activity-text.ts`; migrācijas `051_task_activities_extended` un `052_task_activities_reordered`
- Komandu lomu **pieejas** tagad kontrolē arī UI: sānjoslas sadaļas (nav) + darbības (listas/uzdevumi, šabloni, failu augšupielāde, komandas dzēšana u.c.); efektīvā list access kombinē listu līmeni un team permissions (`resolveEffectiveListAccess`); toggle automātiski saglabā (bez Saglabāt pogas); divkolonnu izkārtojums; migrācija `051_team_permissions_extended`
- **Paziņojumi** iesaistītajiem par uzdevumu/apakšuzdevumu notikumiem: piešķiršana, noņemšana, komentārs, fails, statuss, citi labojumi, jauns apakšuzdevums; `task-notifications.ts` + preference filtrs `appendNotifications`; zvaniņā tikai personīgie (`recipient_id`); migrācijas `053`–`054`
- **Paziņojumu uzstādījumi** — grupēts modālis (Uzdevumi / Atgādinājumi / Komanda) ar ikonām katram veidam; toggle automātiski saglabā bez Saglabāt pogas; pieejams no lietotāja izvēlnes un zvaniņa paneļa settings pogas
- Paziņojumu **dzēšana** — hover uz lasītu paziņojumu rāda × pogu; automātiska tīrīšana vecākiem par 30 dienām (`deleteOldNotifications`)

## v0.1.14

**Komandas šabloni, automatizācijas un veidnes redaktors**

- Komandas `...` → **Šabloni**: nosaukti šabloni ar mapēm, uzdevumu sarakstiem un apakšuzdevumiem; mapes `+` ievieto šablonu kā apakšstruktūru (mapes → apakšmapes)
- Saraksta `...` → **Automatizācijas**: konfigurējami noteikumi; pirmais — jaunai mapei automātiski pielietot izvēlētu šablonu (mapes, uzdevumi, apakšuzdevumi mapes iekšienē)
- Šablona redaktors: secīga ievade bez uzdevumu/apakšuzdevumu + pogām, automātiskas tukšās rindas (arī pēc saglabāšanas), fokuss paliek laukā pēc pirmā burta; mapei sava **+ Mape** / apakšmapes poga
- Drag-and-drop šablonā: uzdevumu un mapju secība, ielikšana mapē un iznešana; apakšuzdevumus var pārnest uz citu uzdevumu
- Apakšuzdevuma pielikumos atļautie failu tipi kā teksts zem drop zonas; sānjoslas faila augšupielādē info ikona
- Apakšuzdevuma sākuma/termiņa datumi: relatīvais hints (`Šodien`, atlicis, kavē) atkarībā no statusa grupas — sākums `not_started` / `active`, termiņš `not_started` / `active` / `closed`
- Mapes automatizācija + šablons: uzdevumu DB saglabāšana rindā pēc vecāka (novērš `parent_id` FK kļūdu); `formatSupabaseError` lasāmākiem konsoles logiem
- Tiešsaistes `last_online_at` atjauninājums pēc `team_id` + `user_id` (bez tukšās konsoles kļūdas)

## v0.1.13

**Uzdevumu un mapju arhīvs**

- Saraksta uzdevumu vai mapi (ar visiem apakšuzdevumiem) var arhivēt no koka `...` vai ar atvērtās mapes ikonu aiz nosaukuma; arhīvā aizvērtā mape izņem no arhīva
- Saraksta lapā labajā malā arhīva poga atver to pašu kopsavilkuma skatu tikai ar arhivētajām lietām
- Sānjoslas kokā uzdevumu var nomest pašā apakšā arī tad, ja pēdējā ir mape (biezā līnija zem mapes)

**Sistēmas logotips, Sākums un ielogota landing**

- Admin `/admin/settings`: logotips un favicon; bez faila avatārs no sistēmas iniciāļiem ar izvēlētu fonu (kā komandām) un liela burta favicon `<head>`
- Pārlūka cilnes nosaukums: `lapas nosaukums | sistēmas nosaukums` (sistēmas vārds no admin uzstādījumiem); katrai lietotnes un mārketinga lapai `generateMetadata`, dinamiskajām maršrutiem nosaukums no DB
- Sākumā Mani uzdevumi un atdalītājs rādās tikai tad, ja ir piesaistīti uzdevumi; atbildīgo izvēlne nav nogriezta; saglabāšana vairs nedod `task_assignees` dublikāta kļūdu
- Ielogotam `/` uzreiz ved uz `/dashboard` (proxy un landing lapa)

## v0.1.12

**Atcerēties mani, failu tipi un datumu attēlojums**

- Google ienākšana paliek pārlūkā, ja ieslēgts Atcerēties mani (noklusējums); bez ķeksīša sesija beidzas, aizverot pārlūku. Sesija 30 dienas; ielogotam `/`, `/login` un `/signup` ved uz dashboard
- Kokā un apakšuzdevumos var augšupielādēt tikai admin konfigurētos tipus (sākumā pdf, dwg, Word, Excel); `/admin/file-types` pievieno, labo un dzēš paplašinājumu, ikonu un krāsu
- Sānjoslā virs Uzstādījumiem rādās failu vietas summa (koks + apakšuzdevumu pielikumi)
- Admin `/admin/settings` un personīgie uzstādījumi: nedēļas sākums, datuma formāts/atdalītājs, 12/24 h; lietotāja izvēle pārspēj sistēmas noklusējumu

## v0.1.11

**Arhīva rindas, grupēta tabula un drop līnija**

- Arhīvā pabeigtajiem un dzēstajiem apakšuzdevumiem viegls rindas fons statusa krāsā, lai tie uzreiz atšķiras
- Viena tabula ar statusu galvenēm; vilkšana starp grupām maina statusu; zila drop līnija
- Arhīva poga aktīva ir sarkanīga; mapes Sarakstā aplītis hover pabeidz uzdevumu

## v0.1.10

**Sadalīto uzdevumu secība pēc statusa**

- Sākumā un saraksta kopsavilkumā uzdevumi un apakšuzdevumi ir pretējā secībā pret statusu picker: vispirms tālākie aktīvie (piem. IZM), tad IN PROGRESS, tad TO DO
- Tā pati kārtība Saraksta logā; slēgtie paliek arhīvā; vilktā secība paliek logā Uzdevumi

## v0.1.9

**Arhīva statusu krāsas**

- Pabeigtiem arhivētiem apakšuzdevumiem statusa bloks ir blāvā statusa krāsā
- Dzēstajiem statuss ir sarkanīgs ar blāvu fonu; blakus poga arī sarkanīgā tonī

## v0.1.8

**Apakšuzdevumu Check List**

- Apakšuzdevuma modalī pirms pielikumiem var pievienot čeklistus ar nosaukumu; nākamais punkts parādās, tiklīdz iepriekšējā ir teksts
- Slēgto statusu grupu un Pabeigt var izvēlēties tikai pie 100%; aktīvos statusus var mainīt arī ar nepabeigtiem punktiem
- Sarakstā zem statusa pogas zaļa progresa josla

## v0.1.7

**Sākuma skats, saraksta statusi un koka vilkšana**

- Sākums rāda Mani uzdevumi un darbu pa sarakstiem; ielāde ar spinneri, ne tukšu saturu
- Saraksta `...` → Statusi: sistēmas katalogs plus komandas statusi tikai šim sarakstam
- Sānjoslas kokā mapes, uzdevumus un failus var ievilkt mapē vai iznest ārā; drop līnija paliek virs vilktā bloka

## v0.1.6

**Mapes sarakstā, apakšuzdevuma modālis uz vietas un relatīvie laiki**

- Saraksta logs rāda mapes ar iekšējiem uzdevumiem un apakšuzdevumiem; arhīva poga parāda pabeigtos, progresa josla paliek
- Klikšķis uz apakšuzdevuma sarakstā atver modāli; statuss saglabājas uzreiz, Saglabāt tikai pārējiem laukiem
- Vēsturē kataloga statusu nosaukumi; laiki kā pēdējā tiešsaiste; zem statusa un datumiem atlikušās vai kavētās dienas; hover rāda `>` / pārvietot / dzēst

## v0.1.5

**Apakšuzdevumu arhīvs, pieeju slēdzis un pārvietošana**

- Saraksta forma: sākumā tikai noklusējuma pieeja; slēdzis **Pielāgot katrai lomai** rāda lomu līmeņus un paslēpj globālo izvēli
- Apakšuzdevumu arhīvs pie Pievienot: aktīvie paliek redzami kopā ar pabeigtajiem un paslēptajiem; pabeigšana fade-out vietā; dzēsto atjauno ar klikšķi
- Pārvietot ikona atver uzdevumu pogu modāli; miskaste uzreiz aiz Check; `work_tasks.deleted_at`

## v0.1.4

**Komandas lomas, sarakstu pieejas un statusu katalogs**

- Sarakstam noklusējuma pieeja un līmenis katrai lomai: pilna labošana, labot, komentēt, tikai skatīt; privātam arī biedriem un „nav pieejas”
- Komandas lomas ar sānjoslas un darbību pieejām; sistēmas noklusējuma lomas `/admin/roles`; lomas pieejas no saraksta ikonas
- Uzdevumu statusu katalogs `/admin/statuses`; privāti saraksti ar lomu un biedru redzamību

## v0.1.3

**Valodas pārslēdzējs, sistēmas noklusējums un admin sesijas pieeja**

- Ceļa joslā aiz paziņojumiem valodas kods, ja aktīvas valodas > 1; ielogotam `users.language_code`, viesim cookie, citādi sistēmas noklusējums
- Admin valodas, tulkojumi un uzstādījumi caur ielogotā sesiju (bez service role)
- Security smoke atpazīst `getCurrentUser` valodas servera darbībā, kas paliek pieejama arī viesiem

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
