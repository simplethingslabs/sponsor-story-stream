import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

export type NotificationType = 'report' | 'newsletter' | 'event' | 'sponsorship' | 'system';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Create a notification for a user
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  const id = uuidv4();
  
  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, params.userId, params.type, params.title, params.message, params.link || null]
  );
  
  return id;
}

// Create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<string[]> {
  const ids: string[] = [];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const userId of userIds) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, type, title, message, link || null]
      );
      ids.push(id);
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  
  return ids;
}

// Notify all sponsors of a child
export async function notifyChildSponsors(
  childId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const sponsors = await pool.query(
    `SELECT sponsor_id FROM sponsorships 
     WHERE child_id = $1 AND status = 'active' AND deleted_at IS NULL`,
    [childId]
  );
  
  if (sponsors.rows.length > 0) {
    const sponsorIds = sponsors.rows.map(s => s.sponsor_id);
    await createBulkNotifications(sponsorIds, type, title, message, link);
  }
}

// Notify all sponsors (for newsletters, general announcements)
export async function notifyAllSponsors(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const sponsors = await pool.query(
    `SELECT DISTINCT u.id FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     WHERE ur.role = 'sponsor' AND u.deleted_at IS NULL`
  );
  
  if (sponsors.rows.length > 0) {
    const sponsorIds = sponsors.rows.map(s => s.id);
    await createBulkNotifications(sponsorIds, type, title, message, link);
  }
}

// Notify admins
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const admins = await pool.query(
    `SELECT DISTINCT u.id FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     WHERE ur.role IN ('super_admin', 'admin') AND u.deleted_at IS NULL`
  );
  
  if (admins.rows.length > 0) {
    const adminIds = admins.rows.map(a => a.id);
    await createBulkNotifications(adminIds, type, title, message, link);
  }
}

// Get unread notification count for a user
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return parseInt(result.rows[0].count);
}
