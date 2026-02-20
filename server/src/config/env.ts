import dotenv from 'dotenv';
dotenv.config();

// Support multiple origins via comma-separated env (CORS_ORIGINS),
// falling back to single CORS_ORIGIN or '*'.
const rawCorsOrigins = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '*';
const CORS_ORIGINS = rawCorsOrigins.split(',').map((s) => s.trim()).filter(Boolean);

const env = {
  PORT: Number(process.env.PORT ?? 4000),
  APP_URL: process.env.APP_URL ?? 'http://localhost:4000',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
  ACCESS_TTL: process.env.ACCESS_TTL ?? '7d', // Changed from 15m to 7d for mobile
  REFRESH_TTL: process.env.REFRESH_TTL ?? '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  CORS_ORIGINS,
  DEMO_MODE: (process.env.DEMO_MODE === 'true'),

  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? 'noreply@cleancare.com',

  // Client URL
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',

  // Password Reset Token TTL
  PASSWORD_RESET_TTL: process.env.PASSWORD_RESET_TTL ?? '1h',
  EMAIL_VERIFICATION_TTL: process.env.EMAIL_VERIFICATION_TTL ?? '24h',
  EMAIL_VERIFICATION_ENABLED: process.env.EMAIL_VERIFICATION_ENABLED === 'true',
  PHONE_VERIFICATION_ENABLED: process.env.PHONE_VERIFICATION_ENABLED === 'true',

  // TTL in seconds for calculations
  ACCESS_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days (increased for mobile app)
  REFRESH_TTL_SECONDS: 30 * 24 * 60 * 60, // 30 days
  PASSWORD_RESET_TTL_SECONDS: 60 * 60, // 1 hour
  EMAIL_VERIFICATION_TTL_SECONDS: 24 * 60 * 60, // 24 hours
};

export default env;