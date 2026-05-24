import { useState } from "react";
import { RETAIL_THEME } from "../config/retailTheme";

const C    = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

const STEPS = [
  {
    num: "1",
    icon: "🔍",
    title: "Eligibility Review",
    body: "Our specialists verify your details against UAE FTA requirements. This typically takes 24–48 hours.",
  },
  {
    num: "2",
    icon: "💳",
    title: "Payment & Unlock",
    body: "Once eligible, our team arranges payment with you. Your full workspace unlocks immediately after confirmation.",
  },
  {
    num: "3",
    icon: "🏆",
    title: "Documents & Certificate",
    body: "Upload your documents, your advisor reviews them, and we submit directly to the UAE Federal Tax Authority.",
  },
];

export default function RetailWelcome({ profile, application }) {
  const userId    = profile?.id || "guest";
  const storageKey = `trc_welcomed_${userId}`;

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setDismissed(true);
  };

  // Only show for accounts created within the last 7 days and not yet dismissed
  const created = application?.created_at ? new Date(application.created_at) : null;
  const isRecent = created ? (Date.now() - created.getTime()) < (7 * 24 * 3600 * 1000) : false;

  if (dismissed || !isRecent) return null;

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <div style={{
      background: C.white,
      borderRadius: RETAIL_THEME.radius.lg,
      border: `1.5px solid ${C.gold}40`,
      boxShadow: `0 0 0 4px ${C.gold}08, ${RETAIL_THEME.shadows.card}`,
      overflow: "hidden",
      fontFamily: SANS,
    }}>
      {/* Gold top stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.navy})` }} />

      <div style={{ padding: "22px 24px 24px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>
              Welcome to TRC Connect
            </div>
            <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.navy, margin: 0 }}>
              Hi {firstName} — here's what happens next
            </h3>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss welcome guide"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* 3-step explainer */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{
              background: C.offWhite,
              border: `1px solid ${C.border}`,
              borderRadius: RETAIL_THEME.radius.md,
              padding: "16px 18px",
              position: "relative",
            }}>
              {/* Step badge */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: "#fff", fontSize: 13, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}>
                {step.num}
              </div>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{step.body}</div>

              {/* Arrow connector (not on last) */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, color: C.gold, zIndex: 1,
                  display: "none", // hidden on mobile, shows on wider layouts
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer nudge */}
        <div style={{ marginTop: 16, fontSize: 12, color: C.muted, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span>We'll email you at each stage — check your inbox for updates.</span>
          <button
            onClick={dismiss}
            style={{
              background: "none", border: "none", fontSize: 12, fontWeight: 700,
              color: C.navy, cursor: "pointer", textDecoration: "underline", padding: 0,
            }}
          >
            Got it, dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
