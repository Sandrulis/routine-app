# Routine Gmail extension

Chrome paplašinājums: Gmailā rāda sistēmas logo, atver modāli un pievieno e-pastu + pielikumus pie Routine apakšuzdevuma.

Nav jāievada Routine URL vai OAuth Client ID. Spraudnis sauc [https://www.tasqin.com](https://www.tasqin.com) (ne apex `tasqin.com` — Vercel 308 bez CORS bloķētu Chrome). Lokāli `http://localhost:3120`. Sesija ir spraudņa paša (`chrome.storage.local` + `refresh_token`, atjaunošana caur `/api/extension/refresh` un alarm ~45 min) — TASQIN cilnei nav jābūt atvērtai un ielogošanās turas līdz ~30 dienām, arī ja vietnē iziet. Vietnes cookie izmanto tikai pirmajai Google ielogošanās bootstrap; pēc **Iziet** spraudnī vietnes sesija paliek. Gmail savieno caur sistēmas Google OAuth.

`GET /api/extension/config` ir publisks. Serveris atbildē atspoguļo derīgu `chrome-extension://` Origin (`Access-Control-Allow-Origin`). Privātie API prasa Bearer. `CHROME_EXTENSION_IDS` nav vajadzīgs. `/api/extension/*` neiet caur www/apex 301 (tas bez CORS galvenēm bloķētu Chrome).

## Priekšnosacījumi

1. Production: [https://www.tasqin.com](https://www.tasqin.com) (kanoniskais hosts `NEXT_PUBLIC_SITE_URL`). Local: `npm run dev`
2. Administrācija → Moduļi: **Gmail spraudnis** ieslēgts
3. Administrācija → Integrācijas: Google OAuth konfigurēts; Google Cloud: **Gmail API** + **Drive API**
4. Google Cloud OAuth klientā Redirect URI: `/auth/google-oauth/callback` (login un Gmail spraudnis) un `/auth/google-drive/callback` — arī `http://localhost:3120` varianti. Rādās Integrācijās.
5. Komandai pieslēgts **Google Drive** (bez tā popup rāda sarkanu brīdinājumu un Gmailā pogas nav)
6. `module_file_upload` ieslēgts

## Ielāde Chrome

1. `chrome://extensions` → Developer mode → **Load unpacked** → `extensions/gmail`
2. Pēc koda izmaiņām: **Reload** uz paplašinājuma kartītes, tad **F5** Gmail cilnē (citādi vecais content script met `Extension context invalidated`)
3. Popup: ienāc ar Google vai e-pastu/paroli (custom login). **Turpināt ar Google** atver Google konta izvēli (`/auth/gmail-plugin/login`), ne vispārīgo `/login` lapu (tā ielogotam lietotājam aizmet uz dashboard un spraudnis paliek ārā). Pēc apstiprinājuma `plugin-auth.js` uz `/auth/gmail-plugin/done` nodod sesiju spraudnim (arī `base64-` cookie); vari aizvērt cilni un atvērt spraudni - sesija ir `chrome.storage.local`. Login API un OAuth preferē production (`www` / `tasqin.com`), ne `localhost` (arī ja lokālais serveris skrien). Ja Gmail nav savienots, nospied **Savienot Gmail** - tas saglabā savienojumu arī Routine

## Lietošana

1. Atver e-pastu Gmailā (pilns skats)
2. Nospied **Routine** pogu e-pasta skatā
3. Izvēlies **saraksts** → (mape) → **uzdevums** → **apakšuzdevums**
4. Zem saraksta atzīmē pielikumus (checkbox) → **Pievienot**

Ja pielikumi neredzami vai rāda OAuth kļūdu: Chrome → `chrome://extensions` → TASQIN - Gmail → **Reload** (versija `0.4.13`), tad Gmail cilnē **F5**. Spraudņa popup → **Atjaunot Gmail savienojumu** (tas nav tas pats, kas «Turpināt ar Google»). Modālī zem saraksta jābūt sadaļai **Pielikumi**.

Apakšuzdevumu saraksts (3. solis) ir tajā pašā statusa secībā kā sānjosla un uzdevuma UI: aktīvie pirms “nav sākts”, slēgtie netiek rādīti.

Ja pēc spraudņa Reload Gmailā rādās kļūda par pārstartētu spraudni — pārlādē Gmail lapu (F5). Tas nav Google Drive problēma.

Popup ir balta kartīte: avatars, vārds un uzvārds, e-pasts, **Iziet** tikai kā ikona augšējā labajā stūrī, komandu izvēle, Drive brīdinājums zem select, Gmail statuss kā ikona ar tooltip. Teksti ar `{SYSTEM_NAME}` ņem sistēmas nosaukumu no `GET /api/extension/config` / sesijas. Sesija paliek spraudnī (`chrome.storage.local`) arī tad, ja TASQIN cilne nav atvērta. Gmailā TASQIN pogas rādās tikai tad, ja izvēlētajai komandai ir pieslēgts Google Drive.

## API (Routine)

- `GET /api/extension/config` (publisks)
- `GET /api/extension/session`
- `POST /api/extension/login`
- `POST /api/extension/refresh`
- `GET /api/extension/gmail-access`
- `GET /api/extension/browse`
- `GET /api/extension/subtasks?q=`
- `POST /api/extension/gmail-bridge-ticket
- `POST /api/extension/attach-email``
- `GET /auth/gmail-plugin/login` → Google OAuth (`/auth/google-oauth/callback`) → `/auth/gmail-plugin/done?logged_in=1`
- `GET /auth/gmail-plugin/start` → Google OAuth (`/auth/google-oauth/callback`) → `/auth/gmail-plugin/done`
