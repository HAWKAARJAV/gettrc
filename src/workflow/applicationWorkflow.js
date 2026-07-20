import { normalizeWorkflowState } from "./workflowStates";

// normalizeApplicationState is normalizeWorkflowState — imported above so the
// functions below can call it, and also re-exported for consumers.
const normalizeApplicationState = normalizeWorkflowState;

export {
  APPLICATION_STATES,
  APPLICATION_STATES as WORKFLOW_STATES,
  DOCUMENT_REVIEW_STATES,
  LEGACY_REQUEST_STATUS_TO_WORKFLOW_STATE,
  WORKFLOW_STATE_META as APPLICATION_STATE_META,
  WORKFLOW_STATE_META,
  getWorkflowStateLabel as getApplicationProgressLabel,
  getWorkflowStateMeta as getApplicationStateMeta,
  getWorkflowTimeline as getApplicationTimeline,
  mapLegacyRequestStatusToWorkflowState,
  normalizeWorkflowState as normalizeApplicationState,
} from "./workflowStates";

export function getApplicationUnlockState(application) {
  const workflowState = normalizeApplicationState(application);

  if (workflowState === "completed") return "payment_completed";
  if (workflowState === "payment_completed") return "payment_completed";
  if (workflowState === "submitted_to_authority" || workflowState === "processing" || workflowState === "advisor_assigned") return workflowState;
  if (workflowState === "documents_under_review" || workflowState === "documents_pending") return workflowState;
  if (workflowState === "payment_pending") return "payment_pending";
  if (workflowState === "eligible") return "payment_pending";
  if (workflowState === "rejected") return "rejected";
  return "pending_review";
}

export function getApplicationOperationalStage(application, fallbackState = "pending_review") {
  return normalizeApplicationState(application, fallbackState);
}

export function buildApplicationMeta({ applicantType, userId, applicationType, eligibilityRequestId }) {
  return {
    applicant_type: applicantType,
    user_id: userId,
    country: "AE",
    application_type: applicationType,
    eligibility_request_id: eligibilityRequestId,
  };
}
