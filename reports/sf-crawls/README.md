# Screaming Frog crawl archive

Per-date snapshots of technical SEO crawls across our own site and every
competitor/target source we scrape.

## Structure

```
reports/sf-crawls/<YYYY-MM-DD>/
  vacationdeals/            — our site (500 URL cap, full audit)
  <source-slug>/            — one folder per target source (300 URL cap)
    internal_all.csv        — every URL + status, title, H1, meta, word count
    response_codes_*.csv    — 4xx, 5xx, 3xx if any
    page_titles_all.csv
    meta_description_all.csv
    h1_all.csv
    sf.log                  — SF CLI output for this run
```

## How to regenerate

```bash
# Full run (own site + all ~39 targets). Sequential, 2-3 hours total.
bash scripts/sf-crawl-targets.sh

# Just specific sources
bash scripts/sf-crawl-targets.sh --only=westgate,bookvip

# Import the resulting CSVs into target_landers on the VPS
npx tsx scripts/sf-import-landers.ts --date=$(date +%Y-%m-%d)
```

## Where the data lives

- **CSVs**: this directory, committed to the main repo and mirrored to the
  private backup repo (`vacationdeals-private-backup`).
- **DB**: `target_landers` table on the VPS — one row per (source, URL) pair,
  upsert-on-conflict.
- **Run history**: `target_crawl_runs` table.

## Notes

- SF CLI requires a paid license. Anonymous / free-tier mode maxes out at 500
  URLs via GUI only.
- Some targets throttle or block crawlers (429 / 403). Those runs log a
  `failed` status in `target_crawl_runs` and produce no `internal_all.csv`.
- Large binary `.seospider` crawl files are excluded to keep the repo small.
