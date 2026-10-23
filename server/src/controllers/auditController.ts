import { Request, Response } from 'express';
import { query, queryOne } from '../db/database.js';

/** Builds the shared WHERE clause for audit queries from the validated query string. */
function buildAuditFilter(q: Record<string, unknown>): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, ...values: unknown[]) => {
    clauses.push(clause);
    params.push(...values);
  };

  if (q.role) add('a.actor_role = ?', q.role);
  if (q.userId) add('a.actor_id = ?', q.userId);
  if (q.action) add('a.action LIKE ?', `%${q.action}%`);
  if (q.from) add('a.timestamp >= ?', new Date(String(q.from)).toISOString());
  if (q.to) add('a.timestamp <= ?', new Date(String(q.to)).toISOString());
  if (q.search) {
    const like = `%${q.search}%`;
    add('(a.details LIKE ? OR a.target_id LIKE ? OR u.full_name LIKE ?)', like, like, like);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const { where, params } = buildAuditFilter(req.query);
    const from = `FROM audit_logs a LEFT JOIN users u ON a.actor_id = u.id ${where}`;

    const logs = await query(
      `SELECT a.*, u.full_name as actor_name, u.email as actor_email ${from}
       ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    const totalRow = await queryOne<{ count: number }>(`SELECT COUNT(*) as count ${from}`, params);

    return res.json({
      success: true,
      data: { total: Number(totalRow?.count ?? 0), page, limit, logs }
    });
  } catch (error: any) {
    console.error('Audit query error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system audit logs.' });
  }
}
