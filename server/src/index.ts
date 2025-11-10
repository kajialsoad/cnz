import app from './app';
import env from './config/env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function start() {
  try {
    if (!env.DEMO_MODE) {
      await prisma.$connect();
    }
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`Server listening on:`);
      console.log(`  - Local:   http://localhost:${env.PORT}`);
      console.log(`  - Network: http://10.236.50.46:${env.PORT}`);
      console.log(`\nServer is accessible from any device on your WiFi network!`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();