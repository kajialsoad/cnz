# Clean App Server (Express + Prisma + MySQL)

Backend for Flutter client with auth (register/login/refresh/logout/me).

## Stack
- Node.js (Express)
- Prisma (MySQL)
- TypeScript
- JWT (access + refresh)

## Setup
1. Copy `.env.example` to `.env` and set values
2. Install deps: `npm i`
3. Init Prisma: `npx prisma init` (already scaffolded here)
4. Migrate: `npx prisma migrate dev --name init`
5. Generate: `npx prisma generate`
6. Dev run: `npm run dev` (http://localhost:4000)

## Important ENV
- `DATABASE_URL` MySQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` strong secrets
- `ACCESS_TTL` e.g. `15m`, `REFRESH_TTL` e.g. `30d`
- `CORS_ORIGIN` e.g. `http://localhost:5500` (Flutter Web)

## API
- `POST /auth/register` { name, phone, email?, password }
- `POST /auth/login` { phone, password }
- `POST /auth/refresh` { refreshToken }
- `POST /auth/logout` { refreshToken }
- `GET /auth/me` Bearer access token