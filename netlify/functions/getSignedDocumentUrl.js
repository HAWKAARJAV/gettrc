import { getServiceClient, verifyAdminOrAdvisor } from "./_shared";

export async function handler(event, context) {
  try {
    const auth = event.headers?.authorization?.replace("Bearer ", "") || event.headers?.Authorization?.replace("Bearer ", "");
    // allow admin/advisor or any authenticated session — but enforce via token
    await verifyAdminOrAdvisor(auth);

    const { bucket, path, expires = 300 } = JSON.parse(event.body || "{}");
    if (!bucket || !path) return { statusCode: 400, body: JSON.stringify({ error: "bucket and path required" }) };

    const svc = getServiceClient();
    const { data, error } = await svc.storage.from(bucket).createSignedUrl(path, Number(expires));
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, data: { url: data?.signedUrl }, historyEntry: null, notifications: [], error: null }) };
  } catch (err) {
    console.error("getSignedDocumentUrl error", err);
    const status = err?.status || 500;
    return { statusCode: status, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}

export const main = handler;
