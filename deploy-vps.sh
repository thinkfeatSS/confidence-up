#!/bin/bash
# ==============================================================================
# ConfidenceUp - Production VPS Deployment Script
# ==============================================================================
set -e

echo "🚀 Starting ConfidenceUp deployment on VPS..."

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
