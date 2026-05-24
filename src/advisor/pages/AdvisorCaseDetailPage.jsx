import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import {
  fetchApplicationDocuments,
  fetchDocumentRequests,
  fetchApplicableDocumentRequirements,
  createDocumentRequest,
  createSignedDocumentUrl,
  DOCUMENT_BUCKET,
} from "../../documents/documentService";
import { reviewDocument } from "../../adminApi";

const C = {
  navy: "#0F2557", navyLight: "#1A3570", gold: "#C9A84C", goldDark: "#A07C2E",
  white: "#fff", offWhite: "#F7F8FC", offWhite2: "#EEF2F8",
  muted: "#6B7A99", border: "#E2E8F0",
  success: "#059669", successBg: "#ECFDF5",
  warn: "#D97706", warnBg: "#FFFBEB",
  error: "#DC2626", errorBg: "#FEF2F2",
  purple: "#5B21B6", purpleBg: "#F5F3FF",
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

// ── helpers ──────────────────────────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{value || "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    uploaded:             [C.muted,    "#F3F4F6", "Uploaded"],
    under_review:         [C.purple,   C.purpleBg, "Under Review"],
    approved:             [C.success,  C.successBg, "Approved ✓"],
    rejected:             [C.error,    C.errorBg,   "Rejected"],
    needs_resubmission:   [C.warn,     C.warnBg,    "Needs Resubmission"],
    pending:              [C.warn,     C.warnBg,    "Pending"],
    fulfilled:            [C.success,  C.successBg, "Fulfilled ✓"],
    cancelled:            [C.muted,    "#F3F4F6",   "Cancelled"],
  };
  const [color, bg, label] = map[status] || [C.muted, "#F3F4F6", status || "unknown"];
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>
      {label}
    </span>
  );
}

function WorkflowBadge({ state }) {
  const map = {
    pending_review:          ["Pending Review",   "#EFF6FF", "#1D6FB8"],
    advisor_assigned:        ["Advisor Assigned", C.successBg, C.success],
    documents_pending:       ["Docs Pending",     C.warnBg, C.warn],
    documents_under_review:  ["Docs Under Review",C.purpleBg, C.purple],
    processing:              ["Processing",       C.purpleBg, C.purple],
    submitted_to_authority:  ["Submitted",        C.successBg, C.success],
    completed:               ["Completed ✓",      C.successBg, C.success],
    rejected:                ["Rejected",         C.errorBg, C.error],
    payment_pending:         ["Payment Pending",  C.warnBg, C.warn],
    payment_completed:       ["Payment Done",     C.successBg, C.success],
  };
  const [label, bg, color] = map[state] || ["—", "#F3F4F6", C.muted];
  return <span style={{ background: bg, color, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</span>;
}

// ── tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ caseData }) {
  const client = caseData.profiles || {};
  const elig   = caseData.eligibility_requests || {};
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
      {/* Client info */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Client Information</div>
        <Field label="Full Name"   value={client.full_name} />
        <Field label="Email"       value={client.email} />
        <Field label="Phone"       value={client.phone} />
        <Field label="Nationality" value={client.nationality} />
        <Field label="Visa Type"   value={client.visa_type} />
      </div>

      {/* Eligibility details */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Eligibility Details</div>
        {caseData.applicant_type === "corporate" ? (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, fontStyle: "italic" }}>
            Corporate eligibility is assessed separately by the compliance team and is not shown here. Review the company's corporate eligibility request through the admin dashboard.
          </div>
        ) : Object.keys(elig).length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            No eligibility record linked to this application yet.
          </div>
        ) : (
          <>
            <Field label="Current Country" value={elig.current_country} />
            <Field label="UAE Visa"         value={elig.uae_visa} />
            <Field label="Emirates ID"      value={elig.emirates_id} />
            <Field label="Days in UAE"      value={elig.days_in_uae} />
            <Field label="Occupation"       value={elig.occupation} />
            <Field label="Income Source"    value={elig.income_source} />
            <Field label="Purpose"          value={elig.purpose} />
            <Field label="Urgency"          value={elig.urgency} />
          </>
        )}
      </div>

      {/* Application details */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Application Details</div>
        <Field label="Application ID"   value={caseData.id} />
        <Field label="Applicant Type"   value={caseData.applicant_type} />
        <Field label="Country"          value={caseData.country} />
        <Field label="Payment State"    value={caseData.payment_state} />
        <Field label="Advisor Assigned" value={caseData.advisor_assigned_at ? new Date(caseData.advisor_assigned_at).toLocaleString() : "—"} />
        <Field label="Started At"       value={caseData.started_at ? new Date(caseData.started_at).toLocaleDateString() : "—"} />
      </div>
    </div>
  );
}

// ── sub-component: Request Document Modal ─────────────────────────────────────

function RequestDocumentModal({ applicationId, onClose, onCreated }) {
  const [docType, setDocType]       = useState("");
  const [description, setDesc]      = useState("");
  const [custom, setCustom]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState("");

  const COMMON_TYPES = [
    "Passport (copy)",
    "UAE Residence Visa",
    "Emirates ID",
    "Bank Statement (6 months)",
    "Tenancy Contract / Title Deed",
    "Salary Certificate / Employment Letter",
    "Tax Identification Number (foreign)",
    "Utility Bills",
    "Trade License (if applicable)",
    "Power of Attorney (if applicable)",
  ];

  const submit = async () => {
    const type = custom ? docType : docType;
    if (!type.trim()) { setErr("Please select or enter a document type."); return; }
    setLoading(true); setErr("");
    try {
      const created = await createDocumentRequest({ applicationId, documentType: type.trim(), description: description.trim() });
      onCreated(created);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,37,87,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 18, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 12px 48px rgba(15,37,87,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.navy }}>Request Document</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Document Type</div>
          {!custom ? (
            <>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, color: C.navy, outline: "none" }}
              >
                <option value="">— Select a type —</option>
                {COMMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => setCustom(true)} style={{ background: "none", border: "none", color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 6, padding: 0, fontFamily: SANS }}>
                + Enter custom type
              </button>
            </>
          ) : (
            <>
              <input
                value={docType} onChange={e => setDocType(e.target.value)}
                placeholder="e.g. Certificate of Domicile"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, color: C.navy, outline: "none", boxSizing: "border-box" }}
              />
              <button onClick={() => { setCustom(false); setDocType(""); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", marginTop: 4, padding: 0, fontFamily: SANS }}>
                ← Choose from list
              </button>
            </>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Description / Instructions (optional)</div>
          <textarea
            value={description} onChange={e => setDesc(e.target.value)}
            placeholder="Add context for the client — e.g. 'Certified copy required, less than 3 months old'"
            rows={3}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 13, color: C.navy, outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        {err && <div style={{ color: C.error, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.offWhite, color: C.navy, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading || !docType.trim()} style={{ padding: "10px 20px", borderRadius: 10, background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", fontWeight: 700, cursor: loading || !docType.trim() ? "not-allowed" : "pointer", fontFamily: SANS, opacity: loading || !docType.trim() ? 0.7 : 1 }}>
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── sub-component: Review Comment Modal ──────────────────────────────────────

function ReviewModal({ doc, action, onClose, onDone }) {
  const [notes, setNotes]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [err, setErr]       = useState("");

  const isApprove = action === "approve";

  const submit = async () => {
    setLoad(true); setErr("");
    try {
      const res = await reviewDocument({ documentId: doc.id, action, reviewerNotes: notes.trim() });
      if (res?.error) throw new Error(res.error);
      onDone(doc.id, isApprove ? "approved" : "rejected", notes.trim());
      onClose();
    } catch (e) {
      setErr(e.message || "Action failed.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,37,87,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 18, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 12px 48px rgba(15,37,87,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: isApprove ? C.success : C.error }}>
            {isApprove ? "✓ Approve Document" : "✗ Reject Document"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
        </div>
        <div style={{ fontSize: 14, color: C.navy, marginBottom: 14 }}>
          <strong>{doc.document_type}</strong>
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder={isApprove ? "Optional: any notes for the client" : "Required: explain why this document was rejected"}
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${isApprove ? C.border : C.error}`, fontFamily: SANS, fontSize: 13, color: C.navy, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }}
        />
        {err && <div style={{ color: C.error, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.offWhite, color: C.navy, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
          <button onClick={submit} disabled={loading || (!isApprove && !notes.trim())} style={{ padding: "10px 20px", borderRadius: 10, background: isApprove ? C.success : C.error, color: "#fff", border: "none", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: SANS, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── tab: Documents ────────────────────────────────────────────────────────────

function DocumentsTab({ caseData, advisorUserId }) {
  const [documents, setDocuments]         = useState([]);
  const [requests, setRequests]           = useState([]);
  const [requirements, setRequirements]   = useState([]);
  const [loadingDocs, setLoadingDocs]     = useState(true);
  const [showRequest, setShowRequest]     = useState(false);
  const [reviewTarget, setReviewTarget]   = useState(null); // { doc, action }
  const [msg, setMsg]                     = useState("");
  const [quickRequesting, setQuickReq]   = useState(""); // doc_name being quick-requested
  const mountedRef                        = useRef(true);

  const answers = useMemo(() => {
    const elig = caseData?.eligibility_requests || {};
    return {
      occupation:    elig.occupation,
      business_owner: String(elig.occupation || "").toLowerCase().includes("business"),
    };
  }, [caseData?.eligibility_requests]);

  const load = useCallback(async () => {
    if (!caseData?.id) return;
    setLoadingDocs(true);
    const country = caseData.country || "AE";
    const appType = caseData.applicant_type || "retail";
    const [docs, reqs, reqs2] = await Promise.all([
      fetchApplicationDocuments(caseData.id),
      fetchDocumentRequests(caseData.id),
      fetchApplicableDocumentRequirements({ country, applicantType: appType, answers }),
    ]);
    if (mountedRef.current) {
      setDocuments(docs);
      setRequests(reqs);
      setRequirements(reqs2);
      setLoadingDocs(false);
    }
  }, [caseData?.id, answers]); // eslint-disable-line

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const openSignedUrl = async (doc) => {
    try {
      const url = await createSignedDocumentUrl(DOCUMENT_BUCKET, doc.file_url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setMsg("Could not load document: " + e.message);
    }
  };

  const handleReviewDone = (docId, newStatus, reviewerNotes) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, review_status: newStatus, reviewer_notes: reviewerNotes } : d));
    setMsg(`Document ${newStatus} successfully.`);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleRequestCreated = (req) => {
    if (req) setRequests(prev => [req, ...prev]);
    setMsg("Document request sent to client.");
    setTimeout(() => setMsg(""), 4000);
  };

  // Quick-request a standard required document with one click
  const handleQuickRequest = async (docName, docDescription) => {
    setQuickReq(docName);
    try {
      const created = await createDocumentRequest({
        applicationId: caseData.id,
        documentType:  docName,
        description:   docDescription || "",
      });
      if (created) setRequests(prev => [created, ...prev]);
      setMsg(`Request sent to client for "${docName}".`);
      setTimeout(() => setMsg(""), 5000);
    } catch (e) {
      setMsg(`Failed to request "${docName}": ${e.message}`);
      setTimeout(() => setMsg(""), 5000);
    } finally {
      setQuickReq("");
    }
  };

  const pendingRequests  = requests.filter(r => r.status === "pending");
  const fulfilledReqs    = requests.filter(r => r.status !== "pending");
  // Lookup sets for O(1) checks
  const uploadedTypes   = new Set(documents.map(d => d.document_type));
  const requestedTypes  = new Set(requests.map(r => r.document_type));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {msg && (
        <div style={{ background: msg.includes("Failed") ? C.errorBg : C.successBg, border: `1px solid ${msg.includes("Failed") ? C.error : C.success}`, color: msg.includes("Failed") ? C.error : C.success, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>
          {msg}
        </div>
      )}

      {/* ── Required Documents (standard checklist with upload status + quick request) ── */}
      {requirements.length > 0 && (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, background: C.offWhite, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>Required Documents</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {uploadedTypes.size} of {requirements.length} uploaded by client
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                ✓ {requirements.filter(r => uploadedTypes.has(r.document_name)).length} uploaded
              </div>
              <div style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                ⚠ {requirements.filter(r => !uploadedTypes.has(r.document_name)).length} missing
              </div>
            </div>
          </div>

          {loadingDocs ? (
            <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Loading…</div>
          ) : (
            requirements.map((req, i) => {
              const isUploaded  = uploadedTypes.has(req.document_name);
              const isRequested = requestedTypes.has(req.document_name);
              const isQuick     = quickRequesting === req.document_name;
              const relatedDoc  = documents.find(d => d.document_type === req.document_name);
              return (
                <div key={req.id || req.document_name}
                  style={{ padding: "14px 22px", borderBottom: i < requirements.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Status dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: isUploaded ? "#059669" : "#DC2626" }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{req.document_name}</span>
                      {isUploaded && (
                        <span style={{ background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>
                          {relatedDoc?.review_status === "approved" ? "Approved ✓" : "Uploaded"}
                        </span>
                      )}
                      {isRequested && !isUploaded && (
                        <span style={{ background: "#FFFBEB", color: "#D97706", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>Requested</span>
                      )}
                    </div>
                    {req.description && (
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{req.description}</div>
                    )}
                  </div>

                  {/* Quick-request button — only if not uploaded and not already pending request */}
                  {!isUploaded && !isRequested && (
                    <button
                      onClick={() => handleQuickRequest(req.document_name, req.description)}
                      disabled={isQuick}
                      style={{ background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: isQuick ? "not-allowed" : "pointer", fontFamily: SANS, flexShrink: 0, opacity: isQuick ? 0.6 : 1, whiteSpace: "nowrap" }}
                    >
                      {isQuick ? "Sending…" : "📤 Request"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Custom Document Requests (advisor-initiated) ── */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.offWhite }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>Additional Document Requests</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{pendingRequests.length} pending · {fulfilledReqs.length} fulfilled</div>
          </div>
          <button
            onClick={() => setShowRequest(true)}
            style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 6 }}
          >
            + Custom Request
          </button>
        </div>

        {loadingDocs ? (
          <div style={{ padding: 28, textAlign: "center", color: C.muted, fontSize: 13 }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: C.muted, fontSize: 13 }}>
            No document requests yet. Click <strong>"Request Document"</strong> to ask the client for a specific file.
          </div>
        ) : (
          <div>
            {requests.map(req => (
              <div key={req.id} style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{req.document_type}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  {req.description && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{req.description}</div>}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Requested {new Date(req.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Uploaded Documents ── */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, background: C.offWhite }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>Client Uploaded Documents</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {documents.filter(d => d.review_status === "approved").length} approved · {documents.filter(d => d.review_status === "rejected").length} rejected · {documents.filter(d => !["approved","rejected"].includes(d.review_status)).length} awaiting review
          </div>
        </div>

        {loadingDocs ? (
          <div style={{ padding: 20 }}>
            <SkeletonCard height={120} />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No documents uploaded yet"
              message="The client hasn't uploaded any documents. Use 'Request Document' to ask for specific files or follow up with the client." 
            />
          </div>
        ) : (
          <div>
            {documents.map(doc => (
              <div key={doc.id} style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: doc.review_status === "approved" ? C.successBg : doc.review_status === "rejected" ? C.errorBg : C.offWhite2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {doc.review_status === "approved" ? "✅" : doc.review_status === "rejected" ? "❌" : "📄"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{doc.document_type}</span>
                      <StatusBadge status={doc.review_status || "uploaded"} />
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      Uploaded {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString()}
                    </div>
                    {doc.reviewer_notes && (
                      <div style={{ marginTop: 6, fontSize: 12, color: doc.review_status === "approved" ? C.success : C.warn, fontWeight: 600, background: doc.review_status === "approved" ? C.successBg : C.warnBg, borderRadius: 8, padding: "6px 10px" }}>
                        💬 {doc.reviewer_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                    {doc.file_url && (
                      <button
                        onClick={() => openSignedUrl(doc)}
                        style={{ padding: "7px 12px", borderRadius: 8, background: C.offWhite2, color: C.navy, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
                      >
                        👁 View
                      </button>
                    )}
                    {doc.review_status !== "approved" && (
                      <button
                        onClick={() => setReviewTarget({ doc, action: "approve" })}
                        style={{ padding: "7px 12px", borderRadius: 8, background: C.successBg, color: C.success, border: `1px solid ${C.success}20`, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
                      >
                        ✓ Approve
                      </button>
                    )}
                    {doc.review_status !== "rejected" && (
                      <button
                        onClick={() => setReviewTarget({ doc, action: "reject" })}
                        style={{ padding: "7px 12px", borderRadius: 8, background: C.errorBg, color: C.error, border: `1px solid ${C.error}20`, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
                      >
                        ✗ Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showRequest && (
        <RequestDocumentModal
          applicationId={caseData.id}
          onClose={() => setShowRequest(false)}
          onCreated={handleRequestCreated}
        />
      )}
      {reviewTarget && (
        <ReviewModal
          doc={reviewTarget.doc}
          action={reviewTarget.action}
          onClose={() => setReviewTarget(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
}

// ── Messages tab ─────────────────────────────────────────────────────────────

function MessagesTab({ caseData, advisorUserId }) {
  const appId    = caseData?.id;
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);

  const load = useCallback(async () => {
    if (!appId) return;
    const { data } = await supabase
      .from("messages").select("*")
      .eq("application_id", appId).order("created_at", { ascending: true });
    setMessages(data || []);
    // mark client messages as read
    await supabase.from("messages").update({ is_read: true })
      .eq("application_id", appId).neq("sender_id", advisorUserId).eq("is_read", false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [appId, advisorUserId]);

  useEffect(() => {
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    load().finally(() => setLoading(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(load, 6_000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const handleSend = async () => {
    if (!text.trim() || !appId || !advisorUserId) return;
    setSending(true);
    try {
      const { data: msg, error } = await supabase
        .from("messages")
        .insert({ application_id: appId, sender_id: advisorUserId, sender_role: "advisor", message: text.trim() })
        .select("*").maybeSingle();
      if (error) throw error;
      if (msg) setMessages(prev => [...prev, msg]);
      setText("");
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); inputRef.current?.focus(); }, 50);
    } catch(e) { console.error("send failed", e); }
    finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const clientName = caseData?.profiles?.full_name || caseData?.profiles?.email || "Client";

  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(15,37,87,.05)", overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400 }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.offWhite }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, flexShrink: 0 }}>👤</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{clientName}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Retail Client · updates every 6s</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", background: C.offWhite }}>
        {loading ? (
          <div style={{ padding: 12 }}>
            <SkeletonCard height={160} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ paddingTop: 12 }}>
            <EmptyState
              title="No messages yet"
              message="Send the first message to start the conversation with the client."
              cta={{ label: 'Send a message', onClick: () => { inputRef.current?.focus(); } }}
            />
          </div>
        ) : messages.map(m => {
          const isOwn = m.sender_id === advisorUserId;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isOwn ? `linear-gradient(135deg,${C.navy},${C.navyLight})` : C.white, color: isOwn ? "#fff" : C.navy, fontSize: 14, lineHeight: 1.55, boxShadow: "0 1px 6px rgba(0,0,0,.08)", border: isOwn ? "none" : `1px solid ${C.border}` }}>
                <div>{m.message}</div>
                <div style={{ fontSize: 10, color: isOwn ? "rgba(255,255,255,.6)" : C.muted, marginTop: 5, textAlign: "right" }}>
                  {isOwn ? "You" : clientName} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-end", background: C.white }}>
        <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Message the client… (Enter to send)"
          rows={2}
          style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, resize: "none", outline: "none", color: C.navy, lineHeight: 1.5 }} />
        <button onClick={handleSend} disabled={sending || !text.trim()}
          style={{ padding: "10px 18px", borderRadius: 10, background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, fontFamily: SANS, flexShrink: 0, cursor: sending || !text.trim() ? "not-allowed" : "pointer", opacity: sending || !text.trim() ? 0.5 : 1 }}>
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",   label: "Overview",   icon: "📋" },
  { key: "documents",  label: "Documents",  icon: "📁" },
  { key: "messages",   label: "Messages",   icon: "💬" },
];

export default function AdvisorCaseDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const [caseData, setCaseData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  // Honour ?tab=messages deep-link (e.g. from "Chat" button in cases list)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [unreadCount, setUnreadCount] = useState(0);
  const advisorUserId = workspace.profile?.id;

  useEffect(() => {
    // Fast-path: look in workspace cache first
    const found = workspace.cases?.find(c => c.id === id);
    if (found) { setCaseData(found); setLoading(false); return; }

    // Fallback: direct DB fetch (uses the advisor's session + RLS)
    supabase
      .from("applications")
      .select("*, eligibility_requests(*), profiles!user_id(id,full_name,email,phone,nationality,visa_type)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => { setCaseData(data); setLoading(false); });
  }, [id, workspace.cases]);

  // Fetch unread message count (from client to this advisor)
  useEffect(() => {
    if (!id || !advisorUserId) return;
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("application_id", id)
      .neq("sender_id", advisorUserId)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));

    // Poll unread count every 10s
    const t = setInterval(() => {
      if (activeTab === "messages") { setUnreadCount(0); return; }
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("application_id", id)
        .neq("sender_id", advisorUserId)
        .eq("is_read", false)
        .then(({ count }) => setUnreadCount(count || 0));
    }, 10_000);
    return () => clearInterval(t);
  }, [id, advisorUserId, activeTab]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: C.muted, fontFamily: SANS }}>Loading case…</div>
  );
  if (!caseData) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: SANS }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
      <div style={{ color: C.muted }}>Case not found or not assigned to you.</div>
      <button onClick={() => navigate("/advisor/cases")} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: C.navy, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>← Back to Cases</button>
    </div>
  );

  const client = caseData.profiles || {};

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/advisor/cases")} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, color: C.navy }}>
          ← Cases
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.navy }}>
            {client.full_name || client.email || caseData.id.slice(0, 8)}
          </h2>
          <div style={{ fontSize: 12, color: C.muted }}>
            {caseData.country || "UAE"} · {caseData.application_type || "TRC"} · ID: {caseData.id.slice(0, 8)}
          </div>
        </div>
        <WorkflowBadge state={caseData.workflow_state} />
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("messages")}
          style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 8 }}>
          💬 Chat with Client
          {unreadCount > 0 && (
            <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate(`/advisor/updates?app=${caseData.id}`)}
          style={{ background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
          📢 Send Update to Admin
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: 6, boxShadow: "0 2px 12px rgba(15,37,87,.05)", width: "fit-content" }}>
        {TABS.map(tab => {
          const showBadge = tab.key === "messages" && unreadCount > 0 && activeTab !== "messages";
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === "messages") setUnreadCount(0); }}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "none", fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: activeTab === tab.key ? C.navy : "transparent",
                color: activeTab === tab.key ? "#fff" : C.muted,
                transition: "all .15s",
                display: "flex", alignItems: "center", gap: 6,
                position: "relative",
              }}
            >
              {tab.icon} {tab.label}
              {showBadge && (
                <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview"  && <OverviewTab  caseData={caseData} />}
      {activeTab === "documents" && <DocumentsTab caseData={caseData} advisorUserId={advisorUserId} />}
      {activeTab === "messages"  && <MessagesTab  caseData={caseData} advisorUserId={advisorUserId} />}
    </div>
  );
}
