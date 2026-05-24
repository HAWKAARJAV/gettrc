import { RETAIL_STATUS_TRACKER } from "../data/retailWorkflow";
import { RETAIL_THEME } from "../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;

function statusIndex(stage) {
  switch (stage) {
    case "payment_completed":
      return 7;
    case "payment_pending":
      return 3;
    case "needs_more_info":
      return 2;
    case "rejected":
      return 2;
    default:
      return 2;
  }
}

export default function EligibilityStatusCard({ profile, request, stage }) {
  const active = statusIndex(stage);

  return (
    <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
      <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
              Retail Compliance Workspace
            </span>
            <h3 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
              {stage === "payment_completed"
                ? "Processing Workspace Unlocked"
                : stage === "payment_pending"
                  ? "You Are Eligible for UAE TRC"
                  : "Eligibility Review In Progress"}
            </h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 640 }}>
              {stage === "payment_completed"
                ? "Your payment has been confirmed. The full processing workspace is now available to continue the managed TRC workflow."
                : "Your file is in a manual review queue. A specialist is checking the details you submitted against UAE Federal Tax Authority requirements."}
            </p>
          </div>
          <div style={{ minWidth: 210, background: C.offWhite2, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.md, padding: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>Current Status</div>
            <div style={{ fontSize: 22, fontFamily: SERIF, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{stage.replaceAll("_", " ")}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{profile?.full_name || request?.user_id || "Retail applicant"}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
          {RETAIL_STATUS_TRACKER.map((item, index) => {
            const done = index < active;
            const current = index === active;
            return (
              <div key={item.key} style={{ borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${done || current ? C.gold : C.border}`, background: current ? C.offWhite : C.white, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: done ? C.white : current ? C.navy : C.muted, background: done ? C.gold : current ? C.goldLight : C.offWhite2 }}>
                  {done ? "✓" : index + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                    {index === 2
                      ? "Your eligibility request is under manual review."
                      : index === 3
                        ? "Payment confirmation is pending a manual call from the team."
                        : index === 7
                          ? "The full compliance workspace is now available."
                          : "Workflow milestone"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div style={{ background: C.offWhite, borderRadius: RETAIL_THEME.radius.md, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Profile</div>
            <div style={{ fontSize: 18, fontFamily: SERIF, color: C.navy, fontWeight: 700, marginBottom: 6 }}>{profile?.full_name || "Pending"}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{profile?.email || "Awaiting verification"}</div>
          </div>
          <div style={{ background: C.offWhite, borderRadius: RETAIL_THEME.radius.md, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Review Notes</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
              {request?.review_notes || "A TRC specialist will update this section after manual review."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
