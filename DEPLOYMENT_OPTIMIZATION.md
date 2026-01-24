# MS Cinema - Production Deployment & Optimization

**Status**: 🟢 Automated CI/CD Setup  
**Build Strategy**: Build on GitHub -> Sync to Server (Zero Server CPU Load)

---

## 🚀 Deployment Workflow

**STOP** running `npm run build` on your server. It kills the CPU.  
Instead, we use GitHub Actions to build the app and push the ready-to-run files to your server.

### How to Deploy
1.  **Code Locally**: Make your changes.
2.  **Push to GitHub**:
    ```bash
    git add .
    git commit -m "feat: new changes"
    git push origin main
    ```
3.  **Done!** GitHub Actions will:
    - Build the app on their servers.
    - Sync the files (including `node_modules`) to your server.
    - Restart PM2 for you.

---

## ⚙️ Secrets Setup (Required)

Go to **GitHub Settings** > **Secrets and variables** > **Actions** > **New repository secret** and add these:

| Secret Name | Value Example | Description |
|-------------|---------------|-------------|
| `VPS_HOST` | `123.45.67.89` | Your server IP address |
| `VPS_USER` | `root` | Your SSH username |
| `VPS_SSH_KEY` | `-----BEGIN...` | Your private SSH key content |
| `VPS_PORT` | `22` | Your SSH port (default is 22) |

*(Note: Ensure your server accepts the SSH key. Test connection manually first: `ssh root@123.45.67.89`)*

---

## 🧹 Server Optimization & Cleanup

We have configured an automatic cleanup script that runs daily to keep disk usage low.

**What Gets Cleaned (Daily at 3:00 AM):**
- `temp/booking-details/*` (files older than 24h)
- `logs/nginx-access.log` (Truncated to 0)
- `logs/nginx-error.log` (Truncated to 0)
- `cron-release-seats.log` (Deleted)
- **Automatic Deployment Cleanup**: The `rsync --delete` command in our deploy script ensures no old, unused files clutter your server.

### Verify Cleanup Setup
Check if the cleanup cron job is active:
```bash
crontab -l
# Should see: 0 3 * * * ... cleanup-old-files.js ...
```

If missing, run the setup once:
```bash
chmod +x scripts/server-setup.sh
./scripts/server-setup.sh
```

---

## ⚡ RAM & CPU Configuration

Your app is configured to use minimal resources via `ecosystem.config.js`.

**Current Settings:**
- **Max Memory**: 1GB (Restarts if exceeded)
- **Instances**: 1 (Prevents CPU spikes)
- **Daily Restart**: 3:00 AM (Clears any memory leaks)

To apply changes to this configuration, just edit `ecosystem.config.js` locally and push to GitHub. The deployment will auto-update the server.

---

## 🆘 Troubleshooting

**GitHub Action "Prepare SSH" Failed?**
- Check `VPS_SSH_KEY` secret. It must include `-----BEGIN OPRNSSH PRIVATE KEY-----` (or similar).
- Check `VPS_HOST` is correct.

**"Deploy files" Failed?**
- Ensure `rsync` is installed on the server (`apt-get install rsync`).

**Server 502/500 Error?**
- Check PM2 logs: `pm2 logs mscinemas-nextjs`
- Ensure `NEXT_TELEMETRY_DISABLED=1` is set (it is by default in our workflow).

**Manual Cleanup**
```bash
node /var/www/mscinemas/scripts/cleanup-old-files.js
```
