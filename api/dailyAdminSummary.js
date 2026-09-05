import { getServiceClient } from "./_shared.js";
import { dispatchEmail } from "./_sendStatusEmail.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

// Compiled daily admin report email — currently disabled.
// Previously ran once a day via Vercel Cron and emailed the admin a
// summary of the previous UAE calendar day. The cron is removed from
// vercel.json; this handler also no-ops so the report is not sent
// if the endpoint is hit manually. Every query below is read-only.
//
// Cron auth: Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
// for scheduled invocations when the CRON_SECRET env var is set on the
// project. If it isn't set yet, the check is skipped (so this still works
// before that's configured) — set CRON_SECRET in Vercel once you want this
// endpoint to reject non-Vercel callers.
function isAuthorizedCronRequest(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const auth = (req.headers.authorization || req.headers.Authorization || "");
  return auth === `Bearer ${expected}`;
}

// UAE has no DST and is always UTC+4 — plain fixed-offset arithmetic is
// sufficient, no timezone library needed.
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function dubaiDayBoundsUtc(daysAgo = 1) {
  const nowDubai = new Date(Date.now() + DUBAI_OFFSET_MS);
  const dayStartDubai = new Date(Date.UTC(nowDubai.getUTCFullYear(), nowDubai.getUTCMonth(), nowDubai.getUTCDate() - daysAgo));
  const dayEndDubai = new Date(dayStartDubai.getTime() + 24 * 60 * 60 * 1000);
  return {
    label: dayStartDubai.toISOString().slice(0, 10),
    startUtc: new Date(dayStartDubai.getTime() - DUBAI_OFFSET_MS).toISOString(),
    endUtc: new Date(dayEndDubai.getTime() - DUBAI_OFFSET_MS).toISOString(),
  };
}

function fmtName(profile) {
  return profile?.full_name || profile?.email || "—";
}

function section(title, rows) {
  if (!rows.length) return `<p style="font-size:13px;color:#6B7A99;margin:0 0 22px">${title}: none today.</p>`;
  return `
    <div style="margin:0 0 22px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0F2557;margin:0 0 8px">${title} (${rows.length})</p>
      <div style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden">
        ${rows.map((r, i) => `<div style="padding:10px 14px;font-size:13px;color:#334155;${i > 0 ? "border-top:1px solid #E2E8F0;" : ""}">${r}</div>`).join("")}
      </div>
    </div>`;
}

const SEND_DAILY_ADMIN_SUMMARY = false;

export default async function handler(req, res) {
  if (!SEND_DAILY_ADMIN_SUMMARY) {
    return res.status(200).json({
      success: true,
      skipped: true,
      reason: "Automated daily compiled report email to admin is disabled.",
    });
  }

  if (!isAuthorizedCronRequest(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const svc = getServiceClient();
    const { label, startUtc, endUtc } = dubaiDayBoundsUtc(1);
    const inRange = (col) => (q) => q.gte(col, startUtc).lt(col, endUtc);

    const [
      { data: newApps },
      { data: eligibilityRows },
      { data: paymentRows },
      { data: docsUploaded },
      { data: docsReviewed },
      { data: docsRequested },
      { data: filedRows },
      { data: resubmitRows },
      { data: pipelineRows },
    ] = await Promise.all([
      inRange("created_at")(svc.from("applications").select("id,applicant_type,profiles!user_id(full_name,email)")),
      inRange("eligibility_determined_at")(svc.from("applications").select("id,applicant_type,eligibility_basis,eligibility_determined_by,profiles!user_id(full_name,email)")),
      inRange("created_at")(svc.from("application_status_history").select("application_id,notes").eq("new_state", "payment_completed")),
      inRange("uploaded_at")(svc.from("documents").select("id,document_type,application_id")),
      inRange("reviewed_at")(svc.from("documents").select("id,document_type,review_status,reviewed_by,application_id")),
      inRange("created_at")(svc.from("document_requests").select("id,document_type,application_id")),
      inRange("created_at")(svc.from("application_status_history").select("application_id").eq("new_state", "submitted_to_authority")),
      inRange("created_at")(svc.from("application_status_history").select("application_id").eq("notes", "Applicant resubmitted corrected eligibility information")),
      svc.from("applications").select("workflow_state").not("workflow_state", "in", "(completed,rejected)"),
    ]);

    // Resolve advisor names for eligibility determinations + document reviews
    // in one batch rather than N+1 queries.
    const advisorIds = [
      ...new Set([
        ...(eligibilityRows || []).map((r) => r.eligibility_determined_by).filter(Boolean),
        ...(docsReviewed || []).map((r) => r.reviewed_by).filter(Boolean),
      ]),
    ];
    const { data: advisorProfiles } = advisorIds.length
      ? await svc.from("profiles").select("id,full_name,email").in("id", advisorIds)
      : { data: [] };
    const advisorById = Object.fromEntries((advisorProfiles || []).map((p) => [p.id, p]));

    const newAppsRows = (newApps || []).map((a) => `New ${a.applicant_type} application — ${fmtName(a.profiles)} (${a.id.slice(0, 8)})`);

    const eligibilityRowsHtml = (eligibilityRows || []).map((a) => {
      const advisor = advisorById[a.eligibility_determined_by];
      const outcome = a.eligibility_basis === "does_not_qualify" ? "Rejected" : `Marked eligible (${a.eligibility_basis || "—"})`;
      return `${outcome} — ${fmtName(a.profiles)} (${a.id.slice(0, 8)}) by ${advisor ? fmtName(advisor) : "—"}`;
    });

    const paymentRowsHtml = (paymentRows || []).map((r) => `Payment completed — application ${String(r.application_id).slice(0, 8)}`);

    const docsUploadedHtml = (docsUploaded || []).map((d) => `"${d.document_type}" uploaded — application ${String(d.application_id).slice(0, 8)}`);

    const docsReviewedHtml = (docsReviewed || []).map((d) => {
      const advisor = advisorById[d.reviewed_by];
      return `"${d.document_type}" ${d.review_status} — application ${String(d.application_id).slice(0, 8)} by ${advisor ? fmtName(advisor) : "—"}`;
    });

    const docsRequestedHtml = (docsRequested || []).map((d) => `"${d.document_type}" requested — application ${String(d.application_id).slice(0, 8)}`);

    const filedRowsHtml = (filedRows || []).map((r) => `Filed with FTA — application ${String(r.application_id).slice(0, 8)}`);

    const resubmitRowsHtml = (resubmitRows || []).map((r) => `Applicant resubmitted after rejection — application ${String(r.application_id).slice(0, 8)}`);

    const pipelineCounts = {};
    for (const r of pipelineRows || []) pipelineCounts[r.workflow_state] = (pipelineCounts[r.workflow_state] || 0) + 1;
    const pipelineHtml = Object.entries(pipelineCounts)
      .map(([state, count]) => `<span style="display:inline-block;background:#F7F8FC;border:1px solid #E2E8F0;border-radius:20px;padding:4px 12px;font-size:12px;color:#0F2557;margin:0 6px 6px 0"><strong>${count}</strong> ${state.replaceAll("_", " ")}</span>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:'DM Sans',-apple-system,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="background:linear-gradient(135deg,#0F2557,#1A3570);padding:32px 36px">
      <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#C9A84C">TRC Connect</span>
      <h1 style="font-family:Georgia,serif;font-size:24px;color:#fff;margin:14px 0 0">Daily Activity Summary</h1>
      <p style="font-size:13px;color:rgba(255,255,255,.6);margin:6px 0 0">${label}</p>
    </div>
    <div style="padding:32px 36px">
      ${section("New applications", newAppsRows)}
      ${section("Eligibility determinations", eligibilityRowsHtml)}
      ${section("Payments completed", paymentRowsHtml)}
      ${section("Documents uploaded", docsUploadedHtml)}
      ${section("Documents reviewed", docsReviewedHtml)}
      ${section("Documents requested by advisors", docsRequestedHtml)}
      ${section("Filed with FTA", filedRowsHtml)}
      ${section("Resubmissions after rejection", resubmitRowsHtml)}
      <p style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0F2557;margin:22px 0 10px">Open pipeline snapshot</p>
      <div>${pipelineHtml || '<span style="font-size:13px;color:#6B7A99">No open cases.</span>'}</div>
    </div>
    <div style="background:#F7F8FC;border-top:1px solid #E2E8F0;padding:16px 36px;text-align:center">
      <p style="font-size:12px;color:#6B7A99;margin:0">Automated daily report · gettrc.com</p>
    </div>
  </div>
</body>
</html>`.trim();

    const adminEmail = process.env.ADMIN_EMAIL || "hawkwilds09@gmail.com";
    await dispatchEmail({ email: adminEmail, subject: `TRC Connect — daily summary (${label})`, html, logContext: "daily admin summary" });

    return res.status(200).json({ success: true, date: label, error: null });
  } catch (err) {
    captureError("dailyAdminSummary error", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
