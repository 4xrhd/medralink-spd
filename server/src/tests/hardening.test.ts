import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server.js';
import { execute, initDb, query, queryOne, runTransaction } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { seedDatabase } from '../db/seed.js';

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

describe('Engineering hardening', () => {
  let rahim: string; // pat-1, linked to doc-1
  let sara: string; // pat-2, linked to doc-2
  let drAhmed: string; // doc-1
  let drFarzana: string; // doc-2
  let admin: string;

  beforeAll(async () => {
    await initDb();
    await seedDatabase();
    rahim = await loginAs('rahim@gmail.com', 'patient123');
    sara = await loginAs('sara@gmail.com', 'patient123');
    drAhmed = await loginAs('dr.ahmed@medralink.com', 'doctor123');
    drFarzana = await loginAs('dr.farzana@medralink.com', 'doctor123');
    admin = await loginAs('admin@medralink.com', 'admin123');
  });

  describe('prescription PDF access', () => {
    it('lets the owning patient download their PDF', async () => {
      const res = await request(app).get('/api/v1/prescriptions/rx-1/pdf').set('Authorization', `Bearer ${rahim}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });

    it("refuses another patient's PDF", async () => {
      const res = await request(app).get('/api/v1/prescriptions/rx-1/pdf').set('Authorization', `Bearer ${sara}`);
      expect(res.status).toBe(403);
    });

    it('refuses an unassigned doctor', async () => {
      const res = await request(app).get('/api/v1/prescriptions/RX-4029/pdf').set('Authorization', `Bearer ${drFarzana}`);
      expect(res.status).toBe(403);
    });

    it('supports POST /prescriptions/:id/pdf as in the proposal', async () => {
      const res = await request(app).post('/api/v1/prescriptions/rx-1/pdf').set('Authorization', `Bearer ${rahim}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });
  });

  describe('lab report files', () => {
    let labId: string;
    let storedName: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/lab-reports/upload')
        .set('Authorization', `Bearer ${drAhmed}`)
        .field('patientId', 'pat-1')
        .field('testName', 'CBC')
        .field('category', 'Hematology')
        .attach('file', PDF_BYTES, { filename: 'cbc.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(201);
      labId = res.body.data.id;
      storedName = path.basename(res.body.data.fileUrl ?? '');
    });

    it('no longer serves uploads as public static files', async () => {
      const files = fs.readdirSync(path.resolve(process.cwd(), 'uploads'));
      const name = files.find((f) => f.endsWith('.pdf')) ?? storedName;
      const res = await request(app).get(`/uploads/${name}`);
      expect(res.status).toBe(404);
    });

    it('returns the file URL as an authenticated API route', async () => {
      const res = await request(app).get('/api/v1/lab-reports').set('Authorization', `Bearer ${rahim}`);
      const row = res.body.data.find((r: { id: string }) => r.id === labId);
      expect(row.file_url).toBe(`/api/v1/lab-reports/${labId}/file`);
    });

    it('serves the file to the owning patient with safe headers', async () => {
      const res = await request(app).get(`/api/v1/lab-reports/${labId}/file`).set('Authorization', `Bearer ${rahim}`);
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-disposition']).toMatch(/cbc\.pdf/);
    });

    it('refuses the file to other patients and anonymous users', async () => {
      expect((await request(app).get(`/api/v1/lab-reports/${labId}/file`).set('Authorization', `Bearer ${sara}`)).status).toBe(403);
      expect((await request(app).get(`/api/v1/lab-reports/${labId}/file`)).status).toBe(401);
    });

    it('returns 404 for a report without a file', async () => {
      const res = await request(app).get('/api/v1/lab-reports/lab-1/file').set('Authorization', `Bearer ${admin}`);
      expect(res.status).toBe(404);
    });

    it('rejects a file whose bytes do not match its declared type, with 400', async () => {
      const res = await request(app)
        .post('/api/v1/lab-reports/upload')
        .set('Authorization', `Bearer ${drAhmed}`)
        .field('patientId', 'pat-1')
        .field('testName', 'Fake')
        .field('category', 'Hematology')
        .attach('file', Buffer.from('MZ not really a pdf'), { filename: 'evil.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(400);
    });

    it('rejects a disallowed extension with 400, not 500', async () => {
      const res = await request(app)
        .post('/api/v1/lab-reports/upload')
        .set('Authorization', `Bearer ${drAhmed}`)
        .field('patientId', 'pat-1')
        .field('testName', 'Script')
        .field('category', 'Hematology')
        .attach('file', Buffer.from('echo hi'), { filename: 'run.sh', contentType: 'text/x-sh' });
      expect(res.status).toBe(400);
    });

    it('does not leave a stored file behind when access is denied', async () => {
      const before = fs.readdirSync(path.resolve(process.cwd(), 'uploads')).length;
      const res = await request(app)
        .post('/api/v1/lab-reports/upload')
        .set('Authorization', `Bearer ${drFarzana}`)
        .field('patientId', 'pat-1')
        .field('testName', 'CBC')
        .field('category', 'Hematology')
        .attach('file', PDF_BYTES, { filename: 'cbc.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(403);
      expect(fs.readdirSync(path.resolve(process.cwd(), 'uploads')).length).toBe(before);
    });
  });

  describe('CORS', () => {
    it('does not allow an unknown origin', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('allows a configured origin', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('patient directory for doctors', () => {
    it('hides national ID numbers from doctors', async () => {
      const res = await request(app).get('/api/v1/patients?q=Sara').set('Authorization', `Bearer ${drAhmed}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].nid_or_bid).toBeUndefined();
    });

    it('matches names case-insensitively', async () => {
      const res = await request(app).get('/api/v1/patients?q=sara').set('Authorization', `Bearer ${admin}`);
      expect(res.body.data.map((p: { full_name: string }) => p.full_name)).toContain('Sara Akter');
    });
  });

  describe('error handler', () => {
    it('does not leak internal messages on 500', async () => {
      const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad json');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('password reset token', () => {
    it('can be used only once', async () => {
      const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'karim@gmail.com' });
      const token = forgot.body.data.resetToken;
      const first = request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: 'newpass123' });
      const second = request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: 'other12345' });
      const statuses = (await Promise.all([first, second])).map((r) => r.status).sort();
      expect(statuses).toEqual([200, 400]);
    });
  });
});

// Runs after the suite above, which already initialised and seeded this worker's database
describe('audit hash chain under concurrency', () => {
  it('keeps one unbroken chain when many events are written at once', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        recordAuditEvent({ actorRole: 'SYSTEM', action: 'CONCURRENCY_TEST', targetResource: 'tests', details: `event ${i}` })
      )
    );
    const rows = await query<{ seq: number }>("SELECT seq FROM audit_logs WHERE action = 'CONCURRENCY_TEST' ORDER BY seq");
    const seqs = rows.map((r) => r.seq);
    expect(new Set(seqs).size).toBe(20);
    expect(seqs[19] - seqs[0]).toBe(19);
  });

  it('rolls back only the failed transaction, not writes from other requests', async () => {
    const failing = runTransaction(async () => {
      await execute("UPDATE system_settings SET value = 'tx' WHERE key = (SELECT key FROM system_settings LIMIT 1)");
      await new Promise((r) => setTimeout(r, 20));
      throw new Error('boom');
    });
    const outside = execute("INSERT INTO notifications (id, user_id, title, message) VALUES ('ntf-tx-test', 'usr-pat-1', 't', 'm')");
    await expect(failing).rejects.toThrow('boom');
    await outside;
    expect(await queryOne("SELECT id FROM notifications WHERE id = 'ntf-tx-test'")).not.toBeNull();
  });
});
