#!/usr/bin/env bash
# Crawl every target source from the sources DB table with Screaming Frog.
# Runs sequentially (SF is single-instance), 300-URL cap per site, 10-min timeout.
#
# Usage:   bash scripts/sf-crawl-targets.sh
#          bash scripts/sf-crawl-targets.sh --only=westgate,bookvip
#          bash scripts/sf-crawl-targets.sh --skip=vacationdeals
#
# Output:  reports/sf-crawls/<YYYY-MM-DD>/<source-slug>/
#          After all runs: npx tsx scripts/sf-import-landers.ts to upsert into DB.

set -u
SF_CLI='/c/Program Files (x86)/Screaming Frog SEO Spider/ScreamingFrogSEOSpiderCli.exe'
DATE=$(date +%Y-%m-%d)
OUT_ROOT="$(pwd)/reports/sf-crawls/$DATE"
URL_LIMIT=300
TIMEOUT_SECS=600
mkdir -p "$OUT_ROOT"

# Parse flags
ONLY=""
SKIP=""
for arg in "$@"; do
  case $arg in
    --only=*) ONLY="${arg#--only=}" ;;
    --skip=*) SKIP="${arg#--skip=}" ;;
  esac
done

# Pull sources from VPS
echo "Fetching sources from VPS..."
TARGETS=$(ssh -o StrictHostKeyChecking=no root@72.60.126.82 \
  "set -a && source /var/www/vacationdeals/.env && set +a && psql \"\$DATABASE_URL\" -tA -c \"SELECT scraper_key || '|' || base_url FROM sources ORDER BY scraper_key;\"")

TOTAL=$(echo "$TARGETS" | grep -c '|')
echo "$TOTAL sources loaded"
echo "Output: $OUT_ROOT"
echo "URL cap: $URL_LIMIT, timeout: ${TIMEOUT_SECS}s per site"
echo ""

IDX=0
OK=0
FAIL=0
SKIPPED=0

while IFS= read -r line; do
  [ -z "$line" ] && continue
  slug="${line%%|*}"
  url="${line##*|}"
  [ -z "$slug" ] || [ -z "$url" ] && continue
  IDX=$((IDX+1))

  # Filter
  if [ -n "$ONLY" ] && ! echo ",$ONLY," | grep -q ",$slug,"; then
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  if [ -n "$SKIP" ] && echo ",$SKIP," | grep -q ",$slug,"; then
    SKIPPED=$((SKIPPED+1))
    continue
  fi

  OUT="$OUT_ROOT/$slug"
  mkdir -p "$OUT"
  echo "[$IDX/$TOTAL] $slug — $url"

  START=$(date +%s)
  if timeout $TIMEOUT_SECS "$SF_CLI" \
    --crawl "$url" \
    --headless \
    --output-folder "$OUT" \
    --overwrite \
    --export-format csv \
    --export-tabs "Internal:All,Response Codes:Client Error (4xx),Page Titles:All,Meta Description:All,H1:All" \
    > "$OUT/sf.log" 2>&1; then
    status="ok"
    OK=$((OK+1))
  else
    status="failed"
    FAIL=$((FAIL+1))
  fi
  ELAPSED=$(($(date +%s) - START))

  URLCOUNT=0
  if [ -f "$OUT/internal_all.csv" ]; then
    URLCOUNT=$(( $(wc -l < "$OUT/internal_all.csv") - 1 ))
  fi
  echo "  status=$status urls=$URLCOUNT elapsed=${ELAPSED}s"

  # Log to DB (don't let this block the next crawl if it fails)
  ssh -n -o StrictHostKeyChecking=no root@72.60.126.82 \
    "set -a && source /var/www/vacationdeals/.env && set +a && psql \"\$DATABASE_URL\" -q -c \"INSERT INTO target_crawl_runs (source_slug, finished_at, status, urls_found) VALUES ('$slug', NOW(), '$status', $URLCOUNT);\"" 2>/dev/null || true
done <<< "$TARGETS"

echo ""
echo "=== Summary ==="
echo "Total: $TOTAL  OK: $OK  Failed: $FAIL  Skipped: $SKIPPED"
echo "Output: $OUT_ROOT"
du -sh "$OUT_ROOT" 2>/dev/null
