import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";
import { CORPORATE_FEATURES, isCorporateWorkspaceUnlocked } from "../routes/corporateWorkspaceRoutes";
import CorporateWorkspaceLockedModal from "../modals/WorkspaceLockedModal";
import { supabase } from "../../supabaseClient";
import ApplicationStatusStrip from "../../components/ApplicationStatusStrip";
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { generateRequiredActions } from "../../workflow/generateRequiredActions";
import {
  fetchDocumentRequests,
  uploadDocumentForRequest,
} from "../../documents/documentService";
import DocumentTemplateButton from "../../documents/DocumentTemplateButton";

const C = RETAIL_THEME.colors;

function Card({ title, subtitle, children, highlight = false }) {
  return (
    <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${highlight ? C.gold : C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{title}</div>
      {subtitle && <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function KeyValueGrid({ rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, lineHeight: 1.6 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export function CorporateDashboardPage() {
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const unlocked = isCorporateWorkspaceUnlocked(workspace.stage);

  const STAGE_LABEL = {
    pending_review: "Under review", eligible: "Eligible",
    needs_more_info: "More info needed", payment_pending: "Awaiting payment",
    payment_completed: "Payment confirmed", documents_pending: "Documents required",
    documents_under_review: "Documents under review", advisor_assigned: "With your advisor",
    processing: "In processing", submitted_to_authority: "Submitted to UAE FTA",
    completed: "Completed", rejected: "Not approved",
  };
  const quickStats = useMemo(() => [
    ["Current Stage", STAGE_LABEL[workspace.stage] || String(workspace.stage || "Under review").replaceAll("_", " ")],
    ["Status", STAGE_LABEL[workspace.request?.status] || STAGE_LABEL[workspace.stage] || "Under review"],
    ["Company", workspace.profile?.company_name || "Corporate client"],
  ], [workspace]);
  const application = workspace.application || workspace.request || workspace;
  const tasks = generateRequiredActions(application, workspace.applicationDocuments || []);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Dashboard overview" subtitle="Executive workspace summary for corporate review and compliance operations." highlight={!unlocked}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/corporate/eligibility-status")} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>
            View Eligibility Status
          </button>
          <button onClick={() => navigate("/corporate/support")} style={{ background: C.offWhite, color: C.navy, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>
            Contact Support
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {quickStats.map(([label, value]) => (
          <div key={label} style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, lineHeight: 1.6 }}>{value}</div>
          </div>
        ))}
      </div>

      <ApplicationStatusStrip application={application} documents={workspace.applicationDocuments || []} tasks={tasks} />

      {!unlocked ? (
        <Card title="Limited enterprise workspace" subtitle="Your compliance workspace is partially unlocked until payment is completed.">
          <div style={{ display: "grid", gap: 12 }}>
            {["Dashboard", "Eligibility Status", "Company Profile", "Support"].map((item) => (
              <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 14, opacity: 0.95 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{item}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em" }}>Active</span>
              </div>
            ))}
            {["Employees / Entities", "Company Applications", "Compliance Center", "Documents", "Advisors", "Billing", "Reports"].map((item) => (
              <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "rgba(255,255,255,.6)", border: `1px dashed ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 14, opacity: 0.55 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{item}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Locked</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card title="Enterprise workspace unlocked" subtitle="Full operational access is now available across the corporate stack.">
          <KeyValueGrid rows={[["Operational scope", "Corporate compliance infrastructure"], ["Access level", "Full workspace"], ["Next step", "Company-specific filing and onboarding"]]} />
        </Card>
      )}
    </div>
  );
}

export function CorporateEligibilityStatusPage() {
  const { workspace } = useOutletContext();
  const { profile, request, stage } = workspace;

  const submittedInfo = useMemo(() => [
    ["Company Name", profile?.company_name || "—"],
    ["Business Email", profile?.business_email || "—"],
    ["Phone", profile?.phone || "—"],
    ["Registered Country", profile?.registered_country || "—"],
    ["Industry", profile?.industry || "—"],
    ["Entity Type", request?.entity_type || "—"],
    ["Employee Count", request?.employee_count ?? "—"],
    ["Annual Revenue", request?.annual_revenue || "—"],
    ["Countries of Operation", request?.countries_of_operation || "—"],
    ["UAE Presence", request?.uae_presence || "—"],
    ["Purpose", request?.purpose || "—"],
    ["Target Jurisdiction", request?.target_jurisdiction || "—"],
    ["Urgency", request?.urgency || "—"],
    ["Tax Structure", request?.tax_structure || "—"],
  ], [profile, request]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Current status" subtitle={request?.review_notes || "No specialist notes yet. Your application is waiting for review."}>
        <KeyValueGrid rows={[["Status", {pending_review:"Under review",eligible:"Eligible",needs_more_info:"More info needed",payment_pending:"Awaiting payment",payment_completed:"Payment confirmed",documents_pending:"Documents required",documents_under_review:"Documents under review",advisor_assigned:"With your advisor",processing:"In processing",submitted_to_authority:"Submitted to UAE FTA",completed:"Completed",rejected:"Not approved"}[stage] || String(stage || "Under review").replaceAll("_"," ")], ["Payment status", request?.payment_status === "completed" ? "Completed" : request?.payment_status === "pending" ? "Pending" : request?.payment_status || "Pending"], ["Assigned specialist", request?.assigned_specialist || "Not assigned"]]} />
      </Card>

      <Card title="Submitted information" subtitle="Corporate details used for manual review and consultation routing.">
        <KeyValueGrid rows={submittedInfo} />
      </Card>

      <Card title="Review timeline" subtitle="Your file advances as the compliance team updates the corporate workflow.">
        <div style={{ display: "grid", gap: 10 }}>
          {["Submit Corporate Eligibility Request", "Compliance Team Reviews Structure", "Receive Corporate Eligibility Confirmation", "Consultation & Payment", "Begin Compliance Processing"].map((step, index) => (
            <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, background: index <= 1 ? C.offWhite : C.white }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: index <= 1 ? C.gold : C.offWhite2, color: index <= 1 ? C.white : C.muted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{index + 1}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{step}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 3 }}>Progress advances as the corporate file is reviewed.</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function CorporateProfilePage() {
  const { workspace, refresh } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    company_name: workspace.profile?.company_name || "",
    business_email: workspace.profile?.business_email || "",
    phone: workspace.profile?.phone || "",
    industry: workspace.profile?.industry || "",
    website: workspace.profile?.website || "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      if (workspace.profile?.id) {
        const { error } = await supabase.from("corporate_profiles").update(form).eq("id", workspace.profile.id);
        if (error) throw error;
      }
      await refresh();
      setMessage("Profile saved.");
    } catch (saveError) {
      setMessage(saveError.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Company profile" subtitle="Confirm the corporate identity details used for compliance review.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {["company_name", "business_email", "phone", "industry", "website"].map((key) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{key.replaceAll("_", " ")}</label>
              <input value={form[key]} onChange={(e) => update(key, e.target.value)} style={{ width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${C.border}`, color: C.navy, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>registered country</label>
            <div style={{ width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${C.border}`, color: C.muted, fontSize: 14, boxSizing: "border-box", background: C.offWhite }}>
              {workspace.profile?.registered_country || "UAE"}
            </div>
          </div>
        </div>
        {message && <div style={{ marginTop: 14, color: C.gold, fontSize: 13, fontWeight: 700 }}>{message}</div>}
        <button onClick={saveProfile} disabled={saving} style={{ marginTop: 16, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : "Refresh Profile"}
        </button>
      </Card>
    </div>
  );
}

// ── Corporate Support Page ────────────────────────────────────────────────────

const TICKET_STATUS_META = {
  open:     { label: "Open",     bg: "#FFFBEB", color: "#D97706" },
  replied:  { label: "Replied",  bg: "#ECFDF5", color: "#059669" },
  closed:   { label: "Closed",   bg: "#F3F4F6", color: "#6B7280" },
};

function TicketStatusPill({ status, hasReply }) {
  const meta = hasReply
    ? TICKET_STATUS_META.replied
    : TICKET_STATUS_META[status] || TICKET_STATUS_META.open;
  return (
    <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>
      {meta.label}
    </span>
  );
}

export function CorporateSupportPage() {
  const { workspace } = useOutletContext();
  const userId = workspace?.profile?.id || workspace?.session?.user?.id;
  const appId  = workspace?.application?.id || workspace?.request?.id;

  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [notice,   setNotice]   = useState({ text: "", ok: true });
  const [tickets,  setTickets]  = useState([]);
  const [selected, setSelected] = useState(null);
  const pollRef = useRef(null);
  const subjectRef = useRef(null);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTickets(data || []);
    setLoadingTickets(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadTickets();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(loadTickets, 15_000);
    return () => clearInterval(pollRef.current);
  }, [loadTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setNotice({ text: "Please fill in both the subject and message.", ok: false });
      return;
    }
    if (!userId) {
      setNotice({ text: "No user session found. Please log in again.", ok: false });
      return;
    }
    setSending(true);
    setNotice({ text: "", ok: true });
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id:        userId,
        application_id: appId || null,
        subject:        subject.trim(),
        message:        message.trim(),
      });
      if (error) throw error;
      setSubject("");
      setMessage("");
      setNotice({ text: "Ticket submitted — a compliance manager will respond shortly.", ok: true });
      await loadTickets();
    } catch (err) {
      setNotice({ text: err.message || "Failed to submit. Please try again.", ok: false });
    } finally {
      setSending(false);
    }
  };

  const FIELD = {
    width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm,
    border: `1.5px solid ${C.border}`, color: C.navy, fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>

      {/* Raise a ticket */}
      <Card title="Raise a Support Ticket" subtitle="Describe your corporate query and a compliance manager will follow up.">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 640 }}>
          <input
            value={subject}
            ref={subjectRef}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject — e.g. 'Payment query' or 'Document clarification'"
            style={FIELD}
            required
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue or question in detail"
            rows={5}
            style={{ ...FIELD, resize: "vertical" }}
            required
          />
          {notice.text && (
            <div style={{ background: notice.ok ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${notice.ok ? "#A7F3D0" : "#FECACA"}`, color: notice.ok ? "#059669" : "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
              {notice.text}
            </div>
          )}
          <button
            type="submit"
            disabled={sending}
            style={{ width: "fit-content", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 22px", fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}
          >
            {sending ? "Submitting…" : "Submit Ticket"}
          </button>
        </form>
      </Card>

      {/* Previous tickets */}
      <Card title="Your Support Tickets" subtitle="Click a ticket to read details and any admin reply.">
        <div style={{ display: "grid", gap: 10 }}>
          {loadingTickets ? (
            <div style={{ padding: 12 }}><SkeletonCard height={96} /></div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 12 }}>
              <EmptyState
                title="No support tickets"
                message="You haven't submitted any support tickets. Use the form above to raise a corporate request — replies will appear here." 
                cta={{ label: 'Raise a ticket', onClick: () => subjectRef.current?.focus() }}
              />
            </div>
          ) : (
            tickets.map(t => (
              <div
                key={t.id}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
                style={{ background: selected?.id === t.id ? C.offWhite2 : C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: "14px 16px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{t.subject || "Support request"}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {t.admin_reply && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#EDE9FE", color: "#7C3AED", padding: "3px 10px", borderRadius: 999, textTransform: "uppercase" }}>
                        Reply received
                      </span>
                    )}
                    <TicketStatusPill status={t.status || "open"} hasReply={!!t.admin_reply} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  {new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                {selected?.id === t.id && (
                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Your message</div>
                      <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{t.message}</div>
                    </div>
                    {t.admin_reply ? (
                      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: RETAIL_THEME.radius.sm, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", marginBottom: 6 }}>Admin reply</div>
                        <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{t.admin_reply}</div>
                        {t.admin_replied_at && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                            Replied {new Date(t.admin_replied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 14 }}>
                        <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>No reply yet — our team will respond within 1 business day.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Corporate Documents Page ──────────────────────────────────────────────────

const DOC_STATUS_META = {
  pending:   { label: "Upload Needed", bg: "#FFFBEB", color: "#D97706", icon: "⏳" },
  fulfilled: { label: "Uploaded ✓",   bg: "#ECFDF5", color: "#059669", icon: "✅" },
  cancelled: { label: "Cancelled",    bg: "#F3F4F6", color: "#6B7280", icon: "—"  },
};

function DocStatusPill({ status }) {
  const m = DOC_STATUS_META[status] || { label: status, bg: "#F3F4F6", color: "#6B7280", icon: "" };
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em", display: "inline-flex", alignItems: "center", gap: 5 }}>
      {m.icon} {m.label}
    </span>
  );
}

export function CorporateDocumentsPage() {
  const { workspace, refresh } = useOutletContext();
  const unlocked = isCorporateWorkspaceUnlocked(workspace.stage);
  const userId   = workspace?.profile?.id;
  const appId    = workspace?.application?.id;

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(""); // request id being uploaded
  const [msg,       setMsg]       = useState({ text: "", ok: true });
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!appId) return;
    const data = await fetchDocumentRequests(appId);
    setRequests(data || []);
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
      if (refresh) await refresh();
    } catch (e) {
      setMsg({ text: e.message || "Upload failed. Please try again.", ok: false });
    } finally {
      setUploading("");
    }
  };

  if (!unlocked) {
    return <CorporateWorkspaceLockedModal featureLabel="Documents" mode="inline" />;
  }

  const pending   = requests.filter(r => r.status === "pending");
  const fulfilled = requests.filter(r => r.status === "fulfilled");
  const cancelled = requests.filter(r => r.status === "cancelled");

  return (
    <div style={{ display: "grid", gap: 18 }}>

      {/* Header */}
      <Card title="Document Requests" subtitle="Your advisor has requested specific documents to progress your corporate TRC application. Upload each file to avoid delays.">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Pending",  count: pending.length,   bg: "#FFFBEB", color: "#D97706" },
            { label: "Uploaded", count: fulfilled.length, bg: "#ECFDF5", color: "#059669" },
          ].map(({ label, count, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: RETAIL_THEME.radius.sm, padding: "10px 18px", textAlign: "center", minWidth: 72 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Status message */}
      {msg.text && (
        <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${msg.ok ? "#A7F3D0" : "#FECACA"}`, color: msg.ok ? "#059669" : "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>
          {msg.text}
        </div>
      )}

      {!appId ? (
        <Card title="No active application">
          <EmptyState title="No active application" message="Document requests will appear here once your corporate application is created." />
        </Card>
      ) : loading ? (
        <Card title="Loading…">
          <SkeletonCard height={120} />
        </Card>
      ) : requests.length === 0 ? (
        <Card title="No requests yet" subtitle="Your advisor hasn't requested any specific documents yet. They'll appear here when needed.">
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 40 }}>📭</div>
        </Card>
      ) : (
        <>
          {/* ── Pending requests ── */}
          {pending.length > 0 && (
            <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
              <div style={{ padding: "14px 22px", background: "#FFFBEB", borderBottom: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#D97706" }}>
                  {pending.length} document{pending.length !== 1 ? "s" : ""} need{pending.length === 1 ? "s" : ""} to be uploaded
                </span>
              </div>
              {pending.map((req, i) => {
                const isUploading = uploading === req.id;
                return (
                  <div key={req.id} style={{ padding: "18px 22px", borderBottom: i < pending.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{req.document_type}</div>
                          <DocumentTemplateButton documentName={req.document_type} size={24} />
                          <DocStatusPill status={req.status} />
                        </div>
                        {req.description && (
                          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 6 }}>{req.description}</div>
                        )}
                        <div style={{ fontSize: 11, color: C.muted }}>
                          Requested {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <label style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, borderRadius: RETAIL_THEME.radius.sm, padding: "11px 20px", fontSize: 13, fontWeight: 800, cursor: isUploading ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "inline-block", opacity: isUploading ? 0.7 : 1, flexShrink: 0 }}>
                        {isUploading ? "Uploading…" : "📎 Upload File"}
                        <input type="file" onChange={e => handleUpload(req, e.target.files?.[0])} style={{ display: "none" }} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Fulfilled requests ── */}
          {fulfilled.length > 0 && (
            <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
              <div style={{ padding: "14px 22px", background: "#ECFDF5", borderBottom: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>
                  {fulfilled.length} document{fulfilled.length !== 1 ? "s" : ""} uploaded
                </span>
              </div>
              {fulfilled.map((req, i) => (
                <div key={req.id} style={{ padding: "16px 22px", borderBottom: i < fulfilled.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{req.document_type}</span>
                      <DocStatusPill status={req.status} />
                    </div>
                    {req.description && <div style={{ fontSize: 12, color: C.muted }}>{req.description}</div>}
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      Requested {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Cancelled requests ── */}
          {cancelled.length > 0 && (
            <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, overflow: "hidden", opacity: 0.7 }}>
              <div style={{ padding: "12px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>
                Cancelled ({cancelled.length})
              </div>
              {cancelled.map((req, i) => (
                <div key={req.id} style={{ padding: "14px 22px", borderBottom: i < cancelled.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 13, color: C.muted, flex: 1 }}>{req.document_type}</div>
                  <DocStatusPill status={req.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info box */}
      <Card title="About Document Requests">
        <div style={{ display: "grid", gap: 10 }}>
          {[
            ["When does a request appear?", "Your assigned compliance specialist sends requests from their case management dashboard. This page refreshes automatically every 10 seconds."],
            ["Accepted formats", "PDF, JPG, PNG, DOC, DOCX. Maximum 50 MB per file."],
            ["After upload", "Your advisor is notified immediately and will review the document. You may re-upload if requested."],
          ].map(([q, a]) => (
            <div key={q} style={{ background: C.offWhite, borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${C.border}`, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{q}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function CorporateFeatureWorkspacePage({ feature }) {
  const { workspace } = useOutletContext();
  const unlocked = isCorporateWorkspaceUnlocked(workspace.stage);
  const data = CORPORATE_FEATURES[feature] || CORPORATE_FEATURES.documents;

  if (!unlocked) {
    return <CorporateWorkspaceLockedModal featureLabel={data.title} mode="inline" />;
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title={data.title} subtitle={data.subtitle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {data.cards.map((item) => (
            <div key={item} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, lineHeight: 1.7 }}>{item}</div>
            </div>
          ))}
        </div>
        {/* Feature-level no-data fallbacks (conservative) */}
        {feature === 'applications' && !workspace.application && !workspace.applications?.length && (
          <div style={{ marginTop: 12 }}>
            <EmptyState
              title="No company applications"
              message="There are no enterprise filings in this workspace yet. Submitted applications will appear here with their review status."
              cta={{ label: 'Contact support', onClick: () => window.location.assign('/corporate/support') }}
            />
          </div>
        )}
        {feature === 'employees' && !(workspace.entities?.length || workspace.employees?.length) && (
          <div style={{ marginTop: 12 }}>
            <EmptyState
              title="No entities or employees"
              message="No named entities or employee records are configured. Add entities to manage access and filings across subsidiaries."
            />
          </div>
        )}
        {feature === 'documents' && !(workspace.applicationDocuments?.length) && (
          <div style={{ marginTop: 12 }}>
            <EmptyState
              title="No corporate documents"
              message="Your documents vault is empty. Upload incorporation documents, licences, and supporting files to this workspace."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
