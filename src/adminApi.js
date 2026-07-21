const ADMIN_API_PREFIX = "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("trc_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function assignAdvisor({ applicationId, advisorId, notes = "" }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/assignAdvisor`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ applicationId, advisorId, notes }) });
  const json = await res.json();
  return json;
}

export async function updateWorkflowState({ applicationId, newState, notes = "", patch = {} }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/updateApplicationState`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ type: "workflow", applicationId, newState, notes, patch }) });
  const json = await res.json();
  return json;
}

export async function reviewDocument({ documentId, action, reviewerNotes = "", resubmit = false }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/reviewDocument`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ documentId, action, reviewerNotes, resubmit }) });
  const json = await res.json();
  return json;
}

export async function updatePaymentState({ applicationId, paymentState, details = {} }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/updateApplicationState`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ type: "payment", applicationId, paymentState, details }) });
  const json = await res.json();
  return json;
}

export async function getSignedDocumentUrl({ bucket, path, expires = 300 }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/getSignedDocumentUrl`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ bucket, path, expires }) });
  const json = await res.json();
  return json;
}

export async function requestDocument({ applicationId, documentType, description = "" }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/requestDocument`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ applicationId, documentType, description }) });
  const json = await res.json();
  return json;
}

export async function createNotification({ userId, title, body: msg, level = 'info', applicationId = null, actionUrl = null, notificationType = 'workflow' }) {
  const res = await fetch(`${ADMIN_API_PREFIX}/createNotification`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId, title, body: msg, level, applicationId, actionUrl, notificationType }) });
  const json = await res.json();
  return json;
}
