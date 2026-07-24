import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { registerRetailApplicant } from "../services/retailAuth";
import { shouldRenderQuestion } from "../services/assessmentService";
import { RETAIL_THEME as P } from "../config/retailTheme";
import { SectionLabel, SectionCard, QuestionField, FieldCard } from "../eligibility/retailQuestionnaire";
import {
  INPUT_STYLE, dedupeQuestions,
  RESIDENCY_QUESTIONS, PROFESSIONAL_QUESTIONS,
  resolveOccupation, resolvePurpose,
} from "../eligibility/retailQuestionnaireData";
import { useSEO, breadcrumbJsonLd } from "../seo/useSEO";
import { validatePasswordStrength, findFirstMissingField } from "../services/formValidation";

const z = P.colors;
const SERIF = P.fonts.serif;
const SANS = P.fonts.sans;

const PROCESS_STEPS = [
  { num: "1", title: "Submit Eligibility Request", desc: "Share the core facts of your residence, visa, and professional profile." },
  { num: "2", title: "Specialist Reviews Profile", desc: "A TRC specialist manually reviews the request against UAE FTA requirements." },
  { num: "3", title: "Receive Eligibility Confirmation", desc: "You will be notified whether you are eligible, need more information, or are rejected." },
  { num: "4", title: "Complete Payment", desc: "Our team calls you to complete the manual payment step." },
  { num: "5", title: "Begin TRC Processing", desc: "Once payment is completed, the full compliance workspace unlocks." },
];

function EligibilityShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${z.navyDark} 0%, ${z.navy} 52%, #1A3A72 100%)`, padding: 24, fontFamily: SANS, boxSizing: "border-box", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", minHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
        {/* Top nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", rowGap: 10 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${z.gold}, ${z.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: z.white }}>TRC</span>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: z.goldLight }}> Connect</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", rowGap: 10 }}>
            <Link to="/login" style={{ color: z.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Login</Link>
            <a href="mailto:support@gettrc.com" style={{ color: z.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Need Help?</a>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>{children}</div>
      </div>
    </div>
  );
}

const REQUIRED_FIELDS = ["fullName", "email", "phone", "nationality", "currentCountry", "vatRegistered", "trcPeriodYear", "daysInUaePeriod", "uaeVisa", "emiratesId", "visaType", "hasPermanentResidence", "hasUaeEmploymentOrBusiness", "isCentreOfFinancialPersonalInterests", "trcPurpose", "occupation", "incomeSource", "purpose", "urgency", "password", "confirmPassword"];

// Human-readable labels for the "which field is missing" error message —
// merges the manually-entered fields with the question text already defined
// for the dynamic residency/professional questions, so both stay in sync.
const FIELD_LABELS = {
  fullName: "Full Name", email: "Email", phone: "Phone Number", nationality: "Nationality",
  password: "Password", confirmPassword: "Confirm Password",
  ...Object.fromEntries([...RESIDENCY_QUESTIONS, ...PROFESSIONAL_QUESTIONS].map(q => [q.field_key, q.question])),
};

export default function EligibilityRegistrationPage() {
  useSEO({
    title: "Check Your UAE Tax Residency Certificate Eligibility",
    description: "Check your eligibility for a UAE Tax Residency Certificate in minutes. Answer a few questions about your residency and visa status and a TRC specialist reviews your case within 24-48 hours.",
    path: "/check-eligibility",
    jsonLd: breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Check Eligibility", path: "/check-eligibility" }]),
  });

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", nationality: "",
    currentCountry: "", uaeVisa: "", emiratesId: "", visaType: "",
    vatRegistered: "", trcPeriodYear: "", daysInUaePeriod: "",
    hasPermanentResidence: "", hasUaeEmploymentOrBusiness: "", isCentreOfFinancialPersonalInterests: "",
    trcPurpose: "", treatyCountry: "",
    occupation: "", occupationOther: "", incomeSource: "", purpose: "", purposeOther: "", urgency: "",
    password: "", confirmPassword: "", terms: false,
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const residencyQs = RESIDENCY_QUESTIONS;
  const professionalQs = PROFESSIONAL_QUESTIONS;

  const handleSubmit = async () => {
    // Validate all required fields, naming the first one that's missing
    // rather than a generic "complete everything" message.
    const missing = findFirstMissingField(form, REQUIRED_FIELDS, FIELD_LABELS);
    if (missing) { setError(`Please fill in: ${missing.label}.`); return; }
    if (form.trcPurpose === "treaty" && !String(form.treatyCountry || "").trim()) {
      setError("Please select the treaty country."); return;
    }
    if (form.occupation === "other" && !String(form.occupationOther || "").trim()) {
      setError("Please specify your occupation."); return;
    }
    if (form.purpose === "other" && !String(form.purposeOther || "").trim()) {
      setError("Please specify the purpose of your TRC."); return;
    }
    if (!form.terms) { setError("Please agree to the Terms & Privacy Policy."); return; }
    const pwCheck = validatePasswordStrength(form.password);
    if (!pwCheck.valid) { setError(pwCheck.message); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    setError("");
    try {
      await registerRetailApplicant({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        nationality: form.nationality,
        currentCountry: form.currentCountry,
        uaeVisa: form.uaeVisa,
        emiratesId: form.emiratesId,
        visaType: form.visaType,
        vatRegistered: form.vatRegistered,
        trcPeriodYear: form.trcPeriodYear,
        daysInUaePeriod: form.daysInUaePeriod,
        hasPermanentResidence: form.hasPermanentResidence,
        hasUaeEmploymentOrBusiness: form.hasUaeEmploymentOrBusiness,
        isCentreOfFinancialPersonalInterests: form.isCentreOfFinancialPersonalInterests,
        trcPurpose: form.trcPurpose,
        treatyCountry: form.trcPurpose === "treaty" ? form.treatyCountry : "",
        occupation: resolveOccupation(form.occupation, form.occupationOther),
        incomeSource: form.incomeSource,
        purpose: resolvePurpose(form.purpose, form.purposeOther),
        urgency: form.urgency,
        password: form.password,
      });
      navigate("/retail/login", { state: { justRegistered: true, email: form.email } });
    } catch (e) {
      console.error("Eligibility submission error:", e);
      const msg = (e && (e.message || e.error_description || e.msg)) || "Unable to submit eligibility request.";
      if (/duplicate|already exists|unique/i.test(msg)) {
        setError("An account with this email already exists. Try signing in or resetting your password.");
      } else if (/password|strength|weak/i.test(msg)) {
        setError("Password does not meet requirements. Choose a stronger password.");
      } else if (/database|db|saving/i.test(msg)) {
        setError("Server error while saving your information. Please try again later.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderedKeys = new Set();

  return (
    <EligibilityShell>
      <style>{`
        * { box-sizing: border-box; }
        .eligibility-card * { min-width: 0; }
        input, button, select { max-width: 100%; }
        .elig-input, .elig-select {
          transition: border-color .15s, box-shadow .15s;
        }
        .elig-input:hover, .elig-select:hover { border-color: ${z.gold}99 !important; }
        .elig-input:focus, .elig-select:focus {
          border-color: ${z.gold} !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,.16);
        }
        .elig-select {
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7' fill='none'%3E%3Cpath d='M1 1L5.5 5.5L10 1' stroke='%236B7A99' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px !important;
        }
        .elig-pill:hover { border-color: ${z.gold} !important; }
        @media (max-width: 1120px) {
          .eligibility-layout { grid-template-columns: 1fr !important; }
          .eligibility-card { width: 100% !important; }
        }
        @media (max-width: 720px) {
          .eligibility-shell { padding: 16px !important; }
          .eligibility-card, .eligibility-panel { width: 100% !important; }
          .eligibility-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="eligibility-layout" style={{ display: "grid", gridTemplateColumns: "minmax(280px,.95fr) minmax(320px,1.05fr)", gap: 24, alignItems: "start", paddingBottom: 16 }}>

        {/* ── Left: marketing panel ── */}
        <div style={{ paddingTop: 16 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: z.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Eligibility Workspace</div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(42px,5vw,66px)", lineHeight: 1, color: z.white, marginBottom: 18 }}>Check Your UAE TRC Eligibility</h1>
            <p style={{ color: "rgba(255,255,255,.78)", fontSize: 16, lineHeight: 1.9, maxWidth: 520, marginBottom: 22 }}>Our specialists manually review every application to ensure compliance with UAE Federal Tax Authority requirements.</p>

            <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
              {["Manual expert review", "Secure & encrypted", "Trusted UAE tax specialists", "Response within 24–48 hours"].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: z.white, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: P.radius.sm, padding: "12px 14px" }}>
                  <span style={{ color: z.goldLight }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, marginBottom: 18 }}>
              <SectionLabel>Process (at-a-glance)</SectionLabel>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {PROCESS_STEPS.map(s => (
                  <div key={s.num} style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: P.radius.sm, fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: form card ── */}
        <div className="eligibility-card" style={{ width: "100%", minWidth: 0, background: z.white, borderRadius: P.radius.lg, border: `1px solid ${z.border}`, boxShadow: P.shadows.glass, overflow: "hidden", boxSizing: "border-box" }}>

          {/* Card header */}
          <div style={{ padding: 24, borderBottom: `1px solid ${z.border}`, background: `linear-gradient(135deg, ${z.offWhite} 0%, ${z.white} 100%)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: z.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Eligibility + Registration</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 32, color: z.navy, marginBottom: 6 }}>Tell us about your profile</h2>
            <p style={{ color: z.muted, fontSize: 14, lineHeight: 1.8 }}>Submit your eligibility request and create your retail account in one guided step.</p>
          </div>

          <div style={{ padding: 24, display: "grid", gap: 16, width: "100%", minWidth: 0, boxSizing: "border-box" }}>

            <SectionCard number={1} title="Basic Details" description="Your personal identification information.">
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {[["Full Name", "fullName", "Your legal name", "Must match your passport exactly."], ["Email Address", "email", "you@example.com"], ["Phone Number", "phone", "+971 ..."], ["Nationality", "nationality", "Your nationality"]].map(([label, field, ph, note]) => (
                  <FieldCard key={field}>
                    <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: z.navy, lineHeight: 1.4, marginBottom: 10 }}>{label}</label>
                    <input className="elig-input" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph} style={INPUT_STYLE} />
                    {note && <div style={{ fontSize: 12, color: z.muted, marginTop: 8, lineHeight: 1.55 }}>{note}</div>}
                  </FieldCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard number={2} title="UAE Eligibility" description="Determines which of the three UAE tax-residency tests applies to you.">
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {dedupeQuestions(residencyQs).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
                  const key = q.field_key || q.id || String(i);
                  if (renderedKeys.has(key)) return null;
                  renderedKeys.add(key);
                  return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
                })}
              </div>
            </SectionCard>

            <SectionCard number={3} title="Professional Details" description="Helps your advisor tailor the required documents to your profile.">
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {dedupeQuestions(professionalQs).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
                  const key = q.field_key || q.id || String(i);
                  if (renderedKeys.has(key)) return null;
                  renderedKeys.add(key);
                  return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
                })}
              </div>
            </SectionCard>

            <SectionCard number={4} title="Account Setup" description="Create your login to track this application.">
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                <FieldCard>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: z.navy, lineHeight: 1.4, marginBottom: 10 }}>Password</label>
                  <input className="elig-input" value={form.password} type="password" onChange={e => set("password", e.target.value)} placeholder="Create a password" style={INPUT_STYLE} />
                  <div style={{ fontSize: 12, color: z.muted, marginTop: 8, lineHeight: 1.55 }}>At least 8 characters, with uppercase, lowercase, a number, and a special character.</div>
                </FieldCard>
                <FieldCard>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: z.navy, lineHeight: 1.4, marginBottom: 10 }}>Confirm Password</label>
                  <input className="elig-input" value={form.confirmPassword} type="password" onChange={e => set("confirmPassword", e.target.value)} placeholder="Confirm password" style={INPUT_STYLE} />
                </FieldCard>
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, fontSize: 14, color: z.navy, lineHeight: 1.7, flexWrap: "wrap", rowGap: 10 }}>
                <input checked={form.terms} onChange={e => set("terms", e.target.checked)} type="checkbox" style={{ marginTop: 4 }} />
                <span>
                  I agree to{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: z.gold, fontWeight: 700 }}>Terms</a>
                  {" "}&amp;{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: z.gold, fontWeight: 700 }}>Privacy Policy</a>
                </span>
              </label>
            </SectionCard>

            {error && (
              <div style={{ background: z.errorBg, border: `1px solid ${z.errorBorder}`, color: z.error, borderRadius: P.radius.sm, padding: "12px 14px", fontSize: 13 }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: "100%", background: `linear-gradient(135deg, ${z.gold}, ${z.goldDark})`, color: z.white, border: "none", borderRadius: P.radius.sm, padding: "15px 18px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: SANS }}>
              {submitting ? "Submitting…" : "Submit Eligibility Request →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: z.muted, marginTop: 4 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: z.navy, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </EligibilityShell>
  );
}
