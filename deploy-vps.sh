#!/bin/bash
# ==============================================================================
# Truefluent AI - Unified FastAPI Production Deployment Script (VPS)
# ==============================================================================
set -e

echo "🚀 Starting Truefluent AI deployment on VPS (https://speakupmic.binaryunit.tech)..."

# 1. Ensure SSL directory & placeholder certificate exists for Nginx boot
mkdir -p ./certbot/conf/live/speakupmic.binaryunit.tech
mkdir -p ./certbot/www/.well-known/acme-challenge
if [ ! -f ./certbot/conf/live/speakupmic.binaryunit.tech/fullchain.pem ]; then
  echo "🛡️ Creating bootstrap self-signed SSL cert for Nginx..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ./certbot/conf/live/speakupmic.binaryunit.tech/privkey.pem \
    -out ./certbot/conf/live/speakupmic.binaryunit.tech/fullchain.pem \
    -subj "/CN=speakupmic.binaryunit.tech" 2>/dev/null || true
fi

# 2. Setup separate truefluent_ai database in MySQL container
echo "🗄️ Setting up truefluent_ai database in MySQL container..."
MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -n 1)

if [ -n "$MYSQL_CONTAINER" ]; then
  echo "   Found MySQL container: $MYSQL_CONTAINER"
  # Attempt creating truefluent_ai database (tries common passwords or environment)
  docker exec "$MYSQL_CONTAINER" mysql -uroot -pmysql_secret -e "CREATE DATABASE IF NOT EXISTS truefluent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
  docker exec "$MYSQL_CONTAINER" mysql -uroot -e "CREATE DATABASE IF NOT EXISTS truefluent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
  echo "   Note: Please verify truefluent_ai database exists in $MYSQL_CONTAINER"
else
  echo "⚠️ No MySQL container detected directly via name=mysql. If running on host, ensure truefluent_ai is created."
fi

# 3. Build & start unified FastAPI backend and background worker
echo "📦 Building and starting Truefluent AI Docker containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for FastAPI to initialize
echo "⏳ Waiting for FastAPI service to become healthy..."
sleep 8

# 5. Seed database schema, badges, fears, and master accounts
echo "🌱 Running Truefluent AI database initialization and seeding..."
docker compose -f docker-compose.prod.yml exec -T fastapi python -m app.db.seed_data || true

# 6. Ensure Ollama AI model is ready
echo "🦙 Ensuring Ollama llama3.2:3b model is pulled..."
docker compose -f docker-compose.prod.yml exec -T ollama ollama pull llama3.2:3b || true

echo "✅ Truefluent AI deployment successful!"
echo "   Endpoint: https://speakupmic.binaryunit.tech/api/v1"
echo "   Web App:  https://speakupmic.vercel.app"
docker compose -f docker-compose.prod.yml ps
