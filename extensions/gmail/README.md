# Routine Gmail extension

Chrome paplašinājums: Gmailā rāda sistēmas logo, atver modāli un pievieno e-pastu + pielikumus pie Routine apakšuzdevuma.

Nav jāievada Routine URL vai OAuth Client ID. Spraudnis pats atrod sesiju tajā pašā Chrome profilā uz `https://tasqin.com` vai `http://localhost:3120` un Gmail savieno caur sistēmas Google OAuth.

## Priekšnosacījumi

1. Production: [https://tasqin.com](https://tasqin.com) vai [https://www.tasqin.com](https://www.tasqin.com) (`NEXT_PUBLIC_SITE_URL` = kanoniskais hosts). Local: `npm run dev`
2. Administrācija → Moduļi: **Gmail spraudnis** ieslēgts
3. Administrācija → Integrācijas: Google OAuth konfigurēts; Google Cloud: **Gmail API** + **Drive API**
4. Google Cloud OAuth klientā trešais Redirect URI: `/auth/gmail-plugin/callback` (rādās Integrācijās)
5. Komandai pieslēgts **Google Drive** (bez tā spraudnis rāda sarkanu brīdinājumu un nestrādā)
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

Popup rāda avataru, vārdu un uzvārdu, e-pastu, un ļauj pārslēgt komandas.

## API (Routine)

- `GET /api/extension/config` (publisks)
- `GET /api/extension/session`
- `POST /api/extension/login`
- `POST /api/extension/refresh`
- `GET /api/extension/gmail-access`
- `GET /api/extension/browse`
- `GET /api/extension/subtasks?q=`
- `POST /api/extension/attach-email`
- `GET /auth/gmail-plugin/start` → Google OAuth → `/auth/gmail-plugin/done`
