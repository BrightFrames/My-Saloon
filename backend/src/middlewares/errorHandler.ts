import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/ApiError';
import { env } from '../config/env';

/**
 * Global Error Handler Middleware
 * Formats responses securely and consistently
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any[] | undefined = undefined;

  // Handle expected errors (our custom ApiError)
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  }
  // Let Zod validation shape if unexpected ZodError comes through
  else if (err.name === 'ZodError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    // @ts-ignore
    details = err.errors; 
  }
  // General fallback
  else {
    // Log unexpected errors, don't expose them!
    console.error(`[Unhandled Error] ${err.name}: ${err.message}\n${err.stack}`);
    
    // In dev, expose actual message
    if (env.NODE_ENV === 'development') {
      message = err.message;
    }
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && details.length > 0 ? { details } : {})
    }
  };

  res.status(statusCode).json(response);
};

/**
 * Route Not Found Middleware 
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
