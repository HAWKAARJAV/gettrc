import { getServiceClient, syncLegacyRequestFromApplication, verifyAdminOrAdvisor } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const { applicationId, advisorId, notes = "" } = req.body || {};
    if (!applicationId || !advisorId) return res.status(400).json({ error: "applicationId and advisorId required" });

    const svc = getServiceClient();

    const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,advisor_id,applicant_type").eq("id", applicationId).maybeSingle();
    if (!existing) return res.status(404).json({ error: "application not found" });

    const { data: advisorRecord } = await svc.from("advisors").select("id,user_id").eq("id", advisorId).maybeSingle();
    const resolvedAdvisorUserId = advisorRecord?.user_id || advisorId;
    const { data: advisorProfile } = await svc.from("profiles").select("full_name,email").eq("id", resolvedAdvisorUserId).maybeSingle();
    const advisorLabel = advisorProfile?.full_name || advisorProfile?.email || resolvedAdvisorUserId;

    const nextPatch = {
      advisor_id: resolvedAdvisorUserId,
      advisor_assigned_at: new Date().toISOString(),
      workflow_state: "advisor_assigned",
    };

    const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
    if (updateError) throw updateError;

    await syncLegacyRequestFromApplication({ application: updated || existing, nextPatch, notes, advisorLabel });

    const { data: historyRows, error: historyError } = await svc.from("application_status_history").insert({
      application_id: applicationId,
      previous_state: existing.workflow_state,
      new_state: nextPatch.workflow_state,
      updated_by: "system",
      notes,
    }).select("*").maybeSingle();
    if (historyError) console.warn("history insert warning", historyError);

    const notifs = [
      { user_id: existing.user_id, application_id: applicationId, notification_type: "workflow", title: "Advisor assigned", body: `An advisor has been assigned to your application (${applicationId.slice(0, 8)}).`, action_url: `/${existing.applicant_type || "retail"}/dashboard`, level: "info", created_at: new Date().toISOString() },
    ];
    if (resolvedAdvisorUserId && resolvedAdvisorUserId !== existing.user_id) {
      notifs.push({ user_id: resolvedAdvisorUserId, application_id: applicationId, notification_type: "workflow", title: "Case assigned to you", body: `Application ${applicationId.slice(0, 8)} has been assigned to you.`, action_url: `/advisor/cases/${applicationId}`, level: "info", created_at: new Date().toISOString() });
    }
    const { data: notifRows, error: notifError } = await svc.from("notifications").insert(notifs).select("*");
    if (notifError) console.warn("notification insert warning", notifError);

    return res.status(200).json({ success: true, data: { application: updated }, historyEntry: historyRows || null, notifications: notifRows || [], error: null });
  } catch (err) {
    console.error("assignAdvisor error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
