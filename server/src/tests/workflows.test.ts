import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

async function tokenFor(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token;
}

const PDF_BYTES = Buffer.from('%PDF-1.4\n%test\n');

describe('Clinical workflows across roles', () => {
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

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('Registration', () => {
    it('registers a patient and a doctor', async () => {
      const patient = await request(app).post('/api/v1/auth/register').send({
        email: 'new.patient@example.com', password: 'password123', fullName: 'New Patient', phone: '+8801700000001',
        role: 'PATIENT', patientData: { dateOfBirth: '1995-02-02', gender: 'FEMALE', bloodGroup: 'A+' },
      });
      expect(patient.status).toBe(201);
      expect(patient.body.data.user.patientId).toBeDefined();

      const doctor = await request(app).post('/api/v1/auth/register').send({
        email: 'new.doctor@example.com', password: 'password123', fullName: 'Dr New', phone: '+8801700000002',
        role: 'DOCTOR', doctorData: { specialization: 'Dermatology', bmdcLicenseNumber: 'BMDC-A-11111' },
      });
      expect(doctor.status).toBe(201);
      expect(doctor.body.data.user.doctorId).toBeDefined();
    });

    it('rejects a duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'rahim@gmail.com', password: 'password123', fullName: 'Dup', phone: '+8801700000003', role: 'PATIENT',
      });
      expect(res.status).toBe(409);
    });

    it('rejects login for an unknown email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'ghost@example.com', password: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('Appointments', () => {
    let appointmentId: string;

    it('lets a patient book only for themselves', async () => {
      const res = await request(app).post('/api/v1/appointments').set(auth(patientToken))
        .send({ patientId: 'pat-2', doctorId: 'doc-2', appointmentDate: '2026-12-01', timeSlot: '10:00 AM', reason: 'Checkup' });
      expect(res.status).toBe(201);
      appointmentId = res.body.data.id;

      const mine = await request(app).get('/api/v1/appointments').set(auth(patientToken));
      const booked = mine.body.data.find((a: { id: string }) => a.id === appointmentId);
      expect(booked.patient_id).toBe('pat-1');
    });

    it('returns 404 for an unknown doctor', async () => {
      const res = await request(app).post('/api/v1/appointments').set(auth(patientToken))
        .send({ doctorId: 'doc-missing', appointmentDate: '2026-12-01', timeSlot: '10:00 AM' });
      expect(res.status).toBe(404);
    });

    it('lists appointments scoped to each role', async () => {
      const doctor = await request(app).get('/api/v1/appointments').set(auth(otherDoctorToken));
      expect(doctor.status).toBe(200);
      expect(doctor.body.data.every((a: { doctor_id: string }) => a.doctor_id === 'doc-2')).toBe(true);
      const admin = await request(app).get('/api/v1/appointments').set(auth(adminToken));
      expect(admin.body.data.length).toBeGreaterThan(doctor.body.data.length - 1);
    });

    it('booking assigns the doctor, granting access to the patient record', async () => {
      const res = await request(app).get('/api/v1/patients/pat-1').set(auth(otherDoctorToken));
      expect(res.status).toBe(200);
    });

    it('enforces who may change an appointment status', async () => {
      const wrongDoctor = await request(app).patch('/api/v1/appointments/apt-1/status').set(auth(otherDoctorToken)).send({ status: 'CANCELLED' });
      expect(wrongDoctor.status).toBe(403);

      const patientComplete = await request(app).patch(`/api/v1/appointments/${appointmentId}/status`).set(auth(patientToken)).send({ status: 'COMPLETED' });
      expect(patientComplete.status).toBe(403);

      const patientCancel = await request(app).patch(`/api/v1/appointments/${appointmentId}/status`).set(auth(patientToken)).send({ status: 'CANCELLED' });
      expect(patientCancel.status).toBe(200);

      const missing = await request(app).patch('/api/v1/appointments/apt-missing/status').set(auth(adminToken)).send({ status: 'CANCELLED' });
      expect(missing.status).toBe(404);
    });
  });

  describe('Doctors directory and verification', () => {
    it('lists doctors and fetches one by id', async () => {
      const list = await request(app).get('/api/v1/doctors').set(auth(patientToken));
      expect(list.status).toBe(200);
      expect(list.body.data.length).toBeGreaterThanOrEqual(2);
      const one = await request(app).get('/api/v1/doctors/doc-1').set(auth(patientToken));
      expect(one.status).toBe(200);
      expect((await request(app).get('/api/v1/doctors/doc-missing').set(auth(patientToken))).status).toBe(404);
    });

    it('allows only admins to verify doctors', async () => {
      expect((await request(app).patch('/api/v1/doctors/doc-2/verify').set(auth(doctorToken)).send({ isVerified: false })).status).toBe(403);
      expect((await request(app).patch('/api/v1/doctors/doc-2/verify').set(auth(adminToken)).send({ isVerified: true })).status).toBe(200);
      expect((await request(app).patch('/api/v1/doctors/doc-missing/verify').set(auth(adminToken)).send({ isVerified: true })).status).toBe(404);
    });
  });

  describe('Dashboards', () => {
    it.each([
      ['admin', () => adminToken],
      ['doctor', () => doctorToken],
      ['patient', () => patientToken],
    ])('returns role-specific statistics for %s', async (_role, token) => {
      const res = await request(app).get('/api/v1/dashboard').set(auth(token()));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Lab reports', () => {
    it('uploads a PDF lab report for an assigned patient', async () => {
      const res = await request(app).post('/api/v1/lab-reports/upload').set(auth(doctorToken))
        .field('patientId', 'pat-1').field('testName', 'Lipid Profile').field('category', 'Biochemistry')
        .field('testDate', '2026-10-01').field('resultsSummary', 'LDL <b>high</b>')
        .attach('file', PDF_BYTES, { filename: 'lipid.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(201);
    });

    it('strips HTML tags from free text', async () => {
      const res = await request(app).get('/api/v1/lab-reports?patientId=pat-1').set(auth(doctorToken));
      const report = res.body.data.find((r: { test_name: string }) => r.test_name === 'Lipid Profile');
      expect(report.results_summary).toBe('LDL high');
    });

    it('refuses uploads for unassigned patients and disallowed file types', async () => {
      const unassigned = await request(app).post('/api/v1/lab-reports/upload').set(auth(doctorToken))
        .field('patientId', 'pat-3').field('testName', 'CBC').field('category', 'Hematology');
      expect(unassigned.status).toBe(403);

      const exe = await request(app).post('/api/v1/lab-reports/upload').set(auth(doctorToken))
        .field('patientId', 'pat-1').field('testName', 'CBC').field('category', 'Hematology')
        .attach('file', Buffer.from('MZ'), { filename: 'virus.exe', contentType: 'application/octet-stream' });
      expect(exe.status).toBeGreaterThanOrEqual(400);
    });

    it('scopes lab report listings by role', async () => {
      const patient = await request(app).get('/api/v1/lab-reports').set(auth(patientToken));
      expect(patient.body.data.every((r: { patient_id: string }) => r.patient_id === 'pat-1')).toBe(true);
      const doctor = await request(app).get('/api/v1/lab-reports').set(auth(doctorToken));
      expect(doctor.status).toBe(200);
      const admin = await request(app).get('/api/v1/lab-reports').set(auth(adminToken));
      expect(admin.status).toBe(200);
    });

    it('forbids patients from uploading', async () => {
      const res = await request(app).post('/api/v1/lab-reports/upload').set(auth(patientToken))
        .field('patientId', 'pat-1').field('testName', 'CBC').field('category', 'Hematology');
      expect(res.status).toBe(403);
    });
  });

  describe('Prescriptions', () => {
    it('lists prescriptions scoped to each role', async () => {
      for (const token of [patientToken, doctorToken, adminToken]) {
        const res = await request(app).get('/api/v1/prescriptions').set(auth(token));
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('lets the owning patient read a prescription and blocks an unassigned doctor', async () => {
      const list = await request(app).get('/api/v1/prescriptions').set(auth(patientToken));
      const rxId = list.body.data[0].id;
      expect((await request(app).get(`/api/v1/prescriptions/${rxId}`).set(auth(patientToken))).status).toBe(200);

      const other = await request(app).get('/api/v1/prescriptions').set(auth(otherDoctorToken));
      const foreign = other.body.data.find((p: { patient_id: string }) => p.patient_id === 'pat-2');
      if (foreign) {
        expect((await request(app).get(`/api/v1/prescriptions/${foreign.id}`).set(auth(doctorToken))).status).toBe(403);
      }
      expect((await request(app).get('/api/v1/prescriptions/rx-missing').set(auth(patientToken))).status).toBe(404);
    });
  });

  describe('Patient search', () => {
    it('lets doctors search and forbids patients', async () => {
      expect((await request(app).get('/api/v1/patients?q=Rahim').set(auth(doctorToken))).status).toBe(200);
      expect((await request(app).get('/api/v1/patients?q=Rahim').set(auth(patientToken))).status).toBe(403);
      expect((await request(app).get('/api/v1/patients/pat-missing').set(auth(adminToken))).status).toBe(404);
    });
  });

  describe('Health and fallbacks', () => {
    it('reports health and 404s unknown API routes', async () => {
      expect((await request(app).get('/api/health')).status).toBe(200);
      expect((await request(app).get('/api/v1/nope')).status).toBe(404);
    });
  });
});
