import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
const TABLE = process.env.TABLE || 'notifications';
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });

async function run() {
  await client.connect();
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [TABLE]);
  console.log('columns for', TABLE);
  for (const r of res.rows) console.log('-', r.column_name, r.data_type);
  await client.end();
}
run().catch(e=>{console.error(e);process.exit(3)});
