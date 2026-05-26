import { getServiceClient, verifyAdminOrAdvisor } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const { bucket, path, expires = 300 } = req.body || {};
    if (!bucket || !path) return res.status(400).json({ error: "bucket and path required" });

    const svc = getServiceClient();
    const { data, error } = await svc.storage.from(bucket).createSignedUrl(path, Number(expires));
    if (error) throw error;

    return res.status(200).json({ success: true, data: { url: data?.signedUrl }, historyEntry: null, notifications: [], error: null });
  } catch (err) {
    console.error("getSignedDocumentUrl error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
