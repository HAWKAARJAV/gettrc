import { RETAIL_THEME } from "../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;

export default function PaymentPendingState({ profile }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
          Payment Pending
        </div>
        <h3 style={{ fontFamily: SERIF, fontSize: 28, color: C.navy, fontWeight: 700, marginBottom: 10 }}>
          Awaiting Manual Payment Confirmation
        </h3>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>
          You have passed the initial review. Our team will call you to complete the payment step manually before the full TRC processing workspace is unlocked.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {[
          ["Next Step", "Our operations team will confirm your payment and onboarding details."],
          ["Unlock Condition", "The full dashboard becomes available once payment is marked completed."],
          ["Current Applicant", profile?.full_name || "Retail client"],
        ].map(([title, value]) => (
          <div key={title} style={{ background: C.offWhite, borderRadius: RETAIL_THEME.radius.md, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{title}</div>
            <div style={{ color: C.navy, fontSize: 14, lineHeight: 1.7 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
