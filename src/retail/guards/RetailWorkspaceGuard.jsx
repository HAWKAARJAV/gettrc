import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRetailWorkspace } from "../../hooks/useRetailWorkspace";

const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

const STAGE_INFO = {
  pending_review: {
    icon: "🔍",
    title: "Application Under Review",
    message: "Our team is reviewing your eligibility request. You'll be notified once a decision has been made.",
    step: 1,
  },
  eligible: {
    icon: "✅",
    title: "Eligibility Approved — Payment Pending",
    message: "Congratulations! Your eligibility has been confirmed. Our team will contact you to complete the payment step.",
    step: 2,
  },
  payment_pending: {
    icon: "💳",
    title: "Payment in Progress",
    message: "Your payment is being processed. Once confirmed, your full workspace will be unlocked.",
    step: 3,
  },
  needs_more_info: {
    icon: "📋",
    title: "Additional Information Required",
    message: "Our team needs more information to process your application. Please check your email for details or contact support.",
    step: 1,
  },
  rejected: {
    icon: "❌",
    title: "Application Not Approved",
    message: "Unfortunately your eligibility request could not be approved at this time. Please contact support for more information.",
    step: 0,
  },
};

const STEPS = [
  { num: 1, label: "Eligibility Review" },
  { num: 2, label: "Payment" },
  { num: 3, label: "Workspace Unlocked" },
];

// Stages that show "under review" screen instead of full dashboard
const LOCKED_STAGES = new Set(["pending_review", "eligible", "payment_pending", "needs_more_info", "rejected"]);

function UnderReviewScreen({ workspace }) {
  const stage = workspace.stage || "pending_review";
  // For the display message, prefer the raw eligibility_request status when it
  // has a dedicated STAGE_INFO entry (e.g. needs_more_info, rejected).  This
  // way the user sees "Additional Information Required" even though the
  // underlying application workflow_state is still "pending_review".
  const requestStatus = workspace.request?.status;
  const displayStage = (requestStatus && STAGE_INFO[requestStatus]) ? requestStatus : stage;
  const info = STAGE_INFO[displayStage] || STAGE_INFO.pending_review;
  const currentStep = info.step;
  const isRejected = displayStage === "rejected";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #091A3D 0%, #0F2557 52%, #1A3A72 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: SANS }}>

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #C9A84C, #A07C2E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖</div>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#fff" }}>TRC <span style={{ color: "#E2C47A", fontWeight: 400 }}>Connect</span></span>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.assign("/retail/login"); }}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontFamily: SANS }}>
          Sign Out
        </button>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 24, boxShadow: "0 40px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Top colour bar */}
        <div style={{ height: 4, background: isRejected ? "#DC2626" : "linear-gradient(90deg, #C9A84C, #E2C47A)" }} />

        <div style={{ padding: "32px 36px" }}>

          {/* Icon + title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{info.icon}</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: "#0F2557", marginBottom: 10 }}>{info.title}</h1>
            <p style={{ color: "#6B7A99", fontSize: 15, lineHeight: 1.75, maxWidth: 380, margin: "0 auto" }}>{info.message}</p>
          </div>

          {/* Progress steps (hide for rejected) */}
          {!isRejected && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
              {STEPS.map((s, idx) => {
                const done   = s.num < currentStep;
                const active = s.num === currentStep;
                return (
                  <div key={s.num} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                      {idx > 0 && <div style={{ flex: 1, height: 2, background: done ? "#C9A84C" : "#E2E8F0" }} />}
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? "#C9A84C" : active ? "#0F2557" : "#E2E8F0", color: done || active ? "#fff" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {done ? "✓" : s.num}
                      </div>
                      {idx < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "#C9A84C" : "#E2E8F0" }} />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? "#0F2557" : "#6B7A99", marginTop: 6, textAlign: "center" }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* User info */}
          {workspace.profile && (
            <div style={{ background: "#F7F8FC", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2557" }}>{workspace.profile.full_name || workspace.profile.email}</div>
                <div style={{ fontSize: 12, color: "#6B7A99", marginTop: 2 }}>{workspace.profile.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", background: "#EFF6FF", color: "#1D6FB8", padding: "4px 10px", borderRadius: 20 }}>Retail</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => workspace.refresh()}
              style={{ flex: 1, background: "linear-gradient(135deg, #C9A84C, #A07C2E)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
              ↻ Check Status
            </button>
            <a href="mailto:support@gettrc.com"
              style={{ flex: 1, textAlign: "center", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, color: "#0F2557", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✉ Contact Us
            </a>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        TRC Connect · UAE Federal Tax Authority Compliance
      </p>
    </div>
  );
}

export default function RetailWorkspaceGuard() {
  const workspace = useRetailWorkspace();
  const location = useLocation();

  if (typeof location?.pathname === "string" && location.pathname.startsWith("/retail/login")) {
    return <Outlet />;
  }

  if (workspace.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#FFFFFF", fontFamily: SANS }}>
        Loading workspace…
      </div>
    );
  }

  if (!workspace.session) {
    return <Navigate to="/retail/login" replace />;
  }

  if (workspace.error) {
    const errMsg = workspace.error?.message || workspace.error?.details || workspace.error?.hint || String(workspace.error);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#FFFFFF", fontFamily: SANS, gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ fontSize: 16, maxWidth: 420, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
          Your session is active but we couldn't load your workspace data.
        </p>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 18px", fontSize: 12, color: "#FBBF24", maxWidth: 480, wordBreak: "break-all", fontFamily: "monospace" }}>{errMsg}</div>
        <button onClick={() => workspace.refresh()}
          style={{ background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  if (workspace.profile?.role && workspace.profile.role !== "retail") {
    return <Navigate to="/check-eligibility" replace />;
  }

  // No eligibility submission yet → prompt them to apply
  const hasEligibilityData = workspace.request || workspace.application;
  if (!hasEligibilityData) {
    return <Navigate to="/check-eligibility" replace />;
  }

  // ── Locked stages: show "under review" screen, not the full dashboard ──────
  // Full dashboard unlocks only at payment_completed and beyond.
  if (LOCKED_STAGES.has(workspace.stage)) {
    return <UnderReviewScreen workspace={workspace} />;
  }

  return <Outlet context={{ workspace, refresh: workspace.refresh }} />;
}
