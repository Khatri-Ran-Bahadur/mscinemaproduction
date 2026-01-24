#!/bin/bash

# MS Cinema - Server Deployment & Cleanup Setup
# Run this on your server after: npm run build && pm2 restart mscinemas-nextjs && pm2 save

echo "🚀 MS Cinema - Server Optimization Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

PROJECT_DIR="/var/www/mscinemas"
CLEANUP_SCRIPT="$PROJECT_DIR/scripts/cleanup-old-files.js"
CRON_LOG="$PROJECT_DIR/logs/cleanup-cron.log"

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Error: Project directory not found at $PROJECT_DIR"
    echo "   Please update PROJECT_DIR in this script"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

echo "📁 Project: $PROJECT_DIR"
echo ""

# ============================================
# Step 1: Test cleanup script
# ============================================
echo "1️⃣  Testing cleanup script..."
echo "───────────────────────────────────────────────────────────"
node "$CLEANUP_SCRIPT"
echo ""

# ============================================
# Step 2: Setup daily cron job
# ============================================
echo "2️⃣  Setting up daily cron job..."
echo "───────────────────────────────────────────────────────────"

CRON_TIME="0 3 * * *"  # Daily at 3:00 AM
CRON_COMMAND="cd $PROJECT_DIR && /usr/bin/node $CLEANUP_SCRIPT >> $CRON_LOG 2>&1"

# Check if cron job already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "$CLEANUP_SCRIPT")

if [ -n "$EXISTING_CRON" ]; then
    echo "⚠️  Cron job already exists. Removing old one..."
    crontab -l 2>/dev/null | grep -v -F "$CLEANUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_TIME $CRON_COMMAND") | crontab -

echo "✅ Cron job installed!"
echo "   Schedule: Daily at 3:00 AM"
echo "   Log file: $CRON_LOG"
echo ""

# ============================================
# Step 3: Verify cron jobs
# ============================================
echo "3️⃣  Current cron jobs:"
echo "───────────────────────────────────────────────────────────"
crontab -l
echo ""

# ============================================
# Summary
# ============================================
echo "═══════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 What happens now:"
echo "   • Booking details older than 24h deleted daily at 3:00 AM"
echo "   • Nginx access & error logs truncated daily"
echo "   • Cron release seats log removed daily"
echo ""
echo "💾 Disk space optimization:"
echo "   • temp/booking-details/ - cleaned daily"
echo "   • logs/nginx-access.log - truncated daily"
echo "   • logs/nginx-error.log - truncated daily"
echo ""
echo "📝 Useful commands:"
echo "   • View cleanup log: tail -f $CRON_LOG"
echo "   • Run cleanup now: node $CLEANUP_SCRIPT"
echo "   • List cron jobs: crontab -l"
echo ""
echo "🔄 Your deployment workflow:"
echo "   npm run build && pm2 restart mscinemas-nextjs && pm2 save"
echo ""
