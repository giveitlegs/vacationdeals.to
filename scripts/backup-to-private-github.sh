#!/bin/bash
# Secure backup of project to a PRIVATE GitHub repo.
# - Uses `git archive` instead of rsync (cross-platform, respects .gitignore)
# - Scrubs secrets defensively (AWS, OpenAI, GitHub, Resend, Meta, Twilio)
# - Exits gracefully if the remote is unreachable (e.g., repo not yet created)
#
# Setup (first time):
#   1. Create a PRIVATE repo on GitHub
#   2. Register your SSH key with GitHub OR set VD_BACKUP_REPO to HTTPS + PAT
#   3. Optional: export VD_BACKUP_REPO=git@github.com:YOU/YOUR_PRIVATE_REPO.git

set -e

PROJECT_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/VACATIONDEALS.TO"
BACKUP_DIR="/c/Users/givei/Dropbox/PERS/CLAUDECODE/.backups/vacationdeals-mirror"
BACKUP_REPO="${VD_BACKUP_REPO:-git@github.com:giveitlegs/vacationdeals-private-backup.git}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

echo "=== Secure GitHub Backup ==="

cd "${PROJECT_DIR}"

# ── 1. Probe remote reachability before doing any work ──
if ! git -c core.askPass=/bin/true ls-remote "${BACKUP_REPO}" HEAD > /tmp/vd-backup-ls 2>&1; then
  echo "⚠️  Cannot reach ${BACKUP_REPO}"
  echo "   Last error: $(tail -1 /tmp/vd-backup-ls)"
  echo "   Setup: create the repo on GitHub, register SSH key, or set VD_BACKUP_REPO."
  rm -f /tmp/vd-backup-ls
  exit 0
fi
rm -f /tmp/vd-backup-ls

# ── 2. Ensure mirror dir is initialized ──
if [ ! -d "${BACKUP_DIR}/.git" ] || [ -z "$(ls -A "${BACKUP_DIR}/.git" 2>/dev/null)" ]; then
  rm -rf "${BACKUP_DIR}"
  mkdir -p "$(dirname "${BACKUP_DIR}")"
  echo "Cloning backup repo..."
  git clone "${BACKUP_REPO}" "${BACKUP_DIR}" 2>/dev/null || {
    echo "Remote empty; initializing fresh repo..."
    mkdir -p "${BACKUP_DIR}"
    cd "${BACKUP_DIR}"
    git init -q -b main
    git remote add origin "${BACKUP_REPO}"
    cd "${PROJECT_DIR}"
  }
fi

# ── 3. Export tracked files via `git archive` (cross-platform, no rsync) ──
# git archive respects .gitignore automatically — secrets never leave the repo.
echo "Exporting tracked files via git archive..."

# Clear mirror contents (preserve .git)
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} + 2>/dev/null || true

# Pack tracked files into tar, extract into mirror
git archive --format=tar HEAD | tar -xf - -C "${BACKUP_DIR}"

# Also include untracked-but-not-ignored files (new work not yet committed)
git ls-files --modified --others --exclude-standard -z 2>/dev/null | while IFS= read -r -d '' f; do
  [ -f "$f" ] || continue
  mkdir -p "${BACKUP_DIR}/$(dirname "$f")"
  cp -p "$f" "${BACKUP_DIR}/$f"
done

# ── 4. Defensive secret scan on the mirror ──
cd "${BACKUP_DIR}"

SCRUB_PATTERNS=(
  'AKIA[0-9A-Z]{16}'                           # AWS access key
  'sk-ant-[a-zA-Z0-9_-]{40,}'                  # Anthropic key
  'sk-[a-zA-Z0-9]{40,}'                        # OpenAI / generic sk-
  'ghp_[a-zA-Z0-9]{36,}'                       # GitHub PAT
  'ghs_[a-zA-Z0-9]{36,}'                       # GitHub server token
  're_[a-zA-Z0-9]{30,}'                        # Resend
  'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'   # SendGrid
  'xox[baprs]-[0-9]+-[0-9]+-[a-zA-Z0-9]+'      # Slack
  'AC[a-f0-9]{32}'                             # Twilio
  'EAAG[a-zA-Z0-9]{100,}'                      # Meta FB
)

SECRETS_FOUND=0
for pattern in "${SCRUB_PATTERNS[@]}"; do
  if grep -rE "${pattern}" \
    --include='*.ts' --include='*.js' --include='*.json' \
    --include='*.md' --include='*.txt' --include='*.sh' --include='*.py' \
    --exclude-dir='.git' \
    . 2>/dev/null | head -1 > /tmp/scrub-check; then
    if [ -s /tmp/scrub-check ]; then
      echo "⚠️  SECRET PATTERN DETECTED, aborting: ${pattern}"
      cat /tmp/scrub-check
      rm -f /tmp/scrub-check
      SECRETS_FOUND=1
    fi
  fi
done

if [ "${SECRETS_FOUND}" = "1" ]; then
  echo "❌ Backup aborted. Remove secrets from tracked files and retry."
  exit 1
fi

# ── 5. Commit + push ──
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git -c user.email="backup@local" -c user.name="VacationDeals Backup" \
    commit -q -m "Backup ${TIMESTAMP}" 2>/dev/null || true

  if git push origin HEAD --force-with-lease 2>&1 | tail -3; then
    SIZE=$(du -sh --exclude=.git . 2>/dev/null | cut -f1)
    echo "✅ Backup pushed (${SIZE}) to private repo"
  else
    echo "⚠️  Push failed; committed locally. Retry later or check creds."
  fi
else
  echo "No changes since last backup."
fi
