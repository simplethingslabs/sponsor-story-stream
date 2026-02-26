import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  
  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.details = details;
    this.name = 'ApiError';
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message: string, code?: string, details?: unknown): ApiError {
    return new ApiError(400, message, code || 'BAD_REQUEST', details);
  }
  
  static unauthorized(message: string, code?: string): ApiError {
    return new ApiError(401, message, code || 'UNAUTHORIZED');
  }
  
  static forbidden(message: string, code?: string): ApiError {
    return new ApiError(403, message, code || 'FORBIDDEN');
  }
  
  static notFound(message: string, code?: string): ApiError {
    return new ApiError(404, message, code || 'NOT_FOUND');
  }
  
  static conflict(message: string, code?: string): ApiError {
    return new ApiError(409, message, code || 'CONFLICT');
  }
  
  static internal(message: string, code?: string): ApiError {
    return new ApiError(500, message, code || 'INTERNAL_ERROR');
  }
}

// Global error handler
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });
  
  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }
  
  // Handle PostgreSQL errors
  if ((err as unknown as Record<string, unknown>).code) {
    const pgError = err as unknown as Record<string, unknown>;
    
    // Unique violation
    if (pgError.code === '23505') {
      res.status(409).json({
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        details: pgError.detail,
      });
      return;
    }
    
    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        error: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
        details: pgError.detail,
      });
      return;
    }
    
    // Not null violation
    if (pgError.code === '23502') {
      res.status(400).json({
        error: 'Required field is missing',
        code: 'NOT_NULL_VIOLATION',
        details: pgError.column,
      });
      return;
    }
    
    // Check violation
    if (pgError.code === '23514') {
      res.status(400).json({
        error: 'Value violates constraint',
        code: 'CHECK_VIOLATION',
        details: pgError.constraint,
      });
      return;
    }
  }
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
    return;
  }
  
  // Default to 500 internal server error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Not found handler
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
}
