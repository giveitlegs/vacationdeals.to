#!/usr/bin/env bash
# Import Screaming Frog internal_all.csv files into target_landers on the VPS.
#
# Strategy:
#   1. For each source dir, normalize SF CSV into a lean 8-column CSV
#      (source_slug, url, status_code, title, h1, meta_desc, word_count, ctype).
#   2. scp the normalized CSV to /tmp/ on VPS.
#   3. On VPS: COPY into temp staging table, then upsert into target_landers.

set -u
DATE="${1:-$(date +%Y-%m-%d)}"
ROOT="$(pwd)/reports/sf-crawls/$DATE"

if [ ! -d "$ROOT" ]; then
  echo "No crawl dir at $ROOT"
  exit 1
fi

echo "Importing from $ROOT"
TOTAL=0

for dir in "$ROOT"/*/; do
  slug=$(basename "$dir")
  csv="$dir/internal_all.csv"
  [ -f "$csv" ] || { echo "  $slug: no internal_all.csv"; continue; }

  # Normalize slug (test suffix → canonical)
  canon_slug="$slug"
  if [ "$slug" = "vacationdeals-test" ]; then canon_slug="vacationdeals"; fi

  STAGE=$(mktemp /tmp/sf-stage-XXXXX.csv)
  python3 - "$canon_slug" "$csv" "$STAGE" << 'PYEOF'
import csv, sys
slug, src, dest = sys.argv[1], sys.argv[2], sys.argv[3]
with open(src, encoding="utf-8-sig", newline="") as f, open(dest, "w", encoding="utf-8", newline="") as out:
    reader = csv.DictReader(f)
    w = csv.writer(out, quoting=csv.QUOTE_ALL)
    for r in reader:
        addr = r.get("Address", "")
        if not addr.startswith("http"):
            continue
        w.writerow([
            slug, addr,
            r.get("Status Code", ""),
            r.get("Title 1", ""),
            r.get("H1-1", ""),
            r.get("Meta Description 1", ""),
            r.get("Word Count", ""),
            r.get("Content Type", ""),
        ])
PYEOF

  rows=$(wc -l < "$STAGE")
  echo "  $canon_slug: $rows rows"

  # Ship to VPS and import
  scp -q -o StrictHostKeyChecking=no "$STAGE" root@72.60.126.82:/tmp/sf-stage.csv
  ssh -o StrictHostKeyChecking=no root@72.60.126.82 "
    set -a && source /var/www/vacationdeals/.env && set +a
    psql \"\$DATABASE_URL\" -q << 'SQL'
CREATE TEMP TABLE sf_stage (
  source_slug varchar(100),
  url text,
  status_code text,
  title text,
  h1 text,
  meta_description text,
  word_count text,
  content_type text
);
\\COPY sf_stage FROM '/tmp/sf-stage.csv' WITH (FORMAT CSV, QUOTE '\"', NULL '');
INSERT INTO target_landers (source_slug, url, status_code, title, h1, meta_description, word_count, content_type)
SELECT
  source_slug, url,
  NULLIF(status_code, '')::integer,
  NULLIF(title, ''),
  NULLIF(h1, ''),
  NULLIF(meta_description, ''),
  NULLIF(word_count, '')::integer,
  NULLIF(content_type, '')
FROM sf_stage
ON CONFLICT (source_slug, url) DO UPDATE SET
  status_code = EXCLUDED.status_code,
  title = EXCLUDED.title,
  h1 = EXCLUDED.h1,
  meta_description = EXCLUDED.meta_description,
  word_count = EXCLUDED.word_count,
  content_type = EXCLUDED.content_type,
  crawled_at = NOW();
SQL
    rm -f /tmp/sf-stage.csv
  " 2>&1 | grep -E "INSERT|ERROR|COPY" | head -3

  rm -f "$STAGE"
  TOTAL=$((TOTAL + rows))
done

echo ""
echo "Done. ~$TOTAL rows processed across all sources."

# Show DB totals
ssh -o StrictHostKeyChecking=no root@72.60.126.82 "
  set -a && source /var/www/vacationdeals/.env && set +a
  psql \"\$DATABASE_URL\" -c 'SELECT source_slug, COUNT(*) FROM target_landers GROUP BY source_slug ORDER BY 2 DESC;'
" 2>&1 | head -20
