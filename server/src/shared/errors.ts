export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const Errors = {
  NOT_FOUND: (resource = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  UNAUTHORIZED: (msg = 'Unauthorized') =>
    new AppError(msg, 401, 'UNAUTHORIZED'),
  FORBIDDEN: () =>
    new AppError('Forbidden', 403, 'FORBIDDEN'),
  VALIDATION: (msg: string) =>
    new AppError(msg, 400, 'VALIDATION_ERROR'),
  CONFLICT: (msg: string) =>
    new AppError(msg, 409, 'CONFLICT'),
  INTERNAL: () =>
    new AppError('Internal server error', 500, 'INTERNAL_ERROR'),
};
