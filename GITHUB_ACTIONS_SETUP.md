# GitHub Actions Setup Guide

This guide will help you set up automated deployment using GitHub Actions pipeline.

## ✅ Yes, You Can Use GitHub Actions!

GitHub Actions can automatically build and deploy your Next.js application whenever you push code to your repository.

## Prerequisites

1. Your code is in a GitHub repository
2. You have SSH access to your server
3. You have a private SSH key for server access

## Step-by-Step Setup

### Step 1: Generate SSH Key Pair (if you don't have one)

On your local machine or server:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates:
- `~/.ssh/github_actions_deploy` (private key - keep secret!)
- `~/.ssh/github_actions_deploy.pub` (public key)

### Step 2: Add Public Key to Server

Copy the public key to your server's authorized_keys:

```bash
# On your local machine
cat ~/.ssh/github_actions_deploy.pub | ssh root@your-server-ip "cat >> ~/.ssh/authorized_keys"
```

Or manually:
1. Copy the content of `github_actions_deploy.pub`
2. SSH into your server
3. Run: `nano ~/.ssh/authorized_keys`
4. Paste the public key and save

### Step 3: Test SSH Connection

Test that the private key works:

```bash
ssh -i ~/.ssh/github_actions_deploy root@your-server-ip
```

If it connects without password, you're good!

### Step 4: Add Secrets to GitHub Repository

1. Go to your GitHub repository: `https://github.com/Khatri-Ran-Bahadur/mscinemaproduction`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

#### Secret 1: SSH_HOST
- **Name:** `SSH_HOST`
- **Value:** Your server IP address (e.g., `72.62.72.191`) or domain

#### Secret 2: SSH_USER
- **Name:** `SSH_USER`
- **Value:** `root` (or your SSH username)

#### Secret 3: SSH_PRIVATE_KEY
- **Name:** `SSH_PRIVATE_KEY`
- **Value:** The entire content of your private key file:
  ```bash
  cat ~/.ssh/github_actions_deploy
  ```
  Copy everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

#### Secret 4: SSH_PORT (Optional)
- **Name:** `SSH_PORT`
- **Value:** `22` (default SSH port, only needed if different)

### Step 5: Verify Workflow File

The workflow file is already created at:
```
.github/workflows/deploy.yml
```

Make sure it's committed to your repository:

```bash
cd /var/www/mscinemas
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

## How It Works

### Automatic Deployment Flow

1. **You push code** to `main` or `master` branch
2. **GitHub Actions triggers** automatically
3. **Builds the application** on GitHub's servers
4. **SSH into your server** using the private key
5. **Pulls latest code** from GitHub
6. **Installs dependencies** (if needed)
7. **Builds the application** on the server
8. **Restarts PM2** to load the new build
9. **Saves PM2 configuration**

### Manual Trigger

You can also trigger deployment manually:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build and Deploy to Production** workflow
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

## Testing the Setup

### Test 1: Push a Small Change

```bash
cd /var/www/mscinemas
# Make a small change (e.g., update a comment)
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

Then:
1. Go to GitHub → **Actions** tab
2. Watch the workflow run
3. Check if it completes successfully

### Test 2: Verify Deployment

After the workflow completes:

```bash
# SSH into your server
ssh root@your-server-ip

# Check PM2 status
pm2 status

# Check if app is running
curl -I http://localhost:3000
```

## Workflow File Location

The workflow file is located at:
```
/var/www/mscinemas/.github/workflows/deploy.yml
```

## Customizing the Workflow

You can edit the workflow file to:
- Change deployment branch
- Add environment variables
- Add build steps
- Add notifications
- Add rollback capabilities

### Example: Add Slack Notification

Add this step after deployment:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Solution:**
1. Verify SSH_PRIVATE_KEY secret is correct (include BEGIN/END lines)
2. Check that public key is in server's `~/.ssh/authorized_keys`
3. Test SSH connection manually

### Issue: "npm: command not found"

**Solution:**
The workflow installs Node.js, but if it fails:
- Check Node.js version in workflow (currently set to 20)
- Verify server has Node.js installed

### Issue: "PM2 command not found"

**Solution:**
PM2 should be installed on the server. If not:
```bash
npm install -g pm2
pm2 startup systemd -u root --hp /root
```

### Issue: Build Fails

**Solution:**
1. Check build logs in GitHub Actions
2. Test build locally: `npm run build`
3. Check for TypeScript/JavaScript errors
4. Verify environment variables are set

### Issue: Deployment Succeeds but App Doesn't Work

**Solution:**
1. Check PM2 logs: `pm2 logs mscinemas-nextjs`
2. Check Nginx logs: `tail -f /var/www/mscinemas/logs/nginx-error.log`
3. Verify app is running: `pm2 status`
4. Check if port 3000 is listening: `netstat -tlnp | grep 3000`

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use SSH keys** instead of passwords
3. **Rotate SSH keys** periodically
4. **Limit SSH access** to specific IPs if possible
5. **Use separate keys** for GitHub Actions (don't reuse personal keys)

## Monitoring Deployments

### View Deployment History

1. Go to GitHub → **Actions** tab
2. Click on any workflow run to see details
3. Check logs for each step

### Check Server Status

After deployment, verify on server:

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs mscinemas-nextjs --lines 50

# System resources
top
htop
```

## Alternative: Using Deployment Script

If you prefer to use the deployment script on the server:

Update the workflow's deploy step to:

```yaml
- name: Deploy to production server
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || 22 }}
    script: |
      cd /var/www/mscinemas
      ./deploy.sh
```

## Quick Reference

### Required GitHub Secrets:
- `SSH_HOST` - Server IP or domain
- `SSH_USER` - SSH username (usually `root`)
- `SSH_PRIVATE_KEY` - Private SSH key content
- `SSH_PORT` - SSH port (optional, default: 22)

### Workflow Triggers:
- Push to `main` or `master` branch
- Manual trigger from GitHub UI

### Deployment Process:
1. Build on GitHub
2. SSH to server
3. Pull code
4. Install dependencies
5. Build application
6. Restart PM2
7. Save PM2 config

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check server logs: `pm2 logs mscinemas-nextjs`
3. Verify SSH connection works manually
4. Check that all secrets are set correctly

---

**Last Updated:** January 2026
**Repository:** Khatri-Ran-Bahadur/mscinemaproduction
**Server:** mscinemas.my
