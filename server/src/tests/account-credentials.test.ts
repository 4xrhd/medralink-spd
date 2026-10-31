import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function signIn(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.data.token;
}

// One account per role; each test run changes and then restores its credentials
const ROLES = [
  { role: 'ADMIN', email: 'admin@medralink.com', password: 'admin123' },
  { role: 'DOCTOR', email: 'dr.farzana@medralink.com', password: 'doctor123' },
  { role: 'PATIENT', email: 'sara@gmail.com', password: 'patient123' },
] as const;

describe('Email and password changes for every role', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDb();
    await seedDatabase();
  });

  describe.each(ROLES)('$role', ({ role, email, password }) => {
    const newPassword = `New-${role.toLowerCase()}-Pass1`;
    const newEmail = `changed.${role.toLowerCase()}@example.com`;

    it('changes the password, keeps this device signed in and signs out the others', async () => {
      const thisDevice = await signIn(email, password);
      const otherDevice = await signIn(email, password);

      const res = await request(app).put('/api/v1/auth/password').set(auth(thisDevice))
        .send({ currentPassword: password, newPassword });
      expect(res.status).toBe(200);
      const fresh = res.body.data.token;

      expect((await request(app).get('/api/v1/auth/me').set(auth(fresh))).status).toBe(200);
      expect((await request(app).get('/api/v1/auth/me').set(auth(otherDevice))).status).toBe(401);
      expect((await request(app).post('/api/v1/auth/login').send({ email, password })).status).toBe(401);
      await signIn(email, newPassword);

      // restore
      const back = await request(app).put('/api/v1/auth/password').set(auth(fresh))
        .send({ currentPassword: newPassword, newPassword: password });
      expect(back.status).toBe(200);
    });

    it('refuses a wrong current password and an unchanged password', async () => {
      const token = await signIn(email, password);
      const wrong = await request(app).put('/api/v1/auth/password').set(auth(token))
        .send({ currentPassword: 'not-it-123', newPassword });
      // 400, not 401: the client treats 401 as an ended session and would sign the user out
      expect(wrong.status).toBe(400);
      expect((await request(app).get('/api/v1/auth/me').set(auth(token))).status).toBe(200);
      const same = await request(app).put('/api/v1/auth/password').set(auth(token))
        .send({ currentPassword: password, newPassword: password });
      expect(same.status).toBe(400);
    });

    it('changes the email with the current password and signs in with the new one', async () => {
      const thisDevice = await signIn(email, password);
      const otherDevice = await signIn(email, password);

      const res = await request(app).put('/api/v1/auth/email').set(auth(thisDevice))
        .send({ newEmail, currentPassword: password });
      expect(res.status).toBe(200);
      const fresh = res.body.data.token;

      const me = await request(app).get('/api/v1/auth/me').set(auth(fresh));
      expect(me.status).toBe(200);
      expect(me.body.data.email).toBe(newEmail);
      expect((await request(app).get('/api/v1/auth/me').set(auth(otherDevice))).status).toBe(401);
      expect((await request(app).post('/api/v1/auth/login').send({ email, password })).status).toBe(401);
      await signIn(newEmail, password);

      // restore
      const back = await request(app).put('/api/v1/auth/email').set(auth(fresh))
        .send({ newEmail: email, currentPassword: password });
      expect(back.status).toBe(200);
    });

    it('refuses an email change with a wrong password, a taken email or a bad address', async () => {
      const token = await signIn(email, password);
      const wrong = await request(app).put('/api/v1/auth/email').set(auth(token))
        .send({ newEmail, currentPassword: 'not-it-123' });
      expect(wrong.status).toBe(400);
      const taken = await request(app).put('/api/v1/auth/email').set(auth(token))
        .send({ newEmail: 'rahim@gmail.com', currentPassword: password });
      expect(taken.status).toBe(409);
      const bad = await request(app).put('/api/v1/auth/email').set(auth(token))
        .send({ newEmail: 'not-an-email', currentPassword: password });
      expect(bad.status).toBe(400);
    });
  });

  it('signs out every session after a password reset', async () => {
    const before = await signIn('karim@gmail.com', 'patient123');
    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'karim@gmail.com' });
    const reset = await request(app).post('/api/v1/auth/reset-password')
      .send({ token: forgot.body.data.resetToken, newPassword: 'Reset-Pass-123' });
    expect(reset.status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me').set(auth(before))).status).toBe(401);
    await signIn('karim@gmail.com', 'Reset-Pass-123');
  });
});
