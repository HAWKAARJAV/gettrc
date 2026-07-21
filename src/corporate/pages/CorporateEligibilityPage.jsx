import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CorporateAuthShell from "../components/CorporateAuthShell";
import { RETAIL_THEME } from "../../config/retailTheme";
import { registerCorporateApplicant } from "../services/corporateAuth";
import { useSEO, breadcrumbJsonLd } from "../../seo/useSEO";
import { validatePasswordStrength, findFirstMissingField } from "../../services/formValidation";

const CORPORATE_FIELD_LABELS = {
  companyName: "Company Name", email: "Official Business Email", phone: "Contact Number",
  industry: "Industry Type", entityType: "Type of Entity", employeeCount: "Number of Employees",
  annualRevenue: "Annual Revenue Range", countriesOfOperation: "Countries of Operation",
  uaePresence: "Existing UAE Presence", incorporationDate: "Date of Incorporation",
  incorporationLocation: "Place of Incorporation", hasCorporateTaxTrn: "Corporate Tax TRN status",
  hasFiledCorporateTaxReturn: "Filed Corporate Tax Return", trcPurpose: "Purpose of Corporate TRC",
  purpose: "Purpose of Corporate TRC", targetJurisdiction: "Target Jurisdiction",
  urgency: "Compliance Urgency", taxStructure: "Current Tax Structure", useCase: "Expected Use Case",
  password: "Password", confirmPassword: "Confirm Password",
};

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

const INCORPORATION_LOCATION_OPTIONS = [
  ["UAE Mainland", "uae_mainland"],
  ["UAE Free Zone", "uae_freezone"],
  ["UAE Offshore", "uae_offshore"],
  ["Foreign", "foreign"],
];

// Keep in sync with TREATY_COUNTRIES in src/pages/EligibilityRegistrationPage.jsx.
const TREATY_COUNTRIES = [
  "Algeria", "Armenia", "Austria", "Azerbaijan", "Bangladesh", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Brunei", "Bulgaria", "Canada", "China", "Cyprus", "Czech Republic", "Egypt", "Estonia", "Ethiopia", "Finland",
  "France", "Georgia", "Germany", "Greece", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kyrgyzstan", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
  "Malaysia", "Malta", "Mauritius", "Mexico", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Netherlands",
  "New Zealand", "Pakistan", "Panama", "Philippines", "Poland", "Portugal", "Romania", "Russia", "Rwanda",
  "Senegal", "Serbia", "Seychelles", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sudan", "Switzerland", "Syria", "Tajikistan", "Thailand", "Tunisia", "Turkey", "Turkmenistan",
  "Ukraine", "United Kingdom", "Uzbekistan", "Venezuela", "Vietnam", "Yemen",
];
const TREATY_COUNTRY_OPTIONS = TREATY_COUNTRIES.map((c) => [c, c]);

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: RETAIL_THEME.radius.sm,
  border: `1.5px solid ${C.border}`,
  color: C.navy,
  fontFamily: SANS,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
};
const SELECT_STYLE = { ...INPUT_STYLE, background: C.white, cursor: "pointer" };

function SelectPill({ label, value, active, onClick }) {
  return (
    <button type="button" onClick={() => onClick(value)} style={{ padding: "11px 14px", borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${active ? C.gold : C.border}`, background: active ? "rgba(201,168,76,.12)" : C.white, color: C.navy, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
      {label}
    </button>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10 }}>{children}</div>;
}

export default function CorporateEligibilityPage() {
  useSEO({
    title: "Check Corporate Tax UAE & TRC Eligibility",
    description: "Check your company's eligibility for a UAE Tax Residency Certificate and Corporate Tax compliance. Submit your structure and a specialist reviews treaty pathways within 24-48 hours.",
    path: "/corporate/check-eligibility",
    jsonLd: breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Corporate Check Eligibility", path: "/corporate/check-eligibility" }]),
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    industry: "",
    website: "",
    entityType: "",
    employeeCount: "",
    annualRevenue: "",
    countriesOfOperation: "",
    uaePresence: "",
    incorporationDate: "",
    incorporationLocation: "",
    hasCorporateTaxTrn: "",
    corporateTaxTrn: "",
    hasFiledCorporateTaxReturn: "",
    trcPurpose: "",
    targetTreatyCountry: "",
    effectiveManagementStatement: "",
    boardMeetingsInUae: "",
    keyDecisionMakersInUae: "",
    purpose: "",
    targetJurisdiction: "",
    urgency: "",
    taxStructure: "",
    useCase: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const required = ["companyName", "email", "phone", "industry", "entityType", "employeeCount", "annualRevenue", "countriesOfOperation", "uaePresence", "incorporationDate", "incorporationLocation", "hasCorporateTaxTrn", "hasFiledCorporateTaxReturn", "trcPurpose", "purpose", "targetJurisdiction", "urgency", "taxStructure", "useCase", "password", "confirmPassword"];
    const missingField = findFirstMissingField(form, required, CORPORATE_FIELD_LABELS);
    if (missingField) {
      setError(`Please fill in: ${missingField.label}.`);
      return;
    }
    if (!form.terms) {
      setError("Please agree to the Terms & Privacy Policy.");
      return;
    }
    if (form.hasCorporateTaxTrn === "yes" && !String(form.corporateTaxTrn || "").trim()) {
      setError("Please provide your Corporate Tax TRN.");
      return;
    }
    if (form.trcPurpose === "treaty" && !String(form.targetTreatyCountry || "").trim()) {
      setError("Please select the treaty country this TRC is for.");
      return;
    }
    if (form.incorporationLocation === "foreign") {
      const foreignRequired = ["effectiveManagementStatement", "boardMeetingsInUae", "keyDecisionMakersInUae"];
      const missingForeign = foreignRequired.find((field) => !String(form[field] || "").trim());
      if (missingForeign) {
        setError("Please complete the effective management and control details for foreign-incorporated entities.");
        return;
      }
    }
    const pwCheck = validatePasswordStrength(form.password);
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerCorporateApplicant({
        companyName: form.companyName,
        email: form.email,
        phone: form.phone,
        industry: form.industry,
        website: form.website,
        entityType: form.entityType,
        employeeCount: Number(form.employeeCount),
        annualRevenue: form.annualRevenue,
        countriesOfOperation: form.countriesOfOperation,
        uaePresence: form.uaePresence,
        incorporationDate: form.incorporationDate,
        incorporationLocation: form.incorporationLocation,
        hasCorporateTaxTrn: form.hasCorporateTaxTrn,
        corporateTaxTrn: form.hasCorporateTaxTrn === "yes" ? form.corporateTaxTrn : "",
        hasFiledCorporateTaxReturn: form.hasFiledCorporateTaxReturn,
        trcPurpose: form.trcPurpose,
        targetTreatyCountry: form.trcPurpose === "treaty" ? form.targetTreatyCountry : "",
        effectiveManagementStatement: form.incorporationLocation === "foreign" ? form.effectiveManagementStatement : "",
        boardMeetingsInUae: form.incorporationLocation === "foreign" ? form.boardMeetingsInUae : "",
        keyDecisionMakersInUae: form.incorporationLocation === "foreign" ? form.keyDecisionMakersInUae : "",
        purpose: form.purpose,
        targetJurisdiction: form.targetJurisdiction,
        urgency: form.urgency,
        taxStructure: form.taxStructure,
        useCase: form.useCase,
        password: form.password,
      });

      navigate(`/corporate/login?email=${encodeURIComponent(form.email)}`);
    } catch (submitError) {
      setError(submitError.message || "Unable to submit corporate eligibility request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CorporateAuthShell
      actions={(
        <Link to="/corporate/login" style={{ color: C.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Sign In</Link>
      )}
    >
      <style>{`
        * { box-sizing: border-box; }
        .corp-eligibility-card * { min-width: 0; }
        input, button { max-width: 100%; }
        @media (max-width: 1120px) {
          .corp-eligibility-layout { grid-template-columns: 1fr !important; }
          .corp-eligibility-card { width: 100% !important; }
        }
        @media (max-width: 720px) {
          .corp-eligibility-card, .corp-eligibility-panel { width: 100% !important; }
          .corp-eligibility-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="corp-eligibility-layout" style={{ display: "grid", gridTemplateColumns: "minmax(300px, .95fr) minmax(340px, 1.05fr)", gap: 24, alignItems: "start", paddingBottom: 16 }}>
        <div style={{ paddingTop: 16 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Enterprise Eligibility Workspace</div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(40px, 4.6vw, 66px)", lineHeight: 1, color: C.white, marginBottom: 18 }}>Check Your Corporate TRC Eligibility</h1>
            <p style={{ color: "rgba(255,255,255,.78)", fontSize: 16, lineHeight: 1.9, maxWidth: 540, marginBottom: 22 }}>
              Our compliance specialists manually review each corporate structure to determine applicable tax residency pathways and treaty benefits.
            </p>

            <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
              {["Enterprise compliance review", "Multi-jurisdiction support", "Manual specialist onboarding", "Dedicated compliance managers"].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: C.white, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px" }}>
                  <span style={{ color: C.goldLight }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: RETAIL_THEME.radius.lg, padding: 20 }}>
              <SectionTitle>Process</SectionTitle>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["1", "Submit Corporate Eligibility Request"],
                  ["2", "Compliance Team Reviews Structure"],
                  ["3", "Receive Corporate Eligibility Confirmation"],
                  ["4", "Consultation & Payment"],
                  ["5", "Begin Compliance Processing"],
                ].map(([num, title]) => (
                  <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{num}</div>
                    <div>
                      <div style={{ color: C.white, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                      <div style={{ color: "rgba(255,255,255,.68)", fontSize: 13, lineHeight: 1.7 }}>Corporate compliance teams review the structure and route the file appropriately.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="corp-eligibility-card" style={{ width: "100%", minWidth: 0, background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.glass, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Corporate Eligibility + Registration</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 32, color: C.navy, marginBottom: 6 }}>Tell us about your business structure</h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>Submit your corporate eligibility request and create your account in one guided step.</p>
          </div>

          <div style={{ padding: 24, display: "grid", gap: 20, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <div>
              <SectionTitle>Company Details</SectionTitle>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                {[
                  ["Company Name", "companyName", "Registered company name"],
                  ["Official Business Email", "email", "business@example.com"],
                  ["Contact Number", "phone", "+971 ..."],
                  ["Industry Type", "industry", "Industry or sector"],
                  ["Company Website", "website", "Optional website"],
                ].map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>{label}</label>
                    <input value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} style={INPUT_STYLE} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Registered Country</label>
                  <div style={{ ...INPUT_STYLE, display: "flex", alignItems: "center", gap: 8, background: C.offWhite, color: C.muted, cursor: "not-allowed" }}>
                    🇦🇪 United Arab Emirates
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>Business Structure</SectionTitle>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Type of Entity</label>
                  <input value={form.entityType} onChange={(e) => update("entityType", e.target.value)} placeholder="LLC / Free Zone / Holding Company / Startup / Agency / Other" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Number of Employees</label>
                  <input value={form.employeeCount} onChange={(e) => update("employeeCount", e.target.value)} type="number" placeholder="e.g. 25" style={INPUT_STYLE} />
                </div>
              </div>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Annual Revenue Range</label>
                  <input value={form.annualRevenue} onChange={(e) => update("annualRevenue", e.target.value)} placeholder="e.g. USD 1M - 5M" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Countries of Operation</label>
                  <input value={form.countriesOfOperation} onChange={(e) => update("countriesOfOperation", e.target.value)} placeholder="List primary markets" style={INPUT_STYLE} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Existing UAE Presence?</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", rowGap: 10 }}>
                  <SelectPill label="Yes" value="yes" active={form.uaePresence === "yes"} onClick={(value) => update("uaePresence", value)} />
                  <SelectPill label="No" value="no" active={form.uaePresence === "no"} onClick={(value) => update("uaePresence", value)} />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>Incorporation & Tax Status</SectionTitle>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Date of Incorporation</label>
                  <input value={form.incorporationDate} onChange={(e) => update("incorporationDate", e.target.value)} type="date" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Place of Incorporation</label>
                  <select value={form.incorporationLocation} onChange={(e) => update("incorporationLocation", e.target.value)} style={SELECT_STYLE}>
                    <option value="">Select an option</option>
                    {INCORPORATION_LOCATION_OPTIONS.map(([label, value]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Do you hold a Corporate Tax TRN?</label>
                  <select value={form.hasCorporateTaxTrn} onChange={(e) => update("hasCorporateTaxTrn", e.target.value)} style={SELECT_STYLE}>
                    <option value="">Select an option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {form.hasCorporateTaxTrn === "yes" && (
                  <div>
                    <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Corporate Tax TRN</label>
                    <input value={form.corporateTaxTrn} onChange={(e) => update("corporateTaxTrn", e.target.value)} placeholder="Corporate Tax registration number" style={INPUT_STYLE} />
                  </div>
                )}
              </div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>
                Informational only — the processing fee is AED 500 if you hold a Corporate Tax TRN, or AED 1,750 if you do not. This app does not process payments.
              </p>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Have you filed a Corporate Tax Return?</label>
                <select value={form.hasFiledCorporateTaxReturn} onChange={(e) => update("hasFiledCorporateTaxReturn", e.target.value)} style={SELECT_STYLE}>
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>
                  Newly incorporated entities that have not yet filed a Corporate Tax Return must be established 12+ months before applying for a TRC.
                </p>
              </div>

              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Do you require TRC under a Tax Treaty, or issued under UAE Domestic law?</label>
                  <select value={form.trcPurpose} onChange={(e) => update("trcPurpose", e.target.value)} style={SELECT_STYLE}>
                    <option value="">Select an option</option>
                    <option value="domestic">UAE Domestic Law</option>
                    <option value="treaty">Tax Treaty</option>
                  </select>
                  <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>
                    Domestic law TRC needs less documentation. Choose Tax Treaty only if you need to claim relief in a specific treaty country.
                  </p>
                </div>
                {form.trcPurpose === "treaty" && (
                  <div>
                    <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Which country's tax treaty is this TRC for?</label>
                    <select value={form.targetTreatyCountry} onChange={(e) => update("targetTreatyCountry", e.target.value)} style={SELECT_STYLE}>
                      <option value="">Select a country</option>
                      {TREATY_COUNTRY_OPTIONS.map(([label, value]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {form.incorporationLocation === "foreign" && (
                <div style={{ marginTop: 14, background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Effective Management &amp; Control in the UAE</div>
                  <div>
                    <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Describe how effective management and control of the company is exercised in the UAE</label>
                    <textarea value={form.effectiveManagementStatement} onChange={(e) => update("effectiveManagementStatement", e.target.value)} placeholder="Where board decisions are made, delegation of authority, shareholder activity, etc." rows={4} style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: SANS }} />
                  </div>
                  <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Are board meetings held in the UAE?</label>
                      <select value={form.boardMeetingsInUae} onChange={(e) => update("boardMeetingsInUae", e.target.value)} style={SELECT_STYLE}>
                        <option value="">Select an option</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Are key decision makers based in the UAE?</label>
                      <select value={form.keyDecisionMakersInUae} onChange={(e) => update("keyDecisionMakersInUae", e.target.value)} style={SELECT_STYLE}>
                        <option value="">Select an option</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionTitle>TRC Requirements</SectionTitle>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Purpose of Corporate TRC</label>
                  <input value={form.purpose} onChange={(e) => update("purpose", e.target.value)} placeholder="Treaty access, banking, procurement, etc." style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Target Jurisdiction</label>
                  <input value={form.targetJurisdiction} onChange={(e) => update("targetJurisdiction", e.target.value)} placeholder="Jurisdiction to support" style={INPUT_STYLE} />
                </div>
              </div>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Compliance Urgency</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", rowGap: 10 }}>
                    {["standard", "urgent", "high"].map((value) => (
                      <SelectPill key={value} label={value === "high" ? "High Priority" : value.charAt(0).toUpperCase() + value.slice(1)} value={value} active={form.urgency === value} onClick={(val) => update("urgency", val)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Current Tax Structure</label>
                  <input value={form.taxStructure} onChange={(e) => update("taxStructure", e.target.value)} placeholder="Current tax framework or entity setup" style={INPUT_STYLE} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Expected Use Case</label>
                <input value={form.useCase} onChange={(e) => update("useCase", e.target.value)} placeholder="Banking, procurement, restructuring, treaty support, etc." style={INPUT_STYLE} />
              </div>
            </div>

            <div>
              <SectionTitle>Account Setup</SectionTitle>
              <div className="corp-eligibility-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Password</label>
                  <input value={form.password} type="password" onChange={(e) => update("password", e.target.value)} placeholder="Create a password" style={INPUT_STYLE} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>At least 8 characters, with uppercase, lowercase, a number, and a special character.</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>Confirm Password</label>
                  <input value={form.confirmPassword} type="password" onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Confirm password" style={INPUT_STYLE} />
                </div>
              </div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, fontSize: 14, color: C.navy, lineHeight: 1.7, flexWrap: "wrap", rowGap: 10 }}>
                <input checked={form.terms} onChange={(e) => update("terms", e.target.checked)} type="checkbox" style={{ marginTop: 4 }} />
                <span>I agree to Terms &amp; Privacy Policy</span>
              </label>
            </div>

            {error && <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.error, borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px", fontSize: 13 }}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "15px 18px", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: RETAIL_THEME.shadows.gold }}>
              {loading ? "Submitting…" : "Submit Corporate Eligibility Request"}
            </button>
          </div>
        </div>
      </div>
    </CorporateAuthShell>
  );
}