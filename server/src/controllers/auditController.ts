import { Request, Response } from 'express';
import { isPostgresDialect, query, queryOne } from '../db/database.js';
import { verifyAuditChain } from '../services/auditService.js';

// Rows hold both ISO strings and CURRENT_TIMESTAMP values; SQLite must compare them as datetimes, not text
const ts = (expr: string) => (isPostgresDialect() ? expr : `datetime(${expr})`);

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
  if (q.action) add('UPPER(a.action) LIKE UPPER(?)', `%${q.action}%`);
  if (q.from) add(`${ts('a.timestamp')} >= ${ts('?')}`, new Date(String(q.from)).toISOString());
  if (q.to) add(`${ts('a.timestamp')} <= ${ts('?')}`, new Date(String(q.to)).toISOString());
  if (q.search) {
    const like = `%${q.search}%`;
    add(
      `(LOWER(a.details) LIKE LOWER(?) OR LOWER(a.target_id) LIKE LOWER(?) OR LOWER(u.full_name) LIKE LOWER(?)
        OR LOWER(a.action) LIKE LOWER(?) OR LOWER(a.target_resource) LIKE LOWER(?))`,
      like, like, like, like, like
    );
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
       ORDER BY ${ts('a.timestamp')} DESC LIMIT ? OFFSET ?`,
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

export async function verifyAuditLogChain(_req: Request, res: Response) {
  try {
    return res.json({ success: true, data: await verifyAuditChain() });
  } catch (error: any) {
    console.error('Audit chain verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify the audit ledger.' });
  }
}
