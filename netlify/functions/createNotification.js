import { getServiceClient, verifyAdminOrAdvisor } from "./_shared";

export async function handler(event, context) {
  try {
    const auth = event.headers?.authorization?.replace("Bearer ", "") || event.headers?.Authorization?.replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const body = JSON.parse(event.body || "{}");
    const { userId, title, body: msg, level = 'info', applicationId = null, actionUrl = null, notificationType = 'workflow' } = body;
    if (!userId || !title || !msg) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'userId, title and body required' }) };

    const svc = getServiceClient();
    const { normalizeActionUrl } = require('./_shared');
    const finalAction = normalizeActionUrl(actionUrl, applicationId, null);
    const { data, error } = await svc.from('notifications').insert({
      user_id: userId,
      application_id: applicationId,
      notification_type: notificationType,
      title,
      body: msg,
      action_url: finalAction,
      level,
      created_at: new Date().toISOString(),
    }).select('*').maybeSingle();
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, data: { notification: data }, historyEntry: null, notifications: [data], error: null }) };
  } catch (err) {
    console.error('createNotification error', err);
    const status = err?.status || 500;
    return { statusCode: status, body: JSON.stringify({ success: false, error: err?.message || String(err) }) };
  }
}

export const main = handler;
