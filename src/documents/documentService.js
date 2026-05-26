import { supabase } from "../supabaseClient";
import * as workflowMutations from "../workflow/workflowMutationService";

export const DOCUMENT_BUCKET = "trc-private-documents";

export async function fetchDocumentRequirements({ country, applicantType }) {
  try {
    const { data, error } = await supabase
      .from("document_requirements")
      .select("*")
      .eq("country", country)
      .eq("applicant_type", applicantType)
      .order("sort_order", { ascending: true });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export function requirementMatchesAnswers(requirement, answers = {}) {
  const conditions = requirement?.conditions;
  if (!conditions || Object.keys(conditions).length === 0) return true;

  return Object.entries(conditions).every(([key, expected]) => {
    const actual = answers[key];
    return String(actual).toLowerCase() === String(expected).toLowerCase();
  });
}

export async function fetchApplicableDocumentRequirements({ country, applicantType, answers = {} }) {
  const requirements = await fetchDocumentRequirements({ country, applicantType });
  return requirements.filter((requirement) => requirementMatchesAnswers(requirement, answers));
}

export async function fetchApplicationDocuments(applicationId) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("uploaded_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createSignedDocumentUrl(bucket, path, expiresIn = 3600) {
  const res = await workflowMutations.getSignedDocumentUrl({ bucket, path, expires: expiresIn });
  if (!res || !res.success) throw new Error(res?.error || 'failed to get signed url');
  return res.data?.url || null;
}

export async function uploadApplicationDocument({ applicationId, documentType, file, uploadedBy }) {
  const extension = file.name?.split(".").pop() || "bin";
  const safeDocumentType = String(documentType || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const storagePath = `${applicationId}/${safeDocumentType}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      application_id: applicationId,
      document_type: documentType,
      file_url: storagePath,
      uploaded_by: uploadedBy,
      review_status: "uploaded",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentReview({ documentId, reviewStatus, reviewerNotes = "" }) {
  const action = reviewStatus === 'approved' ? 'approve' : reviewStatus === 'rejected' ? 'reject' : reviewStatus;
  const res = await workflowMutations.reviewDocument({ documentId, action, reviewerNotes });
  if (!res || !res.success) throw new Error(res?.error || 'document review failed');
  return true;
}

// ── Document Requests (advisor → client) ─────────────────────────────────────

/**
 * Fetch all document requests for an application.
 * Works for both the advisor (via RLS: requested_by = auth.uid())
 * and the retail client (via RLS: application.user_id = auth.uid()).
 */
export async function fetchDocumentRequests(applicationId) {
  try {
    const { data, error } = await supabase
      .from("document_requests")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[documentService] fetchDocumentRequests error:", error);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Advisor calls this to request a specific document from the client.
 * Calls the requestDocument Netlify function (service-role, sends notification).
 */
export async function createDocumentRequest({ applicationId, documentType, description = "" }) {
  const token = localStorage.getItem("trc_token");
  const res = await fetch("/api/requestDocument", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ applicationId, documentType, description }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Request failed");
  return json.data?.documentRequest || null;
}

/**
 * Mark a document_request as fulfilled.
 * Called by the client after they upload the requested document.
 */
export async function fulfillDocumentRequest(requestId) {
  try {
    const { error } = await supabase
      .from("document_requests")
      .update({ status: "fulfilled", updated_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a document in response to an advisor's request.
 * Uploads the file, inserts the document row, then marks the request fulfilled.
 */
export async function uploadDocumentForRequest({ applicationId, requestId, documentType, file, uploadedBy }) {
  const doc = await uploadApplicationDocument({ applicationId, documentType, file, uploadedBy });
  await fulfillDocumentRequest(requestId);
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────

export function summarizeDocumentReadiness(requirements = [], documents = []) {
  const uploadedTypes = new Set(documents.map((document) => document.document_type));
  const approvedTypes = new Set(documents.filter((document) => document.review_status === "approved").map((document) => document.document_type));

  const required = requirements.filter((requirement) => requirement.required);
  const uploadedCount = required.filter((requirement) => uploadedTypes.has(requirement.document_name)).length;
  const approvedCount = required.filter((requirement) => approvedTypes.has(requirement.document_name)).length;

  return {
    requiredCount: required.length,
    uploadedCount,
    approvedCount,
    missingCount: Math.max(required.length - uploadedCount, 0),
    allUploaded: required.length > 0 && uploadedCount === required.length,
    allApproved: required.length > 0 && approvedCount === required.length,
  };
}
