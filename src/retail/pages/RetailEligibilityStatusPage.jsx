import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";

const C     = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

// ── Journey steps ─────────────────────────────────────────────────────────────
// Each step maps to one or more workflow states.
// `reached` is computed at render time from the current stage.

const JOURNEY = [
  {
    key: "submitted",
    label: "Eligibility request submitted",
    desc: "Your details have been received and are in our review queue.",
    states: ["pending_review"],
    doneWhen: ["pending_review","eligible","needs_more_info","payment_pending","payment_completed","documents_pending","documents_under_review","advisor_assigned","processing","submitted_to_authority","completed"],
  },
  {
    key: "reviewed",
    label: "Eligibility review complete",
    desc: "A specialist has reviewed your profile against UAE FTA criteria.",
    states: ["eligible", "needs_more_info"],
    doneWhen: ["eligible","payment_pending","payment_completed","documents_pending","documents_under_review","advisor_assigned","processing","submitted_to_authority","completed"],
    rejectedWhen: ["rejected"],
  },
  {
    key: "payment",
    label: "Payment confirmed",
    desc: "The service fee has been received and your full workspace is unlocked.",
    states: ["payment_pending", "payment_completed"],
    doneWhen: ["payment_completed","documents_pending","documents_under_review","advisor_assigned","processing","submitted_to_authority","completed"],
  },
  {
    key: "documents",
    label: "Documents reviewed and approved",
    desc: "All required compliance documents have been uploaded and cleared by your advisor.",
    states: ["documents_pending", "documents_under_review"],
    doneWhen: ["advisor_assigned","processing","submitted_to_authority","completed"],
  },
  {
    key: "processing",
    label: "Application submitted to UAE FTA",
    desc: "Your advisor has filed the completed application with the Federal Tax Authority.",
    states: ["advisor_assigned","processing","submitted_to_authority"],
    doneWhen: ["completed"],
  },
  {
    key: "completed",
    label: "Tax Residency Certificate issued",
    desc: "Your TRC has been officially issued and is ready for download.",
    states: ["completed"],
    doneWhen: ["completed"],
  },
];

function getJourneyStatus(step, stage) {
  if (stage === "rejected" && step.rejectedWhen?.includes("rejected")) return "rejected";
  if (step.doneWhen.includes(stage)) return "done";
  if (step.states.includes(stage)) return "current";
  return "upcoming";
}

function VerticalTimeline({ stage }) {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      {JOURNEY.map((step, i) => {
        const status = getJourneyStatus(step, stage);
        const isLast = i === JOURNEY.length - 1;

        const dotColor =
          status === "done"     ? C.gold  :
          status === "current"  ? C.navy  :
          status === "rejected" ? C.error :
          C.border;

        const dotBg =
          status === "done"     ? C.gold  :
          status === "current"  ? C.navy  :
          status === "rejected" ? C.error :
          C.offWhite2;

        const dotContent =
          status === "done"     ? "✓"  :
          status === "rejected" ? "✕"  :
          String(i + 1);

        return (
          <div key={step.key} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            {/* Left: dot + line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: dotBg,
                border: status === "current" ? `2px solid ${C.navy}` : status === "upcoming" ? `1.5px solid ${C.border}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: status === "done" || status === "rejected" ? 13 : 11,
                fontWeight: 800,
                color: status === "upcoming" ? C.muted : "#fff",
                boxShadow: status === "current" ? `0 0 0 5px ${C.navy}12` : "none",
                zIndex: 1,
                transition: "all .2s",
              }}>
                {dotContent}
              </div>
              {!isLast && (
                <div style={{
                  flex: 1, width: 2,
                  background: status === "done" ? `linear-gradient(to bottom, ${C.gold}, ${C.gold}80)` : C.border,
                  marginTop: 4, marginBottom: 4,
                  minHeight: 24,
                }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{
              flex: 1, paddingBottom: isLast ? 0 : 24, paddingTop: 4,
              opacity: status === "upcoming" ? 0.5 : 1,
              transition: "opacity .2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: status === "rejected" ? C.error : C.navy, lineHeight: 1.3 }}>
                  {step.label}
                </div>
                {status === "current" && (
                  <span style={{ background: `${C.navy}12`, color: C.navy, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Current
                  </span>
                )}
                {status === "done" && (
                  <span style={{ background: C.successBg, color: C.success, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Done
                  </span>
                )}
                {status === "rejected" && (
                  <span style={{ background: C.errorBg, color: C.error, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Not approved
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{step.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Status header messages ────────────────────────────────────────────────────

const STATUS_META = {
  pending_review:          { label: "Under review",            tone: "info",    msg: "Your file is in our review queue. Expect an update within 24–48 hours." },
  eligible:                { label: "Eligible",                tone: "success", msg: "You meet the criteria for a UAE Tax Residency Certificate. The next step is payment." },
  needs_more_info:         { label: "More info needed",        tone: "warning", msg: "Our team needs additional information from you before proceeding." },
  payment_pending:         { label: "Awaiting payment",        tone: "warning", msg: "Our team will call you to complete the payment step." },
  payment_completed:       { label: "Payment confirmed",       tone: "success", msg: "Payment received. Your workspace is fully unlocked." },
  documents_pending:       { label: "Documents required",      tone: "warning", msg: "Please upload the required documents to continue." },
  documents_under_review:  { label: "Documents under review",  tone: "info",    msg: "Your advisor is reviewing the documents you uploaded." },
  advisor_assigned:        { label: "With your advisor",       tone: "info",    msg: "Your advisor is actively working on your application." },
  processing:              { label: "In processing",           tone: "info",    msg: "Your application is being prepared for submission." },
  submitted_to_authority:  { label: "Submitted to UAE FTA",    tone: "info",    msg: "Filed. Authority response typically takes 5–15 working days." },
  completed:               { label: "Completed ✓",             tone: "success", msg: "Your Tax Residency Certificate has been issued successfully." },
  rejected:                { label: "Not approved",            tone: "error",   msg: "Your application was not approved at this time. Please contact support." },
};

const TONE_STYLE = {
  success: { bg: C.successBg,            border: "#BBF7D0",  color: C.success },
  warning: { bg: C.warningBg || "#FFFBEB", border: "#FDE68A", color: C.warning },
  error:   { bg: C.errorBg,              border: "#FECACA",  color: C.error },
  info:    { bg: "#EFF6FF",              border: "#BFDBFE",  color: "#1D6FB8" },
};

// ── Submitted info ────────────────────────────────────────────────────────────

const INFO_FIELDS = [
  { key: "full_name",       label: "Full name",         src: "profile" },
  { key: "email",           label: "Email address",     src: "profile" },
  { key: "phone",           label: "Phone number",      src: "profile" },
  { key: "nationality",     label: "Nationality",       src: "profile" },
  { key: "current_country", label: "Current country",   src: "request" },
  { key: "uae_visa",        label: "UAE visa",          src: "request" },
  { key: "days_in_uae",     label: "Days spent in UAE", src: "request" },
  { key: "visa_type",       label: "Visa type",         src: "request" },
  { key: "occupation",      label: "Occupation",        src: "request" },
  { key: "income_source",   label: "Income source",     src: "request" },
  { key: "purpose",         label: "Purpose of TRC",    src: "request" },
  { key: "urgency",         label: "Urgency",           src: "request" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RetailEligibilityStatusPage() {
  const { workspace }   = useOutletContext();
  const { profile, request, stage } = workspace;

  const meta      = STATUS_META[stage] || STATUS_META.pending_review;
  const toneStyle = TONE_STYLE[meta.tone] || TONE_STYLE.info;

  const infoRows = useMemo(() =>
    INFO_FIELDS
      .map(f => ({ label: f.label, value: f.src === "profile" ? profile?.[f.key] : request?.[f.key] }))
      .filter(r => r.value !== undefined && r.value !== null && r.value !== ""),
    [profile, request]
  );

  const reviewNotes = request?.review_notes || request?.specialist_notes;

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>

      {/* ── Status header ── */}
      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.navy}, ${C.gold})` }} />
        <div style={{ padding: "24px 28px 22px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>
              Eligibility Status
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 700, color: C.navy, marginBottom: 10, lineHeight: 1.2 }}>
              {profile?.full_name
                ? `${profile.full_name.split(" ")[0]}'s TRC application`
                : "Your TRC application"}
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, maxWidth: 560, margin: 0 }}>
              {meta.msg}
            </p>
          </div>
          {/* Status badge */}
          <div style={{
            background: toneStyle.bg, border: `1.5px solid ${toneStyle.border}`,
            borderRadius: RETAIL_THEME.radius.md, padding: "12px 20px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            minWidth: 160, flexShrink: 0,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Current status</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: toneStyle.color, textAlign: "center", lineHeight: 1.2 }}>{meta.label}</div>
          </div>
        </div>
      </div>

      {/* ── Specialist notes (only shown if present) ── */}
      {reviewNotes && (
        <div style={{
          background: "#FFFBEB", border: `1.5px solid #FDE68A`,
          borderRadius: RETAIL_THEME.radius.md, padding: "18px 22px",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>📝</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 4 }}>Note from our team</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>{reviewNotes}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* ── Journey timeline ── */}
        <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: "24px 24px 28px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 22 }}>
            Your journey
          </div>
          <VerticalTimeline stage={stage} />
        </div>

        {/* ── Submitted information ── */}
        <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: "24px 24px 28px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16 }}>
            Information on file
          </div>
          {infoRows.length === 0 ? (
            <div style={{ fontSize: 14, color: C.muted }}>No submitted information on record yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 1, background: C.border, borderRadius: RETAIL_THEME.radius.sm, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {infoRows.map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 16px", background: C.white, alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "right", overflowWrap: "anywhere" }}>{String(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
