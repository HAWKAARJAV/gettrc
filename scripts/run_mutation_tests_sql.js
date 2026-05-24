import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
const APPLICATION_ID = process.env.APPLICATION_ID || 'b1525d81-7b96-4865-97d8-b9f1b3b13ca2';
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });

async function fetchApp() {
  const res = await client.query(`SELECT * FROM public.applications WHERE id = $1`, [APPLICATION_ID]);
  return res.rows[0] || null;
}

async function fetchHistory() {
  const res = await client.query(`SELECT * FROM public.application_status_history WHERE application_id = $1 ORDER BY created_at ASC`, [APPLICATION_ID]);
  return res.rows;
}

async function fetchNotifications() {
  const res = await client.query(`SELECT * FROM public.notifications WHERE application_id = $1 ORDER BY created_at ASC LIMIT 20`, [APPLICATION_ID]);
  return res.rows;
}

async function fetchDocs() {
  const res = await client.query(`SELECT * FROM public.documents WHERE application_id = $1 ORDER BY created_at ASC LIMIT 20`, [APPLICATION_ID]);
  return res.rows;
}

async function run() {
  await client.connect();
  console.log('\n=== initial application ===');
  console.log(await fetchApp());

  console.log('\n=== assign advisor ===');
  const advisorId = '00000000-0000-4000-8000-000000000999';
  const advisorName = 'Test Advisor';
  const now = new Date().toISOString();
  const app = await fetchApp();
  if (!app) { console.error('Application not found'); await client.end(); process.exit(3); }
  await client.query(`UPDATE public.applications SET advisor_id=$1, advisor_name=$2, advisor_assigned_at=$3, workflow_state='advisor_assigned' WHERE id=$4`, [advisorId, advisorName, now, APPLICATION_ID]);
  await client.query(`INSERT INTO public.application_status_history (application_id, previous_state, new_state, updated_by, notes) VALUES ($1,$2,$3,$4,$5)`, [APPLICATION_ID, app.workflow_state, 'advisor_assigned', 'test-script', 'Assigned test advisor']);
  await client.query(`INSERT INTO public.notifications (user_id, application_id, notification_type, title, body, action_url, level, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [app.user_id, APPLICATION_ID, 'workflow', 'Advisor assigned', 'Advisor assigned to application', '/retail/applications/'+APPLICATION_ID, 'info', now]);

  console.log('after assign app:', await fetchApp());
  console.log('history:', await fetchHistory());
  console.log('notifications:', await fetchNotifications());

  console.log('\n=== create document ===');
  const docRes = await client.query(`INSERT INTO public.documents (application_id, document_type, file_url, uploaded_by, uploaded_at, review_status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [APPLICATION_ID, 'emirates_id', 'uploads/test-emirates-id.pdf', app.user_id, now, 'pending', now]);
  console.log('doc', docRes.rows[0]);

  console.log('\n=== review -> reject ===');
  const docId = docRes.rows[0].id;
  await client.query(`UPDATE public.documents SET review_status='rejected', reviewer_notes=$1 WHERE id=$2`, ['Test rejection from script', docId]);
  await client.query(`INSERT INTO public.notifications (user_id, application_id, notification_type, title, body, action_url, level, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [app.user_id, APPLICATION_ID, 'workflow', 'Document rejected', 'Your document was rejected.', '/retail/applications/'+APPLICATION_ID+'?panel=documents&doc='+docId, 'info', now]);

  console.log('documents', await fetchDocs());
  console.log('notifications', await fetchNotifications());

  console.log('\n=== update payment state ===');
  const nextState = 'completed';
  await client.query(`UPDATE public.applications SET payment_state=$1, workflow_state='payment_completed' WHERE id=$2`, [nextState, APPLICATION_ID]);
  await client.query(`INSERT INTO public.application_status_history (application_id, previous_state, new_state, updated_by, notes) VALUES ($1,$2,$3,$4,$5)`, [APPLICATION_ID, 'advisor_assigned', 'payment_completed', 'test-script', 'Payment completed by script']);
  await client.query(`INSERT INTO public.notifications (user_id, application_id, notification_type, title, body, action_url, level, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [app.user_id, APPLICATION_ID, 'workflow', 'Payment completed', 'Payment completed for application', '/retail/applications/'+APPLICATION_ID, 'info', now]);

  console.log('final app', await fetchApp());
  console.log('final history', await fetchHistory());
  console.log('final notifications', await fetchNotifications());

  await client.end();
  console.log('\n=== done ===');
}

run().catch(e=>{console.error(e); process.exit(4)});
