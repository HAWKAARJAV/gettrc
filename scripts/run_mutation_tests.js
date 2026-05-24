import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLICATION_ID = process.env.APPLICATION_ID || 'b1525d81-7b96-4865-97d8-b9f1b3b13ca2';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function info(msg) { console.log('\n===', msg, '==='); }

async function fetchApp() {
  const { data, error } = await svc.from('applications').select('*').eq('id', APPLICATION_ID).maybeSingle();
  if (error) { console.error('fetchApp error', error); return null; }
  return data;
}

async function fetchHistory() {
  const { data } = await svc.from('application_status_history').select('*').eq('application_id', APPLICATION_ID).order('created_at', { ascending: true });
  return data || [];
}

async function fetchNotifications() {
  const { data } = await svc.from('notifications').select('*').eq('application_id', APPLICATION_ID).order('created_at', { ascending: true }).limit(20);
  return data || [];
}

async function fetchDocs() {
  const { data } = await svc.from('documents').select('*').eq('application_id', APPLICATION_ID).order('created_at', { ascending: true }).limit(20);
  return data || [];
}

async function createAdvisor(appUserId) {
  const { data: existing, error: fetchError } = await svc.from('profiles').select('id, full_name').neq('id', appUserId).limit(1);
  if (fetchError) console.error('advisor lookup error', fetchError);
  if (existing && existing.length > 0) {
    return { id: existing[0].id, name: existing[0].full_name || 'Existing Advisor' };
  }

  return { id: appUserId, name: 'Test Advisor' };
}

async function assignAdvisor(advisor) {
  const app = await fetchApp();
  if (!app) { console.error('Application not found'); return null; }
  const nextPatch = {
    advisor_id: advisor.id,
    advisor_name: advisor.name,
    advisor_assigned_at: new Date().toISOString(),
    workflow_state: 'advisor_assigned',
  };
  const { data: updated, error: updateError } = await svc.from('applications').update(nextPatch).eq('id', APPLICATION_ID).select('*').maybeSingle();
  if (updateError) { console.error('assign update error', updateError); }

  const { data: historyRow, error: historyError } = await svc.from('application_status_history').insert({ application_id: APPLICATION_ID, previous_state: app.workflow_state, new_state: nextPatch.workflow_state, updated_by: 'test-script', notes: 'Assigned test advisor' }).select('*').maybeSingle();
  if (historyError) console.error('history insert error', historyError);

  const actionUrl = `${app.applicant_type === 'corporate' ? '/corporate' : '/retail'}/applications/${APPLICATION_ID}?panel=actions&focus=advisor`;
  const notifs = [
    { user_id: app.user_id, application_id: APPLICATION_ID, notification_type: 'workflow', title: 'Advisor assigned', body: `Advisor assigned to application ${APPLICATION_ID}`, action_url: actionUrl, level: 'info', created_at: new Date().toISOString() },
    { user_id: app.user_id, application_id: APPLICATION_ID, notification_type: 'workflow', title: 'Advisor assignment', body: `You were assigned to application ${APPLICATION_ID}`, action_url: actionUrl, level: 'info', created_at: new Date().toISOString() },
  ];
  const { data: notifRows, error: notifErr } = await svc.from('notifications').insert(notifs).select('*');
  if (notifErr) console.error('notif insert error', notifErr);

  return { updated, historyRow, notifRows };
}

async function createDocument() {
  const app = await fetchApp();
  if (!app) return null;
  const { data, error } = await svc.from('documents').insert({ application_id: APPLICATION_ID, document_type: 'emirates_id', file_url: 'uploads/test-emirates-id.pdf', uploaded_by: app.user_id, uploaded_at: new Date().toISOString(), review_status: 'pending' }).select('*').maybeSingle();
  if (error) { console.error('createDocument error', error); return null; }
  return data;
}

async function reviewDocument(docId, action, notes = '') {
  const reviewStatus = action === 'approve' ? 'approved' : 'rejected';
  const { data: updated, error } = await svc.from('documents').update({ review_status: reviewStatus, reviewer_notes: notes }).eq('id', docId).select('*');
  if (error) console.error('reviewDocument error', error);
  const { data: notifRow, error: notifErr } = await svc.from('notifications').insert({ user_id: (await fetchApp()).user_id, application_id: APPLICATION_ID, notification_type: 'workflow', title: `Document ${reviewStatus}`, body: `Your document for application ${APPLICATION_ID} was ${reviewStatus}.`, action_url: `/retail/applications/${APPLICATION_ID}?panel=documents&doc=${docId}`, level: 'info', created_at: new Date().toISOString() }).select('*').maybeSingle();
  if (notifErr) console.error('notif insert error', notifErr);
  return { updated, notifRow };
}

async function updatePaymentState(newState = 'completed') {
  const app = await fetchApp();
  if (!app) return null;
  const nextPatch = { payment_state: newState === 'completed' ? 'completed' : 'pending', workflow_state: newState === 'completed' ? 'payment_completed' : app.workflow_state };
  const { data: updated, error } = await svc.from('applications').update(nextPatch).eq('id', APPLICATION_ID).select('*').maybeSingle();
  if (error) console.error('updatePaymentState error', error);

  const { data: historyRow, error: historyError } = await svc.from('application_status_history').insert({ application_id: APPLICATION_ID, previous_state: app.workflow_state, new_state: nextPatch.workflow_state, updated_by: 'test-script', notes: 'Payment state updated by script' }).select('*').maybeSingle();
  if (historyError) console.error('history insert error', historyError);

  const { data: notifRows, error: notifErr } = await svc.from('notifications').insert({ user_id: app.user_id, application_id: APPLICATION_ID, notification_type: 'workflow', title: 'Payment update', body: `Payment status for application ${APPLICATION_ID} updated to ${nextPatch.payment_state}.`, action_url: `/retail/applications/${APPLICATION_ID}?panel=actions`, level: 'info', created_at: new Date().toISOString() }).select('*');
  if (notifErr) console.error('notif insert error', notifErr);

  return { updated, historyRow, notifRows };
}

async function run() {
  try {
    await info('initial application');
    console.log(await fetchApp());

    await info('create advisor');
    const advisor = await createAdvisor((await fetchApp()).user_id);
    console.log('advisor', advisor);

    await info('assign advisor');
    const assignRes = await assignAdvisor(advisor);
    console.log('assignRes', assignRes.updated);

    await info('application after assign');
    console.log(await fetchApp());
    console.log('history', await fetchHistory());
    console.log('notifications', await fetchNotifications());

    await info('create document');
    const doc = await createDocument();
    console.log('doc', doc);

    await info('review document -> reject');
    const rev = await reviewDocument(doc.id, 'reject', 'Test rejection from script');
    console.log('review result', rev.updated);

    console.log('documents', await fetchDocs());
    console.log('notifications', await fetchNotifications());

    await info('update payment state');
    const pay = await updatePaymentState('completed');
    console.log('payment result', pay.updated);

    console.log('final application', await fetchApp());
    console.log('final history', await fetchHistory());
    console.log('final notifications', await fetchNotifications());

    info('done');
    process.exit(0);
  } catch (err) {
    console.error('run error', err);
    process.exit(4);
  }
}

run();
