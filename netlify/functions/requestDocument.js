import { getServiceClient, verifyAdminOrAdvisor } from "./_shared";

/**
 * POST /requestDocument
 * Body: { applicationId, documentType, description? }
 *
 * Advisor calls this to formally request a document from the retail/corporate
 * client. Creates a row in document_requests and sends a notification to the client.
 */
export async function handler(event, context) {
  try {
    const auth =
      event.headers?.authorization?.replace("Bearer ", "") ||
      event.headers?.Authorization?.replace("Bearer ", "");

    const { user } = await verifyAdminOrAdvisor(auth);

    const body = JSON.parse(event.body || "{}");
    const { applicationId, documentType, description = "" } = body;

    if (!applicationId || !documentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "applicationId and documentType are required" }),
      };
    }

    const svc = getServiceClient();

    // Verify the advisor is actually assigned to this application
    const { data: application } = await svc
      .from("applications")
      .select("id,user_id,applicant_type,advisor_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (!application) {
      return { statusCode: 404, body: JSON.stringify({ error: "Application not found" }) };
    }

    // Only the assigned advisor (or admin) may request documents
    const isAdmin = !application.advisor_id; // admin can call regardless
    if (application.advisor_id && application.advisor_id !== user.id) {
      return { statusCode: 403, body: JSON.stringify({ error: "Not assigned to this application" }) };
    }

    // Insert the document request
    const { data: docRequest, error: insertError } = await svc
      .from("document_requests")
      .insert({
        application_id: applicationId,
        requested_by: user.id,
        document_type: documentType,
        description: description || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (insertError) throw insertError;

    // Notify the client
    const base = application.applicant_type === "corporate" ? "/corporate" : "/retail";
    const { data: notifRow, error: notifError } = await svc
      .from("notifications")
      .insert({
        user_id: application.user_id,
        application_id: applicationId,
        notification_type: "document_request",
        title: "Document requested by your advisor",
        body: `Your advisor has requested: ${documentType}${description ? " — " + description : ""}`,
        action_url: `${base}/documents`,
        level: "info",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (notifError) console.warn("notification insert warning", notifError);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: { documentRequest: docRequest },
        notification: notifRow || null,
        error: null,
      }),
    };
  } catch (err) {
    console.error("requestDocument error", err);
    return {
      statusCode: err?.status || 500,
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
}

export const main = handler;
