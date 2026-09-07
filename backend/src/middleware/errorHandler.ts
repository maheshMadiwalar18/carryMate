import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found', code: 'ROUTE_NOT_FOUND' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongoose duplicate key
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      code: 'DUPLICATE_KEY',
    });
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: Object.values(err.errors || {}).map((e: any) => e.message),
    });
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV !== 'production' ? { debug: String(err?.message || err) } : {}),
  });
}

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
