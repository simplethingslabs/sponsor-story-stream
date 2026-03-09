import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';

// GET /moments — List moments with aggregated tagged children
export async function getMoments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status } = req.query as { status?: string };

    let sql = `
      SELECT
        cm.*,
        COALESCE(
          json_agg(
            json_build_object('id', mt.child_id)
          ) FILTER (WHERE mt.child_id IS NOT NULL),
          '[]'
        ) AS tagged_children
      FROM classroom_moments cm
      LEFT JOIN moment_tags mt ON mt.moment_id = cm.id
    `;
    const params: unknown[] = [];

    if (status && status !== 'all') {
      sql += ` WHERE cm.status = $1`;
      params.push(status);
    }

    sql += ` GROUP BY cm.id ORDER BY cm.created_at DESC`;

    const result = await query(sql, params);

    // Flatten tagged_children to array of IDs
    const moments = result.rows.map((row: any) => ({
      ...row,
      tagged_children: row.tagged_children.map((t: any) => t.id),
    }));

    res.json({ data: moments });
  } catch (error) {
    console.error('Error fetching moments:', error);
    res.status(500).json({ error: 'Failed to fetch moments' });
  }
}

// POST /moments — Create a moment with tagged children
export async function createMoment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { type, url, caption, event_id, tagged_children } = req.body as {
      type: 'image' | 'video';
      url: string;
      caption: string;
      event_id?: string;
      tagged_children?: string[];
    };

    if (!type || !url || !caption) {
      res.status(400).json({ error: 'type, url, and caption are required' });
      return;
    }

    const teacherId = req.user!.id;

    // Insert moment
    const momentResult = await query(
      `INSERT INTO classroom_moments (teacher_id, type, url, caption, event_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [teacherId, type, url, caption, event_id || null]
    );

    const moment = momentResult.rows[0];

    // Insert tags
    if (tagged_children && tagged_children.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const childId of tagged_children) {
        placeholders.push(`($${idx++}, $${idx++})`);
        values.push(moment.id, childId);
      }
      await query(
        `INSERT INTO moment_tags (moment_id, child_id) VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    res.status(201).json({
      data: {
        ...moment,
        tagged_children: tagged_children || [],
      },
    });
  } catch (error) {
    console.error('Error creating moment:', error);
    res.status(500).json({ error: 'Failed to create moment' });
  }
}

// DELETE /moments/:id
export async function deleteMoment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM classroom_moments WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Moment not found' });
      return;
    }

    res.json({ message: 'Moment deleted successfully' });
  } catch (error) {
    console.error('Error deleting moment:', error);
    res.status(500).json({ error: 'Failed to delete moment' });
  }
}
