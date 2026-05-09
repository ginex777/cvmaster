#!/usr/bin/env bash
set -euo pipefail

# Deploy-Skript: lokal ausführen, deployt via SSH auf IONOS-VPS
# Voraussetzungen: SSH-Key auf VPS hinterlegt, Repo bereits geklont in /opt/lba

REMOTE="${REMOTE:-deploy@example.de}"
REMOTE_PATH="${REMOTE_PATH:-/opt/lba}"

echo "→ Build Frontend"
cd ../frontend && pnpm install --frozen-lockfile && pnpm build

echo "→ Build Backend"
cd ../backend && pnpm install --frozen-lockfile && pnpm build

echo "→ Sync to $REMOTE"
cd ..
rsync -avz --delete \
  --exclude node_modules --exclude .git --exclude '*.log' \
  ./ "$REMOTE:$REMOTE_PATH/"

echo "→ Restart on remote"
ssh "$REMOTE" "cd $REMOTE_PATH/infra && docker compose pull && docker compose up -d --build"

echo "✓ Deploy abgeschlossen."
