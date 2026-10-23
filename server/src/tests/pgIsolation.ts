// On PostgreSQL every suite shares one database, so each file starts from an empty schema
// (SQLite runs use a fresh in-memory database per worker and skip this).
import { Pool } from 'pg';

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) return;
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally {
    await pool.end();
  }
});
