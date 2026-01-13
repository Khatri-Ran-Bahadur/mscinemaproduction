# Email Configuration Setup Guide

This guide will help you set up email functionality for activation and password reset emails.

## Installation

First, install the nodemailer package:

```bash
npm install nodemailer
```

## Environment Variables

Create a `.env.local` file in the root of your project (or update your existing `.env.local` file) with the following email configuration:

### Option 1: Generic SMTP (Recommended)

```env
# Email Configuration - SMTP
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_REJECT_UNAUTHORIZED=true

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_KEY=ensdjkfdsfjskfssdfshdkfhksjfsdkfjhsdf
```

### Option 2: Gmail (Simplified)

```env
# Email Configuration - Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_KEY=ensdjkfdsfjskfssdfshdkfhksjfsdkfjhsdf
```

**Note for Gmail:** You need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular Gmail password. Enable 2-Step Verification first, then generate an App Password.

### Option 3: SendGrid

```env
# Email Configuration - SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_KEY=ensdjkfdsfjskfssdfshdkfhksjfsdkfjhsdf
```

### Option 4: Custom SMTP Server

```env
# Email Configuration - Custom SMTP
EMAIL_SERVICE=smtp
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REJECT_UNAUTHORIZED=true

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_KEY=ensdjkfdsfjskfssdfshdkfhksjfsdkfjhsdf
```

## Environment Variables Explained

- **EMAIL_SERVICE**: Email service provider (`smtp`, `gmail`, or `sendgrid`)
- **EMAIL_HOST**: SMTP server hostname (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
- **EMAIL_PORT**: SMTP port (usually `587` for TLS or `465` for SSL)
- **EMAIL_SECURE**: Use SSL/TLS (`true` for port 465, `false` for port 587)
- **EMAIL_USER**: Your email address or SMTP username
- **EMAIL_PASSWORD**: Your email password or App Password (for Gmail) or API key (for SendGrid)
- **EMAIL_FROM**: The "From" email address (can be same as EMAIL_USER)
- **EMAIL_REJECT_UNAUTHORIZED**: Reject self-signed certificates (`true` for production, `false` for testing)
- **NEXT_PUBLIC_BASE_URL**: Your application's base URL (used in email links)
- **NEXT_PUBLIC_ENCRYPTION_KEY**: Encryption key for user IDs in email links

## Testing Email Configuration

After setting up your `.env.local` file, restart your Next.js development server:

```bash
npm run dev
```

Then test the email functionality by:
1. Registering a new user (activation email will be sent)
2. Requesting a password reset (reset email will be sent)

## Common Email Providers

### Gmail
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Requires**: App Password (not regular password)

### Outlook/Hotmail
- **Host**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Requires**: Regular password

### Yahoo
- **Host**: `smtp.mail.yahoo.com`
- **Port**: `587` or `465`
- **Requires**: App Password

### SendGrid
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Requires**: API Key (set as `SENDGRID_API_KEY`)

## Troubleshooting

### Email not sending
1. Check that all environment variables are set correctly
2. Verify your email credentials are correct
3. For Gmail, ensure you're using an App Password, not your regular password
4. Check your firewall/network settings (some networks block SMTP ports)
5. Check server logs for error messages

### Gmail "Less secure app" error
- Gmail no longer supports "less secure apps"
- You must use an App Password instead
- Enable 2-Step Verification, then generate an App Password

### Self-signed certificate error
- Set `EMAIL_REJECT_UNAUTHORIZED=false` for testing
- For production, use a valid SSL certificate

## Security Notes

1. **Never commit `.env.local` to version control** - it's already in `.gitignore`
2. Use App Passwords for Gmail instead of your main password
3. Use environment-specific configurations (development vs production)
4. Rotate passwords/API keys regularly
5. Use strong encryption keys for `NEXT_PUBLIC_ENCRYPTION_KEY`

## Production Deployment

For production, set these environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- AWS: Use AWS SES or environment variables in your deployment
- Other platforms: Follow their environment variable configuration guide

Make sure to:
- Use production email service credentials
- Set `NEXT_PUBLIC_BASE_URL` to your production domain
- Use a secure encryption key
- Enable proper SSL/TLS settings

