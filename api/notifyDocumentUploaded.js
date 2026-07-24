import { getServiceClient, verifyApplicationOwner, syncLegacyRequestFromApplication } from "./_shared.js";
import { sendAdvisorEmail } from "./_sendStatusEmail.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

// Called by the retail/corporate client immediately after they upload a
// document. RLS prevents a client from writing a notification row targeted at
// the advisor, so this service-role endpoint does it for them — closing the
// loop the UI already promises ("your advisor will be notified"). It also
// nudges the application forward into documents_under_review when it was still
// waiting on documents, so the advisor and admin queues reflect real movement.
//
// Best-effort by design: the upload itself already succeeded before this is
// called, so any failure here is logged and swallowed rather than surfaced to
// the client as an upload error.

// Only auto-advance out of these "waiting on the client" states. Once a case
// is advisor_assigned / processing / submitted, the advisor is actively
// driving the state machine and we must not fight their manual transitions.
const ADVANCEABLE_STATES = ["payment_completed", "documents_pending"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { applicationId, documentType = "" } = req.body || {};
    if (!applicationId) return res.status(400).json({ error: "applicationId required" });

    // Authorise the caller as the owner of this application.
    const { application } = await verifyApplicationOwner(auth, applicationId);

    const svc = getServiceClient();
    const label = String(documentType || "a document").trim() || "a document";

    // 1. Notify the assigned advisor, if one exists.
    if (application.advisor_id) {
      const { error: notifError } = await svc.from("notifications").insert({
        user_id: application.advisor_id,
        application_id: applicationId,
        notification_type: "document_upload",
        title: "Client uploaded a document",
        body: `The client uploaded "${label}" for application ${applicationId.slice(0, 8)} — ready for your review.`,
        action_url: `/advisor/cases/${applicationId}?tab=documents`,
        level: "info",
        created_at: new Date().toISOString(),
      });
      if (notifError) console.warn("[notifyDocumentUploaded] advisor notification warning", notifError);

      try {
        const [{ data: clientProfile }, { data: advisorProfile }] = await Promise.all([
          svc.from("profiles").select("full_name").eq("id", application.user_id).maybeSingle(),
          svc.from("profiles").select("email,full_name").eq("id", application.advisor_id).maybeSingle(),
        ]);
        if (advisorProfile?.email) {
          await sendAdvisorEmail({ email: advisorProfile.email, name: advisorProfile.full_name || "", kind: "document_uploaded", clientName: clientProfile?.full_name, documentType: label, applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
        }
      } catch (emailErr) {
        console.warn("[notifyDocumentUploaded] Advisor email failed (non-fatal):", emailErr?.message || emailErr);
      }
    }

    // 2. Advance the workflow into documents_under_review when the case was
    //    still waiting on the client's documents.
    let advanced = false;
    if (ADVANCEABLE_STATES.includes(application.workflow_state)) {
      const nextPatch = { workflow_state: "documents_under_review", review_state: "documents_under_review" };
      const { data: updated, error: updateError } = await svc
        .from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
      if (updateError) {
        console.warn("[notifyDocumentUploaded] state advance warning", updateError);
      } else {
        advanced = true;
        await syncLegacyRequestFromApplication({ application: updated || application, nextPatch, notes: "Client uploaded documents" });
        await svc.from("application_status_history").insert({
          application_id: applicationId,
          previous_state: application.workflow_state,
          new_state: "documents_under_review",
          updated_by: "system",
          notes: `Client uploaded "${label}"`,
        });
      }
    }

    return res.status(200).json({ success: true, data: { advanced }, error: null });
  } catch (err) {
    captureError("notifyDocumentUploaded error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
