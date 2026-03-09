# Cloudflare Tunnel Documentation

## Overview
This document describes the setup for the Cloudflare Tunnel used to expose the local Next.js development environment to the public internet via `staging.mscinemas.my`.

## Tunnel Information
- **Tunnel Name**: `mscinemas-staging`
- **Tunnel ID**: `18c54d7f-2ac0-4b94-a2ed-30526fc0028a`
- **Credentials File**: `/Users/rnkhatri/.cloudflared/18c54d7f-2ac0-4b94-a2ed-30526fc0028a.json`
- **Public Domain**: `staging.mscinemas.my`
- **Local Service**: `http://localhost:3000`

## Configuration (`config.yml`)
The tunnel is configured using a `config.yml` file in the project root:
```yaml
tunnel: 18c54d7f-2ac0-4b94-a2ed-30526fc0028a
credentials-file: /Users/rnkhatri/.cloudflared/18c54d7f-2ac0-4b94-a2ed-30526fc0028a.json

ingress:
  - hostname: staging.mscinemas.my
    service: http://localhost:3000
  - service: http_status:404
```

## Setup & Maintenance Commands

### 1. Start Initial Setup
```bash
# Login to Cloudflare (Select mscinemas.my)
cloudflared tunnel login

# Create the tunnel
cloudflared tunnel create mscinemas-staging
```

### 2. Route DNS
This connects your subdomain to the tunnel ID:
```bash
cloudflared tunnel route dns mscinemas-staging staging.mscinemas.my
```

### 3. Run the Tunnel
Keep this command running in your terminal to keep the site live:
```bash
cloudflared tunnel --config ./config.yml run mscinemas-staging
```

## Troubleshooting Error 1016
Error 1016 (Origin DNS error) indicates that Cloudflare is unable to resolve the tunnel connection.

**Solutions:**
1. **Wait for DNS Propagation**: It can take 1-5 minutes for the CNAME record to become active throughout Cloudflare's network.
2. **Re-route DNS**: Run the `route dns` command again.
3. **Check Cloudflare Dashboard**: Ensure there are no manually created A or CNAME records for `staging` that might conflict with the tunnel-generated record.
4. **Restart the Tunnel**: Stop the running tunnel command and restart it.
<!-- cloudflared tunnel --config ./config.yml run mscinemas-staging -->