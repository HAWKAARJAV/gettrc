import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function pickApplication(applicant_type) {
  const { data, error } = await svc.from('applications').select('*').eq('applicant_type', applicant_type).limit(1).maybeSingle();
  if (error) { console.error('pickApplication error', error); return null; }
  return data;
}

async function insertNotification(note) {
  const { data, error } = await svc.from('notifications').insert(note).select('*').maybeSingle();
  if (error) console.error('insertNotification error', error);
  return data;
}

async function insertHistory(application_id, previous, next, notes) {
  const { data, error } = await svc.from('application_status_history').insert({ application_id, previous_state: previous, new_state: next, updated_by: 'e2e-sim', notes }).select('*').maybeSingle();
  if (error) console.error('insertHistory error', error);
  return data;
}

async function createDocument(application) {
  const { data, error } = await svc.from('documents').insert({ application_id: application.id, document_type: 'emirates_id', file_url: 'uploads/e2e-emirates-id.pdf', uploaded_by: application.user_id, uploaded_at: new Date().toISOString(), review_status: 'pending' }).select('*').maybeSingle();
  if (error) console.error('createDocument error', error);
  return data;
}

async function reviewDocument(docId, application, action, notes = '') {
  const reviewStatus = action === 'approve' ? 'approved' : 'rejected';
  const { data: updated, error } = await svc.from('documents').update({ review_status: reviewStatus, reviewer_notes: notes }).eq('id', docId).select('*');
  if (error) console.error('reviewDocument error', error);
  const actionUrl = `/retail/applications/${application.id}?panel=documents&doc=${docId}`;
  await insertNotification({ user_id: application.user_id, application_id: application.id, notification_type: 'workflow', title: `Document ${reviewStatus}`, body: `Your document for application ${application.id} was ${reviewStatus}.`, action_url: actionUrl, level: 'info', created_at: new Date().toISOString() });
  return updated;
}

async function assignAdvisor(application, advisorId) {
  const nextPatch = {
    advisor_id: advisorId,
    advisor_name: 'E2E Advisor',
    advisor_assigned_at: new Date().toISOString(),
    workflow_state: 'advisor_assigned',
  };
  const { data: updated, error } = await svc.from('applications').update(nextPatch).eq('id', application.id).select('*').maybeSingle();
  if (error) console.error('assignAdvisor error', error);
  await insertHistory(application.id, application.workflow_state, nextPatch.workflow_state, 'Assigned by e2e');
  await insertNotification({ user_id: application.user_id, application_id: application.id, notification_type: 'workflow', title: 'Advisor assigned', body: `Advisor assigned to application ${application.id}`, action_url: `/retail/applications/${application.id}`, level: 'info', created_at: new Date().toISOString() });
  return updated;
}

async function updatePaymentState(application, state) {
  const nextPatch = { payment_state: state === 'completed' ? 'completed' : 'pending', workflow_state: state === 'completed' ? 'payment_completed' : application.workflow_state };
  const { data: updated, error } = await svc.from('applications').update(nextPatch).eq('id', application.id).select('*').maybeSingle();
  if (error) console.error('updatePaymentState error', error);
  await insertHistory(application.id, application.workflow_state, nextPatch.workflow_state, 'Payment update by e2e');
  await insertNotification({ user_id: application.user_id, application_id: application.id, notification_type: 'workflow', title: 'Payment update', body: `Payment status for application ${application.id} updated to ${nextPatch.payment_state}.`, action_url: `/retail/applications/${application.id}?panel=actions`, level: 'info', created_at: new Date().toISOString() });
  return updated;
}

async function fetchRelated(application_id) {
  const [appRes, docsRes, notifsRes, histRes] = await Promise.all([
    svc.from('applications').select('*').eq('id', application_id).maybeSingle(),
    svc.from('documents').select('*').eq('application_id', application_id).order('created_at', { ascending: true }),
    svc.from('notifications').select('*').eq('application_id', application_id).order('created_at', { ascending: true }).limit(50),
    svc.from('application_status_history').select('*').eq('application_id', application_id).order('created_at', { ascending: true }).limit(50),
  ]);
  return { application: appRes.data, documents: docsRes.data || [], notifications: notifsRes.data || [], history: histRes.data || [] };
}

function expect(cond) {
  return !!cond;
}

function checkDeepLink(url, application, opts = {}) {
  if (!url || !application) return false;
  // Basic checks: contains application id and expected panel keys
  if (!url.includes(application.id)) return false;
  if (opts.panel && !url.includes(opts.panel)) return false;
  if (opts.doc && !url.includes(opts.doc)) return false;
  return true;
}

async function detectDesync(expected, fetchFn, label) {
  const actual = await fetchFn();
  return JSON.stringify(expected) === JSON.stringify(actual) ? null : { label, expected, actual };
}

async function createProfile(email = null, full_name = 'E2E User') {
  const profile = { id: randomUUID(), email, full_name, created_at: new Date().toISOString() };
  const { data, error } = await svc.from('profiles').insert(profile).select('*').maybeSingle();
  if (error) {
    console.error('createProfile error', error);
    return null;
  }
  return data;
}

async function createApplicationForProfile(profile, type = 'retail') {
  const app = {
    user_id: profile.id,
    country: 'uae',
    applicant_type: type,
    application_type: 'trc_eligibility',
    workflow_state: 'submitted',
    payment_state: 'pending',
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
  };
  const { data, error } = await svc.from('applications').insert(app).select('*').maybeSingle();
  if (error) { console.error('createApplication error', error); return null; }
  return data;
}

async function adminAssignAdvisor(applicationId, advisorId, advisorName = 'Admin Assigned') {
  const nextPatch = { advisor_id: advisorId, advisor_name: advisorName, advisor_assigned_at: new Date().toISOString(), workflow_state: 'advisor_assigned' };
  const { data, error } = await svc.from('applications').update(nextPatch).eq('id', applicationId).select('*').maybeSingle();
  if (error) {
    console.error('adminAssignAdvisor error', error);
    return null;
  }
  await svc.from('application_status_history').insert({ application_id: applicationId, previous_state: null, new_state: nextPatch.workflow_state, updated_by: 'e2e-admin', notes: 'admin assign' });
  await svc.from('notifications').insert({ user_id: data.user_id, application_id: applicationId, notification_type: 'workflow', title: 'Advisor assigned (admin)', body: `Advisor ${advisorName} assigned`, action_url: `/${data.applicant_type}/applications/${applicationId}`, level: 'info', created_at: new Date().toISOString() });
  return data;
}

async function adminReviewDocument(application, documentId, action = 'reject', notes = 'Admin review') {
  const status = action === 'approve' ? 'approved' : 'rejected';
  const { data, error } = await svc.from('documents').update({ review_status: status, reviewer_notes: notes }).eq('id', documentId).select('*').maybeSingle();
  if (error) console.error('adminReviewDocument error', error);
  await svc.from('notifications').insert({ user_id: application.user_id, application_id: application.id, notification_type: 'workflow', title: `Document ${status}`, body: `Your document was ${status}`, action_url: `/retail/applications/${application.id}?panel=documents&doc=${documentId}`, level: 'info', created_at: new Date().toISOString() });
  await svc.from('application_status_history').insert({ application_id: application.id, previous_state: application.workflow_state, new_state: application.workflow_state, updated_by: 'e2e-admin', notes: `document ${status}` });
  return data;
}

async function advisorReview(application, documentId, action = 'approve', notes = 'Advisor notes') {
  const status = action === 'approve' ? 'approved' : 'rejected';
  const { data, error } = await svc.from('documents').update({ review_status: status, reviewer_notes: notes }).eq('id', documentId).select('*').maybeSingle();
  if (error) console.error('advisorReview error', error);
  await svc.from('notifications').insert({ user_id: application.user_id, application_id: application.id, notification_type: 'workflow', title: `Advisor review: ${status}`, body: `Advisor ${status} your document`, action_url: `/retail/applications/${application.id}?panel=documents&doc=${documentId}`, level: 'info', created_at: new Date().toISOString() });
  await svc.from('application_status_history').insert({ application_id: application.id, previous_state: application.workflow_state, new_state: application.workflow_state, updated_by: 'e2e-advisor', notes: `advisor ${status}` });
  return data;
}

async function runScenario(application) {
  const report = { application_id: application.id, applicant_type: application.applicant_type, steps: [] };
  try {
    report.steps.push({ step: 'fetch_initial', ok: true, app: application });

    const doc = await createDocument(application);
    report.steps.push({ step: 'create_document', ok: !!doc, doc });

    const review = await reviewDocument(doc.id, application, 'reject', 'E2E rejection');
    report.steps.push({ step: 'review_document_reject', ok: !!review, review });

    const assign = await assignAdvisor(application, application.user_id); // assign to owner for test
    report.steps.push({ step: 'assign_advisor', ok: !!assign, assign });

    const pay = await updatePaymentState(application, 'completed');
    report.steps.push({ step: 'update_payment', ok: !!pay, pay });

    const related = await fetchRelated(application.id);
    report.steps.push({ step: 'fetch_related', ok: true, relatedCounts: { documents: related.documents.length, notifications: related.notifications.length, history: related.history.length } });
  } catch (err) {
    report.steps.push({ step: 'error', ok: false, error: String(err) });
  }
  return report;
}

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    scenarios: [],
    brokenRoutes: [],
    deepLinkFailures: [],
    desyncs: [],
  };

  // 1) Run retail scenario on an existing retail application
  const retailApp = await pickApplication('retail');
  if (retailApp) {
    console.log('Running retail scenario for', retailApp.id);
    report.scenarios.push({ role: 'retail', report: await runScenario(retailApp) });
  } else {
    console.warn('No retail application found to simulate');
  }

  // 2) Run corporate scenario on an existing corporate application
  const corpApp = await pickApplication('corporate');
  if (corpApp) {
    console.log('Running corporate scenario for', corpApp.id);
    report.scenarios.push({ role: 'corporate', report: await runScenario(corpApp) });
  } else {
    console.warn('No corporate application found to simulate');
  }

  // 3) Admin flows: pick recent retail app and perform admin actions
  const recentRetail = await pickApplication('retail');
  if (recentRetail) {
    console.log('Running admin actions on', recentRetail.id);
    // pick an existing profile as advisor
    const { data: possible } = await svc.from('profiles').select('id, full_name').neq('id', recentRetail.user_id).limit(1);
    const adv = possible && possible.length ? possible[0] : null;
    const adminAssign = adv ? await adminAssignAdvisor(recentRetail.id, adv.id, adv.full_name) : await adminAssignAdvisor(recentRetail.id, recentRetail.user_id, 'Fallback Advisor');
    const docs = (await svc.from('documents').select('*').eq('application_id', recentRetail.id).order('created_at', { ascending: false }).limit(5)).data || [];
    for (const d of docs) {
      await adminReviewDocument(recentRetail, d.id, 'reject', 'Admin automated reject');
    }
    report.scenarios.push({ role: 'admin', application: recentRetail.id, actions: { adminAssign: !!adminAssign, reviewedDocs: docs.length } });
  }

  // 4) Advisor flows: find assigned applications and review docs
  const { data: assignedApps } = await svc.from('applications').select('*').not('advisor_id', 'is', null).limit(10);
  if (assignedApps && assignedApps.length) {
    for (const a of assignedApps) {
      const docs = (await svc.from('documents').select('*').eq('application_id', a.id)).data || [];
      for (const d of docs) {
        await advisorReview(a, d.id, 'approve', 'Advisor automated approval');
      }
      report.scenarios.push({ role: 'advisor', application: a.id, reviewed: docs.length });
    }
  }

  // 5) Deep-link and route audit: scan recent notifications for action_url patterns
  const { data: recentNotifs } = await svc.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  for (const n of recentNotifs || []) {
    const app = n.application_id ? (await svc.from('applications').select('*').eq('id', n.application_id).maybeSingle()).data : null;
    const ok = checkDeepLink(n.action_url, app || { id: n.application_id }, { panel: 'documents' }) || checkDeepLink(n.action_url, app || { id: n.application_id }, { panel: 'actions' }) || checkDeepLink(n.action_url, app || { id: n.application_id });
    if (!ok) report.deepLinkFailures.push({ notif: n.id, action_url: n.action_url });
  }

  // 6) Detect simple desyncs by re-fetching a sample of applications and comparing expected workflow fields
  const sampleApps = (await svc.from('applications').select('*').order('created_at', { ascending: false }).limit(20)).data || [];
  for (const s of sampleApps) {
    const fetched = (await svc.from('applications').select('*').eq('id', s.id).maybeSingle()).data;
    if (!fetched) continue;
    if (fetched.workflow_state !== s.workflow_state || fetched.payment_state !== s.payment_state) {
      report.desyncs.push({ application: s.id, expected: { workflow_state: s.workflow_state, payment_state: s.payment_state }, actual: { workflow_state: fetched.workflow_state, payment_state: fetched.payment_state } });
    }
  }

  fs.writeFileSync('scripts/e2e_full_report.json', JSON.stringify(report, null, 2));
  console.log('E2E full simulation complete. Report written to scripts/e2e_full_report.json');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(3); });
