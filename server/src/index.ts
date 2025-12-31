import { buildApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

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
