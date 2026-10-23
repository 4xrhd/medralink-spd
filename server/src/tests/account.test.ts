import request from 'supertest';
import { app } from '../server.js';
import { initDb } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

async function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

describe('Account self-service: profile, password change and reset', () => {
  let patientToken: string;

  beforeAll(async () => {
    await initDb();
    await seedDatabase();
    patientToken = (await login('karim@gmail.com', 'patient123')).body.data.token;
  });

  it('updates the profile name and phone', async () => {
    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fullName: 'Karim Hasan Updated', phone: '+8801811999999' });
    expect(res.status).toBe(200);
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${patientToken}`);
    expect(me.body.data.full_name ?? me.body.data.fullName).toBe('Karim Hasan Updated');
  });

  it('rejects profile update with an invalid phone', async () => {
    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ phone: 'call me' });
    expect(res.status).toBe(400);
  });

  it('refuses a password change when the current password is wrong', async () => {
    const res = await request(app)
      .put('/api/v1/auth/password')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'newpassword123' });
    expect(res.status).toBe(401);
  });

  it('changes the password and allows login with the new one', async () => {
    const res = await request(app)
      .put('/api/v1/auth/password')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ currentPassword: 'patient123', newPassword: 'newpassword123' });
    expect(res.status).toBe(200);
    expect((await login('karim@gmail.com', 'newpassword123')).status).toBe(200);
    expect((await login('karim@gmail.com', 'patient123')).status).toBe(401);
  });

  it('answers forgot-password identically for unknown emails (no account enumeration)', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data?.resetToken).toBeUndefined();
  });

  it('resets the password with a valid single-use token', async () => {
    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'sara@gmail.com' });
    expect(forgot.status).toBe(200);
    const token = forgot.body.data.resetToken as string;
    expect(token).toHaveLength(64);

    const reset = await request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: 'resetpass123' });
    expect(reset.status).toBe(200);
    expect((await login('sara@gmail.com', 'resetpass123')).status).toBe(200);

    const reuse = await request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: 'another123' });
    expect(reuse.status).toBe(400);
  });

  it('rejects an unknown reset token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'f'.repeat(64), newPassword: 'whatever123' });
    expect(res.status).toBe(400);
  });
});
