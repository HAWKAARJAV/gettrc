// Merged from the former api/updateWorkflowState.js and api/updatePaymentState.js
// (each unchanged in behavior) to stay within the Vercel Hobby plan's
// 12-serverless-function cap. Dispatches on `type` in the request body.
import { getServiceClient, syncLegacyRequestFromApplication, verifyAdminOrAdvisor, normalizeActionUrl, autoAssignSoleAdvisor } from "./_shared.js";
import { WORKFLOW_STATES } from "../src/workflow/workflowStates.js";
import { sendAdvisorEmail, sendStatusEmail } from "./_sendStatusEmail.js";

async function handleWorkflowState(req, res, svc) {
  const { applicationId, newState, notes = "", patch = {} } = req.body || {};
  if (!applicationId || !newState) return res.status(400).json({ error: "applicationId and newState required" });
  if (!WORKFLOW_STATES.includes(newState)) return res.status(400).json({ error: "Invalid workflow state" });

  const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,applicant_type").eq("id", applicationId).maybeSingle();
  if (!existing) return res.status(404).json({ error: "application not found" });

  const nextPatch = {
    ...patch,
    workflow_state: newState,
    review_state: newState,
    completed_at: newState === "completed" ? new Date().toISOString() : null,
  };

  const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
  if (updateError) throw updateError;

  await syncLegacyRequestFromApplication({ application: updated || existing, nextPatch, notes });

  const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert({
    application_id: applicationId,
    previous_state: existing.workflow_state,
    new_state: newState,
    updated_by: "system",
    notes,
  }).select("*").maybeSingle();
  if (historyError) console.warn("history insert warning", historyError);

  const actionUrl = normalizeActionUrl(null, applicationId, existing.applicant_type) + "?panel=audit";
  const { data: notifRows, error: notifError } = await svc.from("notifications").insert({
    user_id: existing.user_id,
    application_id: applicationId,
    notification_type: "workflow",
    title: `Application ${newState.replaceAll("_", " ")}`,
    body: `Your application ${applicationId} status changed to ${newState.replaceAll("_", " ")}.`,
    action_url: actionUrl,
    level: "info",
    created_at: new Date().toISOString(),
  }).select("*");
  if (notifError) console.warn("notification insert warning", notifError);

  try {
    const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", existing.user_id).maybeSingle();
    if (profile?.email) {
      await sendStatusEmail({ email: profile.email, name: profile.full_name || "", newState, applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com", notes });
    }
  } catch (emailErr) {
    console.warn("[updateApplicationState:workflow] Status email failed (non-fatal):", emailErr?.message || emailErr);
  }

  return res.status(200).json({ success: true, data: { application: updated }, historyEntry: historyRow || null, notifications: notifRows || [], error: null });
}

async function handlePaymentState(req, res, svc) {
  const { applicationId, paymentState, details = {} } = req.body || {};
  if (!applicationId || !paymentState) return res.status(400).json({ error: "applicationId and paymentState required" });

  const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,applicant_type,advisor_id").eq("id", applicationId).maybeSingle();
  if (!existing) return res.status(404).json({ error: "application not found" });

  const nextWorkflowState = paymentState === "completed" ? "payment_completed" : existing.workflow_state;
  const nextPatch = {
    payment_state: paymentState,
    payment_details: details,
    workflow_state: nextWorkflowState,
    // Keep the legacy review_state mirror in sync with workflow_state so the
    // admin queue (which reads review_state) never disagrees with the
    // advisor/client views (which read workflow_state).
    review_state: nextWorkflowState,
    completed_at: paymentState === "completed" ? new Date().toISOString() : existing.completed_at,
  };

  const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
  if (updateError) throw updateError;

  await syncLegacyRequestFromApplication({ application: updated || existing, nextPatch, notes: `Payment state updated: ${paymentState}` });

  const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert({
    application_id: applicationId,
    previous_state: existing.workflow_state,
    new_state: nextPatch.workflow_state,
    updated_by: "system",
    notes: `Payment state updated: ${paymentState}`,
  }).select("*").maybeSingle();
  if (historyError) console.warn("history insert warning", historyError);

  const actionUrl = `${existing.applicant_type === "corporate" ? "/corporate" : "/retail"}/applications/${applicationId}?panel=summary&focus=payment`;
  const notificationsToInsert = [
    {
      user_id: existing.user_id,
      application_id: applicationId,
      notification_type: "workflow",
      title: "Payment update",
      body: `Payment status for application ${applicationId} updated to ${paymentState}.`,
      action_url: actionUrl,
      level: "info",
      created_at: new Date().toISOString(),
    },
  ];
  if (paymentState === "completed" && existing.advisor_id) {
    notificationsToInsert.push({
      user_id: existing.advisor_id,
      application_id: applicationId,
      notification_type: "workflow",
      title: "Payment received",
      body: `Payment has been confirmed for application ${applicationId} — the case is now ready to proceed.`,
      action_url: `/advisor/cases/${applicationId}`,
      level: "info",
      created_at: new Date().toISOString(),
    });
  }
  const { data: notifRows, error: notifError } = await svc.from("notifications").insert(notificationsToInsert).select("*");
  if (notifError) console.warn("notification insert warning", notifError);

  if (paymentState === "completed") {
    try {
      const [{ data: clientProfile }, { data: advisorProfile }] = await Promise.all([
        svc.from("profiles").select("email,full_name").eq("id", existing.user_id).maybeSingle(),
        existing.advisor_id ? svc.from("profiles").select("email,full_name").eq("id", existing.advisor_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      // This is currently the only usable payment-completion path (the
      // Stripe webhook that also emails the client requires live keys we
      // don't have yet), so the client email lives here rather than being
      // Stripe-only.
      if (clientProfile?.email) {
        await sendStatusEmail({ email: clientProfile.email, name: clientProfile.full_name || "", newState: "payment_completed", applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
      }
      if (advisorProfile?.email) {
        await sendAdvisorEmail({ email: advisorProfile.email, name: advisorProfile.full_name || "", kind: "payment_received", clientName: clientProfile?.full_name, applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
      }
    } catch (emailErr) {
      console.warn("[updateApplicationState:payment] Status email failed (non-fatal):", emailErr?.message || emailErr);
    }
  }

  let finalApplication = updated;
  if (paymentState === "completed" && !existing.advisor_id) {
    const autoAssigned = await autoAssignSoleAdvisor(svc, updated || existing);
    if (autoAssigned?.application) finalApplication = autoAssigned.application;
  }

  return res.status(200).json({ success: true, data: { application: finalApplication }, historyEntry: historyRow || null, notifications: notifRows || [], error: null });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const svc = getServiceClient();
    const type = req.body?.type;
    if (type === "payment") return await handlePaymentState(req, res, svc);
    if (type === "workflow") return await handleWorkflowState(req, res, svc);
    return res.status(400).json({ error: "type must be 'workflow' or 'payment'" });
  } catch (err) {
    console.error("updateApplicationState error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
