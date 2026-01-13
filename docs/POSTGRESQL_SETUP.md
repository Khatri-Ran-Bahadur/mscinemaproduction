# PostgreSQL Database Setup

This project uses PostgreSQL with Prisma ORM. Follow these steps to set up your database connection.

## Quick Setup

1. **Add your PostgreSQL connection string to `.env.local`**:

```env
DATABASE_URL="postgres://8761e5529d2bd78663de9f439d8cfac77d5b1ae358e8dfe9cc3eff7d85156c8e:sk_h2b2Bj11mru1MalE1lvRN@db.prisma.io:5432/postgres?sslmode=require"
```

2. **Initialize Prisma**:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# (Optional) Seed initial admin user
npm run prisma:seed
```

3. **Verify connection**:

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

## Connection String Format

### Prisma Data Platform
```
postgres://USERNAME:PASSWORD@db.prisma.io:5432/DATABASE?sslmode=require
```

### Local PostgreSQL
```
postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE
```

### With SSL (Production)
```
postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

## Environment Variables

Create or update `.env.local` in the root directory:

```env
# PostgreSQL Database Connection
DATABASE_URL="postgres://8761e5529d2bd78663de9f439d8cfac77d5b1ae358e8dfe9cc3eff7d85156c8e:sk_h2b2Bj11mru1MalE1lvRN@db.prisma.io:5432/postgres?sslmode=require"

# Email Configuration (for email APIs)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_KEY=ensdjkfdsfjskfssdfshdkfhksjfsdkfjhsdf
NEXT_PUBLIC_USE_LIVE_API=false

# Admin Default Credentials (for seed script)
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=admin123
ADMIN_DEFAULT_EMAIL=admin@mscinema.com
```

## Database Schema

The following tables will be created:

1. **admins** - Admin user accounts
2. **banners** - Homepage banners
3. **about_content** - About page content sections

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate
# or
npx prisma generate

# Push schema changes to database
npm run prisma:push
# or
npx prisma db push

# Open Prisma Studio (database GUI)
npm run prisma:studio
# or
npx prisma studio

# Seed database with initial data
npm run prisma:seed
# or
npx prisma db seed
```

## Troubleshooting

### Connection Refused
- Verify your connection string is correct
- Check if PostgreSQL server is running (for local)
- Verify network access (for remote/cloud databases)
- Check firewall settings

### SSL/TLS Errors
- Add `?sslmode=require` to connection string
- For development, you can use `?sslmode=prefer` (less secure)

### Authentication Failed
- Verify username and password in connection string
- Check database user permissions
- For Prisma Data Platform, ensure your connection string is up to date

### Schema Sync Issues
- Run `npx prisma generate` after schema changes
- Use `npx prisma db push` for development (non-migrated changes)
- For production, use migrations: `npx prisma migrate dev`

## Next Steps

After setting up the database:

1. **Create initial admin user**:
   ```bash
   npm run prisma:seed
   ```

2. **Access admin panel**:
   - Go to: `http://localhost:3000/admin/login`
   - Use default credentials (from seed script) or create new admin

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Production Considerations

- Use environment-specific connection strings
- Enable SSL/TLS (`sslmode=require`)
- Use connection pooling (Prisma handles this)
- Set up regular backups
- Monitor database performance
- Use read replicas for scaling (if needed)

