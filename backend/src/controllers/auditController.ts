import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { formatPaginatedResponse } from '../utils/helpers';

// Get audit logs
export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      table_name,
      action,
      start_date,
      end_date,
      record_id,
      sort_order = 'desc',
    } = req.query;
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user_id) {
      whereClause += ` AND al.user_id = $${paramIndex++}`;
      params.push(user_id);
    }
    
    if (table_name) {
      whereClause += ` AND al.table_name = $${paramIndex++}`;
      params.push(table_name);
    }
    
    if (action) {
      whereClause += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }
    
    if (start_date) {
      whereClause += ` AND al.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ` AND al.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (record_id) {
      whereClause += ` AND al.record_id = $${paramIndex++}`;
      params.push(record_id);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT al.*, u.full_name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${whereClause}
       ORDER BY al.created_at ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}

// Get audit logs for a specific record
export async function getRecordAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { table_name, record_id } = req.params;
    
    const result = await pool.query(
      `SELECT al.*, u.full_name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.table_name = $1 AND al.record_id = $2
       ORDER BY al.created_at DESC`,
      [table_name, record_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Get available table names for filtering
export async function getAuditTableNames(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT table_name FROM audit_logs ORDER BY table_name`
    );
    
    res.json(result.rows.map(r => r.table_name));
  } catch (error) {
    next(error);
  }
}

// Get audit statistics
export async function getAuditStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT table_name) as tables_affected
       FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '${Number(days)} days'`
    );
    
    // Get daily breakdown
    const dailyResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        action
       FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '${Number(days)} days'
       GROUP BY DATE(created_at), action
       ORDER BY date DESC`
    );
    
    res.json({
      summary: result.rows[0],
      daily: dailyResult.rows,
    });
  } catch (error) {
    next(error);
  }
}
