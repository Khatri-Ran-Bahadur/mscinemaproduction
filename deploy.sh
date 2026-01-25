#!/bin/bash

# Quick Deployment Script for MSCinemas Next.js Application
# Usage: ./deploy.sh [options]

set -e

APP_DIR="/var/www/mscinemas"
APP_NAME="mscinemas-nextjs"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}MSCinemas Deployment Script${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: Running this script on the server uses 100% CPU!${NC}"
echo -e "${YELLOW}>> We have set up GitHub Actions to build automatically.${NC}"
echo -e "${YELLOW}>> Just git push your changes instead of running this script.${NC}"
echo -e "${YELLOW}>> If you MUST run this, expect downtime during build.${NC}"
echo ""
sleep 3

# Navigate to app directory
cd $APP_DIR

# Check if git pull is needed
if [ "$1" == "--pull" ] || [ "$1" == "-p" ]; then
    echo -e "${YELLOW}[1/5] Pulling latest changes from Git...${NC}"
    git pull origin main || git pull origin master
    echo ""
fi

# Install dependencies if needed
if [ "$1" == "--install" ] || [ "$1" == "-i" ] || [ "$1" == "--full" ] || [ "$1" == "-f" ]; then
    echo -e "${YELLOW}[2/5] Installing/updating dependencies...${NC}"
    npm install
    echo ""
fi

# Build the application
echo -e "${YELLOW}[3/5] Building Next.js application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
    
    # Prepare Standalone Build
    echo -e "${YELLOW}[3.5/5] Preparing Standalone Build artifacts...${NC}"
    # Ensure destination directories exist
    mkdir -p .next/standalone/.next/static
    mkdir -p .next/standalone/public
    
    # Copy static assets
    echo "Copying static files..."
    cp -r .next/static/* .next/standalone/.next/static/
    cp -r public/* .next/standalone/public/
    
    echo -e "${GREEN}✓ Standalone build prepared${NC}"
else
    echo -e "${RED}✗ Build failed. Please check the errors above.${NC}"
    exit 1
fi
echo ""

# Restart PM2 application
echo -e "${YELLOW}[4/5] Restarting PM2 application...${NC}"
pm2 restart $APP_NAME --update-env

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Application restarted successfully${NC}"
else
    echo -e "${RED}✗ Failed to restart application${NC}"
    exit 1
fi
echo ""

# Save PM2 configuration
echo -e "${YELLOW}[5/5] Saving PM2 configuration...${NC}"
pm2 save
echo ""

# Show status
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Application Status:"
pm2 status $APP_NAME
echo ""
echo "To view logs, run: pm2 logs $APP_NAME"
echo "To monitor, run: pm2 monit"
