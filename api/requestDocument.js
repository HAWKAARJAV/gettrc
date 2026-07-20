import { getServiceClient, verifyAdminOrAdvisor } from "./_shared.js";
import { sendDocumentEmail } from "./_sendStatusEmail.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { user } = await verifyAdminOrAdvisor(auth);

    const { applicationId, documentType, description = "" } = req.body || {};
    if (!applicationId || !documentType) return res.status(400).json({ error: "applicationId and documentType are required" });

    const svc = getServiceClient();

    const { data: application } = await svc.from("applications").select("id,user_id,applicant_type,advisor_id").eq("id", applicationId).maybeSingle();
    if (!application) return res.status(404).json({ error: "Application not found" });

    if (application.advisor_id && application.advisor_id !== user.id) {
      return res.status(403).json({ error: "Not assigned to this application" });
    }

    const { data: docRequest, error: insertError } = await svc.from("document_requests").insert({
      application_id: applicationId,
      requested_by: user.id,
      document_type: documentType,
      description: description || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    if (insertError) throw insertError;

    const base = application.applicant_type === "corporate" ? "/corporate" : "/retail";
    const { data: notifRow, error: notifError } = await svc.from("notifications").insert({
      user_id: application.user_id,
      application_id: applicationId,
      notification_type: "document_request",
      title: "Document requested by your advisor",
      body: `Your advisor has requested: ${documentType}${description ? " — " + description : ""}`,
      action_url: `${base}/documents`,
      level: "info",
      created_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    if (notifError) console.warn("notification insert warning", notifError);

    try {
      const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", application.user_id).maybeSingle();
      if (profile?.email) {
        await sendDocumentEmail({
          email: profile.email,
          name: profile.full_name || "",
          kind: "requested",
          documentType,
          applicationId,
          applicantType: application.applicant_type,
          siteUrl: process.env.SITE_URL || "https://gettrc.com",
        });
      }
    } catch (emailErr) {
      console.warn("[requestDocument] Document email failed (non-fatal):", emailErr?.message || emailErr);
    }

    return res.status(200).json({ success: true, data: { documentRequest: docRequest }, notification: notifRow || null, error: null });
  } catch (err) {
    console.error("requestDocument error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
