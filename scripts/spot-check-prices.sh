#!/bin/bash
# Spot-check 3 deals per brand against live source URLs.
# Runs on session start to catch stale prices early.
# Outputs a summary of mismatches.

set -e

PROJECT_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/VACATIONDEALS.TO"
RESULT=$(ssh root@72.60.126.82 'export $(cat /var/www/vacationdeals/.env | xargs) && cd /var/www/vacationdeals/apps/scraper && timeout 120 npx tsx src/verify-prices.ts --limit=30 2>&1 | tail -5' 2>/dev/null)

echo "$RESULT"

# Check for issues
CHANGED=$(echo "$RESULT" | grep -c "Changed:" | head -1)
EXPIRED=$(echo "$RESULT" | grep -c "Expired:" | head -1)

if echo "$RESULT" | grep -q "Changed: [1-9]"; then
  echo '{"systemMessage":"Price verification found stale prices — check /var/log/vacdeals-verify.log on VPS"}'
elif echo "$RESULT" | grep -q "Expired: [1-9]"; then
  echo '{"systemMessage":"Price verification found expired deals — auto-deactivated"}'
fi
