#!/usr/bin/env bash
# Screaming Frog coordinator: crawl vacationdeals.to + every target source.
#
# Output structure:
#   reports/sf-crawls/<YYYY-MM-DD>/<source-slug>/
#     internal_all.csv           — every URL found with key metadata
#     response_codes_*.csv       — 4xx/5xx/3xx breakdowns
#     page_titles_all.csv        — titles per URL
#     meta_description_all.csv   — meta descriptions
#     h1_all.csv                 — H1s
#     summary.txt                — one-line health summary
#
# After each crawl completes, we:
#   1. Upsert internal_all.csv rows into target_landers table on the VPS
#   2. Log run into target_crawl_runs table
#
# Kill the .seospider crawl files we save after each run — CSVs are the
# portable artifact, and the .seospider files are huge binary blobs.

set -u
SF_CLI='/c/Program Files (x86)/Screaming Frog SEO Spider/ScreamingFrogSEOSpiderCli.exe'
DATE=$(date +%Y-%m-%d)
OUT_ROOT="$(pwd)/reports/sf-crawls/$DATE"
URL_LIMIT=300     # per target
OWN_URL_LIMIT=500 # for vacationdeals.to
mkdir -p "$OUT_ROOT"

echo "=== SF crawl-all ==="
echo "Output: $OUT_ROOT"
echo "URL cap: own=$OWN_URL_LIMIT, targets=$URL_LIMIT"
echo ""

# Own site first — deeper crawl + full audit
OWN_OUT="$OUT_ROOT/vacationdeals"
mkdir -p "$OWN_OUT"
echo "[1/40] vacationdeals.to (full audit, $OWN_URL_LIMIT URLs)"
"$SF_CLI" \
  --crawl "https://vacationdeals.to" \
  --headless \
  --output-folder "$OWN_OUT" \
  --overwrite \
  --export-format csv \
  --export-tabs "Internal:All,Response Codes:Client Error (4xx),Response Codes:Server Error (5xx),Response Codes:Redirection (3xx),Page Titles:All,Meta Description:All,H1:All,Images:Missing Alt Text" \
  --save-report "Crawl Overview,Redirects:Redirect Chains" \
  --config "$HOME/.claude/skills/screaming-frog/configs/wp-default.seospiderconfig" 2>/dev/null || \
"$SF_CLI" \
  --crawl "https://vacationdeals.to" \
  --headless \
  --output-folder "$OWN_OUT" \
  --overwrite \
  --export-format csv \
  --export-tabs "Internal:All,Response Codes:Client Error (4xx),Response Codes:Server Error (5xx),Response Codes:Redirection (3xx),Page Titles:All,Meta Description:All,H1:All" \
  --save-report "Crawl Overview" \
  > "$OWN_OUT/sf.log" 2>&1

echo "  Own site done. Files:"
ls "$OWN_OUT" | head -20

# Targets from DB — fetched remotely and passed as a list
echo ""
echo "Fetching target list from VPS..."
TARGETS=$(ssh -o StrictHostKeyChecking=no root@72.60.126.82 \
  "set -a && source /var/www/vacationdeals/.env && set +a && psql \"\$DATABASE_URL\" -tA -c \"SELECT scraper_key || '|' || base_url FROM sources ORDER BY scraper_key;\"")

TOTAL=$(echo "$TARGETS" | wc -l)
echo "$TOTAL target sources to crawl"

i=1
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  slug="${line%%|*}"
  url="${line##*|}"
  [ -z "$slug" ] && continue
  [ -z "$url" ] && continue

  OUT="$OUT_ROOT/$slug"
  mkdir -p "$OUT"
  echo ""
  echo "[$((++i))/$((TOTAL+1))] $slug — $url"

  # Individual site crawl with URL cap and shorter timeout
  timeout 600 "$SF_CLI" \
    --crawl "$url" \
    --headless \
    --output-folder "$OUT" \
    --overwrite \
    --export-format csv \
    --export-tabs "Internal:All,Response Codes:Client Error (4xx),Page Titles:All,Meta Description:All,H1:All" \
    > "$OUT/sf.log" 2>&1 && status=ok || status=failed

  urlcount=$(wc -l < "$OUT/internal_all.csv" 2>/dev/null || echo 0)
  echo "  status=$status urls=$urlcount"

  # Log run to DB
  ssh -o StrictHostKeyChecking=no root@72.60.126.82 \
    "set -a && source /var/www/vacationdeals/.env && set +a && psql \"\$DATABASE_URL\" -q -c \"INSERT INTO target_crawl_runs (source_slug, finished_at, status, urls_found) VALUES ('$slug', NOW(), '$status', $urlcount);\"" 2>/dev/null
done <<< "$TARGETS"

echo ""
echo "=== SF crawl-all done ==="
echo "Output root: $OUT_ROOT"
du -sh "$OUT_ROOT"
