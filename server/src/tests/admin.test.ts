import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

async function tokenFor(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

describe('Administrator governance console', () => {
  let adminToken: string;
  let doctorToken: string;

  beforeAll(async () => {
    await initDb();
    await seedDatabase();
    adminToken = await tokenFor('admin@medralink.com', 'admin123');
    doctorToken = await tokenFor('dr.ahmed@medralink.com', 'doctor123');
  });

  describe('User management', () => {
    it('forbids non-admins', async () => {
      const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });

    it('lists users without password hashes and filters by role', async () => {
      const res = await request(app).get('/api/v1/admin/users?role=PATIENT').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      for (const u of res.body.data) {
        expect(u.role).toBe('PATIENT');
        expect(u.password_hash).toBeUndefined();
      }
    });

    it('suspends a user, which immediately blocks their existing token and new logins', async () => {
      const patientToken = await tokenFor('karim@gmail.com', 'patient123');
      const res = await request(app)
        .patch('/api/v1/admin/users/usr-pat-3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' });
      expect(res.status).toBe(200);

      const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${patientToken}`);
      expect(me.status).toBe(403);
      const login = await request(app).post('/api/v1/auth/login').send({ email: 'karim@gmail.com', password: 'patient123' });
      expect(login.status).toBe(403);

      await request(app)
        .patch('/api/v1/admin/users/usr-pat-3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });
      expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${patientToken}`)).status).toBe(200);
    });

    it('prevents an admin from suspending their own account', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/users/usr-admin-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown user and 400 for an invalid status', async () => {
      const missing = await request(app)
        .patch('/api/v1/admin/users/usr-missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });
      expect(missing.status).toBe(404);
      const invalid = await request(app)
        .patch('/api/v1/admin/users/usr-pat-3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELETED' });
      expect(invalid.status).toBe(400);
    });
  });

  describe('System settings', () => {
    it('returns default settings', async () => {
      const res = await request(app).get('/api/v1/admin/settings').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const keys = res.body.data.map((s: { key: string }) => s.key);
      expect(keys).toEqual(expect.arrayContaining(['max_upload_mb', 'session_ttl_hours', 'clinic_name']));
    });

    it('updates a known setting and rejects unknown keys', async () => {
      const ok = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settings: { max_upload_mb: '15' } });
      expect(ok.status).toBe(200);
      const after = await request(app).get('/api/v1/admin/settings').set('Authorization', `Bearer ${adminToken}`);
      expect(after.body.data.find((s: { key: string }) => s.key === 'max_upload_mb').value).toBe('15');

      const bad = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settings: { drop_everything: 'yes' } });
      expect(bad.status).toBe(400);
    });

    it('rejects a non-numeric value for a numeric setting', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settings: { session_ttl_hours: 'forever' } });
      expect(res.status).toBe(400);
    });
  });

  describe('Audit log filters', () => {
    it('filters by userId and action, with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?userId=usr-admin-1&action=LOGIN_SUCCESS&page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(5);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
      for (const log of res.body.data.logs) {
        expect(log.actor_id).toBe('usr-admin-1');
        expect(log.action).toContain('LOGIN_SUCCESS');
      }
    });

    it('filters by time window', async () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .get(`/api/v1/admin/audit-logs?from=${encodeURIComponent(future)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.logs).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it('rejects a malformed date filter', async () => {
      const res = await request(app).get('/api/v1/admin/audit-logs?from=yesterday').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });
});
