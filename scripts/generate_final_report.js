#!/usr/bin/env node
import fs from 'fs';

const full = JSON.parse(fs.readFileSync('scripts/e2e_full_report.json','utf8'));
const integ = JSON.parse(fs.readFileSync('scripts/e2e_integration_report.json','utf8'));

const final = { generated: new Date().toISOString(), summary: {}, findings: { critical:[], medium:[], low:[] }, sources: { full, integ } };

// Deep link failures
const dl = full.deepLinkFailures || [];
const notifFailures = (integ.notifAudit && integ.notifAudit.failures) || [];

// Combine unique failures
const deepLinkMap = new Map();
for (const f of dl) deepLinkMap.set(f.action_url || f, { source: 'full', ...f });
for (const f of notifFailures) deepLinkMap.set(f.action_url || f.id, { source: 'integration', ...f });

if (deepLinkMap.size) {
  for (const [k,v] of deepLinkMap.entries()) {
    final.findings.medium.push({ type: 'deep_link', action_url: k, title: v.title || null, reason: 'notification action_url does not map cleanly to app route or is generic', impact: 'user cannot deep-link into specific application or panel', affected_roles: ['retail','advisor','admin'] });
  }
}

// Broken routes/CTA
const declaredRoutes = integ.routes || [];
const links = integ.links || [];
const brokenLinks = [];
for (const l of links) {
  if (!declaredRoutes.includes(l) && !declaredRoutes.some(r=>r.includes(':') && l.startsWith(r.split('/:')[0]))) brokenLinks.push(l);
}
if (brokenLinks.length) final.findings.critical.push({ type: 'broken_link', items: brokenLinks, reason: 'UI links point to undeclared routes', impact: 'navigation broken', affected_roles: ['all'] });

// Deep-link generic dashboard occurrences (low specificity but high UX impact)
const genericDashboardNotifs = integ.notifAudit.failures.filter(f=>f.action_url === '/dashboard' || f.action_url === '/dashboard');
for (const g of genericDashboardNotifs) {
  final.findings.medium.push({ type: 'generic_dashboard_link', notif_id: g.id || g.notif, action_url: g.action_url, reason: 'Notification uses generic /dashboard instead of application-level deep-link', impact: 'deep-linking broken', affected_roles: ['retail','advisor'] });
}

// Use simulator-detected desyncs as the authoritative source for workflow desynchronization
const simDesyncs = (full && full.desyncs) || full?.desyncs || [];
for (const d of simDesyncs) {
  final.findings.critical.push({ type: 'workflow_desync', application: d.application, reason: 'simulator detected mismatch between expected and fetched workflow/payment state', details: d });
}

// Keep manual action metadata as informational (notifications count)
const manual = integ.manualRes && integ.manualRes.actions || [];
for (const m of manual) {
  final.findings.low.push({ type: 'notifications_count', application: m.application, notifications_after: m.notificationsAfter });
}

// If no criticals, add note
if (!final.findings.critical.length) final.summary.status = 'No critical blockers detected in automated runs';
else final.summary.status = 'Critical issues detected';

// Recommendations
final.recommendations = [
  {prio:'P0', action:'Convert generic notification action_url to application deep-links', reason:'ensures deep-linking to application/document/panel', owner:'frontend'},
  {prio:'P1', action:'Ensure notification creation uses application route templates (/retail/applications/:id?panel=...)', reason:'consistency across roles', owner:'backend'},
  {prio:'P1', action:'Add server-side validation to ensure notifications.action_url matches known route patterns', owner:'backend'},
  {prio:'P2', action:'Audit UI Link and navigate uses for string literals to ensure they reference declared routes', owner:'frontend'},
  {prio:'P2', action:'Add a small integration test that opens each notification.action_url in a headless browser to confirm route resolving', owner:'qa'},
];

fs.writeFileSync('scripts/e2e_final_report.json', JSON.stringify(final, null, 2));
console.log('Wrote scripts/e2e_final_report.json');
