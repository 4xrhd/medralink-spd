// Each Jest worker gets its own in-memory SQLite database so suites never touch dev data
// or the Supabase database configured in .env (dotenv never overrides variables set here).
process.env.NODE_ENV = 'test';
// CI also runs the suites against a throwaway Postgres container (TEST_DATABASE_URL)
if (process.env.TEST_DATABASE_URL) {
  process.env.DB_DIALECT = 'postgres';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DATABASE_SSL = 'false';
} else {
  process.env.DB_DIALECT = 'sqlite';
  process.env.SQLITE_PATH = ':memory:';
}
