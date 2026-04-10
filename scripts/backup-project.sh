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
