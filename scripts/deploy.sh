#!/bin/bash
# VacationDeals.to VPS Deployment Script
# Run on the Hostinger VPS after SSH

set -e

APP_DIR="/var/www/vacationdeals"
REPO_URL="https://github.com/giveitlegs/vacationdeals.to.git"

echo "=== VacationDeals.to Deployment ==="

# Pull latest code
cd "$APP_DIR"
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Restart app
pm2 restart vacationdeals-web || pm2 start apps/web/.next/standalone/server.js --name vacationdeals-web

echo "=== Deployment complete ==="
