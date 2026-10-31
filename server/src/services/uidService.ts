import { randomInt } from 'crypto';
import { queryOne } from '../db/database.js';

/* Human-readable codes (P-1001, RX-4029, APT-802) live in UNIQUE columns, so a random pick must
 * be checked before insert. Each kind gets a range wide enough that retries are rare. */

const CODE_KINDS = {
  patient: { prefix: 'P-', table: 'patients', column: 'patient_uid', min: 1000, max: 99999 },
  doctor: { prefix: 'DOC-', table: 'doctors', column: 'doctor_uid', min: 2000, max: 99999 },
  record: { prefix: 'REC-', table: 'medical_records', column: 'record_uid', min: 10000, max: 999999 },
  prescription: { prefix: 'RX-', table: 'prescriptions', column: 'prescription_uid', min: 1000, max: 999999 },
  appointment: { prefix: 'APT-', table: 'appointments', column: 'appointment_uid', min: 100, max: 999999 },
} as const;

export type CodeKind = keyof typeof CODE_KINDS;

const MAX_ATTEMPTS = 10;

/** Returns a code of this kind that is not in use yet. Table and column names come from the fixed map above. */
export async function uniqueCode(kind: CodeKind): Promise<string> {
  const { prefix, table, column, min, max } = CODE_KINDS[kind];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = `${prefix}${randomInt(min, max + 1)}`;
    const taken = await queryOne(`SELECT 1 AS taken FROM ${table} WHERE ${column} = ?`, [code]);
    if (!taken) return code;
  }
  throw new Error(`Could not allocate a unique ${kind} code after ${MAX_ATTEMPTS} attempts`);
}
