import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { CreatePaymentInput, UpdatePaymentInput, MarkPaidInput } from '../schemas/payment';

interface Payment {
  id: string;
  sponsor_id: string;
  child_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_date: string | null;
  due_date: string;
  receipt_number: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/payments - List payments with filters
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      status,
      sponsor_id,
      child_id,
      from_date,
      to_date,
      page = '1',
      limit = '20',
    } = req.query;

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClause += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (sponsor_id) {
      whereClause += ` AND p.sponsor_id = $${paramIndex++}`;
      params.push(sponsor_id);
    }

    if (child_id) {
      whereClause += ` AND p.child_id = $${paramIndex++}`;
      params.push(child_id);
    }

    if (from_date) {
      whereClause += ` AND p.due_date >= $${paramIndex++}`;
      params.push(from_date);
    }

    if (to_date) {
      whereClause += ` AND p.due_date <= $${paramIndex++}`;
      params.push(to_date);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM payments p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Get payments with sponsor and child info
    const result = await query<Payment & { sponsor_name: string; child_name: string }>(
      `SELECT p.*,
              u.full_name as sponsor_name,
              CONCAT(c.first_name, ' ', c.last_name) as child_name
       FROM payments p
       LEFT JOIN users u ON p.sponsor_id = u.id
       LEFT JOIN children c ON p.child_id = c.id
       ${whereClause}
       ORDER BY p.due_date DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/payments/stats - Financial dashboard stats
export async function getPaymentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get comprehensive stats
    const statsResult = await query<{
      total_collected: string;
      this_month_collected: string;
      pending_amount: string;
      pending_count: string;
      overdue_amount: string;
      overdue_count: string;
    }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status = 'paid' AND to_char(payment_date, 'YYYY-MM') = $1 THEN amount ELSE 0 END), 0) as this_month_collected,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as overdue_amount,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
       FROM payments
       WHERE deleted_at IS NULL`,
      [currentMonth]
    );

    // Get monthly trend (last 6 months)
    const trendResult = await query<{ month: string; amount: string }>(
      `SELECT 
        to_char(payment_date, 'Mon') as month,
        COALESCE(SUM(amount), 0) as amount
       FROM payments
       WHERE status = 'paid' 
         AND deleted_at IS NULL
         AND payment_date >= NOW() - INTERVAL '6 months'
       GROUP BY to_char(payment_date, 'YYYY-MM'), to_char(payment_date, 'Mon')
       ORDER BY to_char(payment_date, 'YYYY-MM')
       LIMIT 6`
    );

    // Get status breakdown
    const breakdownResult = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM payments
       WHERE deleted_at IS NULL
       GROUP BY status`
    );

    const stats = statsResult.rows[0];

    res.json({
      totalCollected: parseFloat(stats?.total_collected || '0'),
      thisMonthCollected: parseFloat(stats?.this_month_collected || '0'),
      pendingAmount: parseFloat(stats?.pending_amount || '0'),
      pendingCount: parseInt(stats?.pending_count || '0'),
      overdueAmount: parseFloat(stats?.overdue_amount || '0'),
      overdueCount: parseInt(stats?.overdue_count || '0'),
      collectionTrend: trendResult.rows.map(r => ({
        month: r.month,
        amount: parseFloat(r.amount),
      })),
      statusBreakdown: breakdownResult.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count),
      })),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/payments/:id - Get single payment
export async function getPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const result = await query<Payment & { sponsor_name: string; child_name: string }>(
      `SELECT p.*,
              u.full_name as sponsor_name,
              u.email as sponsor_email,
              CONCAT(c.first_name, ' ', c.last_name) as child_name
       FROM payments p
       LEFT JOIN users u ON p.sponsor_id = u.id
       LEFT JOIN children c ON p.child_id = c.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// POST /api/payments - Create new payment
export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreatePaymentInput = req.body;
    const userId = req.user?.id;

    const result = await query<Payment>(
      `INSERT INTO payments (
        sponsor_id, child_id, amount, currency, status,
        payment_method, payment_date, due_date, reference_number, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.sponsor_id,
        data.child_id || null,
        data.amount,
        data.currency || 'INR',
        data.status || 'pending',
        data.payment_method || null,
        data.payment_date || null,
        data.due_date,
        data.reference_number || null,
        data.notes || null,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// PUT /api/payments/:id - Update payment
export async function updatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data: UpdatePaymentInput = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const result = await query<Payment>(
      `UPDATE payments SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// PUT /api/payments/:id/mark-paid - Mark payment as paid
export async function markPaymentPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data: MarkPaidInput = req.body;

    const result = await query<Payment>(
      `UPDATE payments SET 
        status = 'paid',
        payment_method = $1,
        payment_date = COALESCE($2, CURRENT_DATE),
        reference_number = $3,
        notes = COALESCE($4, notes),
        updated_at = NOW()
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING *`,
      [
        data.payment_method,
        data.payment_date || null,
        data.reference_number || null,
        data.notes || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/payments/:id - Soft delete payment
export async function deletePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await query<Payment>(
      `UPDATE payments SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
}
