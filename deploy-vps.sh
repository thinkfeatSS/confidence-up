#!/bin/bash
# ==============================================================================
# Truefluent AI - Unified FastAPI Production Deployment Script (VPS)
# ==============================================================================
set -e

echo "🚀 Starting Truefluent AI deployment on VPS (https://speakupmic.binaryunit.tech)..."

# 1. Setup separate truefluent_ai database in MySQL container
echo "🗄️ Setting up truefluent_ai database in MySQL container..."
MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -n 1)

if [ -n "$MYSQL_CONTAINER" ]; then
  echo "   Found MySQL container: $MYSQL_CONTAINER"
  docker exec "$MYSQL_CONTAINER" mysql -uroot -pyour_secure_root_password_2026 -e "CREATE DATABASE IF NOT EXISTS truefluent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON truefluent_ai.* TO 'crypto_user'@'%'; FLUSH PRIVILEGES;" 2>/dev/null || \
  docker exec "$MYSQL_CONTAINER" mysql -uroot -pmysql_secret -e "CREATE DATABASE IF NOT EXISTS truefluent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
  docker exec "$MYSQL_CONTAINER" mysql -uroot -e "CREATE DATABASE IF NOT EXISTS truefluent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
  echo "   Note: Please verify truefluent_ai database exists in $MYSQL_CONTAINER"
fi

# 2. Configure Host Nginx for speakupmic.binaryunit.tech
echo "🌐 Configuring host Nginx reverse proxy..."
cat << 'EOF' > /etc/nginx/sites-available/speakupmic.binaryunit.tech
server {
    server_name speakupmic.binaryunit.tech;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/speakupmic.binaryunit.tech /etc/nginx/sites-enabled/
nginx -t && (nginx -s reload || systemctl reload nginx) || true

# 3. Obtain/renew SSL certificate using host certbot if needed
if [ ! -d "/etc/letsencrypt/live/speakupmic.binaryunit.tech" ]; then
  echo "🔐 Requesting Let's Encrypt SSL certificate for speakupmic.binaryunit.tech..."
  certbot --nginx -d speakupmic.binaryunit.tech --non-interactive --agree-tos -m info@testitan.com --redirect || true
fi

# 4. Build & start unified FastAPI backend and background worker
echo "📦 Building and starting Truefluent AI Docker containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 5. Wait for FastAPI to initialize
echo "⏳ Waiting for FastAPI service to become healthy..."
sleep 8

# 6. Seed database schema, badges, fears, and master accounts
echo "🌱 Running Truefluent AI database initialization and seeding..."
docker compose -f docker-compose.prod.yml exec -T fastapi python -m app.db.seed_data || true

# 7. Ensure Ollama AI model is ready
echo "🦙 Ensuring Ollama llama3.2:3b model is pulled..."
docker compose -f docker-compose.prod.yml exec -T ollama ollama pull llama3.2:3b || true

echo "✅ Truefluent AI deployment successful!"
echo "   Endpoint: https://speakupmic.binaryunit.tech/api/v1"
echo "   Web App:  https://speakupmic.vercel.app"
docker compose -f docker-compose.prod.yml ps
