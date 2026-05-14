import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { CreateChildInput, UpdateChildInput, ChildQueryInput } from '../schemas/child';
import { formatPaginatedResponse } from '../utils/helpers';

// Get all children with pagination and filters
export async function getChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ChildQueryInput;
    const { page, limit, search, status, grade, sort_by, sort_order, include_deleted } = query;
    
    let whereClause = include_deleted ? '1=1' : 'c.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status && status !== 'all') {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (grade) {
      whereClause += ` AND c.grade = $${paramIndex}`;
      params.push(grade);
      paramIndex++;
    }
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM children c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT c.*, 
              COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_sponsorships
       FROM children c
       LEFT JOIN sponsorships s ON c.id = s.child_id AND s.deleted_at IS NULL
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY c.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Get single child
export async function getChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*,
              json_agg(
                json_build_object(
                  'id', s.id,
                  'sponsor_id', s.sponsor_id,
                  'sponsor_name', u.full_name,
                  'sponsor_email', u.email,
                  'start_date', s.start_date,
                  'status', s.status
                )
              ) FILTER (WHERE s.id IS NOT NULL) as sponsorships
       FROM children c
       LEFT JOIN sponsorships s ON c.id = s.child_id AND s.deleted_at IS NULL
       LEFT JOIN users u ON s.sponsor_id = u.id
       WHERE c.id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create child
export async function createChild(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateChildInput;
    const id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO children (id, first_name, last_name, date_of_birth, grade, photo_url, enrollment_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.grade,
        data.photo_url || null,
        data.enrollment_date || new Date().toISOString().split('T')[0],
        data.status || 'active',
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Update child
export async function updateChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body as UpdateChildInput;
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name);
    }
    if (data.date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex++}`);
      values.push(data.date_of_birth);
    }
    if (data.grade !== undefined) {
      fields.push(`grade = $${paramIndex++}`);
      values.push(data.grade);
    }
    if (data.photo_url !== undefined) {
      fields.push(`photo_url = $${paramIndex++}`);
      values.push(data.photo_url);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const result = await pool.query(
      `UPDATE children 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Soft delete child
export async function deleteChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `UPDATE children 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Restore soft-deleted child
export async function restoreChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE children 
       SET deleted_at = NULL, deleted_by = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found or not deleted' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Batch create children
export async function batchCreateChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const { children } = req.body;
    const results: any[] = [];
    const errors: any[] = [];
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < children.length; i++) {
        try {
          const data = children[i];
          const id = uuidv4();
          
          const result = await client.query(
            `INSERT INTO children (id, first_name, last_name, date_of_birth, grade, photo_url, enrollment_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
              id,
              data.first_name,
              data.last_name,
              data.date_of_birth,
              data.grade,
              data.photo_url || null,
              data.enrollment_date || new Date().toISOString().split('T')[0],
              data.status || 'active',
            ]
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
        total: children.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Batch delete children
export async function batchDeleteChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `UPDATE children 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = ANY($2) AND deleted_at IS NULL
       RETURNING id`,
      [userId, ids]
    );
    
    res.json({
      deleted: result.rows.map(r => r.id),
      summary: {
        requested: ids.length,
        deleted: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get children for a sponsor
export async function getChildrenForSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsorId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sponsorships s
       WHERE s.sponsor_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL`,
      [sponsorId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT c.*, s.start_date as sponsorship_start_date, s.id as sponsorship_id
       FROM children c
       JOIN sponsorships s ON c.id = s.child_id
       WHERE s.sponsor_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL AND c.deleted_at IS NULL
       ORDER BY s.start_date DESC
       LIMIT $2 OFFSET $3`,
      [sponsorId, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}
