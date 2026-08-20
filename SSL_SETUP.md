# SSL Installation Guide for `speakupmic.binaryunit.tech`

This project uses **Dockerized Nginx + Let's Encrypt (Certbot)** for automatic SSL certificate generation and auto-renewal.

---

## 🌐 Target Subdomain

- `speakupmic.binaryunit.tech` &rarr; `187.52.116.72`

---

## 🚀 Step 1: Point DNS Record to your VPS IP

In your domain registrar / DNS provider (Hostinger, Cloudflare, etc.), configure only this `A` record pointing to your VPS IP (`187.52.116.72`):

| Type | Host / Name | Value / Points To |
| :--- | :--- | :--- |
| `A` | `speakupmic` | `187.52.116.72` |

*(You can safely remove or ignore the other A records)*

---

## 🔑 Step 2: Run the SSL Provisioning Script on your VPS

SSH into your VPS server:

```bash
ssh root@187.52.116.72
```

Navigate to your project directory and execute:

```bash
chmod +x init-ssl.sh
./init-ssl.sh
```

### What `init-ssl.sh` does automatically:
1. Creates the necessary ACME challenge directories (`./certbot/www` and `./certbot/conf`).
2. Creates a temporary self-signed certificate so Nginx can start safely on port 443.
3. Launches Nginx in Docker.
4. Executes Certbot to request genuine Let's Encrypt certificates exclusively for `speakupmic.binaryunit.tech`.
5. Reloads Nginx to activate SSL.

---

## 🔄 Automatic Certificate Renewal

The `certbot` container in `docker-compose.prod.yml` runs continuously in the background and checks for certificate renewals every 12 days. You do not need to manually renew certificates.

To test manual renewal anytime:
```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 🧪 Verification

Once completed, verify your endpoints in the browser or via `curl`:
```bash
curl -I https://speakupmic.binaryunit.tech/health
```
