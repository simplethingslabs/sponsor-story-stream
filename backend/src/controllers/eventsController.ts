import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { CreateEventInput, UpdateEventInput, EventQueryInput } from '../schemas/event';
import { formatPaginatedResponse } from '../utils/helpers';
import { notifyAllSponsors } from '../services/notificationService';

// Get all events
export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as EventQueryInput;
    const { page, limit, search, start_date, end_date, sort_by, sort_order, include_deleted } = query;
    
    let whereClause = include_deleted ? '1=1' : 'e.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (start_date) {
      whereClause += ` AND e.event_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ` AND e.event_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM events e WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT e.*,
              u.full_name as created_by_name,
              (SELECT json_agg(em.* ORDER BY em.order) FROM event_media em WHERE em.event_id = e.id) as media
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE ${whereClause}
       ORDER BY e.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Get single event
export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT e.*,
              u.full_name as created_by_name,
              (SELECT json_agg(em.* ORDER BY em.order) FROM event_media em WHERE em.event_id = e.id) as media
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create event
export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateEventInput;
    const userId = req.user?.id;
    const id = uuidv4();
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO events (id, title, description, event_date, location, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, data.title, data.description, data.event_date, data.location || null, userId]
      );
      
      // Add media if provided
      if (data.media && data.media.length > 0) {
        for (const media of data.media) {
          await client.query(
            `INSERT INTO event_media (id, event_id, type, url, caption, "order")
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), id, media.type, media.url, media.caption || null, media.order]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Return full event with media
      const fullResult = await pool.query(
        `SELECT e.*,
                (SELECT json_agg(em.* ORDER BY em.order) FROM event_media em WHERE em.event_id = e.id) as media
         FROM events e WHERE e.id = $1`,
        [id]
      );
      
      const event = fullResult.rows[0];
      
      // Notify all sponsors about the new event
      const eventDate = new Date(event.event_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      await notifyAllSponsors(
        'event',
        'New School Event',
        `${event.title} is scheduled for ${eventDate}.`,
        `/sponsor/events`
      );
      
      res.status(201).json(event);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

// Update event
export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body as UpdateEventInput;
    
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
    if (data.event_date !== undefined) {
      fields.push(`event_date = $${paramIndex++}`);
      values.push(data.event_date);
    }
    if (data.location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (fields.length > 0) {
        fields.push('updated_at = NOW()');
        values.push(id);
        
        await client.query(
          `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL`,
          values
        );
      }
      
      // Update media if provided
      if (data.media) {
        await client.query('DELETE FROM event_media WHERE event_id = $1', [id]);
        
        for (const media of data.media) {
          await client.query(
            `INSERT INTO event_media (id, event_id, type, url, caption, "order")
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), id, media.type, media.url, media.caption || null, media.order]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const result = await pool.query(
        `SELECT e.*,
                (SELECT json_agg(em.* ORDER BY em.order) FROM event_media em WHERE em.event_id = e.id) as media
         FROM events e WHERE e.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

// Delete event (soft delete)
export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `UPDATE events 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Restore event
export async function restoreEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE events 
       SET deleted_at = NULL, deleted_by = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or not deleted' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Batch delete events
export async function batchDeleteEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `UPDATE events 
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

// Get upcoming events (for sponsors)
export async function getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM events WHERE event_date >= NOW() AND deleted_at IS NULL`
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT e.*,
              (SELECT json_agg(em.* ORDER BY em.order) FROM event_media em WHERE em.event_id = e.id) as media
       FROM events e
       WHERE e.event_date >= NOW() AND e.deleted_at IS NULL
       ORDER BY e.event_date ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}
