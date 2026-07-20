import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { RETAIL_THEME } from "../../config/retailTheme";
import RetailWelcome from '../../components/RetailWelcome';
import EmptyState from '../../components/EmptyState';
import { fetchDocumentRequests } from "../../documents/documentService";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

// ── Stage-aware content ───────────────────────────────────────────────────────

const STAGE_CONTENT = {
  pending_review: {
    icon: "🔍",
    title: "We're reviewing your eligibility",
    message: "A specialist is manually checking your details against UAE FTA requirements. This usually takes 24–48 hours — we'll notify you as soon as there's an update.",
    cta: { label: "View eligibility details", path: "/retail/eligibility-status" },
    tone: "info",
  },
  eligible: {
    icon: "✅",
    title: "You're eligible — one step left before processing",
    message: "Great news — your eligibility has been confirmed. Our team will contact you shortly to arrange the payment and unlock your full workspace.",
    cta: { label: "Contact support", path: "/retail/support" },
    tone: "success",
  },
  payment_pending: {
    icon: "💳",
    title: "Waiting for payment confirmation",
    message: "Our team will call you to complete the payment step. Once confirmed, your full workspace unlocks immediately.",
    cta: { label: "Contact support", path: "/retail/support" },
    tone: "warning",
  },
  payment_completed: {
    icon: "🔓",
    title: "Payment confirmed — workspace unlocked",
    message: "Your workspace is now fully open. The next step is uploading your required documents so your advisor can begin processing.",
    cta: { label: "Upload your documents", path: "/retail/documents" },
    tone: "success",
  },
  documents_pending: {
    icon: "📁",
    title: "Your documents are needed",
    message: "Please upload the required compliance documents to keep your application moving. Your advisor is waiting to review them.",
    cta: { label: "Upload documents", path: "/retail/documents" },
    tone: "warning",
  },
  documents_under_review: {
    icon: "🔎",
    title: "Documents are being reviewed",
    message: "Your advisor is going through the files you've uploaded. You'll receive a notification if anything else is needed.",
    cta: { label: "View your documents", path: "/retail/documents" },
    tone: "info",
  },
  advisor_assigned: {
    icon: "⚖️",
    title: "Your advisor is working on your case",
    message: "Your application is with your assigned TRC advisor. They're handling everything — sit tight and we'll keep you updated.",
    cta: { label: "Chat with your advisor", path: "/retail/chat" },
    tone: "info",
  },
  processing: {
    icon: "⚙️",
    title: "Your application is being prepared",
    message: "Your advisor is finalising the documents and preparing your submission to the UAE Federal Tax Authority.",
    cta: { label: "Chat with your advisor", path: "/retail/chat" },
    tone: "info",
  },
  submitted_to_authority: {
    icon: "📬",
    title: "Submitted to the UAE FTA",
    message: "Your application has been officially filed. Authority response typically takes 5–15 working days from the submission date.",
    cta: { label: "Check requested documents", path: "/retail/requested" },
    tone: "info",
  },
  completed: {
    icon: "🏆",
    title: "Your Tax Residency Certificate is ready!",
    message: "Congratulations — your TRC has been successfully issued by the UAE Federal Tax Authority. Well done!",
    cta: { label: "View your certificate", path: "/retail/documents" },
    tone: "success",
  },
  rejected: {
    icon: "❌",
    title: "Application was not approved",
    message: "Unfortunately your application was not approved at this stage. Please contact our support team to understand the next steps.",
    cta: { label: "Contact support", path: "/retail/support" },
    tone: "error",
  },
};

const FALLBACK_CONTENT = {
  icon: "📋",
  title: "Your TRC application",
  message: "Your application is in progress. Check back here for the latest update.",
  cta: { label: "View eligibility status", path: "/retail/eligibility-status" },
  tone: "info",
};

// ── Progress stepper ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "Eligibility",  states: ["pending_review", "eligible", "needs_more_info"] },
  { label: "Payment",      states: ["payment_pending", "payment_completed"] },
  { label: "Documents",    states: ["documents_pending", "documents_under_review"] },
  { label: "Processing",   states: ["advisor_assigned", "processing", "submitted_to_authority"] },
  { label: "Certificate",  states: ["completed"] },
];

function getStepIndex(stage) {
  if (stage === "rejected") return -1;
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].states.includes(stage)) return i;
  }
  return 0;
}

function ProgressStepper({ stage }) {
  if (stage === "rejected") return null;
  const current = getStepIndex(stage);
  const isComplete = stage === "completed";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "4px 0" }}>
      {STEPS.map((step, i) => {
        const done    = i < current || isComplete;
        const active  = i === current && !isComplete;
        const future  = i > current && !isComplete;

        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            {/* Circle + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 56 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: done ? 14 : 12, fontWeight: 800,
                background: done ? C.gold : active ? C.navy : C.offWhite2,
                color: done ? "#fff" : active ? "#fff" : C.muted,
                border: active ? `2px solid ${C.navy}` : done ? "none" : `1.5px solid ${C.border}`,
                boxShadow: active ? `0 0 0 4px ${C.navy}18` : "none",
                transition: "all .2s",
                flexShrink: 0,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{
                fontSize: 10, fontWeight: active ? 800 : 600,
                color: active ? C.navy : done ? C.gold : C.muted,
                textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap",
              }}>
                {step.label}
              </div>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? C.gold : C.border, marginBottom: 22, marginLeft: 2, marginRight: 2, transition: "background .3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Pending document requests banner ─────────────────────────────────────────

function DocRequestsBanner({ count, navigate }) {
  if (count === 0) return null;
  return (
    <div
      onClick={() => navigate("/retail/requested")}
      style={{
        background: `linear-gradient(135deg, ${C.warnBg || "#FFFBEB"}, #FFF3CD)`,
        border: `1.5px solid ${C.warning}40`,
        borderRadius: RETAIL_THEME.radius.md,
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 24, flexShrink: 0 }}>📋</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>
          {count === 1 ? "Your advisor has requested 1 document" : `Your advisor has requested ${count} documents`}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
          Upload them to keep your application on track.
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.warning, whiteSpace: "nowrap" }}>
        Upload now →
      </div>
    </div>
  );
}

// ── Status timeline ───────────────────────────────────────────────────────────

const STATE_LABELS = {
  pending_review:          "Eligibility review started",
  eligible:                "Eligibility confirmed",
  needs_more_info:         "More information requested",
  payment_pending:         "Payment step initiated",
  payment_completed:       "Payment confirmed",
  documents_pending:       "Documents requested",
  documents_under_review:  "Documents under review",
  advisor_assigned:        "Advisor assigned to your case",
  processing:              "Application being prepared",
  submitted_to_authority:  "Filed with UAE FTA",
  completed:               "Tax Residency Certificate issued",
  rejected:                "Application not approved",
};

function StatusTimeline({ applicationId }) {
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);

  useEffect(() => {
    if (!applicationId) { setLoading(false); return; }
    supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setHistory(data || []); setLoading(false); });
  }, [applicationId]);

  if (loading || history.length === 0) return null;

  const visible = expanded ? history : history.slice(0, 3);

  return (
    <div style={{
      background: C.white,
      borderRadius: RETAIL_THEME.radius.lg,
      border: `1px solid ${C.border}`,
      boxShadow: RETAIL_THEME.shadows.card,
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px", background: "none", border: "none", cursor: "pointer",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>
            Application History
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, background: C.offWhite2, color: C.muted, padding: "2px 8px", borderRadius: 999 }}>
            {history.length} event{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>
          {expanded ? "Collapse ▲" : "Show all ▼"}
        </span>
      </button>

      {/* Timeline entries */}
      <div style={{ padding: "0 22px 20px" }}>
        <div style={{ position: "relative", paddingLeft: 20 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 6, top: 0, bottom: 0,
            width: 2, background: C.border, borderRadius: 99,
          }} />

          {visible.map((entry, i) => {
            const isLatest  = i === 0;
            const isSuccess = ["completed", "eligible", "payment_completed"].includes(entry.new_state);
            const isError   = entry.new_state === "rejected";
            const dotColor  = isLatest ? C.gold : isSuccess ? C.success : isError ? C.error : C.border;

            return (
              <div key={entry.id} style={{ position: "relative", paddingBottom: i < visible.length - 1 ? 18 : 0 }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", left: -20, top: 3,
                  width: 14, height: 14, borderRadius: "50%",
                  background: dotColor,
                  border: `2px solid ${C.white}`,
                  boxShadow: isLatest ? `0 0 0 3px ${C.gold}30` : "none",
                  zIndex: 1,
                }} />

                <div style={{ paddingLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>
                    {STATE_LABELS[entry.new_state] || entry.new_state.replaceAll("_", " ")}
                  </div>
                  {entry.notes && (
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 3, fontStyle: "italic" }}>
                      "{entry.notes}"
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {new Date(entry.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {" at "}
                    {new Date(entry.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}

          {!expanded && history.length > 3 && (
            <div style={{ paddingTop: 14, paddingLeft: 8 }}>
              <button
                onClick={() => setExpanded(true)}
                style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: C.gold, cursor: "pointer", padding: 0 }}
              >
                + {history.length - 3} more event{history.length - 3 !== 1 ? "s" : ""} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RetailDashboardPage() {
  const { workspace }  = useOutletContext();
  const navigate       = useNavigate();
  const [pendingRequests, setPendingRequests] = useState(0);

  const stage   = workspace.stage || "pending_review";
  const profile = workspace.profile;
  const app     = workspace.application;

  const content = STAGE_CONTENT[stage] || FALLBACK_CONTENT;

  const toneColors = {
    success: { bg: C.successBg, border: "#BBF7D0", accent: C.success },
    warning: { bg: C.warningBg || "#FFFBEB", border: "#FDE68A", accent: C.warning },
    error:   { bg: C.errorBg,   border: "#FECACA", accent: C.error },
    info:    { bg: "#EFF6FF",   border: "#BFDBFE", accent: "#1D6FB8" },
  };
  const tone = toneColors[content.tone] || toneColors.info;

  // Load pending advisor document requests
  useEffect(() => {
    if (!app?.id) return;
    fetchDocumentRequests(app.id)
      .then(reqs => setPendingRequests((reqs || []).filter(r => r.status === "pending").length))
      .catch(() => {});
  }, [app?.id]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const appliedDate = app?.created_at
    ? new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  if (!app || !app.id) {
    return (
      <div style={{ display: 'grid', gap: 20, fontFamily: SANS }}>
        <EmptyState title="No active application" message="You don't have an active TRC application yet. Start the eligibility flow to get your TRC process underway." cta={{ label: 'Start application', onClick: () => navigate('/retail/eligibility') }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>

      {/* ── Greeting + status hero ── */}
      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
        {/* Coloured top strip */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${C.navy}, ${C.gold})` }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Greeting */}
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
            Welcome back, <strong style={{ color: C.navy }}>{firstName}</strong>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: `${tone.accent}15`,
              border: `1px solid ${tone.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>
              {content.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 700, color: C.navy, marginBottom: 8, lineHeight: 1.25 }}>
                {content.title}
              </h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, maxWidth: 620, margin: 0 }}>
                {content.message}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate(content.cta.path)}
              style={{
                background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                color: "#fff", border: "none",
                borderRadius: RETAIL_THEME.radius.sm,
                padding: "12px 22px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: SANS,
              }}
            >
              {content.cta.label} →
            </button>
            <button
              onClick={() => navigate("/retail/support")}
              style={{
                background: C.offWhite, color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: RETAIL_THEME.radius.sm,
                padding: "12px 20px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: SANS,
              }}
            >
              Need help?
            </button>
          </div>
        </div>

        {/* Progress stepper */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "18px 28px 22px", background: C.offWhite }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
            Your journey
          </div>
          <ProgressStepper stage={stage} />
        </div>
      </div>

      {/* ── New user welcome / onboarding ── */}
      <RetailWelcome profile={profile} application={app} />

      {/* ── Advisor document requests alert ── */}
      <DocRequestsBanner count={pendingRequests} navigate={navigate} />

      {/* ── Quick facts strip ── */}
      {(appliedDate || app?.id) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 1,
          background: C.border,
          borderRadius: RETAIL_THEME.radius.md,
          overflow: "hidden",
          border: `1px solid ${C.border}`,
        }}>
          {[
            appliedDate && ["Applied on",      appliedDate],
            app?.id && ["Ref",                  app.id.slice(0, 8).toUpperCase()],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ background: C.white, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Application history timeline ── */}
      {app?.id && <StatusTimeline applicationId={app.id} />}
    </div>
  );
}
