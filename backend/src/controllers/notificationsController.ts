import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { formatPaginatedResponse } from '../utils/helpers';

// Get notifications for current user
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    let whereClause = 'user_id = $1';
    const params: any[] = [userId];
    
    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    // Get unread count
    const unreadCount = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
    
    res.json({
      ...formatPaginatedResponse(result.rows, total, Number(page), Number(limit)),
      unread_count: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
}

// Mark notification as read
export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

// Delete notification
export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}

// Create notification (internal use)
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, type, title, message, link || null]
  );
  return id;
}
