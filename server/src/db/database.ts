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
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medralink'
  });
  console.log('[DB] Connecting to PostgreSQL database...');
} else {
  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`[DB] Using embedded SQLite database at ${sqlitePath}`);
}

export const getDb = () => {
  return { isPostgres, sqliteDb, pgPool };
};

export async function initDb(): Promise<void> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn(`[DB] Schema file not found at ${schemaPath}`);
    return;
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres && pgPool) {
    await pgPool.query(schemaSql);
    console.log('[DB] PostgreSQL schema initialized successfully.');
  } else if (sqliteDb) {
    sqliteDb.exec(schemaSql);
    console.log('[DB] SQLite schema initialized successfully.');
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
