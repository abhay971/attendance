import { buildApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import bcrypt from 'bcrypt';

// Auto-seed database if no admin exists
async function autoSeed() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminExists) {
      console.log('⚠️  No admin user found. Creating default admin...');

      const adminPassword = await bcrypt.hash('admin123', 12);

      await prisma.user.create({
        data: {
          email: 'admin@attendance.com',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          department: 'Management',
          position: 'Administrator',
        },
      });

      console.log('✅ Default admin created!');
      console.log('   Email: admin@attendance.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    }
  } catch (error) {
    console.error('Auto-seed failed:', error);
  }
}

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Auto-seed before starting server
    await autoSeed();

    const app = await buildApp();

    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${config.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
