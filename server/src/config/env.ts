import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
  ACCESS_TTL: process.env.ACCESS_TTL ?? '15m',
  REFRESH_TTL: process.env.REFRESH_TTL ?? '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  DEMO_MODE: (process.env.DEMO_MODE === 'true'),
};

export default env;