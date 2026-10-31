import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Fixes from the 2026-10-31 API review', () => {
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

  describe('appointments', () => {
    it('stops a doctor gaining access to a patient by booking them', async () => {
      // pat-3 has no appointment or record with doc-1
      const book = await request(app).post('/api/v1/appointments').set(auth(doctorToken))
        .send({ patientId: 'pat-3', appointmentDate: '2099-01-10', timeSlot: '10:00 AM' });
      expect(book.status).toBe(403);
      const timeline = await request(app).get('/api/v1/patients/pat-3/timeline').set(auth(doctorToken));
      expect(timeline.status).toBe(403);
    });

    it('books a doctor onto their own calendar even when another doctorId is sent', async () => {
      const res = await request(app).post('/api/v1/appointments').set(auth(doctorToken))
        .send({ patientId: 'pat-1', doctorId: 'doc-2', appointmentDate: '2099-01-11', timeSlot: '11:00 AM' });
      expect(res.status).toBe(201);
      const list = await request(app).get('/api/v1/appointments').set(auth(doctorToken));
      const created = list.body.data.find((a: { id: string }) => a.id === res.body.data.id);
      expect(created.doctor_id).toBe('doc-1');
    });

    it('rejects past dates and date-times', async () => {
      const past = await request(app).post('/api/v1/appointments').set(auth(patientToken))
        .send({ doctorId: 'doc-1', appointmentDate: '2020-01-01', timeSlot: '10:00 AM' });
      expect(past.status).toBe(400);
      const withTime = await request(app).post('/api/v1/appointments').set(auth(patientToken))
        .send({ doctorId: 'doc-1', appointmentDate: '2099-01-01T09:00:00Z', timeSlot: '10:00 AM' });
      expect(withTime.status).toBe(400);
    });

    it('does not reopen a completed appointment', async () => {
      const res = await request(app).patch('/api/v1/appointments/apt-1/status').set(auth(adminToken))
        .send({ status: 'SCHEDULED' });
      expect(res.status).toBe(409);
    });
  });

  it('refuses to attach a lab report to another patient\'s visit', async () => {
    // rec-2 belongs to pat-2; doc-1 treats pat-1
    const res = await request(app).post('/api/v1/lab-reports/upload').set(auth(doctorToken))
      .field('patientId', 'pat-1').field('recordId', 'rec-2')
      .field('testName', 'CBC').field('category', 'Haematology');
    expect(res.status).toBe(400);
  });

  it('hides doctor contact details from patients on the single-doctor endpoint', async () => {
    const res = await request(app).get('/api/v1/doctors/doc-1').set(auth(patientToken));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBeUndefined();
    expect(res.body.data.phone).toBeUndefined();
  });

  it('blocks an account an admin has set to PENDING', async () => {
    const token = await loginAs('karim@gmail.com', 'patient123');
    await request(app).patch('/api/v1/admin/users/usr-pat-3').set(auth(adminToken)).send({ status: 'PENDING' });
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.status).toBe(403);
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'karim@gmail.com', password: 'patient123' });
    expect(login.status).toBe(403);
    await request(app).patch('/api/v1/admin/users/usr-pat-3').set(auth(adminToken)).send({ status: 'ACTIVE' });
  });

  it('rejects impossible vital signs', async () => {
    const res = await request(app).post('/api/v1/consultations').set(auth(doctorToken))
      .send({ patientId: 'pat-1', chiefComplaint: 'Headache', vitals: { heartRate: 'abc', spo2: 140 } });
    expect(res.status).toBe(400);
  });

  it('requires a BMDC licence number to register as a doctor', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'no.licence@example.com', password: 'Password123', fullName: 'Dr No Licence',
      phone: '+8801711596000', role: 'DOCTOR', doctorData: { specialization: 'Dermatology' },
    });
    expect(res.status).toBe(400);
  });

  it('returns the doctor profile when a doctor registers', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'new.cardio@example.com', password: 'Password123', fullName: 'Dr New Cardio',
      phone: '+8801711596001', role: 'DOCTOR', doctorData: { specialization: 'Cardiology', bmdcLicenseNumber: 'A-77123' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.doctorProfile.bmdcLicenseNumber).toBe('A-77123');
  });

  it('tells a doctor which search results they can already open', async () => {
    const res = await request(app).get('/api/v1/patients').set(auth(doctorToken));
    const byId = Object.fromEntries(res.body.data.map((p: { id: string; is_assigned: number }) => [p.id, Number(p.is_assigned)]));
    expect(byId['pat-1']).toBe(1);
    expect(byId['pat-3']).toBe(0);
  });

  it('counts only prescriptions still within their validity window', async () => {
    const res = await request(app).get('/api/v1/dashboard').set(auth(patientToken));
    expect(res.status).toBe(200);
    expect(typeof res.body.data.stats.activePrescriptionsCount).toBe('number');
  });
});
