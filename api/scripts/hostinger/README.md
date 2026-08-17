# Hostinger scheduled jobs

Hostinger Business shared Node.js hosting does not reliably run in-process `@nestjs/schedule` cron jobs. Use **hPanel cron jobs** to call secured HTTP endpoints on your running API instead.

## 1. Production environment variables

In **hPanel → Node.js app → Environment variables** (not only a local `api/.env` file):

```env
NODE_ENV=production
CRON_SECRET=generate-a-long-random-string-min-16-chars
CRON_INTERNAL_ENABLED=false
```

Generate a secret: `openssl rand -base64 32`

`CRON_INTERNAL_ENABLED=false` prevents duplicate runs (in-process + hPanel).

## 2. Upload the shell script

Copy `scripts/hostinger/run-cron.sh` to your Hostinger account, e.g.:

`/home/USERNAME/domains/yourdomain.com/private/run-cron.sh`

Edit the script and set:

- `API_URL` — your live API base, e.g. `https://api.yourdomain.com/api/v1`
- `CRON_SECRET` — same value as `CRON_SECRET` in hPanel env vars

Make it executable (File Manager → Permissions → 755, or via SSH).

## 3. Create hPanel cron jobs

hPanel → **Advanced** → **Cron Jobs** → **Custom**

Use command format (special characters must go in a `.sh` file):

```text
/bin/sh /home/USERNAME/domains/yourdomain.com/private/run-cron.sh daily-mission
```

### Recommended schedules (UTC)

| Job | hPanel cron expression | Endpoint |
|-----|------------------------|----------|
| Reset expired streaks | `0 0 * * *` | `reset-streaks` |
| Daily mission / challenge | `5 0 * * *` | `daily-mission` |
| Streak push reminders | `0 8 * * *` | `streak-reminders` |
| Mission push reminders | `0 9 * * *` | `mission-reminders` |
| Weekly email reports | `0 9 * * 1` | `weekly-reports` |

Adjust times if you want jobs in your local timezone (hPanel uses server UTC).

## 4. Test manually

```bash
curl -X POST "https://api.yourdomain.com/api/v1/cron/daily-mission" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

Success response:

```json
{
  "success": true,
  "data": { "ok": true, "job": "daily-mission", "date": "2026-07-06", "missionId": "..." },
  "timestamp": "..."
}
```

## 5. Local development

In development, in-process crons run automatically (`CRON_INTERNAL_ENABLED` defaults to on when `NODE_ENV` is not `production`). You can still test HTTP endpoints with the dev `CRON_SECRET` from your local `api/.env`.

## Notes

- The API process must stay running (Hostinger Node.js web app handles this).
- Weekly emails may take longer with many users; the curl `--max-time 300` in the script allows up to 5 minutes.
- Daily missions are also ensured on first `GET /daily/hub` or `GET /missions/today` if the cron was missed.
