// Shared retail eligibility questionnaire components — the QuestionField
// renderer and its presentational helpers, used by both the public signup
// form (src/pages/EligibilityRegistrationPage.jsx) and the in-workspace
// "Edit & Resubmit" flow after a rejection
// (src/retail/pages/RetailEligibilityStatusPage.jsx). Field data/resolvers
// live in the sibling retailQuestionnaireData.js (no JSX there, so Fast
// Refresh doesn't choke on a file mixing components and other exports).
import { RETAIL_THEME as P } from "../config/retailTheme";
import { INPUT_STYLE } from "./retailQuestionnaireData";

const z = P.colors;

export function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: z.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10 }}>{children}</div>;
}

export function SectionCard({ number, title, description, children }) {
  return (
    <div style={{ background: z.offWhite, border: `1px solid ${z.border}`, borderRadius: P.radius.md, padding: "20px 20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${z.gold}, ${z.goldDark})`, color: z.white, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          {number}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: z.navy, letterSpacing: "-.01em" }}>{title}</div>
          {description && <div style={{ fontSize: 12.5, color: z.muted, marginTop: 3, lineHeight: 1.5 }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function OptionButton({ label, value, active, onClick, compact = false }) {
  return (
    <button type="button" className="elig-pill" onClick={() => onClick(value)}
      style={{
        padding: compact ? "10px 14px" : "11px 16px",
        borderRadius: P.radius.sm,
        border: `1.5px solid ${active ? z.gold : z.border}`,
        background: active ? z.gold : z.white,
        color: active ? z.white : z.navy,
        fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", minWidth: 0,
        display: "inline-flex", alignItems: "center", gap: 6,
        boxShadow: active ? "0 2px 8px rgba(201,168,76,.35)" : "none",
      }}>
      {active && <span style={{ fontSize: 11 }}>✓</span>}
      {label}
    </button>
  );
}

export function QuestionField({ question, value, onChange }) {
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
        {question.helpText && <div style={{ fontSize: 11, color: z.muted, marginTop: 6, lineHeight: 1.5 }}>{question.helpText}</div>}
      </div>
    );
  }

  if (question.field_type === "select") {
    const isUrgency = fieldKey === "urgency";
    const opts = question.options
      ? question.options
      : isUrgency
        ? [["Standard", "standard"], ["Urgent", "urgent"], ["High Priority", "high"]]
        : [["Yes", "yes"], ["No", "no"]];
    const compact = isUrgency || opts.length > 2;
    return (
      <div style={isUrgency ? { gridColumn: "1 / -1" } : undefined}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
        <div style={isUrgency ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, max-content))", gap: 10, alignItems: "center" } : { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", rowGap: 10 }}>
          {opts.map(([l, v]) => (
            <OptionButton key={v} label={l} value={v} active={value === v} onClick={v => onChange(fieldKey, v)} compact={compact} />
          ))}
        </div>
        {question.helpText && <div style={{ fontSize: 11, color: z.muted, marginTop: 6, lineHeight: 1.5 }}>{question.helpText}</div>}
      </div>
    );
  }

  if (question.field_type === "dropdown") {
    const opts = question.options || [];
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
        <select className="elig-select" value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} style={INPUT_STYLE}>
          <option value="">{question.placeholder || "Select…"}</option>
          {opts.map(([l, v]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {question.helpText && <div style={{ fontSize: 11, color: z.muted, marginTop: 6, lineHeight: 1.5 }}>{question.helpText}</div>}
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
      <input className="elig-input" value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} type={question.field_type === "number" ? "number" : "text"} placeholder={placeholder} style={INPUT_STYLE} />
      {question.helpText && <div style={{ fontSize: 11, color: z.muted, marginTop: 6, lineHeight: 1.5 }}>{question.helpText}</div>}
    </div>
  );
}
