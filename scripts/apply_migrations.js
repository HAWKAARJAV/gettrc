import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');
const MIGRATION_FILES = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

const PG_CONN = process.env.PG_CONN;
if (!PG_CONN) {
  console.error('Please set PG_CONN environment variable (postgres connection string)');
  process.exit(2);
}

async function run() {
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    console.log('\n--- Applying', file, '---');
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await client.query('BEGIN');
      // Some migration files include SET commands and search_path manipulation.
      // Execute the entire file as a single query to preserve block structure.
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Applied', file);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error applying', file, err.message || err);
      // continue to next file rather than aborting to attempt idempotent updates
    }
  }
  await client.end();
  console.log('\nMigrations finished');
}

run().catch(e => { console.error('Migration runner failed', e); process.exit(3); });
