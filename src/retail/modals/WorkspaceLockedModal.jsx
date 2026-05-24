import { RETAIL_THEME } from "../../config/retailTheme";
import { RETAIL_STATUS_TRACKER } from "../../data/retailWorkflow";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;

export default function WorkspaceLockedModal({ featureLabel = "this section", onClose, onViewEligibility, mode = "modal" }) {
  const content = (
    <div style={{ width: "min(100%, 720px)", background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.glass, overflow: "hidden", boxSizing: "border-box" }}>
      <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Workspace Locked</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 32, color: C.navy, marginBottom: 8 }}>Complete onboarding to unlock this workspace.</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 640 }}>
          This section becomes available after eligibility approval and payment confirmation.
        </p>
      </div>

      <div style={{ padding: 24, display: "grid", gap: 18 }}>
        <div style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.md, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Current Section</div>
          <div style={{ fontSize: 20, fontFamily: SERIF, color: C.navy, fontWeight: 700 }}>{featureLabel}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Locked until your compliance workflow advances.</div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>Workflow progression</div>
          <div style={{ display: "grid", gap: 10 }}>
            {RETAIL_STATUS_TRACKER.slice(0, 5).map((step, index) => (
              <div key={step.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.white, borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${C.border}`, padding: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: index === 0 ? C.gold : C.offWhite2, color: index === 0 ? C.white : C.muted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{step.key.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 2 }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{step.label === "Payment Pending" ? "A team member will contact you to complete payment manually." : "Progress moves forward after the current review stage is completed."}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onViewEligibility} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>
            View Eligibility Status
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: C.offWhite, color: C.navy, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === "inline") {
    return <div style={{ minHeight: "100vh", background: C.offWhite, display: "grid", placeItems: "center", padding: 24 }}>{content}</div>;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(9,26,61,.68)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 24 }}>
      {content}
    </div>
  );
}
