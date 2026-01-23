#!/bin/bash
# Cron wrapper: hit release-locked-seats every 10 minutes.
# Uses localhost so it does not depend on Nginx/SSL/DNS.
# If CRON_SECRET is set in /var/www/mscinemas/.env, source it and pass as header.

APP_DIR="/var/www/mscinemas"
URL="http://127.0.0.1:3000/api/cron/release-locked-seats"

# Optional: load CRON_SECRET from .env (supports CRON_SECRET=value or CRON_SECRET="value")
if [ -f "$APP_DIR/.env" ]; then
  CRON_SECRET=$(grep '^CRON_SECRET=' "$APP_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs)
  export CRON_SECRET
fi

if [ -n "$CRON_SECRET" ]; then
  curl -s -H "x-cron-secret: $CRON_SECRET" "$URL" > /dev/null 2>&1
else
  curl -s "$URL" > /dev/null 2>&1
fi
