#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(process.cwd(), '..');
const SRC = path.resolve(process.cwd(), 'src');
const APP_FILE = path.resolve(process.cwd(), 'src/TRCConnectApp.jsx');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function extractRoutes(appText) {
  const routeRegex = /Route path=\"([^\"]+)\"/g;
  const paths = new Set();
  let m;
  while ((m = routeRegex.exec(appText))) {
    paths.add(m[1]);
  }
  return Array.from(paths).sort();
}

function pathToRegex(p) {
  // convert :param to [^/]+ regex
  const escaped = p.replace(/([.*+?^=!:${}()|[\]\\])/g, '\\$1');
  const regexStr = '^' + escaped.replace(/\\:([a-zA-Z0-9_]+)/g, '[^/]+') + '$';
  return new RegExp(regexStr);
}

function linkCandidates(appText) {
  const links = new Set();
  const linkRe = /<ReactRouterDom.Link[^>]*to=\{?['\"]([^'\"\}]+)['\"]\}?/g;
  let m;
  while ((m = linkRe.exec(appText))) links.add(m[1]);
  return Array.from(links);
}

function navStrings(appText) {
  const navs = new Set();
  const navRe = /nav\([^\)]*\)|navigate\([^\)]*\)/g;
  // simpler: find `.navigate(` with string literal
  const simple = /navigate\((['\"])(\/[^'\"]+)\1/g;
  let m;
  while ((m = simple.exec(appText))) navs.add(m[2]);
  return Array.from(navs);
}

async function auditNotifications(routePatterns) {
  const notifs = (await svc.from('notifications').select('*').limit(500).order('created_at', { ascending: false })).data || [];
  const failures = [];
  for (const n of notifs) {
    if (!n.action_url) continue;
    const url = n.action_url.split('#')[0].split('?')[0];
    let matched = false;
    for (const p of routePatterns.map(r => r.regex)) {
      if (p.test(url)) { matched = true; break; }
    }
    if (!matched) failures.push({ id: n.id, action_url: n.action_url, title: n.title });
  }
  return { total: notifs.length, failures };
}

async function targetedManuals() {
  const result = { actions: [] };
  // pick a retail application with at least one document
  const retail = (await svc.from('applications').select('*').eq('applicant_type', 'retail').limit(1).maybeSingle()).data;
  if (!retail) return result;
  const before = (await svc.from('applications').select('*').eq('id', retail.id).maybeSingle()).data;
  const docs = (await svc.from('documents').select('*').eq('application_id', retail.id).order('created_at', { ascending: false }).limit(5)).data || [];
  // admin assign advisor
  const profiles = (await svc.from('profiles').select('id, full_name').neq('id', retail.user_id).limit(1)).data || [];
  const advisor = profiles[0] || { id: retail.user_id, full_name: 'fallback' };
  const assign = await svc.from('applications').update({ advisor_id: advisor.id, advisor_name: advisor.full_name, advisor_assigned_at: new Date().toISOString(), workflow_state: 'advisor_assigned' }).eq('id', retail.id).select('*').maybeSingle();
  await svc.from('application_status_history').insert({ application_id: retail.id, previous_state: before.workflow_state, new_state: 'advisor_assigned', updated_by: 'e2e-manual', notes: 'admin assign' });
  await svc.from('notifications').insert({ user_id: retail.user_id, application_id: retail.id, notification_type: 'workflow', title: 'Advisor assigned (manual)', body: 'Admin assigned an advisor', action_url: `/retail/applications/${retail.id}`, level: 'info', created_at: new Date().toISOString() });
  // pick a document and reject
  if (docs.length) {
    const d = docs[0];
    await svc.from('documents').update({ review_status: 'rejected', reviewer_notes: 'Manual reject' }).eq('id', d.id);
    await svc.from('notifications').insert({ user_id: retail.user_id, application_id: retail.id, notification_type: 'workflow', title: 'Document rejected', body: 'A document was rejected by admin', action_url: `/retail/applications/${retail.id}?panel=documents&doc=${d.id}`, level: 'warn', created_at: new Date().toISOString() });
  }
  // payment update
  await svc.from('applications').update({ payment_state: 'completed', workflow_state: 'payment_completed' }).eq('id', retail.id);
  await svc.from('application_status_history').insert({ application_id: retail.id, previous_state: before.workflow_state, new_state: 'payment_completed', updated_by: 'e2e-manual', notes: 'payment completed' });

  // fetch after
  const after = (await svc.from('applications').select('*').eq('id', retail.id).maybeSingle()).data;
  const newDocs = (await svc.from('documents').select('*').eq('application_id', retail.id)).data || [];
  const notifs = (await svc.from('notifications').select('*').eq('application_id', retail.id)).data || [];

  result.actions.push({ application: retail.id, before, after, documentsBefore: docs.length, documentsAfter: newDocs.length, notificationsAfter: notifs.length });
  return result;
}

async function run() {
  const appText = fs.readFileSync(APP_FILE, 'utf8');
  const routes = extractRoutes(appText);
  const routePatterns = routes.map(p => ({ raw: p, regex: pathToRegex(p) }));
  const links = linkCandidates(appText);
  const navs = navStrings(appText);

  const notifAudit = await auditNotifications(routePatterns);
  const manualRes = await targetedManuals();

  const out = { timestamp: new Date().toISOString(), routes, links, navs, notifAudit, manualRes };
  fs.writeFileSync('scripts/e2e_integration_report.json', JSON.stringify(out, null, 2));
  console.log('Wrote scripts/e2e_integration_report.json');
}

run().catch(e=>{ console.error(e); process.exit(3); });
