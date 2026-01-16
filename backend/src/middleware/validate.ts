import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validate request body against a Zod schema
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      
      next(error);
    }
  };
}

// Validate request query parameters
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      
      next(error);
    }
  };
}

// Validate request params
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid URL parameters',
          code: 'PARAMS_VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      
      next(error);
    }
  };
}

// Combined validation
export function validate<B, Q, P>(schemas: {
  body?: ZodSchema<B>;
  query?: ZodSchema<Q>;
  params?: ZodSchema<P>;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ location: string; field: string; message: string }> = [];
    
    if (schemas.body) {
      try {
        req.body = schemas.body.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach(err => {
            errors.push({
              location: 'body',
              field: err.path.join('.'),
              message: err.message,
            });
          });
        }
      }
    }
    
    if (schemas.query) {
      try {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach(err => {
            errors.push({
              location: 'query',
              field: err.path.join('.'),
              message: err.message,
            });
          });
        }
      }
    }
    
    if (schemas.params) {
      try {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach(err => {
            errors.push({
              location: 'params',
              field: err.path.join('.'),
              message: err.message,
            });
          });
        }
      }
    }
    
    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }
    
    next();
  };
}

// Sanitize HTML input to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// UUID validation regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
