import { getServiceClient, verifyAdminOrAdvisor } from "./_shared.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { user, profile } = await verifyAdminOrAdvisor(auth);

    const { bucket, path, expires = 300 } = req.body || {};
    if (!bucket || !path) return res.status(400).json({ error: "bucket and path required" });

    const svc = getServiceClient();

    // This handler uses the service-role client, which bypasses the
    // storage.objects RLS policy that normally restricts a client's own
    // direct Supabase Storage calls to their own case's folder (files are
    // stored at `${applicationId}/...`). verifyAdminOrAdvisor only confirms
    // the caller HAS an admin/advisor/specialist role — with more than one
    // advisor account, that alone would let any advisor request a signed
    // URL for any OTHER advisor's client's private documents (passports,
    // Emirates IDs, bank statements). Re-derive the owning application from
    // the path and require the caller to actually be its assigned advisor
    // (admins bypass, matching the RLS policy's own admin carve-out).
    const isAdminEmail = profile?.email && String(profile.email).toLowerCase() === (process.env.ADMIN_EMAIL || "hawkwilds09@gmail.com");
    if (profile?.role !== "admin" && !isAdminEmail) {
      const applicationId = String(bucket === "trc-private-documents" ? path.split("/")[0] : "");
      const { data: owningApp } = applicationId
        ? await svc.from("applications").select("id,advisor_id").eq("id", applicationId).maybeSingle()
        : { data: null };
      if (!owningApp || owningApp.advisor_id !== user.id) {
        return res.status(403).json({ error: "You are not the assigned advisor for this document." });
      }
    }

    const { data, error } = await svc.storage.from(bucket).createSignedUrl(path, Number(expires));
    if (error) throw error;

    return res.status(200).json({ success: true, data: { url: data?.signedUrl }, historyEntry: null, notifications: [], error: null });
  } catch (err) {
    captureError("getSignedDocumentUrl error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
