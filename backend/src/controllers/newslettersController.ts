import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { CreateNewsletterInput, UpdateNewsletterInput, NewsletterQueryInput } from '../schemas/newsletter';
import { formatPaginatedResponse } from '../utils/helpers';

// Get all newsletters
export async function getNewsletters(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as NewsletterQueryInput;
    const { page, limit, search, start_date, end_date, sort_by, sort_order, include_deleted } = query;
    
    let whereClause = include_deleted ? '1=1' : 'n.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (n.title ILIKE $${paramIndex} OR n.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (start_date) {
      whereClause += ` AND n.published_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ` AND n.published_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM newsletters n WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT n.* FROM newsletters n
       WHERE ${whereClause}
       ORDER BY n.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Get single newsletter
export async function getNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM newsletters WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create newsletter
export async function createNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateNewsletterInput;
    const id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO newsletters (id, title, description, file_url, thumbnail_url, published_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        data.title,
        data.description || null,
        data.file_url,
        data.thumbnail_url || null,
        data.published_date || new Date().toISOString().split('T')[0],
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Update newsletter
export async function updateNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body as UpdateNewsletterInput;
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.file_url !== undefined) {
      fields.push(`file_url = $${paramIndex++}`);
      values.push(data.file_url);
    }
    if (data.thumbnail_url !== undefined) {
      fields.push(`thumbnail_url = $${paramIndex++}`);
      values.push(data.thumbnail_url);
    }
    if (data.published_date !== undefined) {
      fields.push(`published_date = $${paramIndex++}`);
      values.push(data.published_date);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const result = await pool.query(
      `UPDATE newsletters SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Delete newsletter (soft delete)
export async function deleteNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE newsletters 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Restore newsletter
export async function restoreNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE newsletters 
       SET deleted_at = NULL, deleted_by = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found or not deleted' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Batch delete newsletters
export async function batchDeleteNewsletters(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE newsletters 
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
