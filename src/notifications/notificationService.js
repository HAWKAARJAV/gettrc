import { supabase } from "../supabaseClient";

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,application_id,notification_type,title,body,action_url,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
  if (error) throw error;
  return true;
}

export async function createNotification({ userId, title, body, level = 'info', applicationId = null, actionUrl = null, notificationType = 'workflow' }) {
  // Route notification creation through server-side function for consistency and audit
  const { createNotification } = await import('../adminApi');
  const res = await createNotification({ userId, title, body, level, applicationId, actionUrl, notificationType });
  if (!res || !res.success) throw new Error(res?.error || 'notification creation failed');
  return true;
}
