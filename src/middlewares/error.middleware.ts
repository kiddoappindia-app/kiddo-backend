import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

export function notFoundMiddleware(_req: Request, res: Response) {
  return res.status(StatusCodes.NOT_FOUND).json({
    message: 'Route not found',
  });
}

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: error.flatten(),
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  // Log unhandled errors — critical for production debugging
  console.error(`[ERROR] Unhandled exception on ${_req.method} ${_req.path}:`, error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error',
  });
}
