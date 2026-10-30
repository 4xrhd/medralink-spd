import crypto from 'crypto';
import { execute, isPostgresDialect, query, queryOne, runTransaction } from '../db/database.js';

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

export interface AuditChainReport {
  valid: boolean;
  checked: number;
  /** Rows written before the chain existed (no seq); they are not part of the verifiable chain. */
  unchained: number;
  brokenAt?: { seq: number; id: string; reason: string };
}

/** Postgres returns TIMESTAMP as "YYYY-MM-DD HH:MM:SS.mmm"; the hash was computed over the ISO form. */
function toIsoTimestamp(value: string): string {
  return value.includes('T') ? value : new Date(`${value.replace(' ', 'T')}Z`).toISOString();
}

export interface AuditChainRow {
  id: string; seq: number | null; actor_id: string | null; actor_role: string; action: string;
  target_resource: string; target_id: string | null; timestamp: string; details: string | null; sha256_hash: string;
}

/** SHA-256 link for one entry, matching the content recordAuditEvent hashes. */
export function auditEntryHash(prevHash: string, row: AuditChainRow): string {
  return crypto
    .createHash('sha256')
    .update(`${prevHash}|${row.id}|${row.actor_id || 'system'}|${row.actor_role}|${row.action}|${row.target_resource}|${row.target_id || ''}|${toIsoTimestamp(String(row.timestamp))}|${row.details || ''}`)
    .digest('hex');
}

/** Checks rows (any order) and reports the first chained entry whose link does not match. */
export function verifyAuditRows(rows: AuditChainRow[]): AuditChainReport {
  const chained = rows.filter((r) => r.seq !== null).sort((a, b) => Number(a.seq) - Number(b.seq));
  const unchained = rows.length - chained.length;
  // Databases seeded before the chain existed anchored entry 1 to the newest legacy (unchained) row
  // instead of the genesis hash, so entry 1 may link to any of those rows.
  const legacyHashes = rows.filter((r) => r.seq === null).map((r) => r.sha256_hash);
  let prevHash = GENESIS_HASH;
  for (const [index, row] of chained.entries()) {
    const expectedSeq = index + 1;
    if (Number(row.seq) !== expectedSeq) {
      return { valid: false, checked: index, unchained, brokenAt: { seq: Number(row.seq), id: row.id, reason: `Expected entry ${expectedSeq}; an entry is missing or out of order.` } };
    }
    const candidates = index === 0 ? [GENESIS_HASH, ...legacyHashes] : [prevHash];
    if (!candidates.some((prev) => auditEntryHash(prev, row) === row.sha256_hash)) {
      return { valid: false, checked: index, unchained, brokenAt: { seq: expectedSeq, id: row.id, reason: 'Stored hash does not match the entry contents.' } };
    }
    prevHash = row.sha256_hash;
  }
  return { valid: true, checked: chained.length, unchained };
}

/** Recomputes every chained entry in seq order and reports the first link that does not match. */
export async function verifyAuditChain(): Promise<AuditChainReport> {
  return verifyAuditRows(await query<AuditChainRow>('SELECT * FROM audit_logs'));
}
