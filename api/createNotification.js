import { getServiceClient, verifyAdminOrAdvisor, normalizeActionUrl } from "./_shared.js";
import { sendStatusEmail } from "./_sendStatusEmail.js";

// Two callers share this route to stay within the Vercel Hobby plan's
// 12-function cap:
//  1. Admin/advisor UI — creates an ad-hoc notification (Bearer JWT auth).
//  2. The `sync_application_status_history` Postgres trigger, via pg_net —
//     fires on every `applications.workflow_state` change regardless of
//     which code path caused it (a Node mutation, the admin panel's direct
//     dbPatch, or the legacy eligibility_requests sync cascade), so it's the
//     one place that can guarantee every transition also emails the client
//     (internal shared-secret auth, no user JWT).
async function handleWorkflowEmailWebhook(req, res) {
  const { applicationId, userId, newState } = req.body || {};
  if (!applicationId || !userId || !newState) {
    return res.status(400).json({ error: "applicationId, userId, and newState required" });
  }

  const svc = getServiceClient();
  const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", userId).maybeSingle();
  if (!profile?.email) {
    console.warn(`[createNotification:webhook] No profile/email for user ${userId} — skipping`);
    return res.status(200).json({ success: true, skipped: "no profile email" });
  }

  await sendStatusEmail({
    email: profile.email,
    name: profile.full_name || "",
    newState,
    applicationId,
    siteUrl: process.env.SITE_URL || "https://gettrc.com",
  });

  return res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Internal webhook path — shared-secret auth, not a user JWT.
  const internalSecret = req.headers["x-internal-secret"];
  if (internalSecret) {
    if (internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) return res.status(401).json({ error: "Unauthorized" });
    try {
      return await handleWorkflowEmailWebhook(req, res);
    } catch (err) {
      console.error("createNotification (webhook) error", err);
      // Always 200 for the trigger path — pg_net would just retry a non-2xx,
      // and a failed email shouldn't surface as an error anywhere user-facing.
      return res.status(200).json({ success: false, error: err?.message || String(err) });
    }
  }

  // Admin/advisor manual notification path — unchanged from before.
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const { userId, title, body: msg, level = "info", applicationId = null, actionUrl = null, notificationType = "workflow" } = req.body || {};
    if (!userId || !title || !msg) return res.status(400).json({ success: false, error: "userId, title and body required" });

    const svc = getServiceClient();
    const finalAction = normalizeActionUrl(actionUrl, applicationId, null);
    const { data, error } = await svc.from("notifications").insert({
      user_id: userId,
      application_id: applicationId,
      notification_type: notificationType,
      title,
      body: msg,
      action_url: finalAction,
      level,
      created_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    if (error) throw error;

    return res.status(200).json({ success: true, data: { notification: data }, historyEntry: null, notifications: [data], error: null });
  } catch (err) {
    console.error("createNotification error", err);
    return res.status(err?.status || 500).json({ success: false, error: err?.message || String(err) });
  }
}
