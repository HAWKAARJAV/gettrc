import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });

async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS level text DEFAULT 'info'`);
    console.log('added level column');
  } catch (e) { console.error(e.message); }
  await client.end();
}
run().catch(e=>{console.error(e);process.exit(3)});
