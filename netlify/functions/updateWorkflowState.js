import { getServiceClient, syncLegacyRequestFromApplication, verifyAdminOrAdvisor } from "./_shared";
import { WORKFLOW_STATES } from "../../src/workflow/workflowStates";
import { sendStatusEmail } from "./_sendStatusEmail";

export async function handler(event, context) {
  try {
    const auth = event.headers?.authorization?.replace("Bearer ", "") || event.headers?.Authorization?.replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const body = JSON.parse(event.body || "{}");
    const { applicationId, newState, notes = "", patch = {} } = body;
    if (!applicationId || !newState) return { statusCode: 400, body: JSON.stringify({ error: "applicationId and newState required" }) };
    if (!WORKFLOW_STATES.includes(newState)) return { statusCode: 400, body: JSON.stringify({ error: "Invalid workflow state" }) };

    const svc = getServiceClient();
    const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,applicant_type").eq("id", applicationId).maybeSingle();
    if (!existing) return { statusCode: 404, body: JSON.stringify({ error: "application not found" }) };

    const nextPatch = {
      ...patch,
      workflow_state: newState,
      review_state: newState,
      completed_at: newState === "completed" ? new Date().toISOString() : null,
    };

    const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
    if (updateError) throw updateError;

    await syncLegacyRequestFromApplication({
      application: updated || existing,
      nextPatch,
      notes,
    });

    const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert({
      application_id: applicationId,
      previous_state: existing.workflow_state,
      new_state: newState,
      updated_by: "system",
      notes,
    }).select("*").maybeSingle();
    if (historyError) console.warn('history insert warning', historyError);

    const { normalizeActionUrl } = require('./_shared');
    const actionUrl = normalizeActionUrl(null, applicationId, existing.applicant_type) + '?panel=audit';
    const { data: notifRows, error: notifError } = await svc.from("notifications").insert({ user_id: existing.user_id, application_id: applicationId, notification_type: 'workflow', title: `Application ${newState.replaceAll("_"," ")}`, body: `Your application ${applicationId} status changed to ${newState.replaceAll("_"," ")}.`, action_url: actionUrl, level: "info", created_at: new Date().toISOString() }).select("*");
    if (notifError) console.warn('notification insert warning', notifError);

    // Fire status-change email (non-blocking — never fails the request)
    try {
      const { data: profile } = await svc
        .from("profiles")
        .select("email,full_name")
        .eq("id", existing.user_id)
        .maybeSingle();
      if (profile?.email) {
        await sendStatusEmail({
          email:         profile.email,
          name:          profile.full_name || "",
          newState,
          applicationId,
          siteUrl:       process.env.SITE_URL || "https://gettrc.com",
        });
      }
    } catch (emailErr) {
      console.warn("[updateWorkflowState] Status email failed (non-fatal):", emailErr?.message || emailErr);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, data: { application: updated }, historyEntry: historyRow || null, notifications: notifRows || [], error: null }) };
  } catch (err) {
    console.error("updateWorkflowState error", err);
    const status = err?.status || 500;
    return { statusCode: status, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}

export const main = handler;
