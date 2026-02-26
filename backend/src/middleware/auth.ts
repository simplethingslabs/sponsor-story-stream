import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthenticatedRequest, JWTPayload, UserPublic, User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token and attach user to request
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        code: 'NO_TOKEN',
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Fetch user from database
    const { rows } = await query<User>(
      `SELECT id, email, full_name, phone, avatar_url, roles, is_active, created_at, updated_at
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );
    
    if (rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }
    
    const user = rows[0];
    
    if (!user.is_active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      roles: user.roles,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    } as UserPublic;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    const { rows } = await query<User>(
      `SELECT id, email, full_name, phone, avatar_url, roles, is_active, created_at, updated_at
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL AND is_active = true`,
      [decoded.userId]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        roles: user.roles,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      } as UserPublic;
      req.userId = user.id;
    }
  } catch {
    // Ignore token errors for optional auth
  }
  
  next();
}

// Generate access token
export function generateAccessToken(user: UserPublic): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    roles: user.roles,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string & jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
}

// Generate refresh token
export function generateRefreshToken(user: UserPublic): string {
  const payload = {
    userId: user.id,
    type: 'refresh',
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string & jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
