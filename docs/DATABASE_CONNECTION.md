# Database Connection String

## Your PostgreSQL Connection String

Add this to your `.env.local` file:

```env
DATABASE_URL="postgres://8761e5529d2bd78663de9f439d8cfac77d5b1ae358e8dfe9cc3eff7d85156c8e:sk_h2b2Bj11mru1MalE1lvRN@db.prisma.io:5432/postgres?sslmode=require"
```

## Quick Setup Steps

1. **Create/Update `.env.local`** in the root directory with the connection string above

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Create database tables**:
   ```bash
   npx prisma db push
   ```

5. **Seed initial admin user**:
   ```bash
   npm run prisma:seed
   ```

6. **Verify connection** (optional):
   ```bash
   npx prisma studio
   ```

## Connection String Breakdown

- **Protocol**: `postgres://`
- **Username**: `8761e5529d2bd78663de9f439d8cfac77d5b1ae358e8dfe9cc3eff7d85156c8e`
- **Password**: `sk_h2b2Bj11mru1MalE1lvRN`
- **Host**: `db.prisma.io`
- **Port**: `5432`
- **Database**: `postgres`
- **SSL Mode**: `require` (secure connection)

## Important Notes

- ✅ This is a Prisma Data Platform connection string
- ✅ SSL is required (`sslmode=require`)
- ✅ Keep this connection string secure - don't commit it to version control
- ✅ The `.env.local` file should be in `.gitignore`

## Next Steps

After setting up the database connection:

1. Start your development server: `npm run dev`
2. Access admin panel: `http://localhost:3000/admin/login`
3. Use default credentials (from seed script):
   - Username: `admin`
   - Password: `admin123`

For more details, see `POSTGRESQL_SETUP.md` and `ADMIN_SETUP.md`.

