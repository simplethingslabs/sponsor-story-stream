import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getResendClient, emailConfig, verifyResendConfig } from '../config/resend';
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, RefreshTokenInput, CreateUserInput } from '../schemas/auth';
import { parsePostgresArray } from '../utils/helpers';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate tokens
function generateTokens(userId: string, roles: string[]) {
  const accessToken = jwt.sign(
    { userId, roles },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
  );
  
  const refreshToken = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
  
  return { accessToken, refreshToken, expiresAt };
}

// Login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;
    
    // Find user
    const userResult = await pool.query(
      `SELECT u.*, array_agg(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    user.roles = parsePostgresArray(user.roles);

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(user.id, user.roles);
    
    // Store refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user.id, refreshToken, expiresAt]
    );
    
    // Return user data (without password)
    const { password_hash, ...userData } = user;
    
    res.json({
      user: userData,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
}

// Register (creates pending registration)
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, full_name, phone, message } = req.body as RegisterInput;
    
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if pending registration exists
    const existingPending = await pool.query(
      `SELECT id FROM pending_registrations 
       WHERE email = $1 AND status = 'pending'`,
      [email]
    );
    
    if (existingPending.rows.length > 0) {
      return res.status(400).json({ error: 'Registration already pending approval' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create pending registration
    const result = await pool.query(
      `INSERT INTO pending_registrations (id, email, password_hash, full_name, phone, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, created_at`,
      [uuidv4(), email, passwordHash, full_name, phone || null, message || null]
    );
    
    // Send notification to admins
    if (verifyResendConfig()) {
      const admins = await pool.query(
        `SELECT u.email FROM users u
         JOIN user_roles ur ON u.id = ur.user_id
         WHERE ur.role IN ('super_admin', 'admin') AND u.deleted_at IS NULL`
      );
      
      if (admins.rows.length > 0) {
        const adminEmails = admins.rows.map(a => a.email);
        const { error: emailError } = await getResendClient()?.emails.send({
          from: emailConfig.from,
          to: adminEmails,
          subject: 'New Sponsor Registration Pending',
          html: `
            <h2>New Registration Request</h2>
            <p><strong>Name:</strong> ${full_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <p><a href="${emailConfig.frontendUrl}/dashboard/pending-approvals">Review in Dashboard</a></p>
          `,
        }) ?? {};
        if (emailError) console.error('Resend error (registration notification):', emailError);
      }
    }
    
    res.status(201).json({
      message: 'Registration submitted successfully. You will be notified when approved.',
      registration: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Register with invitation token
export async function registerWithInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const { password, full_name, phone } = req.body;
    
    // Find valid invitation
    const invitation = await pool.query(
      `SELECT * FROM sponsor_invitations 
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );
    
    if (invitation.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    
    const invite = invitation.rows[0];
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, invite.email, passwordHash, full_name, phone || null]
    );
    
    // Add sponsor role
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'sponsor')`,
      [userId]
    );
    
    // Update invitation
    await pool.query(
      `UPDATE sponsor_invitations 
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1`,
      [invite.id]
    );
    
    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(userId, ['sponsor']);
    
    // Store refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, refreshToken, expiresAt]
    );
    
    res.status(201).json({
      message: 'Registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as ForgotPasswordInput;
    
    // Find user
    const user = await pool.query(
      'SELECT id, full_name FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    
    // Always return success (security best practice)
    if (user.rows.length === 0) {
      return res.json({ message: 'If an account exists, you will receive a password reset email' });
    }
    
    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Store token
    await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user.rows[0].id, token, expiresAt]
    );
    
    // Send email
    if (verifyResendConfig()) {
      const { error: emailError } = await getResendClient()?.emails.send({
        from: emailConfig.from,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.rows[0].full_name},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${emailConfig.frontendUrl}/reset-password?token=${token}">Reset Password</a></p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      }) ?? {};
      if (emailError) console.error('Resend error (password reset):', emailError);
    }
    
    res.json({ message: 'If an account exists, you will receive a password reset email' });
  } catch (error) {
    next(error);
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body as ResetPasswordInput;
    
    // Find valid token
    const tokenResult = await pool.query(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const userId = tokenResult.rows[0].user_id;
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
    
    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token]
    );
    
    // Invalidate all refresh tokens for this user
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
}

// Refresh token
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body as RefreshTokenInput;
    
    // Find valid refresh token
    const tokenResult = await pool.query(
      `SELECT rt.user_id, array_agg(ur.role) as roles
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND u.deleted_at IS NULL
       GROUP BY rt.user_id`,
      [refresh_token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    const { user_id, roles: rawRoles } = tokenResult.rows[0];
    const roles = parsePostgresArray(rawRoles);
    
    // Delete old refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken, expiresAt } = generateTokens(user_id, roles);
    
    // Store new refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user_id, newRefreshToken, expiresAt]
    );
    
    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
}

// Logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body;
    
    if (refresh_token) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

// Get current user
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.phone, u.created_at, u.updated_at,
              array_agg(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = result.rows[0];
    userData.roles = parsePostgresArray(userData.roles);

    res.json(userData);
  } catch (error) {
    next(error);
  }
}

// Update current user
export async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { full_name, phone, avatar_url } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id, email, full_name, avatar_url, phone, created_at, updated_at`,
      [full_name, phone, avatar_url, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Admin: Create user (teacher or sponsor)
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, full_name, phone, role } = req.body as CreateUserInput;

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, passwordHash, full_name, phone || null]
    );

    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`,
      [userId, role]
    );

    const result = await pool.query(
      `SELECT id, email, full_name, phone, created_at FROM users WHERE id = $1`,
      [userId]
    );

    // Email the new user their login credentials
    if (verifyResendConfig()) {
      try {
        const { error: emailError } = await getResendClient()?.emails.send({
          from: emailConfig.from,
          to: email,
          subject: 'Your AVPSponsorConnect Account',
          html: `
            <h2>Welcome, ${full_name}!</h2>
            <p>An account has been created for you on AVPSponsorConnect as a <strong>${role}</strong>.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><a href="${emailConfig.frontendUrl}/login">Log In</a></p>
            <p>For your security, we recommend changing this password after you log in.</p>
          `,
        }) ?? {};
        if (emailError) console.error('Resend error (account creation):', emailError);
      } catch (emailError) {
        console.error('Failed to send account creation email:', emailError);
      }
    }

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: { ...result.rows[0], roles: [role] },
    });
  } catch (error) {
    next(error);
  }
}

// Admin: List users by role
export async function listUsersByRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.query;
    if (!role || !['teacher', 'sponsor'].includes(role as string)) {
      return res.status(400).json({ error: 'Invalid role parameter' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.created_at, u.updated_at
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role = $1 AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`,
      [role]
    );

    res.json({ data: result.rows, total: result.rows.length });
  } catch (error) {
    next(error);
  }
}
