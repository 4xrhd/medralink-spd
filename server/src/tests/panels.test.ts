import request from 'supertest';
import { app } from '../server.js';
import { execute, initDb, queryOne } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { auditEntryHash, verifyAuditChain, verifyAuditRows } from '../services/auditService.js';
import { clinicToday, dbTimestamp } from '../services/clock.js';

async function tokenFor(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const consultation = (overrides: Record<string, unknown> = {}) => ({
  patientId: 'pat-1',
  chiefComplaint: 'Chest discomfort on exertion',
  diagnoses: [{ icd10Code: 'I20.9', diagnosisTitle: 'Angina pectoris', severity: 'MODERATE' }],
  prescription: { items: [{ medicationName: 'Aspirin', dosage: '75 mg', frequency: '0+1+0', duration: '30 days' }] },
  ...overrides,
});

describe('Doctor, patient and admin panel fixes', () => {
  let adminToken: string;
  let doctorToken: string;
  let otherDoctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    await initDb();
    await seedDatabase();
    adminToken = await tokenFor('admin@medralink.com', 'admin123');
    doctorToken = await tokenFor('dr.ahmed@medralink.com', 'doctor123');
    otherDoctorToken = await tokenFor('dr.farzana@medralink.com', 'doctor123');
    patientToken = await tokenFor('rahim@gmail.com', 'patient123');
  });

  describe('Doctor verification', () => {
    it('rejects a non-boolean isVerified instead of treating "false" as true', async () => {
      const res = await request(app).patch('/api/v1/doctors/doc-2/verify').set(auth(adminToken)).send({ isVerified: 'yes' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when the state does not change', async () => {
      const res = await request(app).patch('/api/v1/doctors/doc-1/verify').set(auth(adminToken)).send({ isVerified: true });
      expect(res.status).toBe(409);
    });

    it('records a revoke as DOCTOR_VERIFICATION_REVOKED and blocks consultations until re-approved', async () => {
      const revoke = await request(app).patch('/api/v1/doctors/doc-2/verify').set(auth(adminToken)).send({ isVerified: false });
      expect(revoke.status).toBe(200);
      const entry = await queryOne<{ action: string }>(
        "SELECT action FROM audit_logs WHERE target_id = 'doc-2' ORDER BY seq DESC LIMIT 1"
      );
      expect(entry?.action).toBe('DOCTOR_VERIFICATION_REVOKED');

      const blocked = await request(app).post('/api/v1/consultations').set(auth(otherDoctorToken))
        .send(consultation({ patientId: 'pat-2' }));
      expect(blocked.status).toBe(403);

      const hidden = await request(app).get('/api/v1/doctors').set(auth(patientToken));
      expect(hidden.body.data.map((d: { id: string }) => d.id)).not.toContain('doc-2');
      expect(hidden.body.data[0].email).toBeUndefined();

      expect((await request(app).patch('/api/v1/doctors/doc-2/verify').set(auth(adminToken)).send({ isVerified: true })).status).toBe(200);
    });

    it('still lists every doctor with contact details for admins', async () => {
      const res = await request(app).get('/api/v1/doctors').set(auth(adminToken));
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].email).toBeDefined();
    });
  });

  describe('Consultations', () => {
    it('refuses to complete an appointment that belongs to another doctor', async () => {
      const res = await request(app).post('/api/v1/consultations').set(auth(otherDoctorToken))
        .send(consultation({ patientId: 'pat-2', appointmentId: 'apt-3' }));
      expect(res.status).toBe(409);
      const apt = await queryOne<{ status: string }>("SELECT status FROM appointments WHERE id = 'apt-3'");
      expect(apt?.status).toBe('SCHEDULED');
    });

    it('refuses an already completed appointment', async () => {
      const res = await request(app).post('/api/v1/consultations').set(auth(doctorToken))
        .send(consultation({ appointmentId: 'apt-1' }));
      expect(res.status).toBe(409);
    });

    it('returns 400, not 500, for a medicine without a dosage or an unknown severity', async () => {
      const noDose = await request(app).post('/api/v1/consultations').set(auth(doctorToken))
        .send(consultation({ prescription: { items: [{ medicationName: 'Aspirin', frequency: '1+0+0', duration: '5 days' }] } }));
      expect(noDose.status).toBe(400);
      const badSeverity = await request(app).post('/api/v1/consultations').set(auth(doctorToken))
        .send(consultation({ diagnoses: [{ diagnosisTitle: 'Angina', severity: 'মাঝারি' }] }));
      expect(badSeverity.status).toBe(400);
    });

    it('completes the doctor\'s own open appointment and shows the prescription on the dashboard', async () => {
      const res = await request(app).post('/api/v1/consultations').set(auth(doctorToken))
        .send(consultation({ appointmentId: 'apt-3', followUpDate: '2026-12-01' }));
      expect(res.status).toBe(201);
      const apt = await queryOne<{ status: string }>("SELECT status FROM appointments WHERE id = 'apt-3'");
      expect(apt?.status).toBe('COMPLETED');

      const dash = await request(app).get('/api/v1/dashboard').set(auth(doctorToken));
      const recent = dash.body.data.recentConsultations.find((c: { id: string }) => c.id === res.body.data.recordId);
      expect(recent.prescription_id).toBe(res.body.data.prescriptionId);

      const rx = await request(app).get(`/api/v1/prescriptions/${res.body.data.prescriptionId}`).set(auth(patientToken));
      expect(rx.body.data.follow_up_date).toBe('2026-12-01');
    });
  });

  describe('Dashboards', () => {
    it('shows only open appointments in the doctor\'s queue for today', async () => {
      const today = clinicToday();
      await execute(
        `INSERT INTO appointments (id, appointment_uid, patient_id, doctor_id, appointment_date, time_slot, status, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['apt-open', 'APT-901', 'pat-1', 'doc-1', today, '09:00 AM', 'SCHEDULED', 'Open',
          'apt-done', 'APT-902', 'pat-1', 'doc-1', today, '09:30 AM', 'CANCELLED', 'Cancelled']
      );
      const dash = await request(app).get('/api/v1/dashboard').set(auth(doctorToken));
      const ids = dash.body.data.todayAppointments.map((a: { id: string }) => a.id);
      expect(ids).toContain('apt-open');
      expect(ids).not.toContain('apt-done');
      expect(dash.body.data.stats.todayAppointmentsCount).toBe(ids.length);
    });

    it('gives the patient dashboard the latest doctor\'s facility and follow-up date', async () => {
      const dash = await request(app).get('/api/v1/dashboard').set(auth(patientToken));
      const latest = dash.body.data.activePrescriptions[0];
      expect(latest).toHaveProperty('hospital_affiliation');
      expect(latest).toHaveProperty('follow_up_date');
    });
  });

  describe('Admin settings and audit ledger', () => {
    it('upserts settings and applies the session lifetime to new tokens', async () => {
      const save = await request(app).put('/api/v1/admin/settings').set(auth(adminToken))
        .send({ settings: { session_ttl_hours: '2' } });
      expect(save.status).toBe(200);
      const login = await request(app).post('/api/v1/auth/login').send({ email: 'rahim@gmail.com', password: 'patient123' });
      const payload = JSON.parse(Buffer.from(login.body.data.token.split('.')[1], 'base64url').toString());
      expect(payload.exp - payload.iat).toBe(2 * 3600);
      await request(app).put('/api/v1/admin/settings').set(auth(adminToken)).send({ settings: { session_ttl_hours: '24' } });
    });

    it('verifies the audit hash chain and detects tampering', async () => {
      const ok = await request(app).get('/api/v1/admin/audit-logs/verify').set(auth(adminToken));
      expect(ok.status).toBe(200);
      expect(ok.body.data.valid).toBe(true);
      expect(ok.body.data.checked).toBeGreaterThan(0);

      // The table is append-only, so tampering here means appending an entry with a forged hash
      const last = await queryOne<{ seq: number }>('SELECT MAX(seq) as seq FROM audit_logs');
      await execute(
        `INSERT INTO audit_logs (id, actor_role, action, target_resource, details, sha256_hash, timestamp, seq)
         VALUES ('aud-forged', 'ADMIN', 'FORGED', 'platform', 'forged', ?, ?, ?)`,
        ['f'.repeat(64), new Date().toISOString(), Number(last!.seq) + 1]
      );
      const report = await verifyAuditChain();
      expect(report.valid).toBe(false);
      expect(report.brokenAt?.id).toBe('aud-forged');
    });

    it('accepts entry 1 anchored to a legacy row, but not to an unknown hash', () => {
      const base = { actor_id: null, actor_role: 'ADMIN', target_resource: 'users', target_id: null, details: '' };
      const legacy = { ...base, id: 'aud-old', seq: null, action: 'SEED', timestamp: '2026-01-01 00:00:00', sha256_hash: 'a'.repeat(64) };
      const first = { ...base, id: 'aud-1', seq: 1, action: 'LOGIN', timestamp: '2026-01-02T00:00:00.000Z', sha256_hash: '' };
      first.sha256_hash = auditEntryHash(legacy.sha256_hash, first);
      const second = { ...base, id: 'aud-2', seq: 2, action: 'LOGOUT', timestamp: '2026-01-02T01:00:00.000Z', sha256_hash: '' };
      second.sha256_hash = auditEntryHash(first.sha256_hash, second);

      expect(verifyAuditRows([second, legacy, first])).toEqual({ valid: true, checked: 2, unchained: 1 });
      expect(verifyAuditRows([first, second]).valid).toBe(false);
      expect(verifyAuditRows([legacy, first, { ...second, details: 'edited' }]).brokenAt?.seq).toBe(2);
    });

    it('finds entries by action name and filters by date across timestamp formats', async () => {
      const byAction = await request(app).get('/api/v1/admin/audit-logs').set(auth(adminToken))
        .query({ search: 'SYSTEM_BOOTSTRAP' });
      expect(byAction.body.data.total).toBeGreaterThanOrEqual(1);

      await execute(
        `INSERT INTO audit_logs (id, actor_role, action, target_resource, details, sha256_hash, timestamp)
         VALUES ('aud-legacy', 'ADMIN', 'LEGACY_ROW', 'platform', 'legacy', 'x', ?)`,
        [dbTimestamp()]
      );
      const from = new Date(Date.now() - 60_000).toISOString();
      const recent = await request(app).get('/api/v1/admin/audit-logs').set(auth(adminToken)).query({ from, action: 'LEGACY_ROW' });
      expect(recent.body.data.total).toBe(1);
    });

    it('lets only admins verify the ledger', async () => {
      expect((await request(app).get('/api/v1/admin/audit-logs/verify').set(auth(doctorToken))).status).toBe(403);
    });
  });

  describe('PDF downloads', () => {
    it('ignores a session token placed in the URL', async () => {
      const res = await request(app).get(`/api/v1/prescriptions/rx-1/pdf?token=${patientToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Clock helpers', () => {
    it('formats the clinic date in Dhaka time and DB timestamps in UTC', () => {
      // 20:30 UTC on 1 Jan is already 2 Jan in Dhaka (UTC+6)
      expect(clinicToday(new Date('2026-01-01T20:30:00Z'))).toBe('2026-01-02');
      expect(dbTimestamp(new Date('2026-01-01T20:30:05.123Z'))).toBe('2026-01-01 20:30:05');
    });
  });
});
