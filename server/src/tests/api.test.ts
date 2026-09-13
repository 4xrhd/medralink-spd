import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

describe('MedraLink EMR Backend API Test Suite', () => {
  let doctorToken: string;
  let patientToken: string;
  let adminToken: string;
  let testPatientId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDb();
    await seedDatabase();

    // Login as Doctor
    const docRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dr.ahmed@medralink.com', password: 'doctor123' });
    expect(docRes.status).toBe(200);
    doctorToken = docRes.body.data.token;

    // Login as Patient
    const patRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rahim@gmail.com', password: 'patient123' });
    expect(patRes.status).toBe(200);
    patientToken = patRes.body.data.token;
    testPatientId = patRes.body.data.user.patientId;

    // Login as Admin
    const admRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@medralink.com', password: 'admin123' });
    expect(admRes.status).toBe(200);
    adminToken = admRes.body.data.token;
  });

  describe('1. Authentication Module', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@medralink.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user profile on /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('dr.ahmed@medralink.com');
      expect(res.body.data.role).toBe('DOCTOR');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should forbid PATIENT role from accessing admin audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN role to query audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });

  describe('3. Clinical Consultation & Prescription Engine', () => {
    it('should create an atomic consultation with vitals, ICD-10 diagnosis, and prescription items', async () => {
      const payload = {
        patientId: testPatientId,
        chiefComplaint: 'Acute seasonal throat irritation and low grade fever',
        clinicalNotes: 'Pharynx inflamed. Tonsils normal.',
        vitals: {
          systolicBp: 125,
          diastolicBp: 82,
          heartRate: 76,
          temperature: 38.1,
          spo2: 99,
          weightKg: 75,
          heightCm: 172
        },
        diagnoses: [
          {
            icd10Code: 'J02.9',
            diagnosisTitle: 'Acute Pharyngitis, unspecified',
            severity: 'MILD',
            status: 'ACTIVE'
          }
        ],
        prescription: {
          instructions: 'Drink warm water and avoid cold food.',
          validityDays: 7,
          items: [
            {
              medicationName: 'Azithromycin 500mg',
              genericName: 'Azithromycin',
              dosage: '500mg',
              frequency: '1+0+0',
              duration: '3 Days',
              instructions: '1 hour before meal'
            }
          ]
        }
      };

      const res = await request(app)
        .post('/api/v1/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recordUid).toMatch(/^REC-/);
      expect(res.body.data.prescriptionUid).toMatch(/^RX-/);

      // Verify the patient timeline now includes this newly created consultation
      const timelineRes = await request(app)
        .get(`/api/v1/patients/${testPatientId}/timeline`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(timelineRes.status).toBe(200);
      expect(timelineRes.body.data.timeline.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. Prescription PDF Generation', () => {
    it('should stream a formatted prescription PDF', async () => {
      const rxListRes = await request(app)
        .get('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(rxListRes.status).toBe(200);
      expect(rxListRes.body.data.length).toBeGreaterThan(0);
      const rxId = rxListRes.body.data[0].id;

      const pdfRes = await request(app)
        .get(`/api/v1/prescriptions/${rxId}/pdf`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toBe('application/pdf');
    });
  });
});
