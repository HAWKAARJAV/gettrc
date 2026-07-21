import * as adminApi from "../adminApi";

function normalizeResponse(json) {
  if (!json) return { success: false, error: "No response" };
  if (typeof json.success !== "undefined") return json;
  // legacy fallback
  return { success: true, data: json, error: null, historyEntry: null, notifications: [] };
}

export async function assignAdvisor({ applicationId, advisorId, notes = "" }) {
  const res = await adminApi.assignAdvisor({ applicationId, advisorId, notes });
  return normalizeResponse(res);
}

export async function createAdvisor({ name, email }) {
  const res = await adminApi.createAdvisor({ name, email });
  return normalizeResponse(res);
}

export async function updateWorkflowState({ applicationId, newState, notes = "", patch = {} }) {
  const res = await adminApi.updateWorkflowState({ applicationId, newState, notes, patch });
  return normalizeResponse(res);
}

export async function reviewDocument({ documentId, action, reviewerNotes = "", resubmit = false }) {
  const res = await adminApi.reviewDocument({ documentId, action, reviewerNotes, resubmit });
  return normalizeResponse(res);
}

export async function updatePaymentState({ applicationId, paymentState, details = {} }) {
  const res = await adminApi.updatePaymentState({ applicationId, paymentState, details });
  return normalizeResponse(res);
}

export async function getSignedDocumentUrl({ bucket, path, expires = 300 }) {
  const res = await adminApi.getSignedDocumentUrl({ bucket, path, expires });
  const norm = normalizeResponse(res);
  return norm;
}

export async function createNotification({ userId, title, body, level = 'info', applicationId = null, actionUrl = null, notificationType = 'workflow' }) {
  const res = await adminApi.createNotification({ userId, title, body, level, applicationId, actionUrl, notificationType });
  const norm = normalizeResponse(res);
  return norm;
}

export default {
  assignAdvisor,
  createAdvisor,
  updateWorkflowState,
  reviewDocument,
  updatePaymentState,
  getSignedDocumentUrl,
  createNotification,
};
