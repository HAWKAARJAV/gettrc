import { getServiceClient, verifyAdminOrAdvisor } from "./_shared";
import { APPLICATION_STATES } from "../../src/workflow/workflowStates";

export async function handler(event, context) {
  try {
    const auth = event.headers?.authorization?.replace("Bearer ", "") || event.headers?.Authorization?.replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const body = JSON.parse(event.body || "{}");
    const { applicationId, advisorId, notes = "" } = body;
    if (!applicationId || !advisorId) return { statusCode: 400, body: JSON.stringify({ error: "applicationId and advisorId required" }) };

    const svc = getServiceClient();

    // fetch existing application
    const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,advisor_id,applicant_type").eq("id", applicationId).maybeSingle();
    if (!existing) return { statusCode: 404, body: JSON.stringify({ error: "application not found" }) };

    // advisorId may be the advisors.id (record PK) — look up the auth user_id
    // so advisor workspace queries (.eq("advisor_id", session.user.id)) work correctly
    const { data: advisorRecord } = await svc.from("advisors").select("id,user_id").eq("id", advisorId).maybeSingle();
    const resolvedAdvisorUserId = advisorRecord?.user_id || advisorId;

    const nextPatch = {
      advisor_id: resolvedAdvisorUserId,
      advisor_assigned_at: new Date().toISOString(),
      workflow_state: "advisor_assigned",
    };

    const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
    if (updateError) throw updateError;

    // append history and return inserted row
    const { data: historyRows, error: historyError } = await svc.from("application_status_history").insert({
      application_id: applicationId,
      previous_state: existing.workflow_state,
      new_state: nextPatch.workflow_state,
      updated_by: "system",
      notes,
    }).select("*").maybeSingle();
    if (historyError) console.warn('history insert warning', historyError);

    // create notifications for applicant and advisor
    const notifs = [
      { user_id: existing.user_id, application_id: applicationId, notification_type: 'workflow', title: "Advisor assigned", body: `An advisor has been assigned to your application (${applicationId.slice(0,8)}).`, action_url: `/${existing.applicant_type || "retail"}/dashboard`, level: "info", created_at: new Date().toISOString() },
    ];
    // also notify the advisor themselves if user_id resolved
    if (resolvedAdvisorUserId && resolvedAdvisorUserId !== existing.user_id) {
      notifs.push({ user_id: resolvedAdvisorUserId, application_id: applicationId, notification_type: 'workflow', title: "Case assigned to you", body: `Application ${applicationId.slice(0,8)} has been assigned to you.`, action_url: `/advisor/cases/${applicationId}`, level: "info", created_at: new Date().toISOString() });
    }
    const { data: notifRows, error: notifError } = await svc.from("notifications").insert(notifs).select("*");
    if (notifError) console.warn('notification insert warning', notifError);

    const payload = {
      success: true,
      data: { application: updated },
      historyEntry: historyRows || null,
      notifications: notifRows || [],
      error: null,
    };

    return { statusCode: 200, body: JSON.stringify(payload) };
  } catch (err) {
    console.error("assignAdvisor error", err);
    const status = err?.status || 500;
    return { statusCode: status, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}

export const main = handler;
