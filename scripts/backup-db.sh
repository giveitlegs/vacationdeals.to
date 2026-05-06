#!/usr/bin/env bash
# backup-db.sh — pg_dump the VPS Postgres into ./backups/ locally.
#
# Run from the project root on the local Windows/macOS dev box that has
# SSH key auth to root@72.60.126.82. The dump goes into ./backups/
# (gitignored — contains user PII like subscriber emails and consent
# records). Restore with `pg_restore -d <DB> <file>`.
set -euo pipefail

VPS_HOST="root@72.60.126.82"
DATE_STAMP="$(date +%Y-%m-%d)"
LOCAL_DIR="./backups"
REMOTE_TMP="/tmp/vacationdeals-${DATE_STAMP}.pgdump"
LOCAL_FILE="${LOCAL_DIR}/vacationdeals-${DATE_STAMP}.pgdump"

mkdir -p "${LOCAL_DIR}"

echo "→ pg_dump on VPS..."
ssh -o BatchMode=yes "${VPS_HOST}" '
  cd /var/www/vacationdeals && set -a && source .env && set +a &&
  DB_NAME=$(echo $DATABASE_URL | sed "s|.*/||" | sed "s|?.*||") &&
  DB_USER=$(echo $DATABASE_URL | sed -E "s|.*//([^:]+):.*|\1|") &&
  PGPASSWORD=$(echo $DATABASE_URL | sed -E "s|.*://[^:]+:([^@]+)@.*|\1|") \
    pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" \
            --format=custom --compress=9 \
            --file='"${REMOTE_TMP}"'
'

echo "→ scp to ${LOCAL_FILE}..."
scp -o BatchMode=yes "${VPS_HOST}:${REMOTE_TMP}" "${LOCAL_FILE}"

echo "→ cleanup remote /tmp..."
ssh -o BatchMode=yes "${VPS_HOST}" "rm -f ${REMOTE_TMP}"

echo "✓ Backup saved: ${LOCAL_FILE}"
ls -lh "${LOCAL_FILE}"
