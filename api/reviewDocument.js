import { getServiceClient, verifyAdminOrAdvisor, normalizeActionUrl } from "./_shared.js";
import { DOCUMENT_REVIEW_STATES } from "../src/workflow/workflowStates.js";
import { sendDocumentEmail } from "./_sendStatusEmail.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { user: reviewer } = await verifyAdminOrAdvisor(auth);

    const { documentId, action, reviewerNotes = "", resubmit = false } = req.body || {};
    if (!documentId || !action) return res.status(400).json({ error: "documentId and action required" });

    const svc = getServiceClient();

    if (!DOCUMENT_REVIEW_STATES.includes(action) && !["approve", "reject", "resubmit"].includes(action)) {
      return res.status(400).json({ error: "Invalid review action" });
    }

    const mapping = { approve: "approved", reject: "rejected", resubmit: "needs_resubmission" };
    const reviewStatus = mapping[action] || action;

    const { data: doc } = await svc.from("documents").select("id,application_id,uploaded_by,review_status,document_type").eq("id", documentId).maybeSingle();
    if (!doc) return res.status(404).json({ error: "document not found" });

    const { data: application } = await svc.from("applications").select("id,applicant_type").eq("id", doc.application_id).maybeSingle();
    const { data: updatedDocs, error: updateError } = await svc.from("documents").update({ review_status: reviewStatus, reviewer_notes: reviewerNotes, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() }).eq("id", documentId).select("*");
    if (updateError) throw updateError;

    const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert({
      application_id: doc.application_id,
      previous_state: null,
      new_state: doc.review_status || "documents_under_review",
      updated_by: "system",
      notes: `Document ${documentId} ${reviewStatus}. ${reviewerNotes || ""}`,
    }).select("*").maybeSingle();
    if (historyError) console.warn("history insert warning", historyError);

    const base = application?.applicant_type === "corporate" ? "/corporate" : "/retail";
    const actionUrl = normalizeActionUrl(
      `${base}/applications/${doc.application_id}?panel=documents&doc=${documentId}`,
      doc.application_id,
      application?.applicant_type
    );
    const { data: notifRow, error: notifError } = await svc.from("notifications").insert({
      user_id: doc.uploaded_by,
      application_id: doc.application_id,
      notification_type: "workflow",
      title: `Document ${reviewStatus}`,
      body: `Your document for application ${doc.application_id} was ${reviewStatus}.`,
      action_url: actionUrl,
      level: "info",
      created_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    if (notifError) console.warn("notification insert warning", notifError);

    if (reviewStatus === "rejected") {
      try {
        const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", doc.uploaded_by).maybeSingle();
        if (profile?.email) {
          await sendDocumentEmail({
            email: profile.email,
            name: profile.full_name || "",
            kind: "rejected",
            documentType: doc.document_type,
            notes: reviewerNotes,
            applicationId: doc.application_id,
            applicantType: application?.applicant_type,
            siteUrl: process.env.SITE_URL || "https://gettrc.com",
          });
        }
      } catch (emailErr) {
        console.warn("[reviewDocument] Document email failed (non-fatal):", emailErr?.message || emailErr);
      }
    }

    return res.status(200).json({ success: true, data: { document: updatedDocs?.[0] || null }, historyEntry: historyRow || null, notifications: notifRow ? [notifRow] : [], error: null });
  } catch (err) {
    captureError("reviewDocument error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
