import { createClient } from "@supabase/supabase-js";
import { buildLegacyRequestPatchFromApplication, getLegacyRequestKey, getLegacyRequestTable } from "../src/workflow/legacyRequestSync.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export function normalizeActionUrl(actionUrl, applicationId, applicantType = 'retail') {
  try {
    if (!applicationId) return actionUrl || `/${applicantType === 'corporate' ? 'corporate' : 'retail'}`;
    const base = applicantType === 'corporate' ? '/corporate' : '/retail';
    const expected = `${base}/applications/${applicationId}`;
    if (!actionUrl || typeof actionUrl !== 'string') return expected;
    const cleaned = actionUrl.trim();
    if (cleaned === '/dashboard' || cleaned === `${base}/dashboard`) return expected;
    if (!cleaned.includes(applicationId)) return expected;
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  } catch {
    return actionUrl;
  }
}

export async function verifyAdminOrAdvisor(accessToken) {
  if (!accessToken) throw { status: 401, message: "Missing access token" };
  const svc = getServiceClient();
  const { data, error } = await svc.auth.getUser(accessToken);
  if (error) throw { status: 401, message: "Invalid token" };
  const user = data?.user || data;
  if (!user || !user.id) throw { status: 401, message: "Unauthenticated" };

  const { data: profile } = await svc.from("profiles").select("id,role,email").eq("id", user.id).maybeSingle();
  const isAdminEmail = profile?.email && String(profile.email).toLowerCase() === (process.env.ADMIN_EMAIL || "hawkwilds09@gmail.com");
  const role = profile?.role || null;
  if (!isAdminEmail && role !== "admin" && role !== "advisor" && role !== "specialist") {
    throw { status: 403, message: "Insufficient role" };
  }

  return { user, profile };
}

// Verifies the caller is the actual owner of the application (the retail
// user_id, or the corporate company's user_id) — distinct from
// verifyAdminOrAdvisor, which gates privileged staff actions. Used for
// client-initiated actions like starting a payment or resubmitting
// eligibility, where the caller must be the applicant themselves.
export async function verifyApplicationOwner(accessToken, applicationId) {
  if (!accessToken) throw { status: 401, message: "Missing access token" };
  if (!applicationId) throw { status: 400, message: "applicationId required" };
  const svc = getServiceClient();
  const { data, error } = await svc.auth.getUser(accessToken);
  if (error) throw { status: 401, message: "Invalid token" };
  const user = data?.user || data;
  if (!user || !user.id) throw { status: 401, message: "Unauthenticated" };

  const { data: application } = await svc.from("applications").select("*").eq("id", applicationId).maybeSingle();
  if (!application) throw { status: 404, message: "Application not found" };
  if (application.user_id !== user.id) throw { status: 403, message: "Not the owner of this application" };

  return { user, application };
}

export async function syncLegacyRequestFromApplication({ application, nextPatch = {}, notes = "", advisorLabel = null }) {
  if (!application?.id || !application?.applicant_type) return null;

  const svc = getServiceClient();
  const applicantType = application.applicant_type;
  const requestTable = getLegacyRequestTable(applicantType);
  const requestKey = getLegacyRequestKey(applicantType);
  const requestFilterValue = applicantType === "corporate" ? application.user_id : application.eligibility_request_id;

  if (!requestFilterValue) return null;

  const { data: currentRequest } = await svc.from(requestTable).select("*").eq(requestKey, requestFilterValue).maybeSingle();
  if (!currentRequest) return null;

  const requestPatch = buildLegacyRequestPatchFromApplication({ application, nextPatch, currentRequest, notes, advisorLabel });
  if (!requestPatch) return currentRequest;

  const { data: updatedRequest, error } = await svc.from(requestTable).update(requestPatch).eq(requestKey, requestFilterValue).select("*").maybeSingle();
  if (error) {
    console.warn(`[syncLegacyRequestFromApplication] Failed to update ${requestTable}`, error);
    return currentRequest;
  }

  return updatedRequest || currentRequest;
}

// Core "assign an advisor to a case" logic — shared by the manual
// admin-triggered endpoint (assignAdvisor.js) and the automatic
// single-advisor assignment triggered on payment completion below.
export async function assignAdvisorToApplication({ svc, existing, advisorUserId, advisorLabel, notes = "" }) {
  const nextPatch = {
    advisor_id: advisorUserId,
    advisor_assigned_at: new Date().toISOString(),
    workflow_state: "advisor_assigned",
    // review_state is a legacy mirror of workflow_state read by the admin
    // queue — keep the two in lock-step here (as updateWorkflowState does)
    // so a case never shows a different state to admin vs advisor/client.
    review_state: "advisor_assigned",
  };

  const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", existing.id).select("*").maybeSingle();
  if (updateError) throw updateError;

  await syncLegacyRequestFromApplication({ application: updated || existing, nextPatch, notes, advisorLabel });

  const { data: historyRow, error: historyError } = await svc.from("application_status_history").insert({
    application_id: existing.id,
    previous_state: existing.workflow_state,
    new_state: nextPatch.workflow_state,
    updated_by: "system",
    notes,
  }).select("*").maybeSingle();
  if (historyError) console.warn("history insert warning", historyError);

  const notifs = [
    { user_id: existing.user_id, application_id: existing.id, notification_type: "workflow", title: "Advisor assigned", body: `An advisor has been assigned to your application (${existing.id.slice(0, 8)}).`, action_url: `/${existing.applicant_type || "retail"}/dashboard`, level: "info", created_at: new Date().toISOString() },
  ];
  if (advisorUserId && advisorUserId !== existing.user_id) {
    notifs.push({ user_id: advisorUserId, application_id: existing.id, notification_type: "workflow", title: "Case assigned to you", body: `Application ${existing.id.slice(0, 8)} has been assigned to you.`, action_url: `/advisor/cases/${existing.id}`, level: "info", created_at: new Date().toISOString() });
  }
  const { data: notifRows, error: notifError } = await svc.from("notifications").insert(notifs).select("*");
  if (notifError) console.warn("notification insert warning", notifError);

  return { application: updated, historyEntry: historyRow || null, notifications: notifRows || [] };
}

// Auto-assigns the sole configured advisor to a case right after payment
// completes, so admin never has to manually click "Assign Advisor" — there's
// currently exactly one advisor account, so every paid case should reach
// them by default. Only acts when the case has no advisor yet and exactly
// one available+verified advisor exists; if that ever changes (a second
// advisor is added), this intentionally backs off and leaves assignment to
// the manual admin flow rather than guessing which advisor should get it.
export async function autoAssignSoleAdvisor(svc, existing) {
  if (existing.advisor_id) return null;

  const { data: advisors } = await svc.from("advisors").select("id,user_id,name").eq("available", true).eq("verified", true);
  if (!advisors || advisors.length !== 1) return null;

  const advisor = advisors[0];
  try {
    return await assignAdvisorToApplication({
      svc,
      existing,
      advisorUserId: advisor.user_id,
      advisorLabel: advisor.name,
      notes: "Auto-assigned — only one advisor configured",
    });
  } catch (err) {
    console.warn("[autoAssignSoleAdvisor] failed, leaving for manual assignment", err);
    return null;
  }
}
