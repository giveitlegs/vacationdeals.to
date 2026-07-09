#!/bin/sh
# Shell-agnostic cron entrypoint: loads .env, then execs the given command
# from apps/scraper.
#
# Why: crontab lines previously inlined `source .env` (a bash-ism). When the
# crontab lost its SHELL=/bin/bash line in April 2026, dash rejected `source`
# and every scraper job died silently for 2.5 months. This wrapper runs under
# any POSIX sh, so cron jobs no longer depend on the crontab's SHELL setting.
#
# Usage (crontab):
#   0 */6 * * * /var/www/vacationdeals/scripts/run-with-env.sh /usr/bin/npx tsx src/scrape-wave.ts --wave=1 >> /var/log/vacdeals-wave1.log 2>&1
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
. "$ROOT/.env"
set +a
cd "$ROOT/apps/scraper" || exit 1
exec "$@"
