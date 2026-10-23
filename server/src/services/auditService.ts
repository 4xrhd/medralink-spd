import crypto from 'crypto';
import { execute, isPostgresDialect, queryOne, runTransaction } from '../db/database.js';

const GENESIS_HASH = '0'.repeat(64);
// Arbitrary constant naming the Postgres advisory lock that serializes audit writes
const AUDIT_CHAIN_LOCK = 416_2026;

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

/**
 * Appends one event to the hash chain. Reading the previous link and inserting the new one
 * happen in a single serialized transaction, so concurrent requests can never fork the chain.
 */
export async function recordAuditEvent(params: AuditParams): Promise<string> {
  const auditId = `aud-${crypto.randomUUID()}`;
  const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : (params.details || '');
  const timestamp = new Date().toISOString();

  await runTransaction(async () => {
    if (isPostgresDialect()) await queryOne('SELECT pg_advisory_xact_lock(?)', [AUDIT_CHAIN_LOCK]);

    const lastLog = await queryOne<{ sha256_hash: string; seq: number | null }>(
      'SELECT sha256_hash, seq FROM audit_logs ORDER BY COALESCE(seq, 0) DESC, timestamp DESC LIMIT 1'
    );
    const prevHash = lastLog?.sha256_hash || GENESIS_HASH;
    const seq = (lastLog?.seq ?? 0) + 1;

    const hashContent = `${prevHash}|${auditId}|${params.actorId || 'system'}|${params.actorRole}|${params.action}|${params.targetResource}|${params.targetId || ''}|${timestamp}|${detailsStr}`;
    const sha256Hash = crypto.createHash('sha256').update(hashContent).digest('hex');

    await execute(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, target_id, ip_address, user_agent, details, sha256_hash, timestamp, seq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        timestamp,
        seq,
      ]
    );
  });

  return auditId;
}
