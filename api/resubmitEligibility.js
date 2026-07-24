import { getServiceClient, verifyApplicationOwner, syncLegacyRequestFromApplication } from "./_shared.js";
import { sendStatusEmail } from "./_sendStatusEmail.js";
import { enforceRateLimit } from "./_rateLimit.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

// Fields the retail applicant is allowed to correct and resubmit. Whitelisted
// explicitly rather than accepting an arbitrary patch object, so a client
// can't smuggle unrelated columns (e.g. status, payment_status) through this
// endpoint.
const ALLOWED_ELIGIBILITY_FIELDS = [
  "current_country", "vat_registered", "trc_period_year", "days_in_uae",
  "uae_visa", "emirates_id", "visa_type",
  "has_permanent_residence", "has_uae_employment_or_business", "is_centre_of_interests",
  "trc_purpose", "treaty_country",
  "occupation", "income_source", "purpose", "urgency",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { applicationId, updates = {} } = req.body || {};
    if (!applicationId) return res.status(400).json({ error: "applicationId required" });

    const { user, application } = await verifyApplicationOwner(auth, applicationId);

    const svc = getServiceClient();
    const allowed = await enforceRateLimit(req, res, svc, {
      key: `resubmit:${user.id}`,
      limit: 5,
      windowSeconds: 3600,
      message: "Too many resubmission attempts. Please try again later or contact support.",
    });
    if (!allowed) return;

    if (application.applicant_type !== "retail") {
      return res.status(400).json({ error: "Resubmission is currently only supported for retail applications" });
    }
    if (application.workflow_state !== "rejected") {
      return res.status(400).json({ error: `Resubmission is only available for rejected applications (current state: ${application.workflow_state}).` });
    }
    if (!application.eligibility_request_id) {
      return res.status(404).json({ error: "No eligibility request linked to this application" });
    }

    const patch = {};
    for (const key of ALLOWED_ELIGIBILITY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) patch[key] = updates[key];
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { error: eligUpdateError } = await svc.from("eligibility_requests").update(patch).eq("id", application.eligibility_request_id);
    if (eligUpdateError) throw eligUpdateError;

    const nextPatch = {
      workflow_state: "pending_review",
      review_state: "pending_review",
      eligibility_basis: null,
      eligibility_determined_by: null,
      eligibility_determined_at: null,
      eligibility_notes: null,
    };

    const { data: updatedApp, error: appUpdateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
    if (appUpdateError) throw appUpdateError;

    await syncLegacyRequestFromApplication({ application: updatedApp || application, nextPatch, notes: "Applicant resubmitted corrected eligibility information" });

    await svc.from("application_status_history").insert({
      application_id: applicationId,
      previous_state: "rejected",
      new_state: "pending_review",
      updated_by: user.id,
      notes: "Applicant resubmitted corrected eligibility information",
    });

    // Notify the advisor if one is already assigned; otherwise the case
    // simply reappears in the admin/advisor pending-review queue.
    if (application.advisor_id) {
      await svc.from("notifications").insert({
        user_id: application.advisor_id,
        application_id: applicationId,
        notification_type: "workflow",
        title: "Applicant resubmitted eligibility information",
        body: "The applicant corrected and resubmitted their eligibility answers after a rejection — please review again.",
        action_url: `/advisor/cases/${applicationId}`,
        level: "info",
        created_at: new Date().toISOString(),
      });
    }

    try {
      const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", user.id).maybeSingle();
      if (profile?.email) {
        await sendStatusEmail({ email: profile.email, name: profile.full_name || "", newState: "pending_review", applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
      }
    } catch (emailErr) {
      console.warn("[resubmitEligibility] Status email failed (non-fatal):", emailErr?.message || emailErr);
    }

    return res.status(200).json({ success: true, data: { application: updatedApp }, error: null });
  } catch (err) {
    captureError("resubmitEligibility error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
