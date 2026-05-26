import { getServiceClient, syncLegacyRequestFromApplication, verifyAdminOrAdvisor } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const { applicationId, paymentState, details = {} } = req.body || {};
    if (!applicationId || !paymentState) return res.status(400).json({ error: "applicationId and paymentState required" });

    const svc = getServiceClient();
    const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,applicant_type").eq("id", applicationId).maybeSingle();
    if (!existing) return res.status(404).json({ error: "application not found" });

    const nextPatch = {
      payment_state: paymentState,
      payment_details: details,
      workflow_state: paymentState === "completed" ? "payment_completed" : existing.workflow_state,
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
    const { data: notifRows, error: notifError } = await svc.from("notifications").insert({
      user_id: existing.user_id,
      application_id: applicationId,
      notification_type: "workflow",
      title: "Payment update",
      body: `Payment status for application ${applicationId} updated to ${paymentState}.`,
      action_url: actionUrl,
      level: "info",
      created_at: new Date().toISOString(),
    }).select("*");
    if (notifError) console.warn("notification insert warning", notifError);

    return res.status(200).json({ success: true, data: { application: updated }, historyEntry: historyRow || null, notifications: notifRows || [], error: null });
  } catch (err) {
    console.error("updatePaymentState error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
