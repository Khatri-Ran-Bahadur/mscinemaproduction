#!/bin/bash
# Cron wrapper: hit resend-order-emails every 10 minutes (or as configured).
# Uses localhost so it does not depend on Nginx/SSL/DNS.

APP_DIR="/var/www/mscinemas"
URL="http://127.0.0.1:3000/api/cron/resend-order-emails"

# Optional: load CRON_SECRET from .env
if [ -f "$APP_DIR/.env" ]; then
  CRON_SECRET=$(grep '^CRON_SECRET=' "$APP_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs)
  export CRON_SECRET
fi

echo "Running Resend Order Emails Cron..."
if [ -n "$CRON_SECRET" ]; then
  curl -s -H "x-cron-secret: $CRON_SECRET" "$URL"
else
  curl -s "$URL"
fi
echo -e "\nCron Finished."
