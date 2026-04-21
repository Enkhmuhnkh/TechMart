import { Request, Response, NextFunction } from 'express';
import { Errors } from '../shared/errors';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(Errors.UNAUTHORIZED());
  if (req.user.role !== 'admin') return next(Errors.FORBIDDEN());
  next();
}
