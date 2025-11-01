import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await AuthService.register(body);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', issues: err.issues });
    }
    return res.status(400).json({ message: err?.message ?? 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await AuthService.login(body.phone, body.password);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ message: err?.message ?? 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });
    const result = await AuthService.refresh(refreshToken);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ message: err?.message ?? 'Refresh failed' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await AuthService.logout(refreshToken);
    return res.status(200).json({ message: 'ok' });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? 'Logout failed' });
  }
}

import { AuthRequest } from '../middlewares/auth.middleware';
export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await AuthService.me(req.user.sub);
    return res.status(200).json({ user });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? 'Failed to load user' });
  }
}