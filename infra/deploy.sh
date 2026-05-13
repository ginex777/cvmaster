#!/usr/bin/env bash
set -euo pipefail

# Deploy-Skript: lokal ausführen, deployt via SSH auf IONOS-VPS
# Voraussetzungen: SSH-Key auf VPS hinterlegt, Repo bereits geklont in /opt/lba

REMOTE="${REMOTE:-deploy@example.de}"
REMOTE_PATH="${REMOTE_PATH:-/opt/lba}"
REQUIRED_ENV_VARS="DATABASE_URL REDIS_URL APP_URL MAIL_DOMAIN AI_PROVIDER RESEND_API_KEY PADDLE_WEBHOOK_SECRET"

echo "-> Build Frontend"
cd ../frontend && pnpm install --frozen-lockfile && pnpm build

echo "-> Build Backend"
cd ../backend && pnpm install --frozen-lockfile && pnpm build

echo "-> Sync to $REMOTE"
cd ..
rsync -avz --delete \
  --exclude node_modules --exclude .git --exclude '*.log' \
  ./ "$REMOTE:$REMOTE_PATH/"

echo "-> Restart on remote"
ssh "$REMOTE" "cd $REMOTE_PATH/infra && test -f .env.production && set -a && . ./.env.production && set +a && missing='' && for key in $REQUIRED_ENV_VARS; do eval value=\\\${\$key:-}; if [ -z \"\$value\" ]; then missing=\"\$missing \$key\"; fi; done; if [ \"\${AI_PROVIDER:-}\" = groq ] && [ -z \"\${GROQ_API_KEY:-}\" ]; then missing=\"\$missing GROQ_API_KEY\"; fi; if [ \"\${AI_PROVIDER:-}\" = claude ] && [ -z \"\${ANTHROPIC_API_KEY:-}\" ]; then missing=\"\$missing ANTHROPIC_API_KEY\"; fi; if [ \"\${AI_PROVIDER:-}\" != groq ] && [ \"\${AI_PROVIDER:-}\" != claude ]; then echo 'AI_PROVIDER must be groq or claude'; exit 1; fi; if [ -n \"\$missing\" ]; then echo \"Missing required env vars:\$missing\"; exit 1; fi"
ssh "$REMOTE" "cd $REMOTE_PATH/infra && docker compose pull && docker compose up -d --build"

echo "-> Verify public health endpoint"
ssh "$REMOTE" "health=\$(curl -fsS http://localhost/health) && printf '%s' \"\$health\" | grep -q '\"status\":\"ok\"'"

echo "Deploy abgeschlossen."
