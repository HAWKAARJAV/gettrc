import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });

async function existsConstraint(name) {
  const res = await client.query(`SELECT 1 FROM pg_constraint WHERE conname = $1`, [name]);
  return res.rowCount > 0;
}

async function existsTable(name) {
  const res = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [name]);
  return res.rowCount > 0;
}

async function runStatements() {
  await client.connect();
  const stmts = [
    `CREATE TABLE IF NOT EXISTS public.application_status_history (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      application_id uuid NOT NULL,
      previous_state text,
      new_state text NOT NULL,
      updated_by text,
      notes text,
      created_at timestamp without time zone DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL,
      application_id uuid,
      notification_type text NOT NULL,
      title text NOT NULL,
      body text,
      action_url text,
      read_at timestamp without time zone,
      created_at timestamp without time zone DEFAULT now()
    );`,

    `ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS advisor_assigned_at timestamp without time zone;`,
    `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type text;`,
    `ALTER TABLE public.advisors ADD COLUMN IF NOT EXISTS name text;`,
  ];

  for (const s of stmts) {
    try {
      console.log('Executing statement...');
      await client.query(s);
      console.log('OK');
    } catch (e) {
      console.error('Statement error:', e.message);
    }
  }

  // Add PK constraints where missing
  if (!await existsConstraint('application_status_history_pkey')) {
    try {
      await client.query(`ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id);`);
      console.log('Added application_status_history_pkey');
    } catch (e) { console.error('constraint error', e.message); }
  }

  if (!await existsConstraint('notifications_pkey')) {
    try {
      await client.query(`ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);`);
      console.log('Added notifications_pkey');
    } catch (e) { console.error('constraint error', e.message); }
  }

  // Add foreign keys
  if (!await existsConstraint('application_status_history_application_id_fkey')) {
    try {
      await client.query(`ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;`);
      console.log('Added application_status_history_application_id_fkey');
    } catch (e) { console.error('fk error', e.message); }
  }

  if (!await existsConstraint('notifications_user_id_fkey')) {
    try {
      await client.query(`ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;`);
      console.log('Added notifications_user_id_fkey');
    } catch (e) { console.error('fk error', e.message); }
  }

  if (!await existsConstraint('notifications_application_id_fkey')) {
    try {
      await client.query(`ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;`);
      console.log('Added notifications_application_id_fkey');
    } catch (e) { console.error('fk error', e.message); }
  }

  // Create indexes
  try { await client.query(`CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON public.application_status_history(application_id);`); console.log('idx application history'); } catch(e){console.error(e.message)}
  try { await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);`); console.log('idx notifications'); } catch(e){console.error(e.message)}

  await client.end();
  console.log('Patch completed');
}

runStatements().catch(e=>{console.error(e);process.exit(3)});
