# Deployment Guide - MSCinemas Next.js Application

This document provides step-by-step instructions for building and deploying the Next.js application after making code changes.

## Quick Deployment Steps

### 1. Navigate to Application Directory
```bash
cd /var/www/mscinemas
```

### 2. Pull Latest Changes (if using Git)
```bash
git pull origin main
# or
git pull origin master
```

### 3. Install Dependencies (if package.json changed)
```bash
npm install
```

### 4. Build the Application
```bash
npm run build
```

### 5. Restart PM2 Application
```bash
pm2 restart mscinemas-nextjs
```

### 6. Save PM2 Configuration
```bash
pm2 save
```

---

## Detailed Instructions

### Prerequisites
- You must be logged in as `root` or have sudo access
- Application directory: `/var/www/mscinemas`
- PM2 process name: `mscinemas-nextjs`

### Step-by-Step Process

#### Step 1: Access the Application Directory
```bash
cd /var/www/mscinemas
```

#### Step 2: Update Code (if using Git)
If you're using version control and need to pull the latest changes:
```bash
git pull origin main
# or for master branch
git pull origin master
```

#### Step 3: Install/Update Dependencies
Only needed if you've added or updated packages in `package.json`:
```bash
npm install
```

#### Step 4: Build the Next.js Application
This compiles your application for production:
```bash
npm run build
```

**Expected Output:**
- ✓ Compiled successfully
- ✓ Generating static pages
- Route list showing all pages
- Build completion message

**Build Time:** Typically 2-5 minutes depending on application size.

#### Step 5: Restart the Application with PM2
Restart the PM2 process to load the new build:
```bash
pm2 restart mscinemas-nextjs
```

**Alternative commands:**
```bash
# Restart with environment variable updates
pm2 restart mscinemas-nextjs --update-env

# Or use the ecosystem config
pm2 restart ecosystem.config.js
```

#### Step 6: Save PM2 Configuration
Save the current PM2 process list so it persists after server reboot:
```bash
pm2 save
```

#### Step 7: Verify Deployment
Check if the application is running:
```bash
pm2 status
```

You should see:
```
┌────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ mscinemas-nextjs    │ default     │ N/A     │ fork    │ xxxxx    │ xx     │ 0    │ online    │
└────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

Test the application:
```bash
curl -I http://localhost:3000
```

---

## One-Line Deployment Script

You can combine all steps into a single command:
```bash
cd /var/www/mscinemas && npm run build && pm2 restart mscinemas-nextjs && pm2 save
```

---

## Troubleshooting

### Build Fails
If `npm run build` fails:
1. Check for TypeScript/JavaScript errors in the output
2. Verify all dependencies are installed: `npm install`
3. Check environment variables: `cat .env`
4. Review build logs for specific errors

### Application Won't Start
If PM2 shows the app as "errored" or "stopped":
```bash
# Check logs
pm2 logs mscinemas-nextjs --lines 50

# Check for port conflicts
netstat -tlnp | grep 3000

# Restart with fresh start
pm2 delete mscinemas-nextjs
cd /var/www/mscinemas
pm2 start ecosystem.config.js
pm2 save
```

### High CPU Usage After Deployment
If CPU usage is high:
```bash
# Check current CPU usage
pm2 monit

# Restart the application
pm2 restart mscinemas-nextjs
```

### Nginx Not Serving Updated Content
If changes aren't visible:
```bash
# Reload Nginx
systemctl reload nginx

# Check Nginx status
systemctl status nginx
```

---

## Environment Variables

If you need to update environment variables:

1. Edit the `.env` file:
```bash
nano /var/www/mscinemas/.env
```

2. After editing, rebuild and restart:
```bash
npm run build
pm2 restart mscinemas-nextjs --update-env
pm2 save
```

**Important:** For `NEXT_PUBLIC_*` variables, you must rebuild the application for changes to take effect.

---

## Useful Commands Reference

### PM2 Commands
```bash
# View application status
pm2 status

# View logs
pm2 logs mscinemas-nextjs

# View last 50 lines of logs
pm2 logs mscinemas-nextjs --lines 50

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart mscinemas-nextjs

# Stop application
pm2 stop mscinemas-nextjs

# Start application
pm2 start mscinemas-nextjs

# Delete from PM2
pm2 delete mscinemas-nextjs
```

### Build Commands
```bash
# Production build
npm run build

# Development build (for testing)
npm run dev

# Check for outdated packages
npm outdated

# Update packages (be careful!)
npm update
```

### System Commands
```bash
# Check if port 3000 is in use
netstat -tlnp | grep 3000

# Check Nginx status
systemctl status nginx

# Reload Nginx
systemctl reload nginx

# Check disk space
df -h

# Check memory usage
free -h
```

---

## Automated Deployment (GitHub Actions)

If you've set up GitHub Actions, you can deploy automatically by pushing to the main branch:

1. Commit your changes:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. GitHub Actions will automatically:
   - Pull the latest code
   - Install dependencies
   - Build the application
   - Restart PM2

**Note:** Make sure your GitHub repository has the required secrets configured:
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_PORT`

---

## Best Practices

1. **Always test locally first** before deploying to production
2. **Check PM2 logs** after deployment to ensure no errors
3. **Monitor CPU and memory** usage after deployment
4. **Keep backups** of your `.env` file
5. **Document changes** in commit messages
6. **Deploy during low-traffic periods** when possible

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│           MSCinemas Deployment Quick Guide              │
├─────────────────────────────────────────────────────────┤
│ 1. cd /var/www/mscinemas                                │
│ 2. git pull origin main (if using Git)                 │
│ 3. npm install (if dependencies changed)               │
│ 4. npm run build                                        │
│ 5. pm2 restart mscinemas-nextjs                        │
│ 6. pm2 save                                             │
│ 7. pm2 status (verify)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs mscinemas-nextjs`
2. Check Nginx logs: `tail -f /var/www/mscinemas/logs/nginx-error.log`
3. Verify application is running: `curl http://localhost:3000`
4. Check system resources: `top` or `htop`

---

**Last Updated:** January 2026
**Application:** MSCinemas Next.js
**Server:** mscinemas.my
