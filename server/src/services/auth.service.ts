import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const prisma = new PrismaClient();

export async function register(body: { name: string; phone: string; email?: string; password: string; }) {
  const existingPhone = await prisma.user.findUnique({ where: { phone: body.phone } });
  if (existingPhone) throw new Error('Phone already registered');
  if (body.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) throw new Error('Email already registered');
  }
  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: { name: body.name, phone: body.phone, email: body.email, passwordHash, role: Role.USER },
  });
  const payload = { sub: user.id, role: user.role as 'USER' | 'ADMIN' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });
  return { user, accessToken, refreshToken };
}

export async function login(phone: string, password: string) {
  // Demo mode: allow fixed credentials without DB
  if (process.env.DEMO_MODE === 'true' && phone === '01700000000' && password === '123456') {
    const payload = { sub: 1, role: 'USER' as const };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const user = {
      id: 1,
      name: 'Demo User',
      phone,
      email: null,
      role: Role.USER,
      verificationStatus: 'PENDING',
      nidImageUrl: null,
      createdAt: new Date(),
    } as any;
    return { user, accessToken, refreshToken };
  }
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new Error('Invalid credentials');
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  const payload = { sub: user.id, role: user.role as 'USER' | 'ADMIN' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });
  return { user, accessToken, refreshToken };
}

export async function refresh(refreshToken: string) {
  const tokenRow = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!tokenRow || tokenRow.revoked) throw new Error('Invalid refresh token');
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new Error('User not found');
  const accessToken = signAccessToken({ sub: user.id, role: user.role as 'USER' | 'ADMIN' });
  return { accessToken };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { revoked: true },
  }).catch(() => {});
}

export async function me(userId: number) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, phone: true, email: true, role: true, verificationStatus: true, nidImageUrl: true, createdAt: true } });
}