# GitHub Actions Deployment Guide

This project uses GitHub Actions to automatically deploy to the production server via SSH.

## Setup Instructions

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Required Secrets:

1. **SSH_HOST**
   - Value: `72.62.72.191`
   - Description: The IP address or hostname of your production server

2. **SSH_USERNAME**
   - Value: `root`
   - Description: SSH username for server access

3. **SSH_KEY**
   - Value: Your private SSH key content (the entire key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
   - Description: Private SSH key for authentication
   - **How to get your SSH key:**
     ```bash
     # If you don't have an SSH key, generate one:
     ssh-keygen -t ed25519 -C "github-actions"
     
     # Copy the private key content:
     cat ~/.ssh/id_ed25519
     ```
   - **Important:** Add the corresponding public key to the server:
     ```bash
     # On your local machine, copy the public key:
     ssh-copy-id -p 22 root@72.62.72.191
     # Or manually add it to ~/.ssh/authorized_keys on the server
     ```

4. **SSH_PORT** (Optional)
   - Value: `22`
   - Description: SSH port (defaults to 22 if not provided)

5. **DATABASE_URL** (Required for Prisma)
   - Value: Your database connection string
   - Description: PostgreSQL connection URL for Prisma
   - Format: `postgresql://user:password@host:port/database`

### 2. Workflow Triggers

The deployment workflow will automatically trigger when:
- Code is pushed to `main` or `master` branch
- Manually triggered from GitHub Actions tab (workflow_dispatch)

### 3. Deployment Process

The workflow performs the following steps:

1. ✅ Checks out the code
2. ✅ Sets up Node.js environment
3. ✅ Installs dependencies
4. ✅ Generates Prisma client
5. ✅ Builds the Next.js application
6. ✅ Connects to server via SSH
7. ✅ Pulls latest code from repository
8. ✅ Installs dependencies on server
9. ✅ Generates Prisma client on server
10. ✅ Builds the application on server
11. ✅ Restarts PM2 process
12. ✅ Verifies deployment status

### 4. Server Requirements

Ensure your server has:
- ✅ Node.js 20+ installed
- ✅ npm installed
- ✅ PM2 installed globally (`npm install -g pm2`)
- ✅ Git installed
- ✅ SSH access configured
- ✅ The repository cloned at `/var/www/mscinemas`
- ✅ Proper file permissions for the deployment directory

### 5. Troubleshooting

#### SSH Connection Issues
- Verify SSH key is correctly added to GitHub secrets
- Ensure public key is in `~/.ssh/authorized_keys` on server
- Test SSH connection manually: `ssh -p 22 root@72.62.72.191`

#### Build Failures
- Check GitHub Actions logs for specific error messages
- Verify all environment variables are set correctly
- Ensure database is accessible from the server

#### PM2 Issues
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs mscinemas-nextjs`
- Restart manually: `pm2 restart mscinemas-nextjs`

### 6. Manual Deployment

If you need to deploy manually:

```bash
ssh root@72.62.72.191
cd /var/www/mscinemas
git pull origin main
npm ci
npm run prisma:generate
npm run build
pm2 restart mscinemas-nextjs
```

