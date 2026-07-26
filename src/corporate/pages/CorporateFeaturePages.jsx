import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";
import { supabase } from "../../supabaseClient";
import EmptyState from "../../components/EmptyState";
import SkeletonCard from "../../components/SkeletonCard";
import WorkflowTimeline from "../../components/WorkflowTimeline";
import { getWorkflowStateLabel, normalizeWorkflowState } from "../../workflow/workflowStates";
import { fetchApplicableDocumentRequirements } from "../../documents/documentService";

const C = RETAIL_THEME.colors;

// ── Shared local layout primitives (mirrors CorporateWorkspacePages.jsx) ──────

function Card({ title, subtitle, children, highlight = false }) {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${highlight ? C.gold : "var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{title}</div>
      {subtitle && <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

const FIELD = {
  width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm,
  border: `1.5px solid ${"var(--c-border)"}`, color: "var(--c-text)", fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const PRIMARY_BTN = {
  background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#fff", border: "none",
  borderRadius: RETAIL_THEME.radius.sm, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

const SECONDARY_BTN = {
  background: "var(--c-surface)", color: "var(--c-text)", border: `1px solid ${"var(--c-border)"}`,
  borderRadius: RETAIL_THEME.radius.sm, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

// A friendly fallback shown when a table hasn't been created yet by the
// pending migration (see supabase/migrations/*_corporate_employees_and_settings.sql).
function TableNotReadyState({ feature }) {
  return (
    <EmptyState
      title="This feature isn't set up yet"
      message={`${feature} requires a database migration that hasn't been applied yet. Please contact support and we'll get this enabled for your account.`}
      cta={{ label: "Contact support", onClick: () => window.location.assign("/corporate/support") }}
    />
  );
}

function isMissingTableError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || msg.includes("could not find");
}

// ── 3a. Company Applications ───────────────────────────────────────────────────

export function CorporateApplicationsPage() {
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const companyId = workspace?.profile?.id || workspace?.session?.user?.id;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", companyId)
      .eq("applicant_type", "corporate")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error) setApplications(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [companyId]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Company Applications" subtitle="Enterprise filings submitted by your company and their current review stage.">
        {loading ? (
          <SkeletonCard height={120} />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No company applications"
            message="There are no enterprise filings in this workspace yet. Submitted applications will appear here with their review status."
            cta={{ label: "Contact support", onClick: () => navigate("/corporate/support") }}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {applications.map((app) => (
              <div key={app.id} style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", marginBottom: 4 }}>
                    {getWorkflowStateLabel(normalizeWorkflowState(app))}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
                    Filed {new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · Ref {app.id.slice(0, 8)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => navigate("/corporate/eligibility-status")} style={SECONDARY_BTN}>Eligibility Status</button>
                  <button onClick={() => navigate("/corporate/documents")} style={PRIMARY_BTN}>Documents</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 3b. Employees / Entities ────────────────────────────────────────────────────
// NOTE: this roster is intentionally NOT linked to individual TRC applications —
// that per-employee filing workflow is future work. This page is a simple
// contact/entity directory for the company.

export function CorporateEmployeesPage() {
  const { workspace } = useOutletContext();
  const companyId = workspace?.profile?.id || workspace?.session?.user?.id;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", position: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("corporate_employees")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (err) {
      if (isMissingTableError(err)) setTableMissing(true);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("corporate_employees")
        .insert({
          company_id: companyId,
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          position: form.position.trim() || null,
        })
        .select("*")
        .maybeSingle();
      if (err) throw err;
      if (data) setRows((prev) => [data, ...prev]);
      setForm({ full_name: "", email: "", position: "" });
      setShowForm(false);
    } catch (err) {
      if (isMissingTableError(err)) setTableMissing(true);
      else setError(err.message || "Failed to add employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error: err } = await supabase.from("corporate_employees").delete().eq("id", id);
      if (err) throw err;
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete employee.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Employees / Entities" subtitle="A simple roster of company contacts and entities. Not yet linked to individual TRC filings.">
        {tableMissing ? (
          <TableNotReadyState feature="The employees roster" />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => setShowForm((s) => !s)} style={PRIMARY_BTN}>
                {showForm ? "Cancel" : "+ Add Employee"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18, background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
                <input placeholder="Full name *" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} style={FIELD} required />
                <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={FIELD} />
                <input placeholder="Position" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} style={FIELD} />
                <button type="submit" disabled={saving} style={{ ...PRIMARY_BTN, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save"}</button>
              </form>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>
            )}

            {loading ? (
              <SkeletonCard height={100} />
            ) : rows.length === 0 ? (
              <EmptyState title="No entities or employees" message="No named entities or employee records are configured. Add entities to manage access and filings across subsidiaries." />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {rows.map((r) => (
                  <div key={r.id} style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{r.full_name}</div>
                      <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>{[r.position, r.email].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: `1px solid ${"var(--c-border)"}`, color: "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ── 3c. Compliance Center ───────────────────────────────────────────────────────

export function CorporateComplianceCenterPage() {
  const { workspace } = useOutletContext();
  const appId = workspace?.application?.id;

  const [requirements, setRequirements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchApplicableDocumentRequirements({ applicantType: "corporate", answers: { business_owner: true } }),
      appId
        ? supabase.from("documents").select("*").eq("application_id", appId).then(({ data }) => data || [])
        : Promise.resolve([]),
    ]).then(([reqs, docs]) => {
      if (!mounted) return;
      setRequirements(reqs || []);
      setDocuments(docs || []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [appId]);

  const rows = useMemo(() => {
    return requirements.map((req) => {
      const matches = documents.filter((d) => d.document_type === req.document_name);
      const approved = matches.some((d) => d.review_status === "approved");
      const uploaded = matches.length > 0;
      const status = approved ? "complete" : uploaded ? "pending" : "missing";
      return { ...req, status };
    });
  }, [requirements, documents]);

  const completion = rows.length ? Math.round((rows.filter((r) => r.status === "complete").length / rows.length) * 100) : 0;

  const STATUS_META = {
    complete: { icon: "✅", label: "Complete", color: "#059669", bg: "#ECFDF5" },
    pending:  { icon: "⏳", label: "Pending review", color: "#D97706", bg: "#FFFBEB" },
    missing:  { icon: "❌", label: "Missing", color: "#DC2626", bg: "#FEF2F2" },
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Compliance Center" subtitle="A checklist view of required documentation and its current review status. Upload files from the Documents page.">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `conic-gradient(${C.gold} ${completion * 3.6}deg, ${"var(--c-surface-2)"} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>{completion}%</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.7 }}>
            {rows.filter((r) => r.status === "complete").length} of {rows.length} required documents approved.
          </div>
        </div>

        {loading ? (
          <SkeletonCard height={100} />
        ) : rows.length === 0 ? (
          <EmptyState title="No requirements found" message="Document requirements for corporate applicants haven't been configured yet." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: "14px 16px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{r.document_name}</div>
                    {r.description && <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>{r.description}</div>}
                  </div>
                  <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 3d. Reports ─────────────────────────────────────────────────────────────────

export function CorporateReportsPage() {
  const { workspace } = useOutletContext();
  const appId = workspace?.application?.id;

  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      supabase.from("application_status_history").select("*").eq("application_id", appId).order("created_at", { ascending: true }).then(({ data }) => data || []),
      supabase.from("documents").select("*").eq("application_id", appId).then(({ data }) => data || []),
    ]).then(([hist, docs]) => {
      if (!mounted) return;
      setHistory(hist);
      setDocuments(docs);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [appId]);

  const steps = useMemo(() => history.map((h) => ({
    title: `Application moved to ${getWorkflowStateLabel(h.new_state)}`,
    description: h.notes || "Status updated by the compliance team.",
    date: new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    active: false,
    done: true,
  })), [history]);

  const approvedCount = documents.filter((d) => d.review_status === "approved").length;
  const rejectedCount = documents.filter((d) => d.review_status === "rejected").length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Document Summary" subtitle="Review outcomes recorded on your company's documents to date.">
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "#ECFDF5", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 18px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{approvedCount}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Approved</div>
          </div>
          <div style={{ background: "#FEF2F2", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 18px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{rejectedCount}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase" }}>Rejected</div>
          </div>
        </div>
      </Card>

      <Card title="Application Timeline" subtitle="A chronological audit trail of your company's application progress.">
        {loading ? (
          <SkeletonCard height={140} />
        ) : !appId ? (
          <EmptyState title="No active application" message="Timeline events will appear here once your company's application is created." />
        ) : steps.length === 0 ? (
          <EmptyState title="No timeline events yet" message="Status changes recorded by the compliance team will appear here." />
        ) : (
          <WorkflowTimeline steps={steps} />
        )}
      </Card>
    </div>
  );
}

// ── 3e. Billing ──────────────────────────────────────────────────────────────────

export function CorporateBillingPage() {
  const { workspace } = useOutletContext();
  const application = workspace?.application;
  const appId = application?.id;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", appId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!mounted) return;
        setHistory(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [appId]);

  const PAYMENT_META = {
    completed: { label: "Completed", color: "#059669", bg: "#ECFDF5" },
    pending:   { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
    failed:    { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
    refunded:  { label: "Refunded", color: "#6B7280", bg: "#F3F4F6" },
  };
  const paymentState = application?.payment_state || "pending";
  const meta = PAYMENT_META[paymentState] || PAYMENT_META.pending;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Payment Status" subtitle="Current billing status for your company's TRC application.">
        {!appId ? (
          <EmptyState title="No active application" message="Billing status will appear here once your company's application is created." />
        ) : (
          <span style={{ background: meta.bg, color: meta.color, fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".04em" }}>
            {meta.label}
          </span>
        )}
      </Card>

      <Card title="Online payments not yet available">
        <p style={{ fontSize: 14, color: "var(--c-text)", lineHeight: 1.8 }}>
          Online payment collection is not yet available. Your assigned compliance manager will confirm billing arrangements and payment instructions directly.
        </p>
      </Card>

      {appId && (
        <Card title="Payment History" subtitle="Status changes recorded against your application.">
          {loading ? (
            <SkeletonCard height={100} />
          ) : history.length === 0 ? (
            <EmptyState title="No payment history yet" message="Payment-related status changes will appear here as they're recorded." />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {history.map((h) => (
                <div key={h.id} style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: "12px 16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>{getWorkflowStateLabel(h.new_state)}</span>
                  <span style={{ fontSize: 12, color: "var(--c-text-muted)" }}>{new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── 3f. Settings ─────────────────────────────────────────────────────────────────

export function CorporateSettingsPage() {
  const { workspace, refresh } = useOutletContext();
  const companyId = workspace?.profile?.id || workspace?.session?.user?.id;

  // Password change
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: "", ok: true });

  // Notification preference
  const [optIn, setOptIn] = useState(workspace?.profile?.notification_email_opt_in ?? true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState({ text: "", ok: true });
  const [prefUnavailable, setPrefUnavailable] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", ok: true });
    if (password.length < 8) {
      setPwMsg({ text: "Password must be at least 8 characters.", ok: false });
      return;
    }
    if (password !== confirm) {
      setPwMsg({ text: "Passwords do not match.", ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      setPwMsg({ text: "Password updated successfully.", ok: true });
    } catch (err) {
      setPwMsg({ text: err.message || "Failed to update password.", ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  const handleToggleOptIn = async () => {
    const next = !optIn;
    setOptIn(next);
    setPrefSaving(true);
    setPrefMsg({ text: "", ok: true });
    try {
      const { error } = await supabase
        .from("corporate_profiles")
        .update({ notification_email_opt_in: next })
        .eq("id", companyId);
      if (error) throw error;
      setPrefMsg({ text: "Preference saved.", ok: true });
      if (refresh) await refresh();
    } catch (err) {
      setOptIn(!next);
      if (isMissingTableError(err) || String(err.message || "").toLowerCase().includes("column")) {
        setPrefUnavailable(true);
      } else {
        setPrefMsg({ text: err.message || "Failed to save preference.", ok: false });
      }
    } finally {
      setPrefSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card title="Change Password" subtitle="Update the password used to sign in to your corporate workspace.">
        <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
          <input type="password" placeholder="New password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={FIELD} required />
          <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={FIELD} required />
          {pwMsg.text && (
            <div style={{ background: pwMsg.ok ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${pwMsg.ok ? "#A7F3D0" : "#FECACA"}`, color: pwMsg.ok ? "#059669" : "#DC2626", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
              {pwMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwSaving} style={{ ...PRIMARY_BTN, width: "fit-content", opacity: pwSaving ? 0.7 : 1 }}>
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Card>

      <Card title="Email Notification Preference" subtitle="Choose whether your company receives email notifications about your TRC application.">
        {prefUnavailable ? (
          <TableNotReadyState feature="Email notification preferences" />
        ) : (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={optIn} onChange={handleToggleOptIn} disabled={prefSaving} style={{ width: 20, height: 20, cursor: "pointer" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>
                {optIn ? "Email notifications are ON" : "Email notifications are OFF"}
              </span>
            </label>
            {prefMsg.text && (
              <div style={{ marginTop: 12, fontSize: 13, color: prefMsg.ok ? "#059669" : "#DC2626", fontWeight: 600 }}>{prefMsg.text}</div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
