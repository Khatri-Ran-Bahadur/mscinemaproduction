# Admin Panel Setup Guide

This guide will help you set up the admin panel with PostgreSQL database.

## Step 1: Install Dependencies

```bash
npm install @prisma/client bcryptjs
npm install -D prisma @types/bcryptjs
```

## Step 2: Set Up PostgreSQL Database

You can use either:
- **Prisma Data Platform** (recommended for production)
- **Local PostgreSQL** (for development)

### Option A: Using Prisma Data Platform (Recommended)

1. **Get your connection string** from Prisma Data Platform
2. **Update `.env.local`** with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgres://username:password@host:5432/database?sslmode=require"
   ```
   
   Example (Prisma Data Platform):
   ```env
   DATABASE_URL="postgres://8761e5529d2bd78663de9f439d8cfac77d5b1ae358e8dfe9cc3eff7d85156c8e:sk_h2b2Bj11mru1MalE1lvRN@db.prisma.io:5432/postgres?sslmode=require"
   ```

### Option B: Using Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql@14`
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Linux: `sudo apt-get install postgresql postgresql-contrib` (Ubuntu/Debian)

2. **Create Database**:
   ```sql
   CREATE DATABASE ms_cinema_db;
   ```

3. **Update `.env.local`** with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ms_cinema_db"
   ```
   Replace:
   - `postgres` with your PostgreSQL username
   - `yourpassword` with your PostgreSQL password
   - `5432` with your PostgreSQL port (default is 5432)
   - `ms_cinema_db` with your database name

## Step 3: Initialize Prisma and Create Tables

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

## Step 4: Create Initial Admin User

You can create an admin user in one of these ways:

### Option A: Using Prisma Studio
1. Run `npx prisma studio`
2. Navigate to `admins` table
3. Click "Add record"
4. Fill in:
   - username: `admin`
   - email: `admin@mscinema.com`
   - password: (use the hash from seed script or API)
   - name: `Admin User`

### Option B: Using API (after setting up)
1. Go to `/admin/login`
2. Use default credentials (if seed script was run)
3. Or create via API endpoint

### Option C: Using Seed Script
Create a seed script to automatically create admin user on first setup.

## Step 5: Access Admin Panel

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/login`
3. Login with your admin credentials

## Database Models

### Admin
- Stores admin user credentials
- Fields: id, username, email, password (hashed), name

### Banner
- Stores banner images and settings
- Fields: id, image, type (normal/movie), movieId, title, description, link, order, isActive

### AboutContent
- Stores about page content sections
- Fields: id, section, title, content, image, order, isActive

## Production Recommendations

For production, consider:
- Use environment-specific database URLs
- Use strong admin passwords
- Enable SSL for database connections (use `?sslmode=require` in connection string)
- Regular database backups
- Use connection pooling (Prisma handles this automatically)
- Consider using managed PostgreSQL services:
  - **Prisma Data Platform** (recommended)
  - AWS RDS PostgreSQL
  - Google Cloud SQL for PostgreSQL
  - Heroku Postgres
  - Supabase
  - Railway

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `psql -U postgres` (local) or check Prisma Data Platform dashboard
- Check DATABASE_URL format in `.env.local`
- Ensure connection string includes `?sslmode=require` for secure connections
- For Prisma Data Platform, verify your connection string is correct
- Check PostgreSQL user permissions: `\du` (in psql)
- Test connection: `psql "your-connection-string"`

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync schema
- Check Prisma logs for detailed errors

