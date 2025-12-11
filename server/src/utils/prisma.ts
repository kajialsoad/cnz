import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Append connection_limit to DATABASE_URL if not present
const url = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=5'
  : undefined;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;