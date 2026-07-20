import { useEffect, useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import EmptyState from '../../components/EmptyState';
import { supabase } from "../../supabaseClient";
import { RETAIL_THEME } from "../../config/retailTheme";
import { fetchApplicableDocumentRequirements, fetchDocumentRequests, notifyDocumentUploaded } from "../../documents/documentService";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

const DOCUMENT_BUCKET = "trc-private-documents";

// Fallback list used when the document_requirements table has no entries for this applicant
const FALLBACK_DOCS = [
  { key: "passport_front",    label: "Passport — Front Page",      hint: "Photo page with your details (PDF or JPG)" },
  { key: "passport_back",     label: "Passport — Back Page",       hint: "Back page / last page (PDF or JPG)" },
  { key: "emirates_id_front", label: "Emirates ID — Front",        hint: "Front side of the card (PDF or JPG)" },
  { key: "emirates_id_back",  label: "Emirates ID — Back",         hint: "Back side of the card (PDF or JPG)" },
  { key: "residence_visa",    label: "UAE Residence Visa",         hint: "Valid visa page from passport" },
  { key: "bank_statement",    label: "Bank Statement (6 months)",  hint: "Statement showing UAE transactions" },
  { key: "salary_slip",       label: "Salary Slip / Income Proof", hint: "Latest 3 months" },
  { key: "tenancy",           label: "Tenancy Contract / EJARI",   hint: "Current UAE address proof" },
];

/** Map a document_requirements row → the {key, label, hint} shape DocRow expects */
function reqToDoc(req) {
  return {
    key:   req.document_name,
    label: req.document_name,
    hint:  req.description || "",
  };
}

async function fetchDocs(applicationId) {
  if (!applicationId) return [];
  const { data } = await supabase.from("documents")
    .select("*").eq("application_id", applicationId).order("uploaded_at", { ascending: false });
  return data || [];
}

async function uploadDoc(applicationId, userId, docKey, file) {
  const ext  = file.name.split(".").pop() || "bin";
  const path = `${applicationId}/${docKey}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, { cacheControl:"3600", upsert:false });
  if (upErr) throw upErr;
  const { data, error } = await supabase.from("documents")
    .insert({ application_id: applicationId, document_type: docKey, file_url: path, uploaded_by: userId, review_status: "uploaded" })
    .select("*").single();
  if (error) throw error;
  return data;
}

function StatusPill({ status }) {
  const map = {
    uploaded:  ["#FFFBEB","#D97706","Uploaded"],
    approved:  ["#ECFDF5","#059669","Approved"],
    rejected:  ["#FEF2F2","#DC2626","Rejected"],
    pending:   ["#F3F4F6","#6B7280","Pending"],
  };
  const [bg, color, label] = map[status] || map.pending;
  return (
    <span style={{ background:bg, color, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:999, textTransform:"uppercase", letterSpacing:".05em" }}>
      {label}
    </span>
  );
}

function DocRow({ doc, uploaded, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await onUpload(doc.key, file);
    } catch(err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const latestUpload = uploaded.find(u => u.document_type === doc.key);

  return (
    <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 1px 6px rgba(15,37,87,.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:3 }}>{doc.label}</div>
          <div style={{ fontSize:12, color:C.muted }}>{doc.hint}</div>
        </div>
        {latestUpload
          ? <StatusPill status={latestUpload.review_status} />
          : <span style={{ fontSize:11, fontWeight:700, color:"#D97706", background:"#FFFBEB", padding:"3px 10px", borderRadius:999, whiteSpace:"nowrap" }}>Not uploaded</span>
        }
      </div>

      {latestUpload && (
        <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>
          Uploaded {new Date(latestUpload.uploaded_at || latestUpload.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
          {latestUpload.review_status === "rejected" && (
            <span style={{ color:"#DC2626", fontWeight:700, marginLeft:8 }}>— Rejected, please re-upload</span>
          )}
        </div>
      )}

      {error && (
        <div style={{ background:"#FEF2F2", color:"#DC2626", borderRadius:8, padding:"8px 12px", fontSize:12, marginBottom:10, border:"1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ padding:"8px 16px", borderRadius:10, fontSize:12, fontWeight:700, cursor:uploading?"not-allowed":"pointer", border:`1px solid ${C.gold}`, background:latestUpload && latestUpload.review_status !== "rejected" ? C.offWhite : `linear-gradient(135deg,${C.gold},${C.goldDark})`, color:latestUpload && latestUpload.review_status !== "rejected" ? C.navy : "#fff", opacity:uploading?0.6:1 }}>
        {uploading ? "Uploading…" : latestUpload ? "Re-upload" : "Upload File"}
      </button>
    </div>
  );
}

export default function RetailDocumentsPage() {
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const appId       = workspace.application?.id || null;
  const userId      = workspace.session?.user?.id || workspace.profile?.id;
  const appType     = workspace.application?.applicant_type || "retail";

  const [docs,           setDocs]           = useState([]);
  const [requiredDocs,   setRequiredDocs]   = useState([]);
  const [pendingReqCount, setPendingReqCount] = useState(0);
  const [usedFallback,   setUsedFallback]   = useState(false);
  const [loading,        setLoading]        = useState(true);

  const load = async () => {
    if (!appId) { setLoading(false); return; }

    // Fetch uploaded docs, dynamic requirements, and pending advisor requests in parallel
    const [uploadedData, reqs, docRequests] = await Promise.all([
      fetchDocs(appId),
      fetchApplicableDocumentRequirements({ applicantType: appType }),
      fetchDocumentRequests(appId),
    ]);

    setDocs(uploadedData);
    const hasReqs = (reqs || []).length > 0;
    setRequiredDocs(hasReqs ? reqs.map(reqToDoc) : FALLBACK_DOCS);
    setUsedFallback(!hasReqs);
    setPendingReqCount((docRequests || []).filter(r => r.status === "pending").length);
    setLoading(false);
  };

  useEffect(() => { load(); }, [appId]); // eslint-disable-line

  const handleUpload = async (docKey, file) => {
    if (!appId || !userId) throw new Error("No active application found.");
    const newDoc = await uploadDoc(appId, userId, docKey, file);
    setDocs(prev => [newDoc, ...prev.filter(d => d.document_type !== docKey)]);
    // Notify the advisor and nudge the case into documents_under_review.
    // Best-effort — the upload already succeeded, so this never blocks the UI.
    notifyDocumentUploaded({ applicationId: appId, documentType: docKey });
  };

  const uploaded = docs.filter(d => d.review_status !== "deleted");
  const approvedCount = requiredDocs.filter(d => uploaded.find(u => u.document_type === d.key && u.review_status === "approved")).length;

  return (
    <div style={{ display:"grid", gap:20, fontFamily:SANS }}>
      {/* Header */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:"22px 24px", boxShadow:"0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:".12em", marginBottom:8 }}>Documents</div>
        <h2 style={{ fontFamily:SERIF, fontSize:26, fontWeight:700, color:C.navy, marginBottom:8 }}>Upload Required Documents</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.8, maxWidth:600 }}>
          Upload the required compliance documents for your TRC application. All files are stored securely and reviewed by our team.
        </p>
        {appId && (
          <div style={{ marginTop:14, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>
              {approvedCount} / {requiredDocs.length} approved
            </div>
            <div style={{ flex:1, minWidth:120, height:8, background:C.offWhite, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${requiredDocs.length > 0 ? (approvedCount/requiredDocs.length)*100 : 0}%`, background:`linear-gradient(90deg,${C.gold},${C.goldDark})`, borderRadius:99, transition:"width .4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Advisor request banner — shown when there are pending requests */}
      {pendingReqCount > 0 && (
        <div
          onClick={() => navigate("/retail/requested")}
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(217,119,6,.08)" }}
        >
          <div style={{ fontSize: 28, flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#D97706", marginBottom: 2 }}>
              {pendingReqCount} document{pendingReqCount !== 1 ? "s" : ""} requested by your advisor
            </div>
            <div style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
              Your advisor has asked for specific files. Upload them to keep your application moving.
            </div>
          </div>
          <div style={{ background: "#D97706", color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
            View Requests →
          </div>
        </div>
      )}

      {/* Content */}
      {!appId ? (
        <div style={{ padding: 20 }}>
          <EmptyState
            title="No active application"
            message="Documents become available once your application is created. Start your eligibility check to continue." 
            cta={{ label: 'Start eligibility', onClick: () => window.location.href = '/retail/eligibility' }}
          />
        </div>
      ) : loading ? (
        <div style={{ textAlign:"center", padding:40 }}>
          <div style={{ display: 'grid', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 280 }}>
              <EmptyState title="Loading documents" message="Fetching document requirements and uploaded files…" />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {usedFallback && (
            <div style={{ marginBottom: 12 }}>
              <EmptyState
                title="No specific document requirements found"
                message="We've applied a standard set of required documents. If your case needs special documents, contact support for guidance."
                cta={{ label: 'Contact support', onClick: () => window.location.href = 'mailto:support@gettrc.com' }}
              />
            </div>
          )}

          {uploaded.length === 0 && (
            <div style={{ marginBottom: 12 }}>
              <EmptyState
                title="No documents uploaded yet"
                message="Start by uploading your passport (front and back). Use the upload buttons for each required document below."
                cta={{ label: 'Jump to upload', onClick: () => document.getElementById('documents-grid')?.scrollIntoView({ behavior: 'smooth' }) }}
              />
            </div>
          )}

          <div id="documents-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:14 }}>
            {requiredDocs.map(doc => (
              <DocRow key={doc.key} doc={doc} uploaded={uploaded} onUpload={handleUpload} />
            ))}
          </div>

          {/* Rejected documents quick panel */}
          <div style={{ marginTop: 14 }}>
            {uploaded.filter(u => u.review_status === 'rejected').length === 0 ? (
              <div style={{ padding: 10 }}>
                <EmptyState title="No rejected documents" message="No uploaded documents have been rejected. If a document is later rejected, you'll see re-upload instructions here." />
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '8px 0', fontSize: 15, color: C.navy }}>Rejected documents</h4>
                {uploaded.filter(u => u.review_status === 'rejected').map(d => (
                  <div key={d.id} style={{ background: '#FEF2F2', borderRadius: 10, padding: 10, border: `1px solid #FECACA`, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#DC2626' }}>{d.document_type}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>Rejected — please re-upload using the Re-upload action on the document row.</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{ background:"#EFF6FF", borderRadius:12, padding:"14px 18px", border:"1px solid #BFDBFE", fontSize:13, color:"#1D4ED8", lineHeight:1.7 }}>
        <strong>Note:</strong> Accepted formats are PDF, JPG, and PNG. Max file size is 10 MB per document. Your advisor will be notified once documents are uploaded.
      </div>
    </div>
  );
}
