import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

// Check if user has any of the required roles
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }
    
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.roles,
      });
      return;
    }
    
    next();
  };
}

// Check if user is super admin
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  
  if (!req.user.roles.includes('super_admin')) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED',
    });
    return;
  }
  
  next();
}

// Check if user is admin or super admin
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  
  const isAdmin = req.user.roles.some(role => 
    role === 'super_admin' || role === 'admin'
  );
  
  if (!isAdmin) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED',
    });
    return;
  }
  
  next();
}

// Check if user is teacher or above
export function requireTeacher(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  
  const isTeacher = req.user.roles.some(role => 
    role === 'super_admin' || role === 'admin' || role === 'teacher'
  );
  
  if (!isTeacher) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Teacher access required',
      code: 'TEACHER_REQUIRED',
    });
    return;
  }
  
  next();
}

// Check if user owns the resource or is admin
export function requireOwnerOrAdmin(ownerIdField: string = 'user_id') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }
    
    const isAdmin = req.user.roles.some(role => 
      role === 'super_admin' || role === 'admin'
    );
    
    if (isAdmin) {
      next();
      return;
    }
    
    // Check ownership from body or params
    const ownerId = req.body[ownerIdField] || req.params[ownerIdField];
    
    if (ownerId && ownerId !== req.user.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only modify your own resources',
        code: 'NOT_OWNER',
      });
      return;
    }
    
    next();
  };
}

// Check if sponsor can access child data
export function requireSponsorAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  
  // Admins and teachers can access all children
  const isStaff = req.user.roles.some(role => 
    role === 'super_admin' || role === 'admin' || role === 'teacher'
  );
  
  if (isStaff) {
    next();
    return;
  }
  
  // For sponsors, we'll check access in the controller
  // by verifying sponsorship exists
  next();
}
