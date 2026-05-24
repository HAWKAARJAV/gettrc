import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing env'); process.exit(2); }
const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function listTables() {
  const { data, error } = await svc.from('information_schema.tables').select('table_name').eq('table_schema','public').order('table_name');
  if (error) { console.error('tables error', error); return; }
  console.log('Tables:', data.map(r=>r.table_name));
}

async function columnsFor(table) {
  const { data, error } = await svc.from('information_schema.columns').select('column_name,data_type').eq('table_name', table).order('ordinal_position');
  if (error) { console.error('columns error for', table, error); return; }
  console.log('\nColumns for', table, ':', data.map(c=>`${c.column_name} (${c.data_type})`));
}

async function run() {
  await listTables();
  for (const t of ['applications','advisors','documents','notifications','application_status_history']) {
    await columnsFor(t);
  }
}

run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(3)});
