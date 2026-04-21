import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unexpected errors
  logger.error('Unexpected error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    },
  });
}
