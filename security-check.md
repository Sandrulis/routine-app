# Security Audit - routine-app

**Sākotnējā atzīme:** 5 / 10  
**Atzīme pēc labojumiem:** **6.5 / 10**  
**Pēdējā pilnā pārbaude:** 2026-08-17 (**v0.1.0**)

Aplikācija izmanto Google OAuth un Postgres ar komandas RLS. E-pasta login/signup un `(app)` maršrutu servera aizsardzība vēl nav. Pēdējā pilnā atzīme ir v0.1.0; v0.1.2 aizvēra H2 (dati ārā no `localStorage`).

---

## Ātrā pārbaude v0.1.0 (2026-08-17)

| Kontrole | Rezultāts |
|----------|-----------|
| Drošības galvenes | ✅ CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; HTTPS vidē arī HSTS |
| XSS / `eval()` | ✅ Nav `eval()`, `new Function()` vai `dangerouslySetInnerHTML` `app/` |
| Hardcoded secrets | ✅ `.gitignore` bloķē `.env`; smoke grep pret `sk_live_`, service-role JWT, hardcoded password/secret |
| npm audit | ✅ `npm run audit:check` — nav nepieņemtu HIGH/CRITICAL; pin `postcss`, `sharp`, `uuid`, `js-yaml`, `nanoid`, `brace-expansion` |
| Secret scan | ✅ GitHub Actions gitleaks + `.gitleaks.toml` (i18n key allowlist) |
| Security smoke | ✅ typecheck, lint, production build, headers, eval, secrets |
| Sīkdatņu piekrišana | ✅ `CookieConsentProvider`; nepieciešamās vs preferences / analytics / marketing |
| Auth / RLS | ⚠️ Google OAuth ir īsts; e-pasta login/signup joprojām frontend; `(app)` maršruti nav servera middleware aizsardzībā |
| Dati | ✅ Komandas darba dati Postgres + RLS (`005_work_data.sql`); localStorage tikai UI preferencei |

### Labojumi šajā ciklā

| # | Severity | Apraksts | Statuss |
|---|----------|----------|---------|
| M1 | 🟠 MED | Trūka GitHub CI (secret scan / audit / smoke) | ✅ LABOTS |
| M2 | 🟠 MED | HIGH `postcss` un `sharp` advisories | ✅ LABOTS (`package.json` overrides) |
| L1 | 🟡 LOW | Lint error `list-summary.tsx` (React Compiler memo) bloķētu smoke | ✅ LABOTS |
| L2 | 🟡 LOW | HSTS nebija iestatīts HTTPS vidē | ✅ LABOTS |

### Atlikušās piezīmes / ieteikumi

| # | Severity | Apraksts |
|---|----------|----------|
| H1 | 🔴 HIGH | E-pasta autentifikācija un aizsargāti `(app)` maršruti (Google sesija jau ir) |
| H2 | ✅ | Komandas darba dati Postgres + RLS (`005`, v0.1.2) |
| M3 | 🟠 MED | Server actions / API: `requireAuth` uz katru eksportu (smoke jau gatavs, kad parādīsies `actions.ts`) |
| L3 | ℹ️ DEPLOY | Production: `NEXT_PUBLIC_SITE_URL` ar `https://`, lai ieslēgtos HSTS |
| L4 | ℹ️ AUTH | Rate limit login/signup, kad būs backend |

**Atzīme:** **6.5 / 10** (pēdējā pilnā pārbaude v0.1.0). v0.1.2: darba dati Postgres + RLS (H2). Atzīmi necelt, kamēr e-pasta auth un `(app)` maršruti nav aizsargāti.

---

## CI / Security checks

Trīs GitHub Actions darbplūsmas palaižas pie katra push un pull request:

| Workflow | File | Ko pārbauda |
|----------|------|-------------|
| **Secret scan** | `.github/workflows/secret-scan.yml` | gitleaks — API keys, tokens, paroles git vēsturē |
| **Security audit** | `.github/workflows/security-audit.yml` | `npm run audit:check` — HIGH un CRITICAL atkarības |
| **Security smoke** | `.github/workflows/security-smoke.yml` | TypeScript, lint, production build, auth guard uz `actions.ts` (kad būs), nav `eval()`, drošības galvenes |

> `GITLEAKS_LICENSE` repo secret ir vajadzīgs tikai **organization** kontiem. Šis repo pieder individuālam kontam (`Sandrulis`), tāpēc scan strādā arī privātam repo bez licences.

Lokāli:

```bash
gitleaks detect --redact -v --exit-code=2 --log-opts=-1
npm run audit:check
npm run typecheck
npm run lint
npm run build
```

`npm run audit:check` (`scripts/audit-check.mjs`) krīt pie katra HIGH/CRITICAL advisory, izņemot `ACCEPTED_ADVISORIES` (katram jābūt iemeslam un noņemšanas nosacījumam).
