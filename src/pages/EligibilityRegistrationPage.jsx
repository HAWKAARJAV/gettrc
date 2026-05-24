import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { registerRetailApplicant } from "../services/retailAuth";
import { fetchAssessmentQuestions, groupAssessmentQuestions, shouldRenderQuestion } from "../services/assessmentService";
import { RETAIL_THEME as P } from "../config/retailTheme";

const z = P.colors;
const SERIF = P.fonts.serif;
const SANS = P.fonts.sans;

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: P.radius.sm,
  border: `1.5px solid ${z.border}`,
  color: z.navy,
  fontFamily: SANS,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
};

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

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: z.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10 }}>{children}</div>;
}

function OptionButton({ label, value, active, onClick, compact = false }) {
  return (
    <button type="button" onClick={() => onClick(value)}
      style={{ padding: compact ? "10px 12px" : "11px 14px", borderRadius: P.radius.sm, border: `1px solid ${active ? z.gold : z.border}`, background: active ? "rgba(201,168,76,.12)" : z.white, color: z.navy, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", minWidth: 0 }}>
      {label}
    </button>
  );
}

function QuestionField({ question, value, onChange }) {
  const fieldKey = question.field_key || question.id;
  const label = question.question;
  const placeholder = question.placeholder || "";

  if (question.field_type === "boolean") {
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", rowGap: 10 }}>
          <OptionButton label="Yes" value="true" active={String(value) === "true"} onClick={v => onChange(fieldKey, v)} />
          <OptionButton label="No" value="false" active={String(value) === "false"} onClick={v => onChange(fieldKey, v)} />
        </div>
      </div>
    );
  }

  if (question.field_type === "select") {
    const isUrgency = fieldKey === "urgency";
    const opts = isUrgency
      ? [["Standard", "standard"], ["Urgent", "urgent"], ["High Priority", "high"]]
      : [["Yes", "yes"], ["No", "no"]];
    return (
      <div style={isUrgency ? { gridColumn: "1 / -1" } : undefined}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
        <div style={isUrgency ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, max-content))", gap: 10, alignItems: "center" } : { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", rowGap: 10 }}>
          {opts.map(([l, v]) => (
            <OptionButton key={v} label={l} value={v} active={value === v} onClick={v => onChange(fieldKey, v)} compact={isUrgency} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
      <input value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} type={question.field_type === "number" ? "number" : "text"} placeholder={placeholder} style={INPUT_STYLE} />
    </div>
  );
}

function dedupeQuestions(questions = []) {
  const seen = new Set();
  return (questions || []).filter(q => {
    const key = `${String(q.field_key || "").trim().toLowerCase()}::${String(q.question || "").trim().toLowerCase().replace(/\?/g, "").replace(/\s+/g, " ")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Fallback questions used when the DB table is empty ──────────────────────
const FALLBACK_RESIDENCY = [
  { id: "currentCountry", field_key: "currentCountry", question: "Current country of residence", field_type: "text", placeholder: "Current residence" },
  { id: "daysInUae", field_key: "daysInUae", question: "Days stayed in UAE", field_type: "number", placeholder: "e.g. 45" },
  { id: "uaeVisa", field_key: "uaeVisa", question: "UAE residence visa?", field_type: "select" },
  { id: "emiratesId", field_key: "emiratesId", question: "Emirates ID available?", field_type: "select" },
  { id: "visaType", field_key: "visaType", question: "Visa type", field_type: "text", placeholder: "Employment, investor, freelance, family, etc." },
];

const FALLBACK_PROFESSIONAL = [
  { id: "occupation", field_key: "occupation", question: "Occupation", field_type: "text", placeholder: "Your role" },
  { id: "incomeSource", field_key: "incomeSource", question: "Income source", field_type: "text", placeholder: "Salary, business, investments" },
  { id: "purpose", field_key: "purpose", question: "Purpose of TRC", field_type: "text", placeholder: "Personal, corporate, banking, etc." },
  { id: "urgency", field_key: "urgency", question: "Urgency level", field_type: "select" },
];

const REQUIRED_FIELDS = ["fullName", "email", "phone", "nationality", "currentCountry", "uaeVisa", "emiratesId", "daysInUae", "visaType", "occupation", "incomeSource", "purpose", "urgency", "password", "confirmPassword"];

export default function EligibilityRegistrationPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dynamicQuestions, setDynamicQuestions] = useState([]);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", nationality: "",
    currentCountry: "", uaeVisa: "", emiratesId: "", daysInUae: "", visaType: "",
    occupation: "", incomeSource: "", purpose: "", urgency: "",
    password: "", confirmPassword: "", terms: false,
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetchAssessmentQuestions({ country: "AE", applicantType: "retail" })
      .then(setDynamicQuestions)
      .catch(() => setDynamicQuestions([]));
  }, []);

  const grouped = useMemo(() => {
    const filtered = dynamicQuestions.filter(q => q.field_key && ["residency", "professional"].includes(q.section));
    return groupAssessmentQuestions(dedupeQuestions(filtered));
  }, [dynamicQuestions]);

  const hasDynamic = Object.keys(grouped).length > 0;
  const residencyQs  = hasDynamic ? (grouped.residency || []) : FALLBACK_RESIDENCY;
  const professionalQs = hasDynamic ? (grouped.professional || []) : FALLBACK_PROFESSIONAL;

  const handleSubmit = async () => {
    // Validate all required fields
    const missing = REQUIRED_FIELDS.find(f => !String(form[f] || "").trim());
    if (missing) { setError("Please complete every field before submitting."); return; }
    if (!form.terms) { setError("Please agree to the Terms & Privacy Policy."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (String(form.daysInUae || "").trim() !== "" && !/^\d+$/.test(String(form.daysInUae).trim())) {
      setError("Please enter a valid number for 'Days stayed in UAE'."); return;
    }

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
        daysInUae: Number(form.daysInUae),
        visaType: form.visaType,
        occupation: form.occupation,
        incomeSource: form.incomeSource,
        purpose: form.purpose,
        urgency: form.urgency,
        password: form.password,
      });
      localStorage.setItem("trc_pending_email", form.email);
      localStorage.setItem("trc_pending_name", form.fullName);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
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
        input, button { max-width: 100%; }
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

          <div style={{ padding: 24, display: "grid", gap: 20, width: "100%", minWidth: 0, boxSizing: "border-box" }}>

            {/* Basic Details */}
            <div>
              <SectionLabel>Basic Details</SectionLabel>
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {[["Full Name", "fullName", "Your legal name"], ["Email Address", "email", "you@example.com"], ["Phone Number", "phone", "+971 ..."], ["Nationality", "nationality", "Your nationality"]].map(([label, field, ph]) => (
                  <div key={field} style={{ gridColumn: "span 1" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
                    <input value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph} style={INPUT_STYLE} />
                  </div>
                ))}
              </div>
            </div>

            {/* UAE Eligibility */}
            <div>
              <SectionLabel>UAE Eligibility</SectionLabel>
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {dedupeQuestions(residencyQs).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
                  const key = q.field_key || q.id || String(i);
                  if (renderedKeys.has(key)) return null;
                  renderedKeys.add(key);
                  return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
                })}
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <SectionLabel>Professional Details</SectionLabel>
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                {dedupeQuestions(professionalQs).filter(q => shouldRenderQuestion(q, form)).map((q, i) => {
                  const key = q.field_key || q.id || String(i);
                  if (renderedKeys.has(key)) return null;
                  renderedKeys.add(key);
                  return <QuestionField key={`${key}-${i}`} question={q} value={form[q.field_key]} onChange={set} />;
                })}
              </div>
            </div>

            {/* Account Setup */}
            <div>
              <SectionLabel>Account Setup</SectionLabel>
              <div className="eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Password</label>
                  <input value={form.password} type="password" onChange={e => set("password", e.target.value)} placeholder="Create a password" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Confirm Password</label>
                  <input value={form.confirmPassword} type="password" onChange={e => set("confirmPassword", e.target.value)} placeholder="Confirm password" style={INPUT_STYLE} />
                </div>
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, fontSize: 14, color: z.navy, lineHeight: 1.7, flexWrap: "wrap", rowGap: 10 }}>
                <input checked={form.terms} onChange={e => set("terms", e.target.checked)} type="checkbox" style={{ marginTop: 4 }} />
                <span>I agree to Terms &amp; Privacy Policy</span>
              </label>
            </div>

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
