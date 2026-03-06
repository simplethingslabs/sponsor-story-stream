import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';

interface AttendanceRecord {
  child_id: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

// POST /attendance — Bulk upsert attendance for a date
export async function saveAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, records } = req.body as { date: string; records: AttendanceRecord[] };

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'date and records[] are required' });
      return;
    }

    const markedBy = req.user!.id;

    // Build bulk upsert query
    const values: unknown[] = [];
    const valuePlaceholders: string[] = [];
    let paramIndex = 1;

    for (const record of records) {
      if (!record.child_id || !record.status) continue;
      valuePlaceholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      values.push(record.child_id, date, record.status, record.notes || null, markedBy);
    }

    if (valuePlaceholders.length === 0) {
      res.status(400).json({ error: 'No valid attendance records provided' });
      return;
    }

    const sql = `
      INSERT INTO attendance (child_id, date, status, notes, marked_by)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (child_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        marked_by = EXCLUDED.marked_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(sql, values);

    res.json({
      message: 'Attendance saved successfully',
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
}

// GET /attendance?date=YYYY-MM-DD
export async function getAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, child_id } = req.query as { date?: string; child_id?: string };

    if (!date) {
      res.status(400).json({ error: 'date query parameter is required' });
      return;
    }

    let sql = `
      SELECT a.*, c.first_name, c.last_name
      FROM attendance a
      JOIN children c ON c.id = a.child_id
      WHERE a.date = $1
    `;
    const params: unknown[] = [date];

    if (child_id) {
      sql += ` AND a.child_id = $2`;
      params.push(child_id);
    }

    sql += ` ORDER BY c.first_name, c.last_name`;

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}
