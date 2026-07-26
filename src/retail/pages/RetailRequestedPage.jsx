import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  fetchDocumentRequests,
  uploadDocumentForRequest,
} from "../../documents/documentService";
import SkeletonCard from '../../components/SkeletonCard';
import { RETAIL_THEME } from "../../config/retailTheme";
import DocumentTemplateButton from "../../documents/DocumentTemplateButton";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

const STATUS_META = {
  pending:   { label: "Upload Needed",  bg: "#FFFBEB", color: "#D97706", icon: "⏳" },
  fulfilled: { label: "Uploaded ✓",     bg: "#ECFDF5", color: "#059669", icon: "✅" },
  cancelled: { label: "Cancelled",      bg: "#F3F4F6", color: "#6B7280", icon: "—"  },
};

function StatusPill({ status }) {
  const m = STATUS_META[status] || { label: status, bg: "#F3F4F6", color: "#6B7280", icon: "" };
  return (
    <span style={{
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
      textTransform: "uppercase", letterSpacing: ".04em",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function LockedState() {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: "var(--c-text)", marginBottom: 10 }}>Workspace Locked</h2>
      <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>
        Document requests from your advisor will appear here once your workspace is unlocked after payment confirmation.
      </p>
    </div>
  );
}

export default function RetailRequestedPage() {
  const { workspace, refresh } = useOutletContext();
  const userId = workspace?.profile?.id || workspace?.session?.user?.id;
  const appId  = workspace?.application?.id;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(""); // request id being uploaded
  const [msg, setMsg]           = useState({ text: "", ok: true });
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!appId) return;
    const data = await fetchDocumentRequests(appId);
    setRequests(data);
  }, [appId]);

  useEffect(() => {
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    load().finally(() => setLoading(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(load, 10_000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const handleUpload = async (req, file) => {
    if (!file || !appId || !userId) return;
    setUploading(req.id);
    setMsg({ text: "", ok: true });
    try {
      await uploadDocumentForRequest({
        applicationId: appId,
        requestId:     req.id,
        documentType:  req.document_type,
        file,
        uploadedBy:    userId,
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "fulfilled" } : r));
      setMsg({ text: `"${req.document_type}" uploaded — your advisor will review it shortly.`, ok: true });
      await refresh();
    } catch (e) {
      setMsg({ text: e.message || "Upload failed. Please try again.", ok: false });
    } finally {
      setUploading("");
    }
  };

  if (!appId) return <LockedState />;

  const pending   = requests.filter(r => r.status === "pending");
  const fulfilled = requests.filter(r => r.status === "fulfilled");
  const cancelled = requests.filter(r => r.status === "cancelled");

  const INPUT_STYLE = {
    width: "100%", padding: "14px 16px", borderRadius: RETAIL_THEME.radius.sm,
    border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14,
    outline: "none", color: "var(--c-text)", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gap: 18, fontFamily: SANS }}>

      {/* Header card */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Document Requests</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 32, color: "var(--c-text)", marginBottom: 10 }}>Requested by Your Advisor</h2>
            <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 680 }}>
              Your advisor has requested specific documents to progress your TRC application. Upload each one to avoid delays.
            </p>
          </div>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Pending",   count: pending.length,   bg: "#FFFBEB", color: "#D97706" },
              { label: "Uploaded",  count: fulfilled.length, bg: "#ECFDF5", color: "#059669" },
            ].map(({ label, count, bg, color }) => (
              <div key={label} style={{ background: bg, borderRadius: RETAIL_THEME.radius.sm, padding: "10px 18px", textAlign: "center", minWidth: 72 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      {msg.text && (
        <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${msg.ok ? "#A7F3D0" : "#FECACA"}`, color: msg.ok ? "#059669" : "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>
          {msg.text}
        </div>
      )}

      {loading ? (
            <div style={{ padding: 20 }}>
              <SkeletonCard height={120} />
            </div>
          ) : requests.length === 0 ? (
        <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: "var(--c-text)", marginBottom: 8 }}>No requests yet</div>
          <div style={{ color: "var(--c-text-muted)", fontSize: 14, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
            Your advisor hasn't requested any specific documents yet. They'll appear here when needed.
          </div>
        </div>
      ) : (
        <>
          {/* ── Pending requests ── */}
          {pending.length > 0 && (
            <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
              <div style={{ padding: "14px 22px", background: "#FFFBEB", borderBottom: `1px solid #FDE68A`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#D97706" }}>
                  {pending.length} document{pending.length !== 1 ? "s" : ""} need{pending.length === 1 ? "s" : ""} to be uploaded
                </span>
              </div>
              {pending.map((req, i) => {
                const isUploading = uploading === req.id;
                return (
                  <div key={req.id} style={{ padding: "18px 22px", borderBottom: i < pending.length - 1 ? `1px solid ${"var(--c-border)"}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)" }}>{req.document_type}</div>
                          <DocumentTemplateButton documentName={req.document_type} size={24} />
                          <StatusPill status={req.status} />
                        </div>
                        {req.description && (
                          <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.65, marginBottom: 6 }}>{req.description}</div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--c-text-muted)" }}>
                          Requested {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <label style={{
                        background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                        color: "#fff", borderRadius: RETAIL_THEME.radius.sm,
                        padding: "11px 20px", fontSize: 13, fontWeight: 800,
                        cursor: isUploading ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap", display: "inline-block",
                        opacity: isUploading ? 0.7 : 1, flexShrink: 0,
                      }}>
                        {isUploading ? "Uploading…" : "📎 Upload File"}
                        <input
                          type="file"
                          onChange={e => handleUpload(req, e.target.files?.[0])}
                          style={{ display: "none" }}
                          disabled={isUploading}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Fulfilled requests ── */}
          {fulfilled.length > 0 && (
            <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
              <div style={{ padding: "14px 22px", background: "#ECFDF5", borderBottom: `1px solid #A7F3D0`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>
                  {fulfilled.length} document{fulfilled.length !== 1 ? "s" : ""} uploaded
                </span>
              </div>
              {fulfilled.map((req, i) => (
                <div key={req.id} style={{ padding: "16px 22px", borderBottom: i < fulfilled.length - 1 ? `1px solid ${"var(--c-border)"}` : "none", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{req.document_type}</span>
                      <StatusPill status={req.status} />
                    </div>
                    {req.description && <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>{req.description}</div>}
                    <div style={{ fontSize: 11, color: "var(--c-text-muted)", marginTop: 4 }}>
                      Requested {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Cancelled requests ── */}
          {cancelled.length > 0 && (
            <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, overflow: "hidden", opacity: 0.7 }}>
              <div style={{ padding: "12px 22px", borderBottom: `1px solid ${"var(--c-border)"}`, fontSize: 12, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Cancelled requests ({cancelled.length})
              </div>
              {cancelled.map((req, i) => (
                <div key={req.id} style={{ padding: "14px 22px", borderBottom: i < cancelled.length - 1 ? `1px solid ${"var(--c-border)"}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--c-text-muted)", flex: 1 }}>{req.document_type}</div>
                  <StatusPill status={req.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info box */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>About Document Requests</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            ["When does a request appear?", "Your advisor sends requests directly from their dashboard. This page updates automatically every 10 seconds."],
            ["What file formats are accepted?", "PDF, JPG, PNG, DOC, and DOCX. Maximum 50 MB per file."],
            ["What happens after I upload?", "Your advisor is notified and will review the document. You can still re-upload if asked."],
          ].map(([q, a]) => (
            <div key={q} style={{ background: "var(--c-bg)", borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${"var(--c-border)"}`, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 4 }}>{q}</div>
              <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
