# Deploy NestJS API on Hostinger Node.js

## hPanel build settings

| Setting | Value |
|---------|--------|
| **Root directory** | `./` (api.zip contents = api project root) |
| **Build command** | `npm install && npm run build` |
| **Start command** | `npm start` |
| **Node.js version** | 22.x |

`npm run build` runs `prisma generate` then `nest build`.  
`npm start` runs `node dist/main`.

**Important:** Set `DATABASE_URL` (and other env vars) in hPanel **before** deploying — `prisma generate` needs it at build time.

## Environment variables (hPanel only in production)

Set these in **hPanel → Node.js app → Environment variables**.  
Do **not** rely on uploading `api/.env` — when `NODE_ENV=production`, the API ignores `.env` and reads only hPanel vars.

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CRON_SECRET=...          # min 16 chars, required in production
CRON_INTERNAL_ENABLED=false
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=info@thinkfeat.com
MAIL_PASSWORD=...        # mailbox password from hPanel → Emails (no extra quotes)
MAIL_FROM_NAME=ConfidenceUp
MAIL_FROM_ADDRESS=info@thinkfeat.com
APP_URL=http://binaryunit.tech
FRONTEND_URL=https://confidenceup.vercel.app
CORS_ALLOWED_ORIGINS=https://confidenceup.vercel.app,https://thinkfeat.com
CORS_ALLOW_VERCEL_PREVIEWS=true
GOOGLE_CLIENT_ID=...
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
```

### Mail (Hostinger SMTP)

- `MAIL_USER` must be the **full mailbox email** (`info@thinkfeat.com`), not your hPanel login.
- `MAIL_PASSWORD` is the **email account password** from hPanel → Emails → Manage.
- Port **465** + `MAIL_SECURE=true` (SSL), or port **587** + `MAIL_SECURE=false` (STARTTLS).
- Do not wrap values in quotes when pasting into hPanel.

### Ollama (speech AI + coach chat)

- `OLLAMA_BASE_URL=http://ollama:11434` (or `http://127.0.0.1:11434`).
- `OLLAMA_MODEL=llama3.2:3b`.

### Optional: Firebase (push notifications)

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

Use a **single line** with literal `\n` between PEM lines. If you see `Failed to parse private key`, fix the key or remove all three `FIREBASE_*` vars.

**CORS notes**

- Do **not** add a trailing slash to URLs (`https://app.com` not `https://app.com/`).
- `CORS_ALLOW_VERCEL_PREVIEWS=true` allows all `*.vercel.app` preview deployments.
- React Native mobile apps do not use browser CORS — no extra config needed.
- Optional: `CORS_ALLOW_LOCALHOST=true` for local web dev against prod API.

## Common deployment failures

| Symptom | Fix |
|---------|-----|
| `Cannot find module dist/main` | Use **Start command:** `npm start` (not `nest start`). Redeploy after pulling latest `package.json`. |
| `Unable to send email` | Verify `MAIL_*` in hPanel; redeploy after env changes. Check logs for `Mail SMTP: configured`. |
| Speech/coach show "(Offline)" | Check Ollama container status on VPS. Check `/api/v1/health` → `ollama.configured: true`. |
| `Failed to parse private key` | Fix `FIREBASE_PRIVATE_KEY` format or remove `FIREBASE_*` env vars |
| Config validation error on boot | Set `CRON_SECRET` when `NODE_ENV=production` |
| Prisma client error | Ensure build command includes `npm run build` (runs `prisma generate`) |
| DB connection refused | Whitelist server IP in Hostinger MySQL → Remote MySQL |

## Verify after deploy

```bash
curl http://binaryunit.tech/api/v1/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "ok": true,
    "mail": { "configured": true, "user": "info@thinkfeat.com" },
    "ollama": { "configured": true, "baseUrl": "http://ollama:11434", "model": "llama3.2:3b" },
    "nodeEnv": "production"
  }
}
```

Also check Hostinger app logs on startup:

- `Mail SMTP: configured (info@thinkfeat.com)`
- `Ollama AI: configured (http://ollama:11434, model: llama3.2:3b)`

Then test coach (should include `"provider":"ollama"`):

```bash
# Login, then POST /coach/chat with Bearer token
```
