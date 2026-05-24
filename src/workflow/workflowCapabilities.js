import { normalizeWorkflowState } from "./workflowStates";

const WORKSPACE_SECTION_KEYS = ["overview", "documents", "advisor", "billing", "review", "residency", "notifications", "audit"];

function isInStates(application, states) {
  return states.includes(normalizeWorkflowState(application));
}

export function getApplicationCapabilities(application) {
  const state = normalizeWorkflowState(application);
  const unlocked = ["payment_completed", "documents_pending", "documents_under_review", "advisor_assigned", "processing", "submitted_to_authority", "completed"].includes(state);
  const canProgress = !["completed", "rejected"].includes(state);

  return {
    state,
    canUploadDocuments: isInStates(application, ["payment_completed", "documents_pending", "documents_under_review", "advisor_assigned", "processing"]),
    canAssignAdvisor: canProgress,
    canReviewDocuments: isInStates(application, ["documents_pending", "documents_under_review", "advisor_assigned", "processing"]),
    canAccessBilling: isInStates(application, ["eligible", "payment_pending", "payment_completed"]),
    canSubmitToAuthority: isInStates(application, ["processing", "advisor_assigned"]),
    canAccessWorkspaceSections: WORKSPACE_SECTION_KEYS.reduce((sections, key) => {
      sections[key] = unlocked || ["overview", "notifications", "audit", "residency"].includes(key) || (key === "billing" && isInStates(application, ["eligible", "payment_pending", "payment_completed"])) || (key === "documents" && isInStates(application, ["payment_completed", "documents_pending", "documents_under_review", "advisor_assigned", "processing"])) || (key === "advisor" && (unlocked || Boolean(application?.advisor_id || application?.assigned_advisor_id)));
      return sections;
    }, {}),
    canViewAdvisor: unlocked || Boolean(application?.advisor_id || application?.assigned_advisor_id),
    canManagePayment: isInStates(application, ["eligible", "payment_pending"]),
  };
}
