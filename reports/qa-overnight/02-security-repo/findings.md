# Repo Security Audit — 2026-05-05

## Summary
- Critical: 0
- High: 0
- Medium: 2
- Low/Info: 4

## Critical findings
(none)

## High findings
(none)

## Medium findings

### M1. Secrets transmitted as URL query parameter
- `apps/web/src/app/api/seo-health/route.ts:6-7` — `PAYLOAD_SECRET` accepted via `?key=...` query string.
- `apps/web/src/app/api/data-report/route.ts:20` — same pattern (`?token=` compared to `process.env.PAYLOAD_SECRET`).
- `apps/web/src/app/api/ping/route.ts:7` — same pattern.
- `apps/web/src/app/api/admin/roulette/route.ts:15` — same pattern.
- Why it's bad: query-string secrets land in nginx access logs, browser history, and third-party `Referer` headers. Move to `Authorization: Bearer …` or a custom header.

### M2. Operator-defined HTML injection via NEXT_PUBLIC env var
- `apps/web/src/app/layout.tsx:85-86` — env-var-driven raw HTML injected into the head via the React unsafe innerHTML prop.
- Why it's bad: `NEXT_PUBLIC_*` is bundled into the client; if user-influenced content is ever piped through this var, you get site-wide XSS. Operator-only today, so impact is low.

## Low / informational

### L1. `.playwright-mcp/` browser-console logs are tracked (110 files)
- `git ls-files .playwright-mcp/` returns 110 logs (e.g. `console-2026-04-08T03-35-57-447Z.log`).
- Sampled file contains third-party JS error noise from facebook.com / fbcdn.net. Long base64 strings are Facebook's encoded video metadata, not JWTs with app secrets.
- Recommend: add `.playwright-mcp/` to `.gitignore` and `git rm -r --cached .playwright-mcp`.

### L2. `AKIA[0-9A-Z]{16}` literal in tracked file
- `scripts/backup-to-private-github.sh` contains the literal regex `'AKIA[0-9A-Z]{16}'` as part of its secret-scrubbing pattern list. False positive — it's a detection pattern, not an actual key.

### L3. Hardcoded GA tag fallback `G-VP66NVW631`
- `apps/web/src/app/layout.tsx:7` defaults `NEXT_PUBLIC_GA_ID` to `G-VP66NVW631`. GA measurement IDs are public by design.

### L4. ClickRank UUID hardcoded in layout
- `apps/web/src/app/layout.tsx:79` contains a client-side script with a UUID. Public client-side identifier; not secret.

## Verified clean
- **gitignore coverage**: PASS — `.env`, `.env*.local`, `vpsssl.txt`, `*.credentials`, `*.creds`, `admin-creds.txt`, `backups/`, `provision_*.py`, `deploy_and_ssl.py`, `*.png`, `reports/sf-crawls/*/` all listed.
- **env-var server-only use**: PASS — all `process.env.*` reads in server-side files; zero matches in `apps/web/src/components/`. `NEXT_PUBLIC_*` exposed to client (intentionally): `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CUSTOM_HEAD_SCRIPT`.
- **no committed secrets in working tree**: PASS — `git ls-files | grep -E '\.(env|credentials|creds)$|vpsssl'` empty; no real `sk-…`, `sk_live_`, `xoxb-`, `AKIA…`, `ghp_`, JWT, `-----BEGIN PRIVATE KEY-----`, or `postgres://user:pass@host` literals.
- **no committed secrets in history**: PASS — `git rev-list --all --objects | grep -iE '\.env$|vpsssl|admin-creds'` empty; `git log -S` for `sk_live_`, `AKIA`, `PAYLOAD_SECRET=`, `RESEND_API_KEY=`, `BING_API_KEY=` returned no real-value commits.

## Recommended next actions
1. Move query-param auth on `/api/seo-health`, `/api/data-report`, `/api/ping`, `/api/admin/roulette` to an `Authorization` header.
2. Untrack `.playwright-mcp/`.
3. Document or scope-restrict `NEXT_PUBLIC_CUSTOM_HEAD_SCRIPT`.
