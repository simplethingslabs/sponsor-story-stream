import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getResendClient, emailConfig, verifyResendConfig } from '../config/resend';
import { formatPaginatedResponse } from '../utils/helpers';

// Get pending registrations
export async function getPendingRegistrations(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    let whereClause = `status = 'pending'`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM pending_registrations WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT id, email, full_name, phone, message, created_at
       FROM pending_registrations
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}

// Get single pending registration
export async function getPendingRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, email, full_name, phone, message, created_at
       FROM pending_registrations
       WHERE id = $1 AND status = 'pending'`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Approve registration
export async function approveRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const reviewerId = req.user?.userId;
    
    // Get pending registration
    const pendingResult = await pool.query(
      `SELECT * FROM pending_registrations WHERE id = $1 AND status = 'pending'`,
      [id]
    );
    
    if (pendingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found or already processed' });
    }
    
    const pending = pendingResult.rows[0];
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create user
      const userId = uuidv4();
      await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, pending.email, pending.password_hash, pending.full_name, pending.phone]
      );
      
      // Add sponsor role
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'sponsor')`,
        [userId]
      );
      
      // Update pending registration
      await client.query(
        `UPDATE pending_registrations 
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
         WHERE id = $2`,
        [reviewerId, id]
      );
      
      await client.query('COMMIT');
      
      // Send approval email
      if (verifyResendConfig()) {
        await getResendClient()?.emails.send({
          from: emailConfig.from,
          to: pending.email,
          subject: 'Your Registration Has Been Approved!',
          html: `
            <h2>Welcome!</h2>
            <p>Hi ${pending.full_name},</p>
            <p>Your registration has been approved. You can now log in to your sponsor account.</p>
            <p><a href="${emailConfig.frontendUrl}/login">Log In Now</a></p>
          `,
        });
      }
      
      res.json({ message: 'Registration approved successfully' });
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

// Reject registration
export async function rejectRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user?.userId;
    
    // Get pending registration
    const pendingResult = await pool.query(
      `SELECT * FROM pending_registrations WHERE id = $1 AND status = 'pending'`,
      [id]
    );
    
    if (pendingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found or already processed' });
    }
    
    const pending = pendingResult.rows[0];
    
    // Update status
    await pool.query(
      `UPDATE pending_registrations 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, rejection_reason = $2
       WHERE id = $3`,
      [reviewerId, reason || null, id]
    );
    
    // Send rejection email
    if (verifyResendConfig()) {
      await getResendClient()?.emails.send({
        from: emailConfig.from,
        to: pending.email,
        subject: 'Update on Your Registration',
        html: `
          <h2>Registration Update</h2>
          <p>Hi ${pending.full_name},</p>
          <p>We regret to inform you that your registration request has not been approved at this time.</p>
          ${reason ? `<p>Reason: ${reason}</p>` : ''}
          <p>If you have any questions, please contact us.</p>
        `,
      });
    }
    
    res.json({ message: 'Registration rejected' });
  } catch (error) {
    next(error);
  }
}

// Batch approve registrations
export async function batchApproveRegistrations(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const reviewerId = req.user?.userId;
    const results: any[] = [];
    const errors: any[] = [];
    
    for (const id of ids) {
      try {
        // Get pending registration
        const pendingResult = await pool.query(
          `SELECT * FROM pending_registrations WHERE id = $1 AND status = 'pending'`,
          [id]
        );
        
        if (pendingResult.rows.length === 0) {
          errors.push({ id, error: 'Registration not found or already processed' });
          continue;
        }
        
        const pending = pendingResult.rows[0];
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Create user
          const userId = uuidv4();
          await client.query(
            `INSERT INTO users (id, email, password_hash, full_name, phone)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, pending.email, pending.password_hash, pending.full_name, pending.phone]
          );
          
          // Add sponsor role
          await client.query(
            `INSERT INTO user_roles (user_id, role) VALUES ($1, 'sponsor')`,
            [userId]
          );
          
          // Update pending registration
          await client.query(
            `UPDATE pending_registrations 
             SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
             WHERE id = $2`,
            [reviewerId, id]
          );
          
          await client.query('COMMIT');
          
          // Send approval email
          if (verifyResendConfig()) {
            await resend.emails.send({
              from: emailConfig.from,
              to: pending.email,
              subject: 'Your Registration Has Been Approved!',
              html: `
                <h2>Welcome!</h2>
                <p>Hi ${pending.full_name},</p>
                <p>Your registration has been approved. You can now log in to your sponsor account.</p>
                <p><a href="${emailConfig.frontendUrl}/login">Log In Now</a></p>
              `,
            });
          }
          
          results.push({ id, email: pending.email });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        errors.push({ id, error: err.message });
      }
    }
    
    res.json({
      approved: results,
      errors,
      summary: {
        total: ids.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
