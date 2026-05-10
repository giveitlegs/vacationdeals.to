#!/bin/bash
# VacationDeals.to local backup script
# Creates timestamped tar.gz backup, keeps last 20

set -e

PROJECT_ROOT="/c/Users/givei/Dropbox/PERS/CLAUDECODE/VACATIONDEALS.TO"
BACKUP_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/VACATIONDEALS.TO-backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/vacationdeals-${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Exclusions
EXCLUDES=(
  --exclude='node_modules'
  --exclude='.next'
  --exclude='.turbo'
  --exclude='dist'
  --exclude='build'
  --exclude='*.log'
  --exclude='.playwright-mcp'
  --exclude='apps/scraper/storage'
  --exclude='crawlee_storage'
  --exclude='apify_storage'
  --exclude='.claude/worktrees'
)

echo "Creating backup: ${BACKUP_FILE}"
cd "$(dirname "${PROJECT_ROOT}")"
tar "${EXCLUDES[@]}" -czf "${BACKUP_FILE}" "$(basename "${PROJECT_ROOT}")"

SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Backup complete: ${SIZE}"

# Retention: keep last 20 backups, delete older
cd "${BACKUP_DIR}"
ls -t vacationdeals-*.tar.gz 2>/dev/null | tail -n +21 | xargs -r rm -f
REMAINING=$(ls vacationdeals-*.tar.gz 2>/dev/null | wc -l)
echo "Retaining ${REMAINING} backup(s) in ${BACKUP_DIR}"

# ── Pull latest prod DB dump (skip if already grabbed today) ──
DB_BACKUP_DIR="${PROJECT_ROOT}/backups/db"
mkdir -p "${DB_BACKUP_DIR}"
TODAY=$(date -u +%Y%m%d)
if ! ls "${DB_BACKUP_DIR}"/prod-snapshot-${TODAY}*.sql.gz >/dev/null 2>&1; then
  echo "Pulling fresh prod DB dump..."
  DB_FILE="${DB_BACKUP_DIR}/prod-snapshot-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  ssh -o BatchMode=yes -o ConnectTimeout=10 root@72.60.126.82 \
    "cd /var/www/vacationdeals && set -a && . ./.env && set +a && pg_dump --no-owner --no-acl \"\$DATABASE_URL\"" 2>/dev/null \
    | gzip > "${DB_FILE}" || echo "(VPS DB dump skipped — host unreachable)"
  if [ -s "${DB_FILE}" ]; then
    DB_SIZE=$(du -h "${DB_FILE}" | cut -f1)
    echo "DB dump saved: ${DB_FILE} (${DB_SIZE})"
    # Retention: keep last 14 daily dumps locally
    cd "${DB_BACKUP_DIR}"
    ls -t prod-snapshot-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
  else
    rm -f "${DB_FILE}"
  fi
else
  echo "Prod DB dump already pulled today; skipping."
fi
