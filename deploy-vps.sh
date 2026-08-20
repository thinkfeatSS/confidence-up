#!/bin/bash
# ==============================================================================
# ConfidenceUp - Production VPS Deployment Script
# ==============================================================================
set -e

echo "🚀 Starting ConfidenceUp deployment on VPS..."

# 0. Ensure api/.env exists and is up to date
if [ ! -f api/.env ]; then
  echo "📝 Creating api/.env from production template..."
  mkdir -p api
  cat << 'EOF' > api/.env
DATABASE_URL="mysql://u897031851_ismail:Mastsanai110@148.222.53.12:3306/u897031851_confidenceup"
NODE_ENV=production
PORT=3000
APP_URL=http://binaryunit.tech
FRONTEND_URL=http://binaryunit.tech
JWT_SECRET=39xDp8E+RbI5839moflWxbwEZbyK0nm4I+XsGQ6Gmn44
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=A5fvnDAZxMiuFuVBFvMdUKZsCPHkVZiC9jid8lMfcG88
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=408638792904-bjj0a2ap9ic3ln2aghp0c5vhuf8d2hph.apps.googleusercontent.com
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=info@thinkfeat.com
MAIL_PASSWORD=c948f8^I
MAIL_FROM_NAME=ConfidenceUp
MAIL_FROM_ADDRESS=info@thinkfeat.com
CRON_SECRET=BIr/MEiDyaIY/D6feYhghZGhL/i+G1rclomzanW4WLcc
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
EOF
else
  echo "🔄 Updating existing api/.env with Ollama and binaryunit.tech..."
  sed -i '/GEMINI/d' api/.env 2>/dev/null || true
  grep -q "OLLAMA_BASE_URL" api/.env || echo "OLLAMA_BASE_URL=http://ollama:11434" >> api/.env
  grep -q "OLLAMA_MODEL" api/.env || echo "OLLAMA_MODEL=llama3.2:3b" >> api/.env
  sed -i 's|pink-nightingale-973118.hostingersite.com|binaryunit.tech|g' api/.env 2>/dev/null || true
fi

# 1. Pull latest code or build images
echo "📦 Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build

# 2. Run Prisma migrations inside API container
echo "🔄 Running Prisma migrations against remote database..."
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# 3. Seed initial database data & admin/demo accounts
echo "🌱 Seeding badges, missions, skill tree, and admin/demo users..."
docker compose -f docker-compose.prod.yml exec -T api npm run seed || true
docker compose -f docker-compose.prod.yml exec -T api npm run seed:demo || true

# 4. Pull Ollama model inside container if not already downloaded
echo "🦙 Ensuring Ollama LLM model is ready..."
docker compose -f docker-compose.prod.yml exec -T ollama ollama pull llama3.2:3b || true

echo "✅ Deployment successful! Service status:"
docker compose -f docker-compose.prod.yml ps
