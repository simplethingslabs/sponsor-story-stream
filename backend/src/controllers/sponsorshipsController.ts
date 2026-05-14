import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AssignSponsorshipInput, SponsorshipQueryInput } from '../schemas/sponsorship';
import { formatPaginatedResponse } from '../utils/helpers';
import { createNotification } from '../services/notificationService';

// Get all sponsorships
export async function getSponsorships(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as SponsorshipQueryInput;
    const { page, limit, sponsor_id, child_id, status, sort_by, sort_order, include_deleted } = query;
    
    let whereClause = include_deleted ? '1=1' : 's.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (sponsor_id) {
      whereClause += ` AND s.sponsor_id = $${paramIndex++}`;
      params.push(sponsor_id);
    }
    
    if (child_id) {
      whereClause += ` AND s.child_id = $${paramIndex++}`;
      params.push(child_id);
    }
    
    if (status && status !== 'all') {
      whereClause += ` AND s.status = $${paramIndex++}`;
      params.push(status);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sponsorships s WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT s.*,
              u.full_name as sponsor_name, u.email as sponsor_email, u.avatar_url as sponsor_avatar,
              c.first_name || ' ' || c.last_name as child_name, c.photo_url as child_photo, c.grade as child_grade
       FROM sponsorships s
       JOIN users u ON s.sponsor_id = u.id
       JOIN children c ON s.child_id = c.id
       WHERE ${whereClause}
       ORDER BY s.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Assign sponsorship
export async function assignSponsorship(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as AssignSponsorshipInput;
    
    // Check if sponsorship already exists
    const existing = await pool.query(
      `SELECT id FROM sponsorships 
       WHERE sponsor_id = $1 AND child_id = $2 AND status = 'active' AND deleted_at IS NULL`,
      [data.sponsor_id, data.child_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Sponsorship already exists' });
    }
    
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO sponsorships (id, sponsor_id, child_id, start_date, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [id, data.sponsor_id, data.child_id, data.start_date || new Date().toISOString().split('T')[0]]
    );
    
    // Get full details
    const fullResult = await pool.query(
      `SELECT s.*,
              u.full_name as sponsor_name, u.email as sponsor_email,
              c.first_name || ' ' || c.last_name as child_name
       FROM sponsorships s
       JOIN users u ON s.sponsor_id = u.id
       JOIN children c ON s.child_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    
    const sponsorship = fullResult.rows[0];
    
    // Notify the sponsor about their new sponsorship
    await createNotification({
      userId: data.sponsor_id,
      type: 'sponsorship_assigned',
      title: 'New Sponsorship Assigned',
      message: `You are now sponsoring ${sponsorship.child_name}. Welcome to the family!`,
      link: `/sponsor/children/${data.child_id}`,
    });
    
    res.status(201).json(sponsorship);
  } catch (error) {
    next(error);
  }
}

// Remove sponsorship (end it)
export async function removeSponsorship(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { end_date } = req.body;
    
    const result = await pool.query(
      `UPDATE sponsorships 
       SET status = 'ended', end_date = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [end_date || new Date().toISOString().split('T')[0], id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Update sponsorship status
export async function updateSponsorship(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, end_date } = req.body;
    
    const result = await pool.query(
      `UPDATE sponsorships 
       SET status = COALESCE($1, status), 
           end_date = COALESCE($2, end_date),
           updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [status, end_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Batch assign sponsorships
export async function batchAssignSponsorships(req: Request, res: Response, next: NextFunction) {
  try {
    const { sponsorships } = req.body;
    const results: any[] = [];
    const errors: any[] = [];
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < sponsorships.length; i++) {
        try {
          const data = sponsorships[i];
          
          // Check if sponsorship already exists
          const existing = await client.query(
            `SELECT id FROM sponsorships 
             WHERE sponsor_id = $1 AND child_id = $2 AND status = 'active' AND deleted_at IS NULL`,
            [data.sponsor_id, data.child_id]
          );
          
          if (existing.rows.length > 0) {
            errors.push({ index: i, error: 'Sponsorship already exists' });
            continue;
          }
          
          const id = uuidv4();
          const result = await client.query(
            `INSERT INTO sponsorships (id, sponsor_id, child_id, start_date, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING *`,
            [id, data.sponsor_id, data.child_id, data.start_date || new Date().toISOString().split('T')[0]]
          );
          
          results.push(result.rows[0]);
        } catch (err: any) {
          errors.push({ index: i, error: err.message });
        }
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    res.status(201).json({
      created: results,
      errors,
      summary: {
        total: sponsorships.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Batch remove sponsorships
export async function batchRemoveSponsorships(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, end_date } = req.body;
    
    const result = await pool.query(
      `UPDATE sponsorships 
       SET status = 'ended', end_date = $1
       WHERE id = ANY($2) AND deleted_at IS NULL
       RETURNING id`,
      [end_date || new Date().toISOString().split('T')[0], ids]
    );
    
    res.json({
      ended: result.rows.map(r => r.id),
      summary: {
        requested: ids.length,
        ended: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
