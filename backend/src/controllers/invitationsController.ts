import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getResendClient, emailConfig, verifyResendConfig } from '../config/resend';
import { SendInvitationInput, InvitationQueryInput } from '../schemas/invitation';
import { formatPaginatedResponse } from '../utils/helpers';

const INVITATION_EXPIRES_DAYS = 7;

// Get all invitations
export async function getInvitations(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as InvitationQueryInput;
    const { page, limit, status, search, sort_by, sort_order } = query;
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      whereClause += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (search) {
      whereClause += ` AND i.email ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sponsor_invitations i WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT i.*, u.full_name as invited_by_name
       FROM sponsor_invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE ${whereClause}
       ORDER BY i.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Send invitation
export async function sendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as SendInvitationInput;
    const invitedBy = req.user?.userId;
    
    // Check if email already registered
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered' });
    }
    
    // Check for pending invitation
    const existingInvitation = await pool.query(
      `SELECT id FROM sponsor_invitations 
       WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
      [data.email]
    );
    
    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({ error: 'An active invitation already exists for this email' });
    }
    
    // Create invitation
    const id = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_DAYS);
    
    const result = await pool.query(
      `INSERT INTO sponsor_invitations (id, email, token, invited_by, expires_at, personal_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.email, token, invitedBy, expiresAt, data.personal_message || null]
    );
    
    // Get inviter name
    const inviter = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [invitedBy]
    );
    
    // Send invitation email
    if (verifyResendConfig()) {
      await getResendClient()?.emails.send({
        from: emailConfig.from,
        to: data.email,
        subject: 'You\'re Invited to Join as a Sponsor',
        html: `
          <h2>You're Invited!</h2>
          <p>${inviter.rows[0]?.full_name || 'Our team'} has invited you to join as a sponsor.</p>
          ${data.personal_message ? `<p><em>"${data.personal_message}"</em></p>` : ''}
          <p>Click the link below to create your account:</p>
          <p><a href="${emailConfig.frontendUrl}/register?token=${token}">Accept Invitation</a></p>
          <p>This invitation expires in ${INVITATION_EXPIRES_DAYS} days.</p>
        `,
      });
    }
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Resend invitation
export async function resendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    // Get invitation
    const invitation = await pool.query(
      `SELECT i.*, u.full_name as inviter_name
       FROM sponsor_invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (invitation.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    const invite = invitation.rows[0];
    
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'This invitation has already been accepted' });
    }
    
    // Generate new token and extend expiry
    const newToken = uuidv4();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + INVITATION_EXPIRES_DAYS);
    
    await pool.query(
      `UPDATE sponsor_invitations 
       SET token = $1, expires_at = $2, status = 'pending'
       WHERE id = $3`,
      [newToken, newExpiry, id]
    );
    
    // Send email
    if (verifyResendConfig()) {
      await resend.emails.send({
        from: emailConfig.from,
        to: invite.email,
        subject: 'Reminder: You\'re Invited to Join as a Sponsor',
        html: `
          <h2>Reminder: You're Invited!</h2>
          <p>${invite.inviter_name || 'Our team'} has invited you to join as a sponsor.</p>
          <p>Click the link below to create your account:</p>
          <p><a href="${emailConfig.frontendUrl}/register?token=${newToken}">Accept Invitation</a></p>
          <p>This invitation expires in ${INVITATION_EXPIRES_DAYS} days.</p>
        `,
      });
    }
    
    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    next(error);
  }
}

// Cancel invitation
export async function cancelInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM sponsor_invitations WHERE id = $1 AND status = 'pending' RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }
    
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

// Validate invitation token
export async function validateInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    
    const result = await pool.query(
      `SELECT i.email, i.expires_at, u.full_name as inviter_name
       FROM sponsor_invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.token = $1 AND i.status = 'pending' AND i.expires_at > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    
    res.json({
      valid: true,
      email: result.rows[0].email,
      inviter_name: result.rows[0].inviter_name,
    });
  } catch (error) {
    next(error);
  }
}

// Batch send invitations
export async function batchSendInvitations(req: Request, res: Response, next: NextFunction) {
  try {
    const { invitations } = req.body;
    const invitedBy = req.user?.userId;
    const results: any[] = [];
    const errors: any[] = [];
    
    // Get inviter name
    const inviter = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [invitedBy]
    );
    const inviterName = inviter.rows[0]?.full_name || 'Our team';
    
    for (let i = 0; i < invitations.length; i++) {
      const data = invitations[i];
      
      try {
        // Check if email already registered
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [data.email]
        );
        
        if (existingUser.rows.length > 0) {
          errors.push({ index: i, email: data.email, error: 'Email already registered' });
          continue;
        }
        
        // Check for pending invitation
        const existingInvitation = await pool.query(
          `SELECT id FROM sponsor_invitations 
           WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
          [data.email]
        );
        
        if (existingInvitation.rows.length > 0) {
          errors.push({ index: i, email: data.email, error: 'Active invitation exists' });
          continue;
        }
        
        // Create invitation
        const id = uuidv4();
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_DAYS);
        
        const result = await pool.query(
          `INSERT INTO sponsor_invitations (id, email, token, invited_by, expires_at, personal_message)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id, data.email, token, invitedBy, expiresAt, data.personal_message || null]
        );
        
        // Send email
        if (verifyResendConfig()) {
          await resend.emails.send({
            from: emailConfig.from,
            to: data.email,
            subject: 'You\'re Invited to Join as a Sponsor',
            html: `
              <h2>You're Invited!</h2>
              <p>${inviterName} has invited you to join as a sponsor.</p>
              ${data.personal_message ? `<p><em>"${data.personal_message}"</em></p>` : ''}
              <p>Click the link below to create your account:</p>
              <p><a href="${emailConfig.frontendUrl}/register?token=${token}">Accept Invitation</a></p>
              <p>This invitation expires in ${INVITATION_EXPIRES_DAYS} days.</p>
            `,
          });
        }
        
        results.push(result.rows[0]);
      } catch (err: any) {
        errors.push({ index: i, email: data.email, error: err.message });
      }
    }
    
    res.status(201).json({
      sent: results,
      errors,
      summary: {
        total: invitations.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
