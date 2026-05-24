export const WORKFLOW_STATES = [
  "pending_review",
  "eligible",
  "payment_pending",
  "payment_completed",
  "documents_pending",
  "documents_under_review",
  "advisor_assigned",
  "processing",
  "submitted_to_authority",
  "completed",
  "rejected",
];

export const APPLICATION_STATES = WORKFLOW_STATES;

export const LEGACY_REQUEST_STATUS_TO_WORKFLOW_STATE = {
  eligible: "payment_pending",
  payment_pending: "payment_pending",
  payment_completed: "payment_completed",
  needs_more_info: "documents_pending",
  needs_consultation: "documents_under_review",
  rejected: "rejected",
};

export const WORKFLOW_STATE_META = {
  pending_review: {
    label: "Pending review",
    description: "Eligibility intake is waiting for compliance review.",
    tone: "info",
  },
  eligible: {
    label: "Eligible",
    description: "Eligibility has been approved and payment can be collected.",
    tone: "success",
  },
  payment_pending: {
    label: "Payment pending",
    description: "Payment is required before the operational workspace unlocks.",
    tone: "warning",
  },
  payment_completed: {
    label: "Payment completed",
    description: "Payment has cleared and document collection can begin.",
    tone: "success",
  },
  documents_pending: {
    label: "Documents pending",
    description: "Required compliance documents are awaiting upload.",
    tone: "warning",
  },
  documents_under_review: {
    label: "Documents under review",
    description: "Uploaded files are being reviewed by the operations team.",
    tone: "info",
  },
  advisor_assigned: {
    label: "Advisor assigned",
    description: "A specialist has been assigned to manage the file.",
    tone: "success",
  },
  processing: {
    label: "Processing",
    description: "The file is being prepared for authority submission.",
    tone: "info",
  },
  submitted_to_authority: {
    label: "Submitted to authority",
    description: "The TRC application has been submitted to the authority.",
    tone: "info",
  },
  completed: {
    label: "Completed",
    description: "The compliance workflow is complete.",
    tone: "success",
  },
  rejected: {
    label: "Rejected",
    description: "The application cannot proceed in its current state.",
    tone: "error",
  },
};

export const DOCUMENT_REVIEW_STATES = ["uploaded", "under_review", "approved", "rejected", "needs_resubmission"];

export function normalizeWorkflowState(application, fallbackState = "pending_review") {
  const candidate = application?.workflow_state || application?.review_state || application?.payment_state || fallbackState;
  return WORKFLOW_STATES.includes(candidate) ? candidate : fallbackState;
}

export function mapLegacyRequestStatusToWorkflowState(status, fallbackState = "pending_review") {
  return LEGACY_REQUEST_STATUS_TO_WORKFLOW_STATE[status] || fallbackState;
}

export function getWorkflowStateMeta(state) {
  return WORKFLOW_STATE_META[normalizeWorkflowState({ workflow_state: state })] || WORKFLOW_STATE_META.pending_review;
}

export function getWorkflowStateLabel(state) {
  return getWorkflowStateMeta(state).label;
}

export function getWorkflowTimeline(application, history = []) {
  const currentState = normalizeWorkflowState(application);
  const completedStates = new Set(history.map((entry) => entry.new_state));
  completedStates.add(currentState);

  return WORKFLOW_STATES.map((state, index) => {
    const historyEntry = history.find((entry) => entry.new_state === state);
    const isCurrent = state === currentState;
    const reached = completedStates.has(state);

    return {
      key: state,
      index,
      state,
      ...getWorkflowStateMeta(state),
      reached,
      isCurrent,
      changedAt: historyEntry?.created_at || (isCurrent ? application?.created_at : null),
      notes: historyEntry?.notes || "",
    };
  });
}
