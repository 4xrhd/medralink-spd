import request from 'supertest';
import { app } from '../server.js';
import { initDb, execute, queryOne } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

describe('Security, RBAC and Audit Hardening', () => {
  let doctorToken: string;
  let patientToken: string;
  let adminToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDb();
    await seedDatabase();
    doctorToken = await loginAs('dr.ahmed@medralink.com', 'doctor123');
    patientToken = await loginAs('rahim@gmail.com', 'patient123');
    adminToken = await loginAs('admin@medralink.com', 'admin123');
  });

  describe('Input validation (express-validator)', () => {
    it('rejects login with a malformed email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email', password: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('rejects registration with an invalid role and short password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'new.user@example.com', password: '123', fullName: 'New User', phone: '+8801700000000', role: 'SUPERUSER'
      });
      expect(res.status).toBe(400);
      const fields = res.body.errors.map((e: { field: string }) => e.field);
      expect(fields).toEqual(expect.arrayContaining(['password', 'role']));
    });

    it('rejects consultation without a chief complaint', async () => {
      const res = await request(app)
        .post('/api/v1/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientId: 'pat-1' });
      expect(res.status).toBe(400);
    });

    it('rejects appointment with an invalid date', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ doctorId: 'doc-1', appointmentDate: 'tomorrow-ish', timeSlot: '10:00 AM' });
      expect(res.status).toBe(400);
    });

    it('rejects an invalid appointment status value', async () => {
      const res = await request(app)
        .patch('/api/v1/appointments/apt-3/status')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'DROP TABLE' });
      expect(res.status).toBe(400);
    });
  });

  describe('Doctor to patient assignment (RBAC)', () => {
    it('allows a doctor to read an assigned patient', async () => {
      const res = await request(app).get('/api/v1/patients/pat-1').set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(200);
    });

    it('forbids a doctor from reading an unassigned patient profile', async () => {
      const res = await request(app).get('/api/v1/patients/pat-2').set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });

    it('forbids a doctor from reading an unassigned patient timeline', async () => {
      const res = await request(app).get('/api/v1/patients/pat-2/timeline').set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });

    it('forbids a doctor from listing lab reports of an unassigned patient', async () => {
      const res = await request(app)
        .get('/api/v1/lab-reports?patientId=pat-2')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });

    it('still lets an admin read any patient', async () => {
      const res = await request(app).get('/api/v1/patients/pat-2').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Audit trail', () => {
    it('records a VIEW event when a patient record is read', async () => {
      await request(app).get('/api/v1/patients/pat-1/timeline').set('Authorization', `Bearer ${doctorToken}`);
      const row = await queryOne<{ action: string }>(
        `SELECT action FROM audit_logs WHERE action = 'TIMELINE_ACCESSED' AND target_id = 'pat-1' LIMIT 1`
      );
      expect(row?.action).toBe('TIMELINE_ACCESSED');
    });

    it('records a DENIED event when access is refused', async () => {
      await request(app).get('/api/v1/patients/pat-2').set('Authorization', `Bearer ${doctorToken}`);
      const row = await queryOne<{ action: string }>(
        `SELECT action FROM audit_logs WHERE action = 'ACCESS_DENIED' AND target_id = 'pat-2' LIMIT 1`
      );
      expect(row?.action).toBe('ACCESS_DENIED');
    });

    it('blocks UPDATE on audit_logs (append-only)', async () => {
      await expect(execute(`UPDATE audit_logs SET action = 'TAMPERED'`)).rejects.toMatchObject({ message: expect.stringMatching(/append-only/i) });
    });

    it('blocks DELETE on audit_logs (append-only)', async () => {
      await expect(execute('DELETE FROM audit_logs')).rejects.toMatchObject({ message: expect.stringMatching(/append-only/i) });
    });
  });
});
