import { getServiceClient, verifyAdminOrAdvisor } from "./_shared";
import { DOCUMENT_REVIEW_STATES } from "../../src/workflow/workflowStates";

export async function handler(event, context) {
  try {
    const auth = event.headers?.authorization?.replace("Bearer ", "") || event.headers?.Authorization?.replace("Bearer ", "");
    await verifyAdminOrAdvisor(auth);

    const body = JSON.parse(event.body || "{}");
    const { documentId, action, reviewerNotes = "", resubmit = false } = body;
    if (!documentId || !action) return { statusCode: 400, body: JSON.stringify({ error: "documentId and action required" }) };

    const svc = getServiceClient();

    if (!DOCUMENT_REVIEW_STATES.includes(action) && !["approve","reject","resubmit"].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid review action" }) };
    }

    // Map action to stored review_status
    const mapping = { approve: "approved", reject: "rejected", resubmit: "needs_resubmission" };
    const reviewStatus = mapping[action] || action;

    const { data: doc } = await svc.from("documents").select("id,application_id,uploaded_by,review_status,document_type").eq("id", documentId).maybeSingle();
    if (!doc) return { statusCode: 404, body: JSON.stringify({ error: "document not found" }) };
    const { data: application } = await svc.from("applications").select("id,applicant_type").eq("id", doc.application_id).maybeSingle();
    const { data: updatedDocs, error: updateError } = await svc.from("documents").update({ review_status: reviewStatus, reviewer_notes: reviewerNotes }).eq("id", documentId).select("*");
    if (updateError) throw updateError;

    const historyPayload = {
      application_id: doc.application_id,
      previous_state: null,
      new_state: doc.review_status || "documents_under_review",
      updated_by: "system",
      notes: `Document ${documentId} ${reviewStatus}. ${reviewerNotes || ""}`,
    };

    const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert(historyPayload).select("*").maybeSingle();
    if (historyError) console.warn('history insert warning', historyError);

    const { normalizeActionUrl } = require('./_shared');
    const actionUrl = normalizeActionUrl(`${applicationIdBase(doc.application_id, application?.applicant_type)}?panel=documents&doc=${documentId}`, doc.application_id, application?.applicant_type);
    const { data: notifRow, error: notifError } = await svc.from("notifications").insert({ user_id: doc.uploaded_by, application_id: doc.application_id, notification_type: 'workflow', title: `Document ${reviewStatus}`, body: `Your document for application ${doc.application_id} was ${reviewStatus}.`, action_url: actionUrl, level: "info", created_at: new Date().toISOString() }).select("*").maybeSingle();
    if (notifError) console.warn('notification insert warning', notifError);

    return { statusCode: 200, body: JSON.stringify({ success: true, data: { document: updatedDocs?.[0] || null }, historyEntry: historyRow || null, notifications: notifRow ? [notifRow] : [], error: null }) };
  } catch (err) {
    console.error("reviewDocument error", err);
    const status = err?.status || 500;
    return { statusCode: status, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}

export const main = handler;

function applicationIdBase(applicationId, applicantType = 'retail') {
  const base = applicantType === 'corporate' ? '/corporate' : '/retail';
  return `${base}/applications/${applicationId}`;
}
