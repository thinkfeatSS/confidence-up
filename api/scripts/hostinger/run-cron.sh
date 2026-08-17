#!/bin/sh
# Hostinger hPanel cron helper — triggers API scheduled jobs over HTTP.
#
# Setup:
# 1. Copy this file to your hosting account (outside public_html is fine).
# 2. Set API_URL and CRON_SECRET below (must match api/.env on the server).
# 3. chmod +x run-cron.sh
# 4. In hPanel → Advanced → Cron Jobs → Custom, run:
#    /bin/sh /home/USERNAME/path/to/run-cron.sh JOB_NAME
#
# Jobs: daily-mission | reset-streaks | streak-reminders | mission-reminders | weekly-reports

JOB="$1"
API_URL="${API_URL:-https://your-domain.com/api/v1}"
CRON_SECRET="${CRON_SECRET:-REPLACE_WITH_CRON_SECRET}"

if [ -z "$JOB" ]; then
  echo "Usage: $0 <job-name>" >&2
  exit 1
fi

case "$JOB" in
  daily-mission|reset-streaks|streak-reminders|mission-reminders|weekly-reports) ;;
  *)
    echo "Unknown job: $JOB" >&2
    exit 1
    ;;
esac

curl -fsS -X POST "${API_URL}/cron/${JOB}" \
  -H "X-Cron-Secret: ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  --max-time 300
