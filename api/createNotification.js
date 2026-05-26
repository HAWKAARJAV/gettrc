import { getServiceClient, verifyAdminOrAdvisor, normalizeActionUrl } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
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
