import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getResendClient, emailConfig, verifyResendConfig } from '../config/resend';
import { CreateReportInput, UpdateReportInput, ReportQueryInput } from '../schemas/report';
import { formatPaginatedResponse } from '../utils/helpers';
import { notifyChildSponsors, createNotification } from '../services/notificationService';

// Get all reports with pagination
export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ReportQueryInput;
    const { page, limit, child_id, teacher_id, quarter, year, status, sort_by, sort_order, include_deleted } = query;
    
    let whereClause = include_deleted ? '1=1' : 'r.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (child_id) {
      whereClause += ` AND r.child_id = $${paramIndex++}`;
      params.push(child_id);
    }
    
    if (teacher_id) {
      whereClause += ` AND r.teacher_id = $${paramIndex++}`;
      params.push(teacher_id);
    }
    
    if (quarter) {
      whereClause += ` AND r.quarter = $${paramIndex++}`;
      params.push(quarter);
    }
    
    if (year) {
      whereClause += ` AND r.year = $${paramIndex++}`;
      params.push(year);
    }
    
    if (status && status !== 'all') {
      whereClause += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM progress_reports r WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT r.*,
              c.first_name || ' ' || c.last_name as child_name, c.photo_url as child_photo,
              u.full_name as teacher_name,
              (SELECT json_agg(rm.* ORDER BY rm."order") FROM report_media rm WHERE rm.report_id = r.id) as media
       FROM progress_reports r
       JOIN children c ON r.child_id = c.id
       LEFT JOIN users u ON r.teacher_id = u.id
       WHERE ${whereClause}
       ORDER BY r.${sort_by} ${sort_order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Get single report
export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT r.*,
              c.first_name || ' ' || c.last_name as child_name, c.photo_url as child_photo, c.grade as child_grade,
              u.full_name as teacher_name,
              (SELECT json_agg(rm.* ORDER BY rm.order) FROM report_media rm WHERE rm.report_id = r.id) as media
       FROM progress_reports r
       JOIN children c ON r.child_id = c.id
       LEFT JOIN users u ON r.teacher_id = u.id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create report
export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateReportInput;
    const teacherId = req.user?.userId;
    const id = uuidv4();
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO progress_reports (id, child_id, teacher_id, quarter, year, growth_narrative, activities, teacher_observations, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [id, data.child_id, teacherId, data.quarter, data.year, data.growth_narrative, data.activities, data.teacher_observations, data.status || 'draft']
      );
      
      // Add media if provided
      if (data.media && data.media.length > 0) {
        for (const media of data.media) {
          await client.query(
            `INSERT INTO report_media (id, report_id, type, url, caption, "order")
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), id, media.type, media.url, media.caption || null, media.order]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Return full report with media
      const fullResult = await pool.query(
        `SELECT r.*,
                c.first_name || ' ' || c.last_name as child_name,
                (SELECT json_agg(rm.* ORDER BY rm.order) FROM report_media rm WHERE rm.report_id = r.id) as media
         FROM progress_reports r
         JOIN children c ON r.child_id = c.id
         WHERE r.id = $1`,
        [id]
      );
      
      res.status(201).json(fullResult.rows[0]);
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

// Update report
export async function updateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body as UpdateReportInput;
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.quarter !== undefined) {
      fields.push(`quarter = $${paramIndex++}`);
      values.push(data.quarter);
    }
    if (data.year !== undefined) {
      fields.push(`year = $${paramIndex++}`);
      values.push(data.year);
    }
    if (data.growth_narrative !== undefined) {
      fields.push(`growth_narrative = $${paramIndex++}`);
      values.push(data.growth_narrative);
    }
    if (data.activities !== undefined) {
      fields.push(`activities = $${paramIndex++}`);
      values.push(data.activities);
    }
    if (data.teacher_observations !== undefined) {
      fields.push(`teacher_observations = $${paramIndex++}`);
      values.push(data.teacher_observations);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
      if (data.status === 'published') {
        fields.push(`published_at = NOW()`);
      }
    }
    
    if (fields.length === 0 && !data.media) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (fields.length > 0) {
        fields.push('updated_at = NOW()');
        values.push(id);
        
        await client.query(
          `UPDATE progress_reports SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL`,
          values
        );
      }
      
      // Update media if provided
      if (data.media) {
        await client.query('DELETE FROM report_media WHERE report_id = $1', [id]);
        
        for (const media of data.media) {
          await client.query(
            `INSERT INTO report_media (id, report_id, type, url, caption, "order")
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), id, media.type, media.url, media.caption || null, media.order]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Return updated report
      const result = await pool.query(
        `SELECT r.*,
                c.first_name || ' ' || c.last_name as child_name,
                (SELECT json_agg(rm.* ORDER BY rm.order) FROM report_media rm WHERE rm.report_id = r.id) as media
         FROM progress_reports r
         JOIN children c ON r.child_id = c.id
         WHERE r.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
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

// Publish report and notify sponsors
export async function publishReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { notify_sponsors = true } = req.body;
    
    const result = await pool.query(
      `UPDATE progress_reports 
       SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    
    // Get child details
    const childResult = await pool.query(
      `SELECT first_name, last_name FROM children WHERE id = $1`,
      [report.child_id]
    );
    const childName = childResult.rows[0] 
      ? `${childResult.rows[0].first_name} ${childResult.rows[0].last_name}`
      : 'your sponsored child';
    
    // Create in-app notifications for all sponsors of this child
    await notifyChildSponsors(
      report.child_id,
      'report',
      'New Progress Report',
      `${report.quarter} ${report.year} report for ${childName} is now available.`,
      `/sponsor/children/${report.child_id}/reports/${report.id}`
    );
    
    // Send email notifications if requested and Resend is configured
    if (notify_sponsors && verifyResendConfig()) {
      const sponsors = await pool.query(
        `SELECT u.email, u.full_name
         FROM sponsorships s
         JOIN users u ON s.sponsor_id = u.id
         WHERE s.child_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL`,
        [report.child_id]
      );
      
      for (const sponsor of sponsors.rows) {
        await getResendClient()?.emails.send({
          from: emailConfig.from,
          to: sponsor.email,
          subject: `New Progress Report for ${childName}`,
          html: `
            <h2>New Progress Report Available</h2>
            <p>Hi ${sponsor.full_name},</p>
            <p>A new ${report.quarter} ${report.year} progress report is available for ${childName}.</p>
            <p><a href="${emailConfig.frontendUrl}/sponsor/children/${report.child_id}/reports/${report.id}">View Report</a></p>
          `,
        });
      }
    }
    
    res.json(report);
  } catch (error) {
    next(error);
  }
}

// Request revision on a report (notify teacher)
export async function requestRevision(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const reviewerId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE progress_reports 
       SET status = 'needs_revision', feedback = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [feedback, reviewerId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    
    // Notify the teacher
    if (report.teacher_id) {
      await createNotification({
        userId: report.teacher_id,
        type: 'system',
        title: 'Report Needs Revision',
        message: feedback || 'Your report requires changes before it can be published.',
        link: `/teacher/reports/${report.id}`,
      });
    }
    
    res.json(report);
  } catch (error) {
    next(error);
  }
}

// Approve a report (notify teacher)
export async function approveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const reviewerId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE progress_reports 
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [reviewerId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    
    // Notify the teacher
    if (report.teacher_id) {
      await createNotification({
        userId: report.teacher_id,
        type: 'system',
        title: 'Report Approved',
        message: 'Your report has been approved and is ready for publishing.',
        link: `/teacher/reports/${report.id}`,
      });
    }
    
    res.json(report);
  } catch (error) {
    next(error);
  }
}

// Delete report (soft delete)
export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE progress_reports 
       SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Restore report
export async function restoreReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE progress_reports 
       SET deleted_at = NULL, deleted_by = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or not deleted' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Batch delete reports
export async function batchDeleteReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE progress_reports 
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

// Get reports for a sponsor's children
export async function getReportsForSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsorId = req.user?.userId;
    const { page = 1, limit = 20, child_id } = req.query;
    
    let whereClause = `s.sponsor_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL 
                       AND r.status = 'published' AND r.deleted_at IS NULL`;
    const params: any[] = [sponsorId];
    let paramIndex = 2;
    
    if (child_id) {
      whereClause += ` AND r.child_id = $${paramIndex++}`;
      params.push(child_id);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM progress_reports r
       JOIN sponsorships s ON r.child_id = s.child_id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(
      `SELECT r.*, 
              c.first_name || ' ' || c.last_name as child_name, c.photo_url as child_photo,
              (SELECT json_agg(rm.* ORDER BY rm.order) FROM report_media rm WHERE rm.report_id = r.id) as media
       FROM progress_reports r
       JOIN sponsorships s ON r.child_id = s.child_id
       JOIN children c ON r.child_id = c.id
       WHERE ${whereClause}
       ORDER BY r.published_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json(formatPaginatedResponse(result.rows, total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
}
