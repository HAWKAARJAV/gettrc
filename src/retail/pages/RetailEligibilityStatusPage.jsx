import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";
import { ELIGIBILITY_BASIS_LABELS } from "../../eligibility/eligibilitySignal";
import { startCheckout } from "../../services/paymentService";
import { resubmitEligibility } from "../../services/resubmissionService";
import { QuestionField } from "../../eligibility/retailQuestionnaire";
import {
  RESIDENCY_QUESTIONS, PROFESSIONAL_QUESTIONS, dedupeQuestions,
  resolveOccupation, resolvePurpose, codeForOccupationLabel, codeForPurposeLabel,
  deriveHasUaeEmploymentOrBusiness,
} from "../../eligibility/retailQuestionnaireData";
import { shouldRenderQuestion } from "../../services/assessmentService";

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
          "var(--c-border)";

        const dotBg =
          status === "done"     ? C.gold  :
          status === "current"  ? C.navy  :
          status === "rejected" ? C.error :
          "var(--c-surface-2)";

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
                border: status === "current" ? `2px solid ${C.navy}` : status === "upcoming" ? `1.5px solid ${"var(--c-border)"}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: status === "done" || status === "rejected" ? 13 : 11,
                fontWeight: 800,
                color: status === "upcoming" ? "var(--c-text-muted)" : "#fff",
                boxShadow: status === "current" ? `0 0 0 5px ${C.navy}12` : "none",
                zIndex: 1,
                transition: "all .2s",
              }}>
                {dotContent}
              </div>
              {!isLast && (
                <div style={{
                  flex: 1, width: 2,
                  background: status === "done" ? `linear-gradient(to bottom, ${C.gold}, ${C.gold}80)` : "var(--c-border)",
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
                <div style={{ fontSize: 15, fontWeight: 700, color: status === "rejected" ? C.error : "var(--c-text)", lineHeight: 1.3 }}>
                  {step.label}
                </div>
                {status === "current" && (
                  <span style={{ background: `${C.navy}12`, color: "var(--c-text)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>
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
              <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.65 }}>{step.desc}</div>
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
  payment_pending:         { label: "Eligible",                tone: "success", msg: "You meet the criteria for a UAE Tax Residency Certificate. The next step is payment." },
  payment_completed:       { label: "Payment confirmed",       tone: "success", msg: "Payment received. Your workspace is fully unlocked." },
  documents_pending:       { label: "Documents required",      tone: "warning", msg: "Please upload the required documents to continue." },
  documents_under_review:  { label: "Documents under review",  tone: "info",    msg: "Your advisor is reviewing the documents you uploaded." },
  advisor_assigned:        { label: "With your advisor",       tone: "info",    msg: "Your advisor is actively working on your application." },
  processing:              { label: "In processing",           tone: "info",    msg: "Your application is being prepared for submission." },
  submitted_to_authority:  { label: "Submitted to UAE FTA",    tone: "info",    msg: "Filed. Authority response typically takes 5–15 working days." },
  completed:               { label: "Completed ✓",             tone: "success", msg: "Your Tax Residency Certificate has been issued successfully." },
  rejected:                { label: "Not approved",            tone: "error",   msg: "Your application was not approved at this time. Review the note below, correct your information, and resubmit for another review." },
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
  { key: "vat_registered",  label: "VAT registered",    src: "request" },
  { key: "trc_period_year", label: "TRC period year",   src: "request" },
  { key: "days_in_uae",     label: "Days in UAE",       src: "request" },
  { key: "uae_visa",        label: "UAE residence visa",src: "request" },
  { key: "emirates_id",     label: "Emirates ID available", src: "request" },
  { key: "visa_type",       label: "Visa type",         src: "request" },
  { key: "has_permanent_residence",        label: "Permanent residence in UAE", src: "request" },
  { key: "has_uae_employment_or_business", label: "UAE employment/business",    src: "request" },
  { key: "is_centre_of_interests",         label: "Centre of financial/personal interests", src: "request" },
  { key: "trc_purpose",     label: "TRC purpose",       src: "request" },
  { key: "treaty_country",  label: "Treaty country",    src: "request" },
  { key: "occupation",      label: "Occupation",        src: "request" },
  { key: "income_source",   label: "Income source",     src: "request" },
  { key: "purpose",         label: "Purpose of TRC",    src: "request" },
  { key: "urgency",         label: "Urgency",           src: "request" },
];

// ── Edit & Resubmit (shown when the application was rejected) ─────────────────

const SNAKE_CASE_MAP = {
  currentCountry: "current_country",
  vatRegistered: "vat_registered",
  trcPeriodYear: "trc_period_year",
  daysInUaePeriod: "days_in_uae",
  uaeVisa: "uae_visa",
  emiratesId: "emirates_id",
  visaType: "visa_type",
  hasPermanentResidence: "has_permanent_residence",
  isCentreOfFinancialPersonalInterests: "is_centre_of_interests",
  trcPurpose: "trc_purpose",
  treatyCountry: "treaty_country",
  incomeSource: "income_source",
  urgency: "urgency",
};

function buildFormFromRequest(request) {
  const occ = codeForOccupationLabel(request?.occupation);
  const purp = codeForPurposeLabel(request?.purpose);
  return {
    currentCountry: request?.current_country || "",
    vatRegistered: request?.vat_registered || "",
    trcPeriodYear: request?.trc_period_year || "",
    daysInUaePeriod: request?.days_in_uae !== null && request?.days_in_uae !== undefined ? String(request.days_in_uae) : "",
    uaeVisa: request?.uae_visa || "",
    emiratesId: request?.emirates_id || "",
    visaType: request?.visa_type || "",
    hasPermanentResidence: request?.has_permanent_residence || "",
    hasUaeEmploymentOrBusiness: request?.has_uae_employment_or_business || "",
    isCentreOfFinancialPersonalInterests: request?.is_centre_of_interests || "",
    trcPurpose: request?.trc_purpose || "",
    treatyCountry: request?.treaty_country || "",
    occupation: occ.code,
    occupationOther: occ.other,
    incomeSource: request?.income_source || "",
    purpose: purp.code,
    purposeOther: purp.other,
    urgency: request?.urgency || "",
  };
}

function EditAndResubmitPanel({ applicationId, request, onResubmitted }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => buildFormFromRequest(request));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleResubmit = async () => {
    if (form.trcPurpose === "treaty" && !String(form.treatyCountry || "").trim()) {
      setError("Please select the treaty country."); return;
    }
    if (form.occupation === "other" && !String(form.occupationOther || "").trim()) {
      setError("Please specify your occupation."); return;
    }
    if (form.purpose === "other" && !String(form.purposeOther || "").trim()) {
      setError("Please specify the purpose of your TRC."); return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updates = {};
      for (const [camel, snake] of Object.entries(SNAKE_CASE_MAP)) {
        updates[snake] = form[camel];
      }
      updates.days_in_uae = form.daysInUaePeriod ? Number(form.daysInUaePeriod) : null;
      updates.treaty_country = form.trcPurpose === "treaty" ? form.treatyCountry : "";
      updates.occupation = resolveOccupation(form.occupation, form.occupationOther);
      updates.purpose = resolvePurpose(form.purpose, form.purposeOther);
      // Not asked on-screen (redundant with visaType) — keep it in sync with
      // whatever visa type the applicant corrected on resubmission.
      updates.has_uae_employment_or_business = deriveHasUaeEmploymentOrBusiness(form.visaType);

      await resubmitEligibility({ applicationId, updates });
      onResubmitted();
    } catch (e) {
      setError(e.message || "Unable to resubmit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderedKeys = new Set();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight || C.navy})`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>
        Edit & Resubmit →
      </button>
    );
  }

  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: "24px 24px 28px", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Correct your information</div>
        <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.6 }}>Update the fields below based on the note from your advisor, then resubmit for another review.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
        {dedupeQuestions(RESIDENCY_QUESTIONS).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
          const key = q.field_key || q.id || String(i);
          if (renderedKeys.has(key)) return null;
          renderedKeys.add(key);
          return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
        })}
        {dedupeQuestions(PROFESSIONAL_QUESTIONS).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
          const key = q.field_key || q.id || String(i);
          if (renderedKeys.has(key)) return null;
          renderedKeys.add(key);
          return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
        })}
      </div>

      {error && <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder || "#FECACA"}`, color: C.error, borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setOpen(false)} disabled={submitting}
          style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, color: "var(--c-text)", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 18px", fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleResubmit} disabled={submitting}
          style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 22px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "Resubmitting…" : "Resubmit for Review →"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RetailEligibilityStatusPage() {
  const { workspace, refresh } = useOutletContext();
  const { profile, request, stage, application } = workspace;

  const meta      = STATUS_META[stage] || STATUS_META.pending_review;
  const toneStyle = TONE_STYLE[meta.tone] || TONE_STYLE.info;
  const eligibilityBasis = application?.eligibility_basis && application.eligibility_basis !== "does_not_qualify"
    ? (ELIGIBILITY_BASIS_LABELS[application.eligibility_basis] || application.eligibility_basis)
    : null;

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const handlePayNow = async () => {
    if (!application?.id) return;
    setPayLoading(true);
    setPayError("");
    try {
      const checkoutUrl = await startCheckout({ applicationId: application.id });
      if (checkoutUrl) window.location.href = checkoutUrl;
      else setPayError("Unable to start payment right now. Please contact support.");
    } catch (e) {
      setPayError(e.message || "Unable to start payment right now. Please contact support.");
    } finally {
      setPayLoading(false);
    }
  };

  const infoRows = useMemo(() =>
    INFO_FIELDS
      .map(f => ({ label: f.label, value: f.src === "profile" ? profile?.[f.key] : request?.[f.key] }))
      .filter(r => r.value !== undefined && r.value !== null && r.value !== ""),
    [profile, request]
  );

  // Avoid showing the same note twice — the advisor's determination
  // rationale (eligibility_notes) and their general review note
  // (review_notes) sometimes end up identical for a given case.
  const rawReviewNotes = request?.review_notes || request?.specialist_notes;
  const reviewNotes = rawReviewNotes && rawReviewNotes !== application?.eligibility_notes ? rawReviewNotes : null;

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>

      {/* ── Status header ── */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.navy}, ${C.gold})` }} />
        <div style={{ padding: "24px 28px 22px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>
              Eligibility Status
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 700, color: "var(--c-text)", marginBottom: 10, lineHeight: 1.2 }}>
              {profile?.full_name
                ? `${profile.full_name.split(" ")[0]}'s TRC application`
                : "Your TRC application"}
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.75, maxWidth: 560, margin: 0 }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Current status</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: toneStyle.color, textAlign: "center", lineHeight: 1.2 }}>{meta.label}</div>
          </div>
        </div>
      </div>

      {/* ── Confirmed eligibility basis (only shown once an advisor has recorded a determination) ── */}
      {eligibilityBasis && (
        <div style={{
          background: C.successBg, border: `1.5px solid #BBF7D0`,
          borderRadius: RETAIL_THEME.radius.md, padding: "18px 22px",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>Confirmed eligibility basis</div>
            <div style={{ fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.75 }}>
              Your advisor has confirmed you qualify under: <strong style={{ color: "var(--c-text)" }}>{eligibilityBasis}</strong>.
              {application?.eligibility_notes && <> {application.eligibility_notes}</>}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment step (only shown once eligible, before payment is completed) ──
          Note: getApplicationUnlockState() normalizes raw workflow_state
          'eligible' into stage 'payment_pending' — 'stage' here is NEVER
          literally "eligible", so this must check "payment_pending". */}
      {stage === "payment_pending" && (
        <div style={{
          background: "var(--c-surface)", border: `1.5px solid ${"var(--c-border)"}`,
          borderRadius: RETAIL_THEME.radius.md, padding: "20px 22px",
          display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>Next step: complete payment</div>
            <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.6, maxWidth: 460 }}>
              You're eligible — complete the service fee payment to unlock your full workspace and start document upload.
            </div>
            {payError && <div style={{ marginTop: 8, fontSize: 12, color: C.error, fontWeight: 600 }}>{payError}</div>}
          </div>
          <button onClick={handlePayNow} disabled={payLoading}
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 22px", fontWeight: 800, fontSize: 14, cursor: payLoading ? "not-allowed" : "pointer", opacity: payLoading ? 0.7 : 1, flexShrink: 0 }}>
            {payLoading ? "Starting…" : "Pay Now →"}
          </button>
        </div>
      )}

      {/* ── Rejected: show the reason and let the applicant correct & resubmit ── */}
      {stage === "rejected" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{
            background: C.errorBg, border: `1.5px solid #FECACA`,
            borderRadius: RETAIL_THEME.radius.md, padding: "18px 22px",
            display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>✕</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>Not approved — here's why</div>
              <div style={{ fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.75 }}>
                {application?.eligibility_notes || "Your advisor did not find a clear basis for eligibility based on the information provided. Please review your answers below and resubmit."}
              </div>
            </div>
          </div>
          <EditAndResubmitPanel applicationId={application?.id} request={request} onResubmitted={refresh} />
        </div>
      )}

      {/* ── Specialist notes (only shown if present) ── */}
      {reviewNotes && (
        <div style={{
          background: "#FFFBEB", border: `1.5px solid #FDE68A`,
          borderRadius: RETAIL_THEME.radius.md, padding: "18px 22px",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>📝</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>Note from our team</div>
            <div style={{ fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.75 }}>{reviewNotes}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* ── Journey timeline ── */}
        <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: "24px 24px 28px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 22 }}>
            Your journey
          </div>
          <VerticalTimeline stage={stage} />
        </div>

        {/* ── Submitted information ── */}
        <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: "24px 24px 28px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16 }}>
            Information on file
          </div>
          {infoRows.length === 0 ? (
            <div style={{ fontSize: 14, color: "var(--c-text-muted)" }}>No submitted information on record yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 1, background: "var(--c-border)", borderRadius: RETAIL_THEME.radius.sm, overflow: "hidden", border: `1px solid ${"var(--c-border)"}` }}>
              {infoRows.map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 16px", background: "var(--c-surface)", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)", fontWeight: 600, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", textAlign: "right", overflowWrap: "anywhere" }}>{String(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
