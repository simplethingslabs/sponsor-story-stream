import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { formatPaginatedResponse } from '../utils/helpers';

// Get all sponsors with pagination
export async function getSponsors(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search, status, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    let whereClause = `ur.role = 'sponsor' AND u.deleted_at IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT u.id) FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.phone, u.created_at, u.updated_at,
              COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_sponsorships,
              COUNT(DISTINCT s.id) as total_sponsorships
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN sponsorships s ON u.id = s.sponsor_id AND s.deleted_at IS NULL
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY u.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}

// Get single sponsor
export async function getSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.phone, u.created_at, u.updated_at,
              json_agg(
                json_build_object(
                  'id', s.id,
                  'child_id', s.child_id,
                  'child_name', c.first_name || ' ' || c.last_name,
                  'child_photo', c.photo_url,
                  'start_date', s.start_date,
                  'status', s.status
                )
              ) FILTER (WHERE s.id IS NOT NULL) as sponsorships
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN sponsorships s ON u.id = s.sponsor_id AND s.deleted_at IS NULL
       LEFT JOIN children c ON s.child_id = c.id
       WHERE u.id = $1 AND ur.role = 'sponsor' AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Update sponsor
export async function updateSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar_url } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, email, full_name, avatar_url, phone, created_at, updated_at`,
      [full_name, phone, avatar_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Delete sponsor (soft delete)
export async function deleteSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    // End all active sponsorships first
    await pool.query(
      `UPDATE sponsorships 
       SET status = 'ended', end_date = NOW(), deleted_at = NOW(), deleted_by = $1
       WHERE sponsor_id = $2 AND status = 'active'`,
      [userId, id]
    );
    
    // Soft delete user
    const result = await pool.query(
      `UPDATE users 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    
    res.json({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get sponsor statistics
export async function getSponsorStats(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsorId = req.user?.userId;
    
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT s.child_id) FILTER (WHERE s.status = 'active') as active_children,
        COUNT(DISTINCT pr.id) as total_reports,
        COUNT(DISTINCT pr.id) FILTER (WHERE pr.created_at > NOW() - INTERVAL '30 days') as recent_reports,
        (SELECT COUNT(*) FROM newsletters WHERE deleted_at IS NULL) as total_newsletters,
        (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL AND event_date > NOW()) as upcoming_events
       FROM sponsorships s
       LEFT JOIN progress_reports pr ON s.child_id = pr.child_id AND pr.status = 'published' AND pr.deleted_at IS NULL
       WHERE s.sponsor_id = $1 AND s.deleted_at IS NULL`,
      [sponsorId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
