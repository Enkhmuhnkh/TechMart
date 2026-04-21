import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, data: { message: 'Logged out' } });
}
