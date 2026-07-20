import { getServiceClient, syncLegacyRequestFromApplication, verifyAdminOrAdvisor, normalizeActionUrl } from "./_shared.js";
import { WORKFLOW_STATES } from "../src/workflow/workflowStates.js";
import { sendStatusEmail } from "./_sendStatusEmail.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const { applicationId, newState, notes = "", patch = {} } = req.body || {};
    if (!applicationId || !newState) return res.status(400).json({ error: "applicationId and newState required" });
    if (!WORKFLOW_STATES.includes(newState)) return res.status(400).json({ error: "Invalid workflow state" });

    const svc = getServiceClient();
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
      console.warn("[updateWorkflowState] Status email failed (non-fatal):", emailErr?.message || emailErr);
    }

    return res.status(200).json({ success: true, data: { application: updated }, historyEntry: historyRow || null, notifications: notifRows || [], error: null });
  } catch (err) {
    console.error("updateWorkflowState error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
