declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    EMAIL_HOST: string;
    EMAIL_PORT: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    EMAIL_FROM: string;
    FRONTEND_URL: string;
    ACCESS_TTL: number;
    REFRESH_TTL: number;
    PASSWORD_RESET_TTL: number;
    EMAIL_VERIFICATION_TTL: number;
    BCRYPT_ROUNDS: number;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
  }
}