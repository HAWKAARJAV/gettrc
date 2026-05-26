import { mapLegacyRequestStatusToWorkflowState } from "./workflowStates";

export function getLegacyRequestTable(applicantType = "retail") {
  return applicantType === "corporate" ? "corporate_eligibility_requests" : "eligibility_requests";
}

export function getLegacyRequestKey(applicantType = "retail") {
  return applicantType === "corporate" ? "company_id" : "id";
}

export function mapApplicationWorkflowToLegacyStatus({
  workflowState,
  applicantType = "retail",
  currentStatus = "pending_review",
  currentPaymentStatus = "pending",
}) {
  const state = String(workflowState || "").trim();

  if (["pending_review", "eligible", "payment_pending", "payment_completed", "rejected"].includes(state)) {
    return state;
  }

  if (state === "documents_pending" || state === "documents_under_review") {
    return applicantType === "corporate" ? "needs_consultation" : "needs_more_info";
  }

  if (["advisor_assigned", "processing", "submitted_to_authority", "completed"].includes(state)) {
    if (currentStatus && currentStatus !== "pending_review") {
      return currentStatus;
    }
    return currentPaymentStatus === "completed" ? "payment_completed" : "payment_pending";
  }

  return currentStatus || "pending_review";
}

export function buildApplicationPatchFromRequest({
  applicantType = "retail",
  requestPatch = {},
  currentApplication = {},
  currentRequest = {},
}) {
  const patch = {};
  const hasStatus = Object.prototype.hasOwnProperty.call(requestPatch, "status");
  const hasPaymentStatus = Object.prototype.hasOwnProperty.call(requestPatch, "payment_status");
  const hasAssignedSpecialist = Object.prototype.hasOwnProperty.call(requestPatch, "assigned_specialist");

  const nextStatus = hasStatus ? requestPatch.status : null;
  const nextPaymentStatus = hasPaymentStatus ? requestPatch.payment_status : null;

  let workflowState = nextStatus
    ? mapLegacyRequestStatusToWorkflowState(nextStatus, currentApplication.workflow_state || "pending_review")
    : null;

  if (applicantType === "retail" && nextStatus === "needs_more_info") {
    workflowState = "pending_review";
  }

  if (hasAssignedSpecialist && !hasStatus) {
    workflowState = "advisor_assigned";
  }

  if (!workflowState && nextPaymentStatus === "completed") {
    workflowState = "payment_completed";
  }

  if (workflowState) {
    patch.workflow_state = workflowState;
    patch.review_state = workflowState;
  }

  if (hasPaymentStatus) {
    patch.payment_state = nextPaymentStatus === "completed" ? "completed" : "pending";
  }

  if (applicantType === "corporate" && hasAssignedSpecialist) {
    patch.advisor_name = requestPatch.assigned_specialist || currentApplication.advisor_name || null;
    patch.advisor_assigned_at = currentApplication.advisor_assigned_at || new Date().toISOString();
  }

  if (workflowState === "payment_completed" || workflowState === "completed") {
    patch.completed_at = currentApplication.completed_at || new Date().toISOString();
  } else if (workflowState || hasPaymentStatus || hasAssignedSpecialist) {
    patch.completed_at = null;
  }

  return Object.keys(patch).length ? patch : null;
}

export function buildLegacyRequestPatchFromApplication({
  application,
  nextPatch = {},
  currentRequest = {},
  notes = "",
  advisorLabel = null,
}) {
  const patch = {};
  const applicantType = application?.applicant_type || "retail";
  const workflowState = nextPatch.workflow_state || nextPatch.review_state || null;
  const paymentState = nextPatch.payment_state || null;
  const advisorName = advisorLabel || nextPatch.advisor_name || null;

  if (workflowState) {
    patch.status = mapApplicationWorkflowToLegacyStatus({
      workflowState,
      applicantType,
      currentStatus: currentRequest.status || "pending_review",
      currentPaymentStatus: currentRequest.payment_status || "pending",
    });
  }

  if (paymentState) {
    patch.payment_status = paymentState === "completed" ? "completed" : "pending";
  }

  if (notes) {
    patch.review_notes = notes;
  }

  if (applicantType === "corporate" && advisorName) {
    patch.assigned_specialist = advisorName;
  }

  return Object.keys(patch).length ? patch : null;
}