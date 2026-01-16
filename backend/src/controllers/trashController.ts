import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { formatPaginatedResponse } from '../utils/helpers';

// Get all deleted items (trash)
export async function getTrash(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, entity_type } = req.query;
    
    const results: any = {};
    
    // Get deleted children
    if (!entity_type || entity_type === 'children') {
      const children = await pool.query(
        `SELECT c.*, u.full_name as deleted_by_name
         FROM children c
         LEFT JOIN users u ON c.deleted_by = u.id
         WHERE c.deleted_at IS NOT NULL
         ORDER BY c.deleted_at DESC`
      );
      results.children = children.rows;
    }
    
    // Get deleted reports
    if (!entity_type || entity_type === 'reports') {
      const reports = await pool.query(
        `SELECT r.*, 
                c.first_name || ' ' || c.last_name as child_name,
                u.full_name as deleted_by_name
         FROM progress_reports r
         JOIN children c ON r.child_id = c.id
         LEFT JOIN users u ON r.deleted_by = u.id
         WHERE r.deleted_at IS NOT NULL
         ORDER BY r.deleted_at DESC`
      );
      results.reports = reports.rows;
    }
    
    // Get deleted events
    if (!entity_type || entity_type === 'events') {
      const events = await pool.query(
        `SELECT e.*, u.full_name as deleted_by_name
         FROM events e
         LEFT JOIN users u ON e.deleted_by = u.id
         WHERE e.deleted_at IS NOT NULL
         ORDER BY e.deleted_at DESC`
      );
      results.events = events.rows;
    }
    
    // Get deleted newsletters
    if (!entity_type || entity_type === 'newsletters') {
      const newsletters = await pool.query(
        `SELECT n.*, u.full_name as deleted_by_name
         FROM newsletters n
         LEFT JOIN users u ON n.deleted_by = u.id
         WHERE n.deleted_at IS NOT NULL
         ORDER BY n.deleted_at DESC`
      );
      results.newsletters = newsletters.rows;
    }
    
    // Get deleted sponsorships
    if (!entity_type || entity_type === 'sponsorships') {
      const sponsorships = await pool.query(
        `SELECT s.*, 
                c.first_name || ' ' || c.last_name as child_name,
                u.full_name as sponsor_name,
                du.full_name as deleted_by_name
         FROM sponsorships s
         JOIN children c ON s.child_id = c.id
         JOIN users u ON s.sponsor_id = u.id
         LEFT JOIN users du ON s.deleted_by = du.id
         WHERE s.deleted_at IS NOT NULL
         ORDER BY s.deleted_at DESC`
      );
      results.sponsorships = sponsorships.rows;
    }
    
    res.json(results);
  } catch (error) {
    next(error);
  }
}

// Restore item from trash
export async function restoreItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity_type, id } = req.params;
    
    const tableMap: Record<string, string> = {
      children: 'children',
      reports: 'progress_reports',
      events: 'events',
      newsletters: 'newsletters',
      sponsorships: 'sponsorships',
    };
    
    const table = tableMap[entity_type];
    if (!table) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }
    
    const result = await pool.query(
      `UPDATE ${table} 
       SET deleted_at = NULL, deleted_by = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in trash' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Permanently delete item (super_admin only)
export async function permanentlyDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity_type, id } = req.params;
    
    const tableMap: Record<string, string> = {
      children: 'children',
      reports: 'progress_reports',
      events: 'events',
      newsletters: 'newsletters',
      sponsorships: 'sponsorships',
    };
    
    const table = tableMap[entity_type];
    if (!table) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }
    
    const result = await pool.query(
      `DELETE FROM ${table} WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in trash' });
    }
    
    res.json({ message: 'Item permanently deleted' });
  } catch (error) {
    next(error);
  }
}

// Empty trash (super_admin only)
export async function emptyTrash(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity_type } = req.query;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (!entity_type || entity_type === 'children') {
        await client.query('DELETE FROM children WHERE deleted_at IS NOT NULL');
      }
      if (!entity_type || entity_type === 'reports') {
        await client.query('DELETE FROM progress_reports WHERE deleted_at IS NOT NULL');
      }
      if (!entity_type || entity_type === 'events') {
        await client.query('DELETE FROM events WHERE deleted_at IS NOT NULL');
      }
      if (!entity_type || entity_type === 'newsletters') {
        await client.query('DELETE FROM newsletters WHERE deleted_at IS NOT NULL');
      }
      if (!entity_type || entity_type === 'sponsorships') {
        await client.query('DELETE FROM sponsorships WHERE deleted_at IS NOT NULL');
      }
      
      await client.query('COMMIT');
      
      res.json({ message: 'Trash emptied successfully' });
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
