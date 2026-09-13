import { Request, Response } from 'express';
import { query, queryOne } from '../db/database.js';

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const role = req.query.role as string;
    const action = req.query.action as string;
    const search = req.query.search as string;

    let sql = `
      SELECT a.*, u.full_name as actor_name, u.email as actor_email
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      sql += ` AND a.actor_role = ?`;
      params.push(role);
    }
    if (action) {
      sql += ` AND a.action LIKE ?`;
      params.push(`%${action}%`);
    }
    if (search) {
      sql += ` AND (a.details LIKE ? OR a.target_id LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT 100`;

    const logs = await query(sql, params);
    const totalCount = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM audit_logs');

    return res.json({
      success: true,
      data: {
        total: totalCount?.count || logs.length,
        logs
      }
    });
  } catch (error: any) {
    console.error('Audit query error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system audit logs.' });
  }
}
