// Shared retail eligibility questionnaire data — field definitions and
// resolver helpers, used by both the public signup form
// (src/pages/EligibilityRegistrationPage.jsx) and the in-workspace
// "Edit & Resubmit" flow after a rejection
// (src/retail/pages/RetailEligibilityStatusPage.jsx), so the two never
// drift out of sync. Pure data/logic only, no JSX — kept in a plain .js
// file separate from src/eligibility/retailQuestionnaire.jsx (components)
// so React Fast Refresh doesn't choke on a file mixing components and
// non-component exports.
import { RETAIL_THEME as P } from "../config/retailTheme";

const z = P.colors;

export const INPUT_STYLE = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: P.radius.sm,
  border: `1.5px solid ${z.border}`,
  color: z.navy,
  fontFamily: P.fonts.sans,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
};

export function dedupeQuestions(questions = []) {
  const seen = new Set();
  return (questions || []).filter(q => {
    const key = `${String(q.field_key || "").trim().toLowerCase()}::${String(q.question || "").trim().toLowerCase().replace(/\?/g, "").replace(/\s+/g, " ")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Countries UAE has a double taxation avoidance agreement with — used for the
// "Tax Treaty purpose" follow-up dropdown.
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
export const TREATY_COUNTRY_OPTIONS = TREATY_COUNTRIES.map(c => [c, c]);

// Gregorian calendar years selectable for the TRC period. Per the FTA's
// October 2024 TPGTR1 guide update, individuals can now apply mid-period —
// i.e. for the current, still-ongoing year — not just fully completed past
// years. A future year (one that hasn't started yet) is still never valid.
const TRC_PERIOD_YEARS = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));
export const TRC_PERIOD_YEAR_OPTIONS = TRC_PERIOD_YEARS.map(y => [y, y]);

// ─── Eligibility questionnaire — the single source of truth for these
// questions. This intentionally does NOT read from the `assessment_questions`
// DB table (that table has no editor UI, its condition engine can't express
// the branching this form needs, and its seed data is stale/legacy) — these
// arrays are versioned in code and reviewed like any other change.
//
// Fields map to UAE's three independent domestic tax-residency tests
// (Cabinet Decision 85/2022, per the FTA's Tax Resident and TRC guide):
//   1. 183-day physical presence test — day count alone.
//   2. 90-day test — day count + not a tourist visa + (permanent residence OR
//      UAE employment/business).
//   3. Centre of financial & personal interests test — no day minimum.
export const RESIDENCY_QUESTIONS = [
  { id: "currentCountry", field_key: "currentCountry", question: "Current country of residence", field_type: "text", placeholder: "Current residence" },
  { id: "vatRegistered", field_key: "vatRegistered", question: "Do you have a VAT Registration Number in the UAE?", field_type: "select" },
  { id: "trcPeriodYear", field_key: "trcPeriodYear", question: "Period for which the TRC is to be applied for", field_type: "dropdown", options: TRC_PERIOD_YEAR_OPTIONS, placeholder: "Select a year", helpText: "Must align with a full Gregorian calendar year. Mid-period (current year) applications are allowed — a future year is not." },
  { id: "daysInUaePeriod", field_key: "daysInUaePeriod", question: "Approximately how many days were you physically present in the UAE during that period?", field_type: "number", placeholder: "e.g. 183" },
  { id: "uaeVisa", field_key: "uaeVisa", question: "UAE residence visa?", field_type: "select" },
  { id: "emiratesId", field_key: "emiratesId", question: "Emirates ID available?", field_type: "select" },
  { id: "visaType", field_key: "visaType", question: "What type of UAE visa do you currently hold?", field_type: "dropdown", placeholder: "Select visa type", options: [["Employed", "Employed"], ["Dependent Visa", "Dependent Visa"], ["Investor/Partner Visa", "Investor/Partner Visa"], ["Tourist/Visit Visa", "Tourist/Visit Visa"]], helpText: "Tourist/Visit visas do not qualify for the 90-day residency test." },
  { id: "hasPermanentResidence", field_key: "hasPermanentResidence", question: "Do you have a permanent place of residence in the UAE?", field_type: "select", helpText: "e.g. a certified tenancy contract (Ejari) or owned property continuously available to you — not a hotel or short-term stay." },
  { id: "hasUaeEmploymentOrBusiness", field_key: "hasUaeEmploymentOrBusiness", question: "Do you carry on employment or business in the UAE?", field_type: "select" },
  { id: "isCentreOfFinancialPersonalInterests", field_key: "isCentreOfFinancialPersonalInterests", question: "Is the UAE the centre of your financial and personal interests?", field_type: "select", helpText: "Considers where your job, business, investments, and close family/social ties are primarily based." },
  { id: "trcPurpose", field_key: "trcPurpose", question: "Do you require TRC under a Tax Treaty, or issued under UAE Domestic law?", field_type: "select", options: [["UAE Domestic Law", "domestic"], ["Tax Treaty", "treaty"]], helpText: "Domestic law TRC needs less documentation. Choose Tax Treaty only if you need to claim relief in a specific treaty country." },
  { id: "treatyCountry", field_key: "treatyCountry", question: "Which country's tax treaty is this TRC for?", field_type: "dropdown", options: TREATY_COUNTRY_OPTIONS, placeholder: "Select a country", conditional_logic: { showWhen: { field: "trcPurpose", equals: "treaty" } } },
];

export const OCCUPATION_OPTIONS = [
  ["Employee (Full-time)", "employee"],
  ["Business Owner / Self-Employed", "business_owner"],
  ["Investor / Shareholder", "investor"],
  ["Freelancer / Consultant", "freelancer"],
  ["Retired", "retired"],
  ["Not Currently Employed", "not_employed"],
  ["Other", "other"],
];

export const TRC_PURPOSE_USE_OPTIONS = [
  ["Claim Double Taxation Treaty benefits", "treaty_benefit"],
  ["Personal banking requirements", "banking"],
  ["Employment-related tax matters", "employment"],
  ["Business or investment purposes", "business"],
  ["Real estate purposes", "real_estate"],
  ["Other", "other"],
];

export const PROFESSIONAL_QUESTIONS = [
  { id: "occupation", field_key: "occupation", question: "Occupation", field_type: "dropdown", placeholder: "Select your occupation", options: OCCUPATION_OPTIONS },
  { id: "occupationOther", field_key: "occupationOther", question: "Please specify your occupation", field_type: "text", placeholder: "Your role", conditional_logic: { showWhen: { field: "occupation", equals: "other" } } },
  { id: "incomeSource", field_key: "incomeSource", question: "Income source", field_type: "text", placeholder: "Salary, business, investments" },
  { id: "purpose", field_key: "purpose", question: "Purpose of TRC", field_type: "dropdown", placeholder: "Select the purpose", options: TRC_PURPOSE_USE_OPTIONS },
  { id: "purposeOther", field_key: "purposeOther", question: "Please specify the purpose", field_type: "text", placeholder: "Describe your purpose", conditional_logic: { showWhen: { field: "purpose", equals: "other" } } },
  { id: "urgency", field_key: "urgency", question: "Urgency level", field_type: "select" },
];

export const RETAIL_ELIGIBILITY_REQUIRED_FIELDS = ["currentCountry", "vatRegistered", "trcPeriodYear", "daysInUaePeriod", "uaeVisa", "emiratesId", "visaType", "hasPermanentResidence", "hasUaeEmploymentOrBusiness", "isCentreOfFinancialPersonalInterests", "trcPurpose", "occupation", "incomeSource", "purpose", "urgency"];

// Resolves a dropdown code (e.g. "employee", "other") to its human-readable
// label, falling back to a caller-supplied "other" free-text value. Shared by
// the signup submit handler and the resubmit flow so both produce identically
// shaped data for eligibility_requests.occupation / .purpose.
export function resolveOccupation(occupationCode, occupationOther) {
  if (occupationCode === "other") return occupationOther;
  return OCCUPATION_OPTIONS.find(([, v]) => v === occupationCode)?.[0] || occupationCode;
}
export function resolvePurpose(purposeCode, purposeOther) {
  if (purposeCode === "other") return purposeOther;
  return TRC_PURPOSE_USE_OPTIONS.find(([, v]) => v === purposeCode)?.[0] || purposeCode;
}

// Reverse of resolveOccupation/resolvePurpose — used to pre-fill the
// dropdown when editing a previously-submitted (stored-as-label) value. If
// the stored text doesn't match any known option label, falls back to
// "other" so the raw text can be shown in the free-text follow-up field.
export function codeForOccupationLabel(label) {
  if (!label) return { code: "", other: "" };
  const match = OCCUPATION_OPTIONS.find(([l]) => l === label);
  return match ? { code: match[1], other: "" } : { code: "other", other: label };
}
export function codeForPurposeLabel(label) {
  if (!label) return { code: "", other: "" };
  const match = TRC_PURPOSE_USE_OPTIONS.find(([l]) => l === label);
  return match ? { code: match[1], other: "" } : { code: "other", other: label };
}
