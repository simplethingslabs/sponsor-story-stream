import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest, AuditLog } from '../types';
import { generateId } from '../utils/helpers';

// Tables that should be audited
const AUDITED_TABLES = [
  'users',
  'children',
  'sponsorships',
  'progress_reports',
  'newsletters',
  'events',
  'pending_registrations',
  'sponsor_invitations',
];

// Create audit log entry
export async function createAuditLog(
  userId: string | undefined,
  action: 'create' | 'update' | 'delete' | 'restore',
  tableName: string,
  recordId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        generateId(),
        userId || null,
        action,
        tableName,
        recordId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

// Middleware to attach audit helper to request
export function auditMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Attach audit helper to request
  (req as AuthenticatedRequest & { audit: typeof auditHelper }).audit = {
    create: (tableName: string, recordId: string, newData: Record<string, unknown>) =>
      createAuditLog(req.userId, 'create', tableName, recordId, undefined, newData, ipAddress, userAgent),
    
    update: (tableName: string, recordId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
      createAuditLog(req.userId, 'update', tableName, recordId, oldData, newData, ipAddress, userAgent),
    
    delete: (tableName: string, recordId: string, oldData: Record<string, unknown>) =>
      createAuditLog(req.userId, 'delete', tableName, recordId, oldData, undefined, ipAddress, userAgent),
    
    restore: (tableName: string, recordId: string, newData: Record<string, unknown>) =>
      createAuditLog(req.userId, 'restore', tableName, recordId, undefined, newData, ipAddress, userAgent),
  };
  
  next();
}

// Audit helper type
const auditHelper = {
  create: async (_tableName: string, _recordId: string, _newData: Record<string, unknown>) => {},
  update: async (_tableName: string, _recordId: string, _oldData: Record<string, unknown>, _newData: Record<string, unknown>) => {},
  delete: async (_tableName: string, _recordId: string, _oldData: Record<string, unknown>) => {},
  restore: async (_tableName: string, _recordId: string, _newData: Record<string, unknown>) => {},
};

// Extend request type
declare global {
  namespace Express {
    interface Request {
      audit?: typeof auditHelper;
    }
  }
}

// Get audit logs for a specific record
export async function getRecordHistory(
  tableName: string,
  recordId: string
): Promise<AuditLog[]> {
  const { rows } = await query<AuditLog>(
    `SELECT * FROM audit_logs 
     WHERE table_name = $1 AND record_id = $2 
     ORDER BY created_at DESC`,
    [tableName, recordId]
  );
  return rows;
}

// Get all audit logs with pagination
export async function getAuditLogs(options: {
  page: number;
  limit: number;
  userId?: string;
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: AuditLog[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;
  
  if (options.userId) {
    conditions.push(`user_id = $${paramIndex}`);
    params.push(options.userId);
    paramIndex++;
  }
  
  if (options.tableName) {
    conditions.push(`table_name = $${paramIndex}`);
    params.push(options.tableName);
    paramIndex++;
  }
  
  if (options.action) {
    conditions.push(`action = $${paramIndex}`);
    params.push(options.action);
    paramIndex++;
  }
  
  if (options.startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(options.startDate);
    paramIndex++;
  }
  
  if (options.endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(options.endDate);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data
  const offset = (options.page - 1) * options.limit;
  const { rows } = await query<AuditLog>(
    `SELECT al.*, u.full_name as user_name, u.email as user_email
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, options.limit, offset]
  );
  
  return { data: rows, total };
}

export { AUDITED_TABLES };
