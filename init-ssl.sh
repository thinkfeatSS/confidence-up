#!/bin/bash
# ==============================================================================
# SpeakUpMic - Automated Let's Encrypt SSL Initializer
# Target Domain: speakupmic.binaryunit.tech
# ==============================================================================
set -e

PRIMARY_DOMAIN="speakupmic.binaryunit.tech"
EMAIL="info@thinkfeat.com"
CERT_DIR="./certbot/conf/live/${PRIMARY_DOMAIN}"
RSA_KEY_SIZE=4096

echo "🔐 Initializing SSL certificate provisioning for: ${PRIMARY_DOMAIN}..."

# 1. Create required directory structure
mkdir -p "./certbot/conf/live/${PRIMARY_DOMAIN}"
mkdir -p "./certbot/www/.well-known/acme-challenge"

# 2. Generate temporary self-signed certificate if none exists
# This allows Nginx to start its HTTPS listener on port 443 without throwing fatal errors.
if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  echo "🛡️ Creating temporary self-signed certificate so Nginx can start..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null || true
fi

# 3. Start Nginx
echo "🚀 Starting Nginx container..."
docker compose -f docker-compose.prod.yml up -d nginx

# 4. Remove dummy self-signed certificate before requesting real certs
echo "🧹 Preparing Certbot directories for Let's Encrypt challenge..."
rm -rf "./certbot/conf/live/${PRIMARY_DOMAIN}"
rm -rf "./certbot/conf/archive/${PRIMARY_DOMAIN}"*
rm -rf "./certbot/conf/renewal/${PRIMARY_DOMAIN}"*

echo "📜 Requesting genuine Let's Encrypt SSL certificate for ${PRIMARY_DOMAIN}..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    -d ${PRIMARY_DOMAIN} \
    --cert-name ${PRIMARY_DOMAIN} \
    --email ${EMAIL} \
    --rsa-key-size ${RSA_KEY_SIZE} \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

# 5. Fix potential duplicate suffix folder if Certbot created -000X
LATEST_CERT_DIR=$(ls -td ./certbot/conf/live/${PRIMARY_DOMAIN}* 2>/dev/null | head -n 1)
if [ -n "$LATEST_CERT_DIR" ] && [ "$LATEST_CERT_DIR" != "./certbot/conf/live/${PRIMARY_DOMAIN}" ]; then
  echo "🔗 Linking ${LATEST_CERT_DIR} to ./certbot/conf/live/${PRIMARY_DOMAIN}..."
  rm -rf "./certbot/conf/live/${PRIMARY_DOMAIN}"
  cp -rL "$LATEST_CERT_DIR" "./certbot/conf/live/${PRIMARY_DOMAIN}"
fi

# 6. Reload Nginx with genuine certificates
echo "🔄 Reloading Nginx with new SSL certificates..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL installation completed successfully!"
echo "✨ Your API is now securely available at:"
echo "   - https://speakupmic.binaryunit.tech"
