// Each Jest worker gets its own in-memory SQLite database so suites never touch dev data
// or the Supabase database configured in .env (dotenv never overrides variables set here).
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.SQLITE_PATH = ':memory:';
