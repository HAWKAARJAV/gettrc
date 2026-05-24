import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });

async function hasTable(name) {
  const res = await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`, [name]);
  return res.rows[0].exists;
}

async function hasColumn(table, column) {
  const res = await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2)`, [table, column]);
  return res.rows[0].exists;
}

async function run() {
  await client.connect();
  const tables = ['applications','application_status_history','notifications','documents','advisors','profiles'];
  for (const t of tables) {
    const exists = await hasTable(t);
    console.log(`table ${t}: ${exists}`);
    if (exists) {
      const cols = ['workflow_state','payment_state','advisor_id','advisor_assigned_at','document_type','review_status','reviewer_notes','name'];
      for (const c of cols) {
        const colExists = await hasColumn(t, c);
        console.log(`  col ${c}: ${colExists}`);
      }
    }
  }
  await client.end();
}

run().catch(e=>{console.error(e);process.exit(3)});
