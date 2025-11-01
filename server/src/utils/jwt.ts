import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  sub: number;
  role: 'USER' | 'ADMIN';
}

export function signAccessToken(payload: JwtPayload) {
  const secret: Secret = env.JWT_ACCESS_SECRET as Secret;
  const options: SignOptions = { expiresIn: env.ACCESS_TTL as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const secret: Secret = env.JWT_REFRESH_SECRET as Secret;
  const options: SignOptions = { expiresIn: env.REFRESH_TTL as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as JwtPayload;
}