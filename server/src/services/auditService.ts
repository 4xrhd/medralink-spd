import crypto from 'crypto';
import { execute, queryOne } from '../db/database.js';

export interface AuditParams {
  actorId?: string;
  actorRole: string;
  action: string;
  targetResource: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string | Record<string, any>;
}

export async function recordAuditEvent(params: AuditParams): Promise<string> {
  const auditId = 'aud-' + Math.random().toString(36).substring(2, 10);
  const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : (params.details || '');
  const timestamp = new Date().toISOString();

  // Fetch the latest hash to maintain cryptographic SHA-256 hash chaining
  const lastLog = await queryOne<{ sha256_hash: string }>(
    'SELECT sha256_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1'
  );
  const prevHash = lastLog?.sha256_hash || '0000000000000000000000000000000000000000000000000000000000000000';

  const hashContent = `${prevHash}|${auditId}|${params.actorId || 'system'}|${params.actorRole}|${params.action}|${params.targetResource}|${params.targetId || ''}|${timestamp}|${detailsStr}`;
  const sha256Hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  await execute(
    `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, target_id, ip_address, user_agent, details, sha256_hash, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      params.actorId || null,
      params.actorRole,
      params.action,
      params.targetResource,
      params.targetId || null,
      params.ipAddress || '127.0.0.1',
      params.userAgent || 'API',
      detailsStr,
      sha256Hash,
      timestamp
    ]
  );

  return auditId;
}
