# Routine Gmail extension

Chrome paplašinājums: Gmailā rāda sistēmas logo, atver modāli un pievieno e-pastu + pielikumus pie Routine apakšuzdevuma.

## Kas ir “DOM” vs Gmail API

| | DOM (vecais MVP) | Gmail API (tagad) |
|---|---|---|
| Kā lasa e-pastu | No Gmail HTML lapas | Oficiāls Google API |
| Pielikumi | Nestabili download linki | Pilni faili no API |
| Risks | Gmail UI maiņa salauž | Stabils, prasa OAuth |

Bez API tu zaudē uzticamus pielikumus (bieži “klusi” neielādējas).

## Priekšnosacījumi

1. `npm run dev` (vai production Routine)
2. Ielogojies Routine tajā pašā Chrome profilā
3. `module_file_upload` ieslēgts
4. Lieliem failiem (> ~1.5 MB saturs DB): komandas **Google Drive** pieslēgts (līdz 25 MB)
5. Google Cloud: ieslēgts **Gmail API** + OAuth Client ID

## Gmail OAuth Client ID

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs → ieslēdz **Gmail API**
2. Credentials → Create OAuth client → tips **Web application**
3. Authorized redirect URIs: nokopē no paplašinājuma opcijām (`Redirect URI`)
4. Ielīmē Client ID paplašinājuma opcijās → **Saglabāt** → **Savienot Gmail**

## Ielāde Chrome

1. `chrome://extensions` → Developer mode → **Load unpacked** → `extensions/gmail`
2. Pēc koda izmaiņām: **Reload** uz paplašinājuma kartītes
3. Opcijās: Routine URL + Gmail Client ID → Savienot Gmail

## Lietošana

1. Atver e-pastu Gmailā (pilns skats)
2. Nospied **Routine** pogu e-pasta skatā (josla virs ziņas / blakus temata) vai peldošo pogu
3. Izvēlies **saraksts** → (mape) → **uzdevums** → **apakšuzdevums**
   - Breadcrumb ir klikšķināms; rāda tikai neatvērtus (neslēgtus) ierakstus
4. Apakšā atzīmē pielikumus (pēc noklusējuma visi) → **Pievienot**
5. Pēc pievienošanas rādās tikai rezultāta ziņa

## API (Routine)

- `GET /api/extension/session`
- `GET /api/extension/browse`
- `GET /api/extension/subtasks?q=`
- `POST /api/extension/attach-email`
