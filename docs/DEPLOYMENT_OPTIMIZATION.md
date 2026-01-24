# MS Cinema - Server Deployment & Optimization Guide

Complete guide for deploying and optimizing your MS Cinema server with automatic disk space cleanup.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Deploy Your Code (Normal Workflow)
```bash
# On your server
cd /var/www/mscinemas
git pull origin main
npm run build && pm2 restart mscinemas-nextjs && pm2 save
```

### Step 2: One-Time Cleanup Setup (Run Once)
```bash
chmod +x scripts/server-setup.sh
./scripts/server-setup.sh
```

### Step 3: Done! ✅
Your server now automatically cleans up disk space daily at 3:00 AM.

---

## 📋 What Gets Cleaned Automatically

| File/Directory | Action | When | Savings |
|----------------|--------|------|---------|
| `temp/booking-details/*.json` | Delete files older than 24h | Daily 3:00 AM | 0.5-2 MB/day |
| `logs/nginx-access.log` | Truncate (clear) | Daily 3:00 AM | 30-100 MB/day |
| `logs/nginx-error.log` | Truncate (clear) | Daily 3:00 AM | 0.1-1 MB/day |
| `cron-release-seats.log` | Delete if exists | Daily 3:00 AM | 0.1-0.5 MB/day |

**💾 Total Disk Space Saved: 30-100+ MB per day**

---

## � Your Deployment Workflow

### Normal Deployment (No Changes)
Your workflow stays exactly the same:
```bash
npm run build && pm2 restart mscinemas-nextjs && pm2 save
```

### Complete Deployment Process

#### 1. Local Development
```bash
git add .
git commit -m "Your changes"
git push origin main
```

#### 2. Server Deployment
```bash
# SSH into server
ssh your-user@your-server

# Navigate to project
cd /var/www/mscinemas

# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build and restart
npm run build && pm2 restart mscinemas-nextjs && pm2 save
```

#### 3. Verify Deployment
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs mscinemas-nextjs --lines 50
```

---

## 📝 Monitoring & Maintenance

### View Cleanup Activity
```bash
# View cleanup log
tail -f /var/www/mscinemas/logs/cleanup-cron.log

# View last 50 lines
tail -n 50 /var/www/mscinemas/logs/cleanup-cron.log
```

### Run Cleanup Manually (Testing)
```bash
cd /var/www/mscinemas
node scripts/cleanup-old-files.js
```

### Check Disk Usage
```bash
# Check booking details size
du -sh /var/www/mscinemas/temp/booking-details/

# Check logs size
du -sh /var/www/mscinemas/logs/

# Check total project size
du -sh /var/www/mscinemas/
```

### View Cron Jobs
```bash
# List all cron jobs
crontab -l

# View cron logs
tail -f /var/log/syslog | grep CRON
```

---

## ⚡ RAM & CPU Optimization

### Monitor Server Resources
```bash
# PM2 monitoring dashboard
pm2 monit

# Server resource usage
htop
# or
top

# Memory usage
free -h

# Disk usage
df -h
```

### PM2 Memory Optimization
```bash
# Restart with memory limit (500MB)
pm2 restart mscinemas-nextjs --max-memory-restart 500M

# Save configuration
pm2 save
```

### Advanced PM2 Configuration
Create `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [{
    name: 'mscinemas-nextjs',
    script: 'npm',
    args: 'start',
    node_args: '--max-old-space-size=512', // Limit to 512MB
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

Then use:
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔧 Customization

### Change Cleanup Schedule u

Edit crontab:
```bash
crontab -e
```

Find the line with `cleanup-old-files.js` and modify:

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Daily at 3:00 AM | `0 3 * * *` | Default |
| Daily at 2:00 AM | `0 2 * * *` | Earlier cleanup |
| Every 6 hours | `0 */6 * * *` | More frequent |
| Every 12 hours | `0 */12 * * *` | Twice daily |
| Weekly (Sunday) | `0 0 * * 0` | Once per week |

### Change File Age Threshold

Edit `scripts/cleanup-old-files.js`:
```javascript
const MAX_AGE_HOURS = 24; // Change this value
```

**Examples:**
- `12` - Delete files older than 12 hours
- `48` - Delete files older than 2 days
- `72` - Delete files older than 3 days
- `168` - Delete files older than 1 week

---

## 🆘 Troubleshooting

### Problem: Cleanup Not Running

**Solution 1: Check cron service**
```bash
sudo systemctl status cron
# If not running:
sudo systemctl start cron
```

**Solution 2: Verify cron job exists**
```bash
crontab -l | grep cleanup
```

**Solution 3: Check cron logs**
```bash
tail -f /var/log/syslog | grep CRON
```

**Solution 4: Verify Node.js path**
```bash
which node
# Update cron job if path is different from /usr/bin/node
```

### Problem: Files Not Being Deleted

**Solution 1: Run manually to see errors**
```bash
cd /var/www/mscinemas
node scripts/cleanup-old-files.js
```

**Solution 2: Check file permissions**
```bash
ls -la temp/booking-details/
ls -la logs/

# Fix permissions if needed
chmod 755 temp/booking-details/
chmod 755 logs/
```

**Solution 3: Check file ages**
```bash
# List files with modification times
ls -lht temp/booking-details/
```

### Problem: High Memory Usage

**Solution 1: Restart PM2**
```bash
pm2 restart mscinemas-nextjs
```

**Solution 2: Set memory limit**
```bash
pm2 restart mscinemas-nextjs --max-memory-restart 500M
pm2 save
```

**Solution 3: Check for memory leaks**
```bash
pm2 monit
# Watch memory usage over time
```

### Problem: Disk Space Still Full

**Solution 1: Find large files**
```bash
# Find files larger than 100MB
find /var/www/mscinemas -type f -size +100M -exec ls -lh {} \;

# Check directory sizes
du -h --max-depth=1 /var/www/mscinemas/ | sort -hr
```

**Solution 2: Clean node_modules**
```bash
cd /var/www/mscinemas
rm -rf node_modules
npm install
```

**Solution 3: Clean PM2 logs**
```bash
pm2 flush
```

### Remove Cleanup (If Needed)

To disable automatic cleanup:
```bash
crontab -l | grep -v 'cleanup-old-files.js' | crontab -
```

---

## 📊 Files Created

| File | Purpose |
|------|---------|
| `scripts/cleanup-old-files.js` | Main cleanup script |
| `scripts/server-setup.sh` | One-command setup installer |
| `DEPLOYMENT_OPTIMIZATION.md` | This documentation |

---

## ✅ Summary

**What You Get:**
- ✅ Automatic cleanup runs daily at 3:00 AM
- ✅ Booking details older than 24 hours deleted
- ✅ Nginx logs truncated daily to save space
- ✅ 30-100+ MB disk space freed per day
- ✅ No changes to your deployment workflow
- ✅ No manual intervention required

**Your Deployment Stays Simple:**
```bash
npm run build && pm2 restart mscinemas-nextjs && pm2 save
```

**The cleanup happens automatically in the background!** 🎉

---

## 📞 Need Help?

- Check cleanup log: `tail -f logs/cleanup-cron.log`
- Run manual test: `node scripts/cleanup-old-files.js`
- View cron jobs: `crontab -l`
- Monitor resources: `pm2 monit`
