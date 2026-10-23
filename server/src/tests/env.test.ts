import { validateEnv } from '../config/env.js';

const SECRET = 'x'.repeat(32);

describe('validateEnv', () => {
  it('accepts the local development defaults', () => {
    expect(validateEnv({}).DB_DIALECT).toBe('sqlite');
  });

  it('requires DATABASE_URL for postgres', () => {
    expect(() => validateEnv({ DB_DIALECT: 'postgres' })).toThrow(/DATABASE_URL/);
  });

  it('requires a long JWT secret and explicit CORS origins in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production', JWT_SECRET: 'short', CORS_ORIGIN: 'https://a.app' })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ NODE_ENV: 'production', JWT_SECRET: SECRET, CORS_ORIGIN: '*' })).toThrow(/CORS_ORIGIN/);
    expect(() => validateEnv({ NODE_ENV: 'production', JWT_SECRET: SECRET })).toThrow(/CORS_ORIGIN/);
  });

  it('accepts a complete production configuration', () => {
    const env = validateEnv({ NODE_ENV: 'production', JWT_SECRET: SECRET, CORS_ORIGIN: 'https://medralink.netlify.app', PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });
});
