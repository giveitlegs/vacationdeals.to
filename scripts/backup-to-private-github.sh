#!/bin/bash
# Secure backup of project to a PRIVATE GitHub repo.
# - Scrubs all secrets before pushing (.env, vpsssl.txt, credentials, API keys)
# - Pushes to a separate private repo (not the public vacationdeals.to repo)
# - Uses --force-with-lease to avoid accidentally nuking history
#
# Setup (first time):
#   1. Create a PRIVATE repo on GitHub (e.g., giveitlegs/vacationdeals-private-backup)
#   2. Set BACKUP_REPO env var below or in ~/.bashrc
#   3. Ensure your SSH key is registered with GitHub
#   4. chmod +x this file

set -e

PROJECT_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/VACATIONDEALS.TO"
BACKUP_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/.backups/vacationdeals-mirror"
BACKUP_REPO="${VD_BACKUP_REPO:-git@github.com:giveitlegs/vacationdeals-private-backup.git}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

echo "=== Secure GitHub Backup ==="

# ── 1. Mirror the project to a clean staging directory ──
if [ ! -d "${BACKUP_DIR}" ]; then
  mkdir -p "$(dirname "${BACKUP_DIR}")"
  git clone "${BACKUP_REPO}" "${BACKUP_DIR}" 2>/dev/null || {
    echo "Initializing new backup repo..."
    mkdir -p "${BACKUP_DIR}"
    cd "${BACKUP_DIR}"
    git init -q
    git remote add origin "${BACKUP_REPO}"
  }
fi

cd "${BACKUP_DIR}"

# ── 2. Clear staging (keep .git) ──
find . -mindepth 1 -not -path "./.git*" -delete 2>/dev/null || true

# ── 3. Copy project, excluding secrets and build artifacts ──
rsync -a \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='.turbo/' \
  --exclude='dist/' \
  --exclude='build/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.env' \
  --exclude='vpsssl.txt' \
  --exclude='*.credentials' \
  --exclude='*.secret' \
  --exclude='*.key' \
  --exclude='*.pem' \
  --exclude='id_rsa*' \
  --exclude='*.log' \
  --exclude='.playwright-mcp/' \
  --exclude='apps/scraper/storage/' \
  --exclude='crawlee_storage/' \
  --exclude='.claude/worktrees/' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  "${PROJECT_DIR}/" "${BACKUP_DIR}/"

# ── 4. Final scrub: any stray secret patterns in file contents ──
# This is a belt-and-suspenders check for API keys that might be hardcoded
SCRUB_PATTERNS=(
  'AKIA[0-9A-Z]{16}'              # AWS access key
  'sk-[a-zA-Z0-9]{40,}'           # OpenAI / Anthropic secret keys
  'ghp_[a-zA-Z0-9]{36,}'          # GitHub personal access token
  'ghs_[a-zA-Z0-9]{36,}'          # GitHub server token
  're_[a-zA-Z0-9]{30,}'           # Resend API key
  'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'  # SendGrid
  'xox[baprs]-[0-9]+-[0-9]+-[a-zA-Z0-9]+'     # Slack token
  'AC[a-f0-9]{32}'                # Twilio account SID
  'EAAG[a-zA-Z0-9]{100,}'         # Meta/Facebook access token
)

SECRETS_FOUND=0
for pattern in "${SCRUB_PATTERNS[@]}"; do
  if grep -rE "${pattern}" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.txt" --include="*.sh" --include="*.py" . 2>/dev/null | head -1 > /tmp/scrub-check; then
    if [ -s /tmp/scrub-check ]; then
      echo "⚠️  SECRET PATTERN DETECTED, aborting backup: ${pattern}"
      cat /tmp/scrub-check
      rm -f /tmp/scrub-check
      SECRETS_FOUND=1
    fi
  fi
done

if [ "${SECRETS_FOUND}" = "1" ]; then
  echo "❌ Backup aborted due to secret detection. Fix the file then retry."
  exit 1
fi

# ── 5. Commit + push (if there are changes) ──
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git -c user.email="backup@local" -c user.name="VacationDeals Backup" commit -q -m "Backup ${TIMESTAMP}" 2>/dev/null || true

  # Push only if remote is configured and reachable
  if git ls-remote origin > /dev/null 2>&1; then
    git push origin HEAD --force-with-lease 2>&1 | tail -3
    SIZE=$(du -sh . | cut -f1)
    echo "✅ Backup pushed (${SIZE}) to private repo"
  else
    echo "⚠️  No reachable remote 'origin'. Backup committed locally only."
    echo "   To enable: create PRIVATE GitHub repo, then run:"
    echo "     cd ${BACKUP_DIR} && git remote set-url origin git@github.com:YOUR_USER/YOUR_PRIVATE_REPO.git"
  fi
else
  echo "No changes since last backup."
fi
