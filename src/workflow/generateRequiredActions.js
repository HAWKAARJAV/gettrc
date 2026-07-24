import { normalizeWorkflowState } from "./workflowStates";

const HIGH_BLOCKING_STATES = new Set(["eligible", "payment_pending", "payment_completed", "documents_pending", "rejected"]);
const MEDIUM_STATES = new Set(["pending_review", "documents_under_review", "advisor_assigned", "processing", "submitted_to_authority"]);

function deriveDueState(priority, status) {
  if (status === "done") return "complete";
  if (status === "blocked") return "blocked";
  if (priority === "high") return "due_now";
  if (priority === "medium") return "upcoming";
  return "not_due";
}

function pushTask(tasks, task) {
  const priority = task.priority || "medium";
  const status = task.status || "open";
  const blocking = typeof task.blocking === "boolean" ? task.blocking : priority === "high" && status !== "done";

  tasks.push({
    id: task.id,
    title: task.title,
    description: task.description || "",
    section: task.section || "overview",
    priority,
    severity: task.severity || priority,
    blocking,
    dueState: task.dueState || deriveDueState(priority, status),
    status,
  });
}

function taskPriorityForState(state) {
  if (HIGH_BLOCKING_STATES.has(state)) return "high";
  if (MEDIUM_STATES.has(state)) return "medium";
  return "low";
}

function getBasePath(application) {
  return application?.applicant_type === "corporate" ? "/corporate/applications" : "/retail/applications";
}

function buildLink(application, suffix = "") {
  const applicationId = application?.id;
  if (!applicationId) return null;
  const basePath = getBasePath(application);
  return `${basePath}/${applicationId}${suffix}`;
}

function hasMissingEmiratesId(application) {
  // Emirates ID is a retail (individual) requirement — corporate applications
  // never populate these fields, so this always fired for every corporate
  // case regardless of its real document status.
  if (application?.applicant_type === "corporate") return false;
  return Boolean(application) && !application.emirates_id && !application.emiratesId && !application.identity_number;
}

export function generateRequiredActions(application, documents = [], history = []) {
  const state = normalizeWorkflowState(application);
  const tasks = [];
  const hasAdvisor = Boolean(application?.advisor_id || application?.assigned_advisor_id || application?.assigned_manager || application?.assigned_specialist);
  const requiredDocuments = Array.isArray(documents) ? documents.filter((document) => document.required) : [];
  const uploadedTypes = new Set((documents || []).map((document) => document.document_type || document.document_name));
  const statePriority = taskPriorityForState(state);

  if (hasMissingEmiratesId(application) && ["pending_review", "eligible", "payment_pending", "payment_completed", "documents_pending"].includes(state)) {
    pushTask(tasks, {
      id: "missing-emirates-id",
      title: "Missing Emirates ID",
      description: "Identity details are required before compliance review can be finalized.",
      section: "identity",
      priority: "high",
      severity: "high",
      blocking: true,
      dueState: "due_now",
      link: { path: buildLink(application, "?panel=summary&focus=identity"), section: "summary", focus: "identity" },
    });
  }

  if (state === "pending_review") {
    pushTask(tasks, {
      id: "review-intake",
      title: "Awaiting advisor review",
      description: "The file is waiting for initial compliance review.",
      section: "review",
      priority: "medium",
      severity: "medium",
      blocking: false,
      link: { path: buildLink(application, "?panel=actions&focus=review"), section: "actions", focus: "review" },
    });
  }

  if (state === "eligible" || state === "payment_pending") {
    pushTask(tasks, {
      id: "payment-followup",
      title: "Payment pending",
      description: "Payment must be completed before the workflow can progress.",
      section: "billing",
      priority: "high",
      severity: "high",
      blocking: true,
      dueState: "due_now",
      link: { path: buildLink(application, "?panel=summary&focus=payment"), section: "summary", focus: "payment" },
    });
  }

  if (state === "payment_completed") {
    pushTask(tasks, {
      id: "collect-documents",
      title: "Collect required documents",
      description: "The workspace is unlocked and document intake can begin.",
      section: "documents",
      priority: "high",
      severity: "high",
      blocking: true,
      link: { path: buildLink(application, "?panel=documents"), section: "documents" },
    });
  }

  if (state === "documents_pending") {
    pushTask(tasks, {
      id: "document-upload",
      title: "Documents pending",
      description: "Required files still need to be uploaded for review.",
      section: "documents",
      priority: "high",
      severity: "high",
      blocking: true,
      link: { path: buildLink(application, "?panel=documents"), section: "documents" },
    });
  }

  if (state === "documents_under_review") {
    pushTask(tasks, {
      id: "document-review",
      title: "Awaiting advisor review",
      description: "Uploaded documents are ready for operational review.",
      section: "review",
      priority: "medium",
      severity: "medium",
      blocking: false,
      link: { path: buildLink(application, "?panel=documents"), section: "documents" },
    });
  }

  if (state === "advisor_assigned") {
    pushTask(tasks, {
      id: "advisor-review",
      title: "Awaiting advisor review",
      description: hasAdvisor ? "The assigned advisor should continue the managed workflow." : "Assign an advisor to continue the managed workflow.",
      section: "advisor",
      priority: hasAdvisor ? "medium" : "high",
      severity: hasAdvisor ? "medium" : "high",
      blocking: !hasAdvisor,
      link: { path: buildLink(application, "?panel=actions&focus=advisor"), section: "actions", focus: "advisor" },
    });
  }

  if (state === "processing" || state === "submitted_to_authority") {
    pushTask(tasks, {
      id: state === "processing" ? "authority-submission" : "authority-followup",
      title: state === "processing" ? "Preparing submission" : "Awaiting authority response",
      description: "The file is progressing through the managed compliance workflow.",
      section: "submission",
      priority: statePriority,
      severity: statePriority,
      blocking: false,
      link: { path: buildLink(application, "?panel=audit"), section: "audit" },
    });
  }

  if (state === "completed") {
    pushTask(tasks, {
      id: "case-complete",
      title: "Case completed",
      description: "The workflow is closed and no further action is required.",
      section: "audit",
      priority: "low",
      severity: "low",
      blocking: false,
      status: "done",
      link: { path: buildLink(application, "?panel=audit"), section: "audit" },
    });
  }

  if (state === "rejected") {
    pushTask(tasks, {
      id: "case-rejected",
      title: "Application rejected",
      description: "Review audit history and rejection notes before any re-open step.",
      section: "audit",
      priority: "high",
      severity: "high",
      blocking: true,
      status: "blocked",
      link: { path: buildLink(application, "?panel=audit"), section: "audit" },
    });
  }

  if (!hasAdvisor && ["payment_completed", "documents_pending", "documents_under_review", "advisor_assigned", "processing", "submitted_to_authority"].includes(state)) {
    pushTask(tasks, {
      id: "assign-advisor",
      title: "Assign an advisor",
      description: "Advisor ownership is required to keep the file moving.",
      section: "advisor",
      priority: "high",
      severity: "high",
      blocking: true,
      link: { path: buildLink(application, "?panel=actions&focus=advisor"), section: "actions", focus: "advisor" },
    });
  }

  const requiredCount = requiredDocuments.length;
  const uploadedCount = requiredDocuments.filter((document) => uploadedTypes.has(document.document_name)).length;
  if (requiredCount > 0 && uploadedCount < requiredCount && !tasks.some((task) => task.id === "document-upload")) {
    pushTask(tasks, {
      id: "missing-documents",
      title: "Missing required documents",
      description: "One or more required files still need to be uploaded.",
      section: "documents",
      priority: "high",
      severity: "high",
      blocking: true,
      link: { path: buildLink(application, "?panel=documents"), section: "documents" },
    });
  }

  if (Array.isArray(history) && history.length > 0 && tasks.length === 0) {
    pushTask(tasks, {
      id: "workflow-active",
      title: "Workflow active",
      description: "The file is progressing through the managed compliance workflow.",
      section: "overview",
      priority: "low",
      severity: "low",
      blocking: false,
      status: "done",
      link: { path: buildLink(application, "?panel=audit"), section: "audit" },
    });
  }

  return tasks;
}

export default generateRequiredActions;
