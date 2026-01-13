/**
 * Prisma Seed Script
 * Creates initial admin user
 * Run with: npx prisma db seed or npm run prisma:seed
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please add DATABASE_URL to your .env.local file');
  process.exit(1);
}

// Prisma reads connection string from DATABASE_URL environment variable
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Starting seed...');

  // Create default admin user
  const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@mscinema.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.admin.create({
    data: {
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrator'
    }
  });

  console.log('✅ Created admin user:', admin.username);
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password:', adminPassword);
  console.log('⚠️  Please change the default password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

