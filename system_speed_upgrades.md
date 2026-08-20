# Routine - sistēmas ātrdarbības uzlabojumi

Audits: **2026-08-20**.  
Statuss: **ieviests 2026-08-20** (`package.json` 0.2.0) - žurnāls apakšā.

Kā lasīt:

- `[ ]` vēl jādara
- `[x]` izdarīts
- ietekme ir **sajūta lietotājam** (ielāde, klikšķis, ritināšana), ne mikrooptimizācija

---

## Kas šobrīd palēnina sistēmu

Lietotne pēc ielogošanās ir **klienta SPA ar vienu milzīgu atmiņas veikalu**. `(app)/layout.tsx` ietin visu `ListsProvider` + `TeamProvider` + `TemplatesProvider`. Pirmajā atvēršanā klients gaida ķēdi:

1. `proxy.ts` → `getUser()` katrā pieprasījumā + `Cache-Control: no-store`
2. Root layout → tulkojumi, valodas, site settings, display preferences
3. App layout → `ensureCurrentUserProfile` (RPC), tad statusi / failu tipi / moduļi
4. Klients → `useAuthSession().getUser()` vēlreiz
5. `TeamProvider` → `importLocalWorkIfNeeded`, tad `fetchUserTeams`
6. `ListsProvider` gaida komandu, tad `fetchTeamWorkspace` (visa komanda)
7. Paralēli: šabloni, admin pārbaude, paziņojumi

`fetchTeamWorkspace` (`app/lib/db/work-data.ts`) vienā piegājienā velk **visus** sarakstus, uzdevumus, aktivitātes, failu metadatus **un failu saturu (data URL / base64)**, paziņojumus un todos. `ListsProvider` paziņojumus un todos **nemaz neizmanto** - tie tiek lejupielādēti un izmesti.

Pēc tam jebkura uzdevuma/aktivitātes izmaiņa pārraksta visu `ListsContext` vērtību. `useLists()` ir ~40 komponentēs, ieskaitot `AppNav` koku. Viens statusa klikšķis pārzīmē sānjoslu, kopsavilkumus un atvērto skatu.

Šis modelis strādā mazai komandai. Ar simtiem uzdevumu, gadiem aktivitāšu un serverī glabātiem failiem ielāde un UI kļūst lēni.

---

## HIGH - darīt vispirms

Lielākā ietekme uz pirmo ielādi un ikdienas klikšķiem.

### H1. Nesākt ar visu komandas darbvietu `[x]`

**Kur:** `fetchTeamWorkspace`, `ListsProvider` (`app/lib/lists-store.tsx`)

**Kas ir:** Viena funkcija lejupielādē visus sarakstus, uzdevumus, aktivitātes, failus, saturu, statusus, automatizācijas, paziņojumus, todos. UI paliek `LoadingState`, kamēr viss ir klāt.

**Ko darīt:**

1. Pirmajā pieprasījumā tikai tas, kas vajadzīgs čaulai: saraksti, uzdevumi (bez gariem aprakstiem, ja iespējams), statusi, assignees, pieejas.
2. Aktivitātes, failu saturu, todos, paziņojumus **neiekļaut** šajā pieprasījumā.
3. Atvērt UI, kad čaula ir gatava; pārējo pievilkt pēc vajadzības.

**Gaidāmais:** pirmā ielāde no “gaida visu DB” uz “redz sarakstus, kad saraksti atnākuši”.

### H2. Failu saturu nevilkt kopā ar metadatiem `[x]`

**Kur:** `task_files.content`, `list_files.content` select `fetchTeamWorkspace`; `hydrateTaskFileContents` / `hydrateListFiles`; `storeTaskFileContent` (`readAsDataURL`)

**Kas ir:** Faili līdz **1.5 MB** glabājas Postgres `text` kā data URL. Katrā ielādē visus saturus velk klientā un tur RAM. Base64 palielina izmēru ~33%.

**Ko darīt:**

1. Sākuma select: `id, task_id, name, mime_type, size, google_drive_file_id, created_at` - **bez** `content`.
2. Saturs tikai atverot failu (`fetchTaskFileContent` / `fetchListFileContent` jau pastāv).
3. Vidējā termiņā: saturu no Postgres pārcelt uz Storage (Supabase Storage / Drive), DB paliek tikai atsauce.

**Gaidāmais:** payload no megabaitiem uz kilobaitiem, ja komandai ir serverī glabāti faili.

### H3. Aktivitātes lādēt tikai atvērtam uzdevumam `[x]`

**Kur:** `task_activities` select pēc `team_id` bez limita; `ListsProvider` `activities` masīvs visai komandai

**Kas ir:** Visa vēsture visiem uzdevumiem atmiņā. `taskActivities(taskId)` katru reizi filtrē visu masīvu. Katra jauna aktivitāte pārraksta context → visa lietotne.

**Ko darīt:**

1. Sākumā aktivitātes nelādēt (vai tikai pēdējās N komentāru kopsavilkumam, ja vajag).
2. Atverot uzdevumu / apakšuzdevumu: `select ... eq('task_id', id) order created_at desc limit 50` + “rādīt vecākos”.
3. Indekss: `task_activities (team_id)`, labāk `(task_id, created_at desc)`.

**Gaidāmais:** mazāks JSON, ātrāks context, ātrāka uzdevuma lapa.

### H4. Sadalīt `ListsContext`, lai sānjosla nepārzīmējas pie katra klikšķa `[x]`

**Kur:** `lists-store.tsx` viens `value` ar lists + tasks + activities + files + visām darbībām

**Kas ir:** `useLists()` atgriež visu. `AppNav`, `PageBreadcrumb`, dashboard, list summary, task page - visi re-render, ja mainās jebkurš uzdevums. `taskActivities` / `taskFiles` / `listTasks` ir jaunas funkcijas katrā value atjaunošanā.

**Ko darīt:**

1. Atsevišķi context vai selektori: `lists`, `tasks`, `files`, `actions`.
2. `AppNav` abonē lists + koka uzdevumu kopsavilkumu, nevis `allTaskFiles` + visas aktivitātes.
3. `listTasks(listId)` / `subtasks(parentId)` kā `useMemo` Map pēc `listId` / `parentId`, nevis `.filter` katrā renderī.
4. `React.memo` koka rindām.

**Gaidāmais:** statusa maiņa paliek lokāla, sānjosla neraustās.

### H5. Saīsināt ielādes ķēdi (auth → teams → workspace) `[x]`

**Kur:** `proxy.ts`, `(app)/layout.tsx`, `use-auth-session.ts`, `team-store.tsx`, `lists-store.tsx`

**Kas ir:** `getUser()` notiek proxy, layout (`ensureCurrentUserProfile`), un klientā. Workspace sākas tikai pēc `teamReady`. Šabloni, admin, paziņojumi gaida to pašu.

**Ko darīt:**

1. Sesiju / `is_admin` / aktīvo `teamId` padot no servera layout (cookies + `getUser` vienreiz).
2. `fetchUserTeams` un `fetchTeamWorkspace` (čaula) palaist paralēli, kad teamId jau zināms no cookie (`currentTeamIdStorageKey`).
3. `ensure_user_profile` nerakstīt katrā layout, ja profils jau ir (piem. tikai ja nav `users` rindas).
4. Proxy: `getSession()` / matcher šaurāks, lai statiskie asseti un marketinga lapas neiet caur auth round-trip.

**Gaidāmais:** mazāk secīgu tīkla hopu pirms pirmā satura.

### H6. PostgREST 1000 rindu slēptais limits `[x]`

**Kur:** visos `fetchTeamWorkspace` / `fetchVisibleNotifications` select **nav** `.range()` / lapošanas

**Kas ir:** Supabase/PostgREST noklusējums parasti ir **1000 rindas**. Komandai ar >1000 uzdevumiem vai aktivitātēm dati apraujas bez kļūdas. Tas ir gan ātrums, gan kļūda.

**Ko darīt:**

1. Nelādēt “visu uz visiem laikiem”.
2. Kur vajag pilnu sarakstu: lapot vai RPC, kas atgriež tikai vajadzīgās kolonnas.
3. Pārbaudīt `max-rows` projektā; nepārlikt uz 50 000 kā “risinājumu”.

**Gaidāmais:** pareizi dati + kontrolēts payload.

### H7. N+1 rakstīšana pie pārkārtošanas `[x]`

**Kur:**

- `updateTaskSortOrders` - viens `update` katram id
- `reorderLists` - `updateListRow` katrā id
- `updateListStatusSortOrders` / `updateWorkTaskStatusSortOrders` / `reorderTeamRoleRows` - **secīgi** `for` ciklā
- `reassignTasksOffStatus` - viens update katram uzdevumam
- `persistListFilePatches` - secīgi

**Kas ir:** 40 uzdevumu drag-and-drop = 40 HTTP. Statusu pārkārtošana gaida katru atbildi pēc kārtas.

**Ko darīt:** viena RPC, piem. `reorder_work_tasks(p_ids text[])`, vai `upsert` ar visām rindām vienā pieprasījumā.

**Gaidāmais:** vilkšana paliek tūlītēja arī lielā sarakstā; mazāk slodzes uz API.

### H8. Last-online polling nepārraksta visu komandas stāvokli `[x]`

**Kur:** `TeamProvider` `setInterval(..., 20_000)` + `setMembersByTeam` katru reizi; `MemberLastOnline` / `RelativeTime` / paziņojumi `setNow` ik 15 s

**Kas ir:** Ik 20 s mainās `members` → `TeamContext` → visi `useTeam()`. Sānjoslas biedri, assignee sejas, dashboard. Online zīme nav jādzēš caur visiem biedriem.

**Ko darīt:**

1. `touchMemberOnline` bez lokāla `setMembersByTeam` (pietiek ar DB).
2. Citu “pēdējoreiz redzēts” atjaunot tikai komandas lapā, retāk (60–120 s) vai Presence.
3. Relatīvo laiku: viens kopīgs `now` context, ne katrs komponents ar savu interval.

**Gaidāmais:** UI neraustās ik 15–20 s.

---

## MIDDLE - nākamais vilnis

Redzams, kad HIGH ir izdarīts vai komanda jau ir vidēja.

### M1. Font Awesome pilnais `all.min.css` `[x]`

**Kur:** `app/layout.tsx` `import "@fortawesome/fontawesome-free/css/all.min.css"`

**Kas ir:** Visa ikonu komplekta CSS + fonti visās lapās, arī marketingā. Lietotne lieto `fas` / `far` klases, bet ne visu katalogu.

**Ko darīt:** subset (tikai izmantotās ikonas) vai SVG komponents. Nevilkt `all.min.css` uz `/login` un landing, ja tur vajag 5 ikonas.

**Gaidāmais:** mazāks pirmais CSS/font payload.

### M2. i18n - klientā visām trim valodām `[x]`

**Kur:** `app/lib/i18n/messages.ts` (~3200 rindas lv+en) importē visu `messages-ru.ts`; `TranslationsProvider` bundlē `messages`

**Kas ir:** Lietotājs ar `lv` saņem arī en un ru vārdnīcu JS bundlī.

**Ko darīt:** serveris iedod tikai aktīvās valodas tabulu (vai vienu valodu + overlay). `import()` pārējām valodām tikai pie pārslēgšanas.

**Gaidāmais:** mazāks JS bundle, īpaši pirmajā ielādē.

### M3. Šablonus nelādēt visās app lapās `[x]`

**Kur:** `AppProviders` vienmēr `TemplatesProvider` → `fetchTeamTemplates`

**Kas ir:** Šabloni vajadzīgi `/templates`, “Pievienot šablonu” un automatizācijām. Dashboard / settings tos nevelk.

**Ko darīt:** lādēt, kad atver šablonu lapu vai create-flow; vai lazy provider tikai tajos maršrutos.

### M4. Paziņojumu vaicājums filtrē JS, ne DB `[x]`

**Kur:** `fetchVisibleNotifications`; `useNotifications` katru reizi arī `deleteOldNotifications(30)`

**Kas ir:** Tiek vilkti komandas paziņojumi, tad filtrēts `recipientId === self`. `deleteOld` ir DELETE pie katras izvēlnes atvēršanas/refresh.

**Ko darīt:**

1. Query: `recipient_id = self OR target_user_id = me`, `limit 50`.
2. Veco dzēšanu - cron / reti, ne UI mount.
3. Indekss `(recipient_id, created_at desc)`.

### M5. Trūkstošie DB indeksi `[x]`

**Kur:** `supabase/migrations/005_work_data.sql` un vēlākās

Pašlaik `task_activities`, `task_files`, `list_files` ir indeksi pēc `task_id` / `list_id`, bet **nav** `team_id`, lai gan `fetchTeamWorkspace` filtrē pēc `team_id`.

**Ko darīt (idempotenta migrācija):**

```sql
create index if not exists task_activities_team_id_idx on public.task_activities (team_id);
create index if not exists task_files_team_id_idx on public.task_files (team_id);
create index if not exists list_files_team_id_idx on public.list_files (team_id);
create index if not exists task_activities_task_created_idx
  on public.task_activities (task_id, created_at desc);
create index if not exists app_notifications_recipient_created_idx
  on public.app_notifications (recipient_id, created_at desc);
```

`work_list_viewers` PK jau ir `(list_id, user_id)` - `list_id` lookup ir OK.

### M6. Nav virtualizācijas garos sarakstos `[x]`

**Kur:** `AppNav` koks, `SubtaskTable`, `ListSummary` / `GroupedSubtaskTables`, `ListWindowsBoard`, dashboard “Mani uzdevumi”

**Kas ir:** Visi DOM mezgli. 200 apakšuzdevumu tabula + koks = smags layout.

**Ko darīt:** virtualizēt logus ar scroll (saraksta logs, sānjoslas koks, ja ir daudz bērnu). Sākt ar `SubtaskTable` un nav koku.

### M7. Nav `dynamic()` smagajiem skatiem `[x]`

**Kur:** projekts - 0 `next/dynamic` / `React.lazy`

**Kas ir:** `list-windows-board.tsx` (~1200 rindas) + `@dnd-kit` iet iekšā `task-detail-page`. `AppNav` importē gandrīz visus modāļus (statusi, automatizācijas, lomas, invite, create-flow).

**Ko darīt:** `dynamic(() => import(...), { ssr: false })` dēļiem, failu skatītājam, Drive/OneDrive lapām, admin formām. Modāļus importēt tikai kad atver.

### M8. Dubultie vaicājumi `[x]`

| Vieta | Kas |
|---|---|
| `AdminProvider` | `current_user_is_admin` RPC **un** `users.is_admin` |
| `inviteMember` | `refreshTeams()` tad vēlreiz `fetchUserTeams()` |
| `fetchTeamWorkspace` | `notifications` + `todos` select, bet ListsProvider tos **neņem** |
| `useAuthSession` + proxy + layout | `getUser()` trīs reizes vienā navigācijā |

**Ko darīt:** viens avots katram faktam; workspace select tikai izmantotajām tabulām.

### M9. `replaceTaskAssignees` ir 4–6 round-trip `[x]`

**Kur:** `replaceTaskAssigneesNow` - delete assignees, delete roles, select members, select roles, insert, insert

**Ko darīt:** viena RPC `set_task_assignees(task_id, ids[])`.

### M10. Admin/settings velk Lists + Templates store `[x]`

**Kur:** `(app)/layout.tsx` `AppProviders` visiem `/admin`, `/settings`, `/team/onedrive`

**Ko darīt:** workspace provider tikai `dashboard` / `lists` / `templates` maršrutiem, vai nest layout `(app)/(work)/layout.tsx`.

**Izdarīts:** šabloni tiek lādēti tikai `/templates` vai `ensureLoaded()` (create-flow / automatizācijas). `ListsProvider` paliek visā `(app)` layout, jo `AppNav` koks vajag sarakstus arī admin/settings.

---

## LOW - kad paliek rezervē

Mazāka ietekme vai kosmētika pēc HIGH/MIDDLE.

### L1. `React.memo` koka un tabulas rindām `[x]`

`NavTreeSortableItem`, `SortableTaskItem`, `AssigneeFaces`, `TaskSummarySection`. Bez H4 selektoriem memo palīdz maz.

### L2. `createClient()` katrā `db()` izsaukumā `[x]`

`work-data.ts` `db()` = jauns `createBrowserClient`. `@supabase/ssr` parasti singletonizē pēc URL, bet labāk viens moduļa klients.

### L3. `importLocalWorkIfNeeded` katrā sesijas startā `[x]`

`localStorage` pārbaude pirms komandām. Ja importa karogs jau ir, izlaist ātri (pārbaudīt, ka early-return ir lēts).

### L4. Relatīvā laika 15 s taimeri `[x]`

`member-last-online.tsx`, `relative-time.tsx`, `notifications-menu.tsx` - katrs `setInterval(15000)`. Apvienot.

### L5. Geist `latin-ext` visām lapām `[x]`

`app/layout.tsx` `subsets: ["latin", "latin-ext"]`. LV vajag ext; ja fonts ir liels, `preload` tikai izmantotajiem glyph.

### L6. `Cache-Control: no-store` visam, kas iet caur proxy `[x]`

`update-session.ts` `applyNoStoreHeaders` visām atbildēm. Marketinga HTML / tulkojumu overlay varētu `private, max-age=0, must-revalidate` vai īsāku CDN kešu publiskajām lapām. Sesijas lapas paliek no-store.

### L7. `next/image` netiek lietots `[x]`

Avatāri un logotipi ir `<img>` / data URL. Kad faili ir URL (Storage/Drive), `next/image` + izmēri samazina atkārtotas ielādes. Tagad, kamēr saturs ir data URL, ieguvums mazs.

**Izdarīts:** `UserAvatar` ar `loading="lazy"` un `decoding="async"`. `next/image` nav visiem hostiem (Google/Microsoft / data URL).

### L8. Apraksta lauki sākuma sarakstā `[x]`

`work_tasks.description`, `work_lists.description` nāk visiem uzdevumiem. Kokam pietiek `title, status, parent_id, sort_order, kind`. Aprakstu - uzdevuma lapā.

**Izdarīts (ar izņēmumu):** apraksts paliek sākuma select, jo saglabāšana bez lauka varētu notīrīt DB. Galvenais payload bija failu `content`.

### L9. Prefetch / hover uz saraksta saitēm `[x]`

`Link` default prefetch palīdz; koka dziļajām saitēm var `prefetch={false}` un prefetch tikai viewportā, lai neražotu simtiem RSC pieprasījumu.

### L10. RLS `is_team_member` / `can_view_work_list` katrā rindā `[x]`

Policy ar `exists (select ... team_members)` pie 11 paralēliem select var būt dārgi. Pēc H1 izmērīt `explain analyze`. Ja lēni - `(select auth.uid())` pattern un šaurāki indeksi, nevis policy pārrakstīšana “lai būtu ātrāk” bez mērījuma.

**Izdarīts (ar izņēmumu):** RLS nav pārrakstīts bez `explain analyze`. Pievienoti `team_id` / `(task_id, created_at desc)` indeksi (M5).

---

## Ieteicamā secība

| Solis | Ieraksti | Kāpēc |
|---|---|---|
| 1 | H2, H3, M8 (nevilkt unused notifs/todos) | Mazākais kods, lielākais payload griezums |
| 2 | H1, H5, H6 | Pirmā ielāde un pareizi limiti |
| 3 | H4, H8 | UI paliek dzīvs pēc ielādes |
| 4 | H7, M5, M9 | Rakstīšana un DB |
| 5 | M1, M2, M3, M7, M10 | Bundle un maršruti |
| 6 | M4, M6, LOW | Paziņojumi, virtualizācija, sīkumi |

Neoptimizēt visus LOW, kamēr H1–H5 nav izmērīti (Network + React Profiler).

---

## Kā pārbaudīt pēc izmaiņām

1. Tīkls: `fetchTeamWorkspace` (vai aizstājējs) izmērs pirms/pēc; nedrīkst iet `content` kolonna sākumā.
2. Time-to-lists: laiks no `/dashboard` navigācijas līdz sarakstu kokam bez `LoadingState`.
3. Profiler: statusa maiņa apakšuzdevumam - `AppNav` nedrīkst renderēt visu koku.
4. Drag 30+ uzdevumiem: Network - 1–2 pieprasījumi, ne 30+.
5. Komanda ar >1000 aktivitātēm: uzdevuma lapa rāda pēdējās, nevis “pazudušas” rindas.
6. `npm run typecheck` un `npm run build` pirms release.

---

## Izpildes žurnāls

| Datums | Kas izdarīts | Piezīmes |
|---|---|---|
| 2026-08-20 | Sākotnējais audits, šis fails | Darba saraksts |
| 2026-08-20 | HIGH + MIDDLE + LOW ieviešana. v0.2.0 | Migrācija `073_workspace_speed.sql`. Workspace bez `content`/aktivitātēm/todos. Dokumentēts CHANGELOG / README / DEVELOPER. |

Kad punkts ir izdarīts: atzīmē `[x]`, ieraksti žurnālā versiju (`package.json`) un īsu rezultātu (piem. “workspace JSON 2.4 MB → 180 KB”).
