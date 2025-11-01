import app from './app';
import env from './config/env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function start() {
  try {
    if (!env.DEMO_MODE) {
      await prisma.$connect();
    }
    app.listen(env.PORT, () => {
      console.log(`Server listening on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();