import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const isPostgres = process.env.DB_DIALECT === 'postgres';
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = process.env.SQLITE_PATH || path.join(dataDir, 'medralink.sqlite');

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

if (isPostgres) {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medralink';
  const requiresSsl = process.env.DATABASE_SSL === 'true' || 
    (process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1'));

  pgPool = new Pool({
    connectionString: dbUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pgPool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
  });

  console.log(`[DB] Connecting to PostgreSQL database (SSL: ${requiresSsl ? 'enabled' : 'disabled'})...`);
} else {
  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`[DB] Using embedded SQLite database at ${sqlitePath}`);
}

export const getDb = () => {
  return { isPostgres, sqliteDb, pgPool };
};

/**
 * Resilient schema file resolution that works across dev, dist, and docker builds
 */
function resolveSchemaPath(): string | null {
  const candidatePaths = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../../src/db/schema.sql'),
    path.resolve(__dirname, '../src/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql'),
    path.resolve(process.cwd(), 'server/src/db/schema.sql'),
    path.resolve(process.cwd(), 'dist/db/schema.sql'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function initDb(): Promise<void> {
  const schemaPath = resolveSchemaPath();
  if (!schemaPath) {
    console.warn('[DB] Warning: schema.sql file could not be located in standard candidate paths.');
    return;
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres && pgPool) {
    await pgPool.query(schemaSql);
    console.log('[DB] PostgreSQL schema initialized successfully.');
  } else if (sqliteDb) {
    sqliteDb.exec(schemaSql);
    // Check and migrate columns on notifications table if needed
    try {
      const columns = sqliteDb.prepare("PRAGMA table_info(notifications)").all() as Array<{ name: string }>;
      const colNames = columns.map(c => c.name);
      if (!colNames.includes('category')) {
        sqliteDb.exec("ALTER TABLE notifications ADD COLUMN category TEXT NOT NULL DEFAULT 'GENERAL'");
      }
      if (!colNames.includes('link')) {
        sqliteDb.exec("ALTER TABLE notifications ADD COLUMN link TEXT");
      }
    } catch (migErr) {
      console.warn('[DB] Migration notice:', migErr);
    }
    console.log('[DB] SQLite schema initialized successfully.');
  }
}

export async function pingDb(): Promise<{ ok: boolean; dialect: string; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    if (isPostgres && pgPool) {
      await pgPool.query('SELECT 1');
      return { ok: true, dialect: 'postgres', latencyMs: Date.now() - start };
    } else if (sqliteDb) {
      sqliteDb.prepare('SELECT 1').get();
      return { ok: true, dialect: 'sqlite', latencyMs: Date.now() - start };
    }
    return { ok: false, dialect: 'unknown', latencyMs: Date.now() - start, error: 'No active DB driver' };
  } catch (err: any) {
    return { ok: false, dialect: isPostgres ? 'postgres' : 'sqlite', latencyMs: Date.now() - start, error: err.message };
  }
}

export async function closeDb(): Promise<void> {
  if (isPostgres && pgPool) {
    await pgPool.end();
    console.log('[DB] PostgreSQL connection pool terminated.');
  } else if (sqliteDb) {
    sqliteDb.close();
    console.log('[DB] SQLite database closed.');
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  return [];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
  if (isPostgres && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return { changes: res.rowCount || 0 };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...params);
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  }
  return { changes: 0 };
}

export async function runTransaction<T>(callback: () => Promise<T>): Promise<T> {
  if (isPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback();
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else if (sqliteDb) {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const result = await callback();
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
  return callback();
}
