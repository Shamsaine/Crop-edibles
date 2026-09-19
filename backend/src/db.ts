import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
export const config = {
  port: Number(process.env.PORT || 4000),
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  secureCookie: process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true',
  paystackKey: process.env.PAYSTACK_SECRET_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
const schema = process.env.DB_SCHEMA || 'public';
if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid DB_SCHEMA');
export const pool = new pg.Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 5435),
    database: process.env.POSTGRES_DB, user: process.env.POSTGRES_USER, password: process.env.POSTGRES_PASSWORD,
  }),
  max: 10, connectionTimeoutMillis: 5000,
  options: `-c search_path=${schema}`,
  ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
});
export type DB = Pick<pg.PoolClient, 'query'>;
export async function transaction<T>(fn: (db: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

