# Routine Gmail extension

Chrome paplašinājums: Gmailā rāda sistēmas logo, atver modāli un pievieno e-pastu + pielikumus pie Routine apakšuzdevuma.

Nav jāievada Routine URL vai OAuth Client ID. Spraudnis lasa sistēmas auth cookie tajā pašā Chrome profilā (`https://tasqin.com` vai `http://localhost:3120`) un turpaļ glabā savu sesiju `chrome.storage.local` (refresh caur `/api/extension/refresh`), tāpēc TASQIN cilnei nav jāpaliek atvērtai. Gmail savieno caur sistēmas Google OAuth.

## Priekšnosacījumi

1. Production: [https://tasqin.com](https://tasqin.com) vai [https://www.tasqin.com](https://www.tasqin.com) (`NEXT_PUBLIC_SITE_URL` = kanoniskais hosts). Local: `npm run dev`
2. Administrācija → Moduļi: **Gmail spraudnis** ieslēgts
3. Administrācija → Integrācijas: Google OAuth konfigurēts; Google Cloud: **Gmail API** + **Drive API**
4. Google Cloud OAuth klientā Redirect URI: `/auth/google-oauth/callback` (login un Gmail spraudnis) un `/auth/google-drive/callback` — arī `http://localhost:3120` varianti. Rādās Integrācijās.
5. Komandai pieslēgts **Google Drive** (bez tā popup rāda sarkanu brīdinājumu un Gmailā pogas nav)
6. `module_file_upload` ieslēgts

## Ielāde Chrome

1. `chrome://extensions` → Developer mode → **Load unpacked** → `extensions/gmail`
2. Pēc koda izmaiņām: **Reload** uz paplašinājuma kartītes
3. Popup: ienāc ar Google vai e-pastu/paroli (custom login). Ja Gmail nav savienots, nospied **Savienot Gmail** - tas saglabā savienojumu arī Routine

## Lietošana

1. Atver e-pastu Gmailā (pilns skats)
2. Nospied **Routine** pogu e-pasta skatā
3. Izvēlies **saraksts** → (mape) → **uzdevums** → **apakšuzdevums**
4. Apakšā atzīmē pielikumus → **Pievienot**

Popup ir balta kartīte: avatars, vārds un uzvārds, e-pasts, **Iziet** tikai kā ikona augšējā labajā stūrī, komandu izvēle, Drive brīdinājums zem select, Gmail statuss kā ikona ar tooltip. Teksti ar `{SYSTEM_NAME}` ņem sistēmas nosaukumu no `GET /api/extension/config` / sesijas. Sesija paliek spraudnī (`chrome.storage.local`) arī tad, ja TASQIN cilne nav atvērta. Gmailā TASQIN pogas rādās tikai tad, ja izvēlētajai komandai ir pieslēgts Google Drive.

## API (Routine)

- `GET /api/extension/config` (publisks)
- `GET /api/extension/session`
- `POST /api/extension/login`
- `POST /api/extension/refresh`
- `GET /api/extension/gmail-access`
- `GET /api/extension/browse`
- `GET /api/extension/subtasks?q=`
- `POST /api/extension/attach-email`
- `GET /auth/gmail-plugin/start` → Google OAuth (`/auth/google-oauth/callback`) → `/auth/gmail-plugin/done`
