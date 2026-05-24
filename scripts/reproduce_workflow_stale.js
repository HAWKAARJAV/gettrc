#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_ID = process.env.APP_ID || process.argv[2];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
if (!APP_ID) {
  console.error('Provide APP_ID as env or arg');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function fetchApp(applicationId) {
  const { data, error } = await svc.from('applications').select('*').eq('id', applicationId).maybeSingle();
  if (error) console.error('fetchApp error', error);
  return data;
}

async function fetchHistory(applicationId) {
  const { data, error } = await svc.from('application_status_history').select('*').eq('application_id', applicationId).order('created_at', { ascending: true }).limit(50);
  if (error) console.error('fetchHistory error', error);
  return data || [];
}

async function insertHistory(applicationId, previous, next, notes) {
  const { data, error } = await svc.from('application_status_history').insert({ application_id: applicationId, previous_state: previous, new_state: next, updated_by: 'reproducer', notes }).select('*').maybeSingle();
  if (error) console.error('insertHistory error', error);
  return data;
}

async function updateApplication(applicationId, patch) {
  const { data, error } = await svc.from('applications').update(patch).eq('id', applicationId).select('*').maybeSingle();
  if (error) console.error('updateApplication error', error);
  return data;
}

async function createDocument(application) {
  const { data, error } = await svc.from('documents').insert({ application_id: application.id, document_type: 'emirates_id', file_url: 'uploads/e2e-emirates-id.pdf', uploaded_by: application.user_id, uploaded_at: new Date().toISOString(), review_status: 'pending' }).select('*').maybeSingle();
  if (error) console.error('createDocument error', error);
  return data;
}

async function main() {
  console.log('Reproducer start for', APP_ID);
  let app = await fetchApp(APP_ID);
  console.log('Initial application:', { id: app?.id, workflow_state: app?.workflow_state, payment_state: app?.payment_state, advisor_id: app?.advisor_id });

  // Create document
  const doc = await createDocument(app);
  console.log('Created document', doc?.id);
  let afterDocApp = await fetchApp(APP_ID);
  console.log('After createDocument application workflow_state:', afterDocApp?.workflow_state);
  console.log('History length:', (await fetchHistory(APP_ID)).length);

  // Simulate review rejection that should not change workflow_state but creates notifications/history
  const { data: revUpdate, error: revErr } = await svc.from('documents').update({ review_status: 'rejected', reviewer_notes: 'Reproducer rejection' }).eq('id', doc.id).select('*');
  console.log('Reviewed (rejected) document, rows:', revUpdate?.length || 0, 'err:', revErr || null);
  await svc.from('notifications').insert({ user_id: app.user_id, application_id: APP_ID, notification_type: 'workflow', title: 'Document rejected', body: 'Reproducer rejects doc', action_url: `/retail/applications/${APP_ID}?panel=documents&doc=${doc.id}`, level: 'info', created_at: new Date().toISOString() });
  await insertHistory(APP_ID, app.workflow_state, app.workflow_state, 'reproducer document reject');

  let afterReviewApp = await fetchApp(APP_ID);
  console.log('After review application workflow_state:', afterReviewApp?.workflow_state);
  console.log('History length:', (await fetchHistory(APP_ID)).length);

  // Assign advisor (this should set workflow_state to advisor_assigned)
  const assignPatch = { advisor_id: app.user_id, advisor_name: 'Reproducer Advisor', advisor_assigned_at: new Date().toISOString(), workflow_state: 'advisor_assigned' };
  const assigned = await updateApplication(APP_ID, assignPatch);
  await insertHistory(APP_ID, app.workflow_state, 'advisor_assigned', 'reproducer assign');
  await svc.from('notifications').insert({ user_id: app.user_id, application_id: APP_ID, notification_type: 'workflow', title: 'Advisor assigned', body: 'Reproducer assigned', action_url: `/retail/applications/${APP_ID}`, level: 'info', created_at: new Date().toISOString() });

  const afterAssignApp = await fetchApp(APP_ID);
  console.log('After assign application workflow_state:', afterAssignApp?.workflow_state, 'advisor_id:', afterAssignApp?.advisor_id);
  console.log('History length:', (await fetchHistory(APP_ID)).length);

  // Update payment (should set workflow_state payment_completed)
  const payPatch = { payment_state: 'completed', workflow_state: 'payment_completed' };
  const payRes = await updateApplication(APP_ID, payPatch);
  await insertHistory(APP_ID, afterAssignApp.workflow_state, 'payment_completed', 'reproducer payment');
  await svc.from('notifications').insert({ user_id: app.user_id, application_id: APP_ID, notification_type: 'workflow', title: 'Payment update', body: 'Payment completed', action_url: `/retail/applications/${APP_ID}?panel=actions`, level: 'info', created_at: new Date().toISOString() });

  const afterPayApp = await fetchApp(APP_ID);
  console.log('After payment application workflow_state:', afterPayApp?.workflow_state, 'payment_state:', afterPayApp?.payment_state);
  console.log('Final history length:', (await fetchHistory(APP_ID)).length);

  console.log('Reproducer finished');
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(3);});
