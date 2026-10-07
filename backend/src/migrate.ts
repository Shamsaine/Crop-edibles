import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool, transaction } from './db.js';
export async function migrate() {
  await transaction(async db => {
    await db.query('SELECT pg_advisory_xact_lock(732941083)');
    await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = new URL('../migrations/', import.meta.url);
    for (const name of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
      const previous = await db.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (previous.rowCount) continue;
      await db.query((await readFile(new URL(name, directory), 'utf8')).replace(/^\uFEFF/, ''));
      await db.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      console.log(`Applied ${name}`);
    }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate().then(() => pool.end()).catch(async error => { console.error(error.message); await pool.end(); process.exitCode=1; });
}
