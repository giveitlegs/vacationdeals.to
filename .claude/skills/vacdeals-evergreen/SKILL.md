---
name: vacdeals-evergreen
description: >
  Run the recurring VacationDeals.to health + growth operations: full 3-layer
  backup (incl. historic rate data), recrawl all sources + maintenance,
  rate-accuracy spot-check swarm (site prices vs live partner-lander rates +
  scraper health), deep-research swarm for new vacpack sites, and a 50-post
  bespoke blog batch. Use when the user says "run evergreen ops", "do the
  routine", "/vacdeals-evergreen", or asks to back up + recrawl + rate-check +
  research + publish blogs together.
---

# VacationDeals.to — Evergreen Operations Runbook

Run these phases IN ORDER. Obey the guardrails, then report a consolidated summary.

## GUARDRAILS (learned the hard way)
- **Agent waves ≤ 5 at a time.** A 13-agent batch was killed mid-run by a session
  limit (2026-07-30). Dispatch writer/research/rate swarms in waves of ≤5, insert +
  commit each wave before the next. Agents must **write once and stop** (no
  self-expansion loops — those burned the tokens that tripped the limit).
- **Guarded deploys:** always `pnpm build` on the VPS BEFORE `pm2 restart`. If the
  build fails, do NOT restart — the site stays up on the old build. Deploy recipe:
  `cd /var/www/vacationdeals && git pull -q origin main && set -a && source .env && set +a && pnpm build && pm2 restart vacationdeals-web --update-env`.
- **Cost:** DataForSEO creds have been 401 (refresh at app.dataforseo.com); treat
  volume data as optional. The only metered spend is the AI-reviews cron (guarded
  to 2 runs/day) + any DataForSEO. Do not exceed a $25 all-in run without asking.
- Programmatically re-validate agent output (word floors, FAQ counts, unique slugs)
  — a writer once shipped 10 under-length posts while claiming it validated them.

## PHASE 1 — Full 3-layer backup (crown-jewel = deal_price_history)
```
ssh root@72.60.126.82 "/usr/local/bin/vacdeals-db-backup.sh >> /var/log/vacdeals-dbbackup.log 2>&1 && ls -t /root/db-backups/*.pgdump | head -1"
# then scp the newest dump to backups/db/ (local Dropbox mirror — it drifts stale)
# then: bash scripts/backup-to-private-github.sh   (private GitHub repo)
```
Verify `deal_price_history` row count + span before/after (it should only grow).

## PHASE 2 — Recrawl all sources + maintenance
```
ssh root@72.60.126.82 "nohup /var/www/vacationdeals/scripts/run-with-env.sh /usr/bin/npx tsx src/scrape-wave.ts --wave=all > /var/log/vacdeals-fullscrape-$(date +%Y%m%d).log 2>&1 &"
# wait for all 5 waves green, then run maintenance (paths are relative to apps/scraper):
#   run-with-env.sh npx tsx src/check-deal-health.ts       (zombie sweep + dead-URL)
#   run-with-env.sh npx tsx ../../scripts/nightly-data-quality.ts --fix
#   run-with-env.sh npx tsx src/verify-prices.ts --limit=50
```

## PHASE 3 — Rate spot-check swarm (≤5 agents)
Dump active deals to a scratch PSV, then dispatch ≤5 agents grouped by source.
Each samples deals across its sources, WebFetches the partner lander (curl fallback
for JS/403), and returns a table: `deal_id|scraper_key|db_price|live_price|verdict|notes`
(MATCH/MISMATCH/GONE/FETCH_BLOCKED). Fix confirmed data errors in the DB (stale
prices, credit-as-price, expired/repurposed URLs, placeholder original_price=50000).
Target ≥20 rates checked. Confirms scrapers work AND published price == brand-site price.

## PHASE 4 — Deep-research swarm: new vacpack sites (≤2 agents)
Dispatch research agents to find NEW timeshare-preview sites we don't scrape (exclude
the ~48 current sources — see CLAUDE.md/scraper list). Each returns a ranked list:
`url | example packages+prices | presentation required? | Cheerio vs browser | bot-blocking`.
Relay the ranked candidates; building crawlers is a follow-up (don't auto-build).

## PHASE 5 — 50 bespoke Google-Discover blog posts (≤5 agents, last wave)
Follow the STYLE-SPEC in `research/blog-batches/weird-batch-2026-07/STYLE-SPEC.md`
(BLUF box, 8-10 AEO FAQs, humanization in BODY ONLY, casual first-person, real
vacpack data). NEW angles each time — check existing slugs first
(`SELECT slug FROM blog_posts`) to avoid dupes. Discover-oriented = curiosity-gap
titles, timely/story hooks, strong first image; lightly SEO'd (one keyword woven in).
Author as JSON to a new `research/blog-batches/<batch>/` dir, validate (unique slugs,
≥900 on-page words incl. FAQs, ≥6 FAQs), commit, insert via
`scripts/insert-blog-batch-json.ts <dir>`, rebuild (guarded) so the sitemap picks
them up, verify a sample renders 200 + FAQPage schema.

## FINISH
- Update `docs/NEXT-ENHANCEMENTS.md` (dated entry) + relevant memory.
- Report a consolidated summary: backup status, recrawl/maintenance results, rate
  spot-check verdicts + fixes, new-site candidates, blogs published + live count.
