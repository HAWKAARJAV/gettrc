// UAEPage.jsx — legacy /uae marketing page (no live nav link points here,
// only reachable by typing the URL directly).
// Extracted from TRCConnectApp.jsx so it lazy-loads as its own chunk.
import { useState, useRef } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "../supabaseClient";
import { C } from "../theme/marketingColors";

// ── Local copies of small helpers also used elsewhere in TRCConnectApp.jsx —
// duplicated here since they're trivial and only shared with one or two
// other places. ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <span style={{fontSize:12,fontWeight:700,color:"#C9A84C",textTransform:"uppercase",
      letterSpacing:".12em",display:"block",marginBottom:12}}>
      {children}
    </span>
  );
}

function SectionTitle({ children, light=false }) {
  return (
    <h2 style={{fontFamily:"'Cormorant Garamond',serif",
      fontSize:"clamp(28px,3.5vw,42px)",fontWeight:700,
      color:light?"#FFFFFF":"#0F2557",letterSpacing:"-.02em",lineHeight:1.15}}>
      {children}
    </h2>
  );
}

function StarRating({ rating }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? C.gold : "#D1D5DB"}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function Chip({ children, bg="#EEF2FF", color="#3730A3" }) {
  return (
    <span style={{background:bg,color,fontSize:11,fontWeight:600,
      padding:"3px 9px",borderRadius:20,letterSpacing:".03em",whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}

function AppFooter() {
  return (
    <footer style={{ background: C.navyDark, padding: "64px 24px 32px", color: "rgba(255,255,255,0.7)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 64, marginBottom: 48, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚖</div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.white }}>TRC<span style={{ color: C.gold, fontWeight: 400 }}> Connect</span></span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: 220 }}>
              The trusted global platform connecting individuals with verified local tax residency specialists.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>Platform</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["How It Works", "Find an Advisor", "Pricing", "Dashboard", "Advisor Portal"].map(item => (
                <a key={item} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = C.gold}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >{item}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Compliance"].map(item => (
                <a key={item} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = C.gold}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >{item}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2025 TRC Connect Ltd. All rights reserved. Not a licensed tax advisory firm.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Regulated advisors only · Secure escrow · End-to-end encrypted</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── SHARED DATA ─────────────────────────────────────────────────── */

const UAE_ADVISORS = [
  {
    id: 1,
    name: "Amira Al-Rashid",
    title: "Senior Tax Consultant · Big 4 Alumni",
    initials: "AA",
    rating: 4.9,
    reviews: 127,
    completions: 340,
    turnaround: "3–5 business days",
    fee: "AED 1,299",
    usdFee: "~$354",
    languages: ["English", "Arabic"],
    specialties: ["Free Zone TRC", "Double Tax Treaties", "OECD Compliance"],
    firms: ["KPMG UAE (former)", "Independent since 2019"],
    available: true,
    badge: "Top Rated",
  },
  {
    id: 2,
    name: "Khalid Al-Mansouri",
    title: "Chartered Tax Advisor · FTA Registered",
    initials: "KA",
    rating: 4.8,
    reviews: 98,
    completions: 211,
    turnaround: "5–7 business days",
    fee: "AED 999",
    usdFee: "~$272",
    languages: ["English", "Arabic", "Urdu"],
    specialties: ["Mainland TRC", "VAT & TRC Bundling", "Expatriate Tax"],
    firms: ["Al-Mansouri Tax Advisory", "FTA Certified"],
    available: true,
    badge: "Best Value",
  },
  {
    id: 3,
    name: "Sarah Thompson",
    title: "International Tax Specialist · CTA",
    initials: "ST",
    rating: 4.7,
    reviews: 74,
    completions: 158,
    turnaround: "4–6 business days",
    fee: "AED 1,499",
    usdFee: "~$408",
    languages: ["English", "French"],
    specialties: ["UK–UAE DTA", "Golden Visa + TRC", "HNWI Tax Planning"],
    firms: ["Thompson & Associates DMCC"],
    available: false,
    badge: "Premium",
  },
];

const UAE_ELIGIBILITY = [
  {
    title: "UAE Residency Visa",
    detail: "A valid UAE residency visa (employment, investor, family, or Golden Visa) is mandatory. Tourist visas do not qualify.",
    icon: "🪪",
    required: true,
  },
  {
    title: "183+ Days Physical Presence",
    detail: "You must have spent at least 183 days in the UAE during the relevant tax year (calendar or fiscal, depending on your home country's treaty).",
    icon: "📅",
    required: true,
  },
  {
    title: "Registered Address in UAE",
    detail: "A valid UAE residential address (tenancy contract, Ejari registration) registered with your emirate's authorities.",
    icon: "🏠",
    required: true,
  },
  {
    title: "Active Emirates ID",
    detail: "A non-expired Emirates ID card is required for the FTA filing. Ensure it reflects your current address.",
    icon: "💳",
    required: true,
  },
  {
    title: "Source of Income (Optional but Recommended)",
    detail: "Employment contract, trade license, or investment proof strengthens your application and is required by some treaty partners.",
    icon: "💼",
    required: false,
  },
  {
    title: "Bank Account in UAE",
    detail: "A UAE-based bank account in your name evidences economic ties. Statements for the full year are recommended.",
    icon: "🏦",
    required: false,
  },
];

const UAE_DOCUMENTS = [
  { label: "Completed FTA TRC Application Form", category: "Government", mandatory: true },
  { label: "Copy of valid Passport (all pages)", category: "Identity", mandatory: true },
  { label: "Emirates ID (front & back)", category: "Identity", mandatory: true },
  { label: "UAE Residency Visa copy", category: "Residency", mandatory: true },
  { label: "Ejari-registered Tenancy Contract or Title Deed", category: "Residency", mandatory: true },
  { label: "Entry/Exit stamps or travel history (GDRFA report)", category: "Presence", mandatory: true },
  { label: "Official request letter addressed to FTA", category: "Government", mandatory: true },
  { label: "Employment Contract or Trade License (for employed/business)", category: "Income", mandatory: false },
  { label: "UAE Bank account statements (12 months)", category: "Financial", mandatory: false },
  { label: "Utility bill in your name", category: "Residency", mandatory: false },
  { label: "Salary certificates / payslips (last 3 months)", category: "Income", mandatory: false },
  { label: "Proof of Golden Visa / investor status (if applicable)", category: "Special", mandatory: false },
];

const UAE_TIMELINE = [
  { day: "Day 1", label: "Document Collection", desc: "Advisor reviews your documents and identifies any gaps. Missing items are requested within 24 hours.", color: C.gold },
  { day: "Day 2–3", label: "Application Preparation", desc: "Advisor drafts the official FTA request letter and compiles the complete submission package.", color: C.navyLight },
  { day: "Day 4–5", label: "FTA Submission", desc: "Application submitted to UAE Federal Tax Authority via the EmaraTax portal under your advisor's registered account.", color: C.navyLight },
  { day: "Day 6–10", label: "FTA Processing", desc: "The FTA reviews your application. Our advisors follow up on status updates and respond to any queries promptly.", color: C.navyLight },
  { day: "Day 10–14", label: "Certificate Issued", desc: "Approved TRC delivered digitally. Physical stamped copies arranged upon request for an additional fee.", color: C.success },
];

const UAE_GOV_FEES = [
  { item: "FTA TRC Application Fee", amount: "AED 2,000", note: "Per application, paid to Federal Tax Authority", mandatory: true },
  { item: "EmaraTax Portal Fee", amount: "AED 0", note: "No charge for portal registration", mandatory: true },
  { item: "Translation & Notarisation (if required)", amount: "AED 300–600", note: "Depends on documents; arranged by advisor", mandatory: false },
  { item: "Physical Stamped Copy", amount: "AED 150", note: "Optional; digital TRC is legally valid", mandatory: false },
  { item: "Advisor Service Fee", amount: "From AED 999", note: "Quoted upfront, held in escrow until delivery", mandatory: true },
];

function UAEAdvisorCard({ a, onBook }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        borderRadius: 18,
        border: `1.5px solid ${hov ? C.gold : C.border}`,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        transition: "all 0.25s ease",
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov ? "0 20px 48px rgba(15,37,87,0.12)" : "0 2px 12px rgba(15,37,87,0.06)",
        cursor: "default",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 700, color: C.white, letterSpacing: "0.05em", flexShrink: 0,
          }}>{a.initials}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>{a.name}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={C.gold}>
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, marginTop: 2 }}>{a.title}</p>
          </div>
        </div>
        <div style={{
          background: a.badge === "Top Rated" ? "#FEF3C7" : a.badge === "Best Value" ? C.successBg : "#EEF2FF",
          color: a.badge === "Top Rated" ? C.warnText : a.badge === "Best Value" ? C.success : "#3730A3",
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>
          {a.badge}
        </div>
      </div>

      {/* Rating */}
      <div>
        <StarRating rating={a.rating} />
        <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{a.reviews} verified reviews · {a.completions} TRCs completed</p>
      </div>

      {/* Specialties */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {a.specialties.map(s => <Chip key={s}>{s}</Chip>)}
      </div>

      {/* Languages */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Languages:</span>
        {a.languages.map(l => (
          <span key={l} style={{ fontSize: 12, color: C.navy, fontWeight: 600, background: C.offWhite, padding: "2px 8px", borderRadius: 6 }}>{l}</span>
        ))}
      </div>

      {/* Divider row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Turnaround</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: "2px 0 0" }}>{a.turnaround}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: C.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Advisor Fee</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: C.gold, margin: "2px 0 0", fontFamily: "'Cormorant Garamond', serif" }}>{a.fee}</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{a.usdFee}</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onBook(a)}
          style={{
            flex: 1,
            background: hov ? C.navy : "transparent",
            color: hov ? C.white : C.navy,
            border: `1.5px solid ${C.navy}`,
            borderRadius: 10,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {a.available ? "Request a Quote" : "Join Waitlist"}
        </button>
        {!a.available && (
          <div style={{
            padding: "11px 14px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            fontSize: 12,
            color: "#991B1B",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}>
            🔴 Full
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── BOOKING FORM ─────────────────────────────────────────────────── */


function BookingForm({ preselected, onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    advisor: preselected?.name || "",
    residency: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.message.trim()) e.message = "Required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          full_name:        form.name,
          email:            form.email,
          phone:            form.phone,
          country:          "UAE",
          advisor_name:     form.advisor,
          residency_status: form.residency,
          message:          form.message,
          status:           "new",
        })
      });
      setLoading(false);
      if (!res.ok) {
        const err = await res.text();
        console.error("Supabase error:", err);
        setErrors({ message: "Something went wrong. Please try again." });
        return;
      }
      // Send email notification
      try {
        await fetch("/api/sendInquiryEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:    form.name,
            email:   form.email,
            country: "UAE",
            message: form.message,
          }),
        });
      } catch(e) {
        // Email failed silently - form still succeeds
        console.log("Email notification failed:", e);
      }
      setSubmitted(true);
    } catch(e) {
      setLoading(false);
      setErrors({ message: "Network error. Please try again." });
    }
  };

  const inputStyle = (err) => ({
    width: "100%",
    background: C.white,
    border: `1.5px solid ${err ? "#F87171" : C.border}`,
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 15,
    color: C.navy,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  });

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "48px 32px" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Inquiry Submitted!</h3>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px" }}>
        Your advisor will respond within <strong>4 business hours</strong>. Check your inbox at <strong>{form.email}</strong> for confirmation.
      </p>
      <button onClick={onClose} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Done
      </button>
    </div>
  );

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = errors.name ? "#F87171" : C.border}
            placeholder="Your full name" style={inputStyle(errors.name)} />
          {errors.name && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{errors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input value={form.email} onChange={e => set("email", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = errors.email ? "#F87171" : C.border}
            placeholder="you@example.com" style={inputStyle(errors.email)} />
          {errors.email && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{errors.email}</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Phone (Optional)</label>
          <input value={form.phone} onChange={e => set("phone", e.target.value)}
            onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
            placeholder="+971 50 000 0000" style={inputStyle(false)} />
        </div>
        <div>
          <label style={labelStyle}>Preferred Advisor</label>
          <select value={form.advisor} onChange={e => set("advisor", e.target.value)}
            style={{ ...inputStyle(false), appearance: "none", cursor: "pointer" }}>
            <option value="">No preference</option>
            {UAE_ADVISORS.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Current Residency Status</label>
        <select value={form.residency} onChange={e => set("residency", e.target.value)}
          style={{ ...inputStyle(false), appearance: "none", cursor: "pointer" }}>
          <option value="">Select your visa type...</option>
          <option value="employment">Employment Visa</option>
          <option value="investor">Investor / Business Visa</option>
          <option value="golden">Golden Visa (5 or 10-year)</option>
          <option value="family">Family / Dependent Visa</option>
          <option value="freelance">Freelance Permit</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Tell us about your TRC requirement *</label>
        <textarea value={form.message} onChange={e => set("message", e.target.value)}
          onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = errors.message ? "#F87171" : C.border}
          placeholder="Describe your situation — e.g. which country is requesting the TRC, your visa type, and any specific treaty requirements..."
          rows={4}
          style={{ ...inputStyle(errors.message), resize: "vertical", lineHeight: 1.6 }} />
        {errors.message && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{errors.message}</p>}
      </div>

      <div style={{ background: C.warnBg, border: `1px solid #FDE68A`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: 13, color: C.warnText, lineHeight: 1.6, margin: 0 }}>
          Your information is encrypted and only shared with your chosen advisor. We never sell data to third parties.
          Advisor fees are held in <strong>secure escrow</strong> until your TRC is delivered.
        </p>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{
        width: "100%",
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
        color: C.white,
        border: "none",
        borderRadius: 12,
        padding: "16px",
        fontSize: 16,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        letterSpacing: "0.02em",
        boxShadow: "0 8px 28px rgba(201,168,76,0.35)",
        transition: "all 0.2s ease",
        opacity: loading ? 0.8 : 1,
      }}>
        {loading ? "Submitting…" : "Submit Inquiry →"}
      </button>
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */


/* ─── MAIN PAGE ────────────────────────────────────────────────────── */

export default function UAEPage() {
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const formRef = useRef(null);

  const toggleDoc = (i) => setCheckedDocs(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const scrollToForm = (advisor) => {
    setBookingAdvisor(advisor);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const mandatoryDocs = UAE_DOCUMENTS.filter(d => d.mandatory);
  const optionalDocs = UAE_DOCUMENTS.filter(d => !d.mandatory);
  const displayDocs = activeTab === "mandatory" ? mandatoryDocs : activeTab === "optional" ? optionalDocs : UAE_DOCUMENTS;
  const mandatoryChecked = mandatoryDocs.filter((_, i) => checkedDocs.has(UAE_DOCUMENTS.indexOf(UAE_DOCUMENTS.find(d => d.label === _.label)))).length;
  const checklistProgress = Math.round((checkedDocs.size / UAE_DOCUMENTS.length) * 100);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.navy, background: C.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${C.gold}33; }
        .doc-row:hover { background: #FAFBFF !important; }
        .elig-card:hover { border-color: ${C.gold} !important; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(15,37,87,0.09) !important; }
        .timeline-step:hover .tl-dot { background: ${C.gold} !important; }
        .hide-mobile { display: flex; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .hero-breadcrumb { flex-wrap: wrap; }
        }
      `}</style>

      

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 50%, #1A3A72 100%)`,
        padding: "130px 24px 90px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Deco */}
        <div style={{ position: "absolute", top: "5%", right: "-8%", width: 700, height: 700, background: `radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(${C.white} 1px, transparent 1px), linear-gradient(90deg, ${C.white} 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div className="hero-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
            <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Home</a>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>/</span>
            <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Countries</a>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: C.goldLight, fontWeight: 600 }}>United Arab Emirates</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 80, alignItems: "center" }} className="two-col">
            {/* Left */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <span style={{ fontSize: 56, lineHeight: 1 }}>🇦🇪</span>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 24, padding: "5px 14px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: C.goldLight, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>UAE · Federal Tax Authority</span>
                  </div>
                </div>
              </div>

              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(38px, 5vw, 60px)",
                fontWeight: 700, color: C.white, lineHeight: 1.1,
                letterSpacing: "-0.02em", marginBottom: 22,
              }}>
                UAE Tax Residency<br />
                <span style={{ color: C.gold, fontStyle: "italic" }}>Certificate</span> Service
              </h1>

              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 36, maxWidth: 500, fontWeight: 300 }}>
                Obtain your official UAE TRC from the Federal Tax Authority. Issued under the UAE Cabinet Resolution No. 85 of 2022 — valid for all tax treaty purposes with 130+ partner countries.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
                <button onClick={() => scrollToForm(null)} style={{
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: C.white, border: "none", borderRadius: 12, padding: "15px 30px",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
                  boxShadow: "0 8px 28px rgba(201,168,76,0.45)",
                }}>Find an Advisor →</button>
                <button style={{
                  background: "rgba(255,255,255,0.08)", color: C.white,
                  border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "15px 30px",
                  fontSize: 15, fontWeight: 500, cursor: "pointer",
                }}>View Requirements</button>
              </div>

              {/* Key facts pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { icon: "⚡", text: "From 3 business days" },
                  { icon: "🏛", text: "FTA-issued & stamped" },
                  { icon: "🌍", text: "Valid in 130+ countries" },
                  { icon: "💱", text: "AED 2,000 gov fee" },
                ].map(p => (
                  <div key={p.text} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10, padding: "8px 14px",
                    fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500,
                  }}>
                    <span>{p.icon}</span>{p.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — TRC overview card */}
            <div style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: 22,
              padding: 32,
              backdropFilter: "blur(16px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>
                TRC at a Glance
              </p>
              {[
                { label: "Issuing Authority", value: "UAE Federal Tax Authority (FTA)" },
                { label: "Legal Basis", value: "Cabinet Resolution 85/2022" },
                { label: "Validity", value: "1 calendar year (renewable)" },
                { label: "Processing Time", value: "3–14 business days" },
                { label: "Government Fee", value: "AED 2,000 (~$545)" },
                { label: "Eligible Visas", value: "Employment, Investor, Golden, Family" },
                { label: "Treaty Partners", value: "130+ countries" },
                { label: "Format", value: "Digital (EmaraTax) + Optional physical" },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: C.white, fontWeight: 600, textAlign: "right" }}>{row.value}</span>
                </div>
              ))}
              <button onClick={() => scrollToForm(null)} style={{
                width: "100%", marginTop: 20,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: C.white, border: "none", borderRadius: 11, padding: "14px",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(201,168,76,0.35)",
              }}>Check Eligibility Today →</button>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 50" fill={C.white} xmlns="http://www.w3.org/2000/svg">
            <path d="M0,25 C360,50 1080,0 1440,25 L1440,50 L0,50 Z" />
          </svg>
        </div>
      </section>

      {/* ── UAE_ELIGIBILITY ── */}
      <section id="countries" style={{ background: C.white, padding: "90px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>Who Qualifies</SectionLabel>
            <SectionTitle>UAE TRC Eligibility Criteria</SectionTitle>
            <p style={{ fontSize: 16, color: C.muted, marginTop: 14, maxWidth: 520, margin: "14px auto 0", lineHeight: 1.7 }}>
              The UAE FTA assesses all criteria holistically. Meeting the mandatory items is essential; optional indicators strengthen your application.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 20 }}>
            {UAE_ELIGIBILITY.map((e, i) => (
              <div key={i} className="elig-card" style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "26px 28px",
                display: "flex",
                gap: 18,
                transition: "all 0.22s ease",
                boxShadow: "0 2px 12px rgba(15,37,87,0.05)",
                cursor: "default",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: e.required ? `${C.navy}12` : C.offWhite,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{e.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{e.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      background: e.required ? "#FEE2E2" : "#D1FAE5",
                      color: e.required ? "#991B1B" : C.success,
                    }}>{e.required ? "Required" : "Recommended"}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{e.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 36,
            background: `linear-gradient(135deg, ${C.navy}08, ${C.navy}04)`,
            border: `1px solid ${C.navy}20`,
            borderLeft: `4px solid ${C.gold}`,
            borderRadius: "0 12px 12px 0",
            padding: "18px 24px",
          }}>
            <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.7 }}>
              <strong>Important:</strong> The UAE FTA has discretion to request additional supporting documents. Our advisors conduct a pre-submission review to ensure your application is complete before filing — minimising delays and rejection risk.
            </p>
          </div>
        </div>
      </section>

      {/* ── UAE_DOCUMENTS CHECKLIST ── */}
      <section id="resources" style={{ background: C.offWhite, padding: "90px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
            <div>
              <SectionLabel>Document Checklist</SectionLabel>
              <SectionTitle>Required Documents</SectionTitle>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 12, maxWidth: 500, lineHeight: 1.7 }}>
                Tick off documents as you gather them. Green = mandatory for all applications.
              </p>
            </div>

            {/* Progress widget */}
            <div style={{
              background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
              padding: "18px 24px", minWidth: 200, boxShadow: "0 2px 12px rgba(15,37,87,0.06)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Your Progress</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: C.gold }}>{checkedDocs.size}</span>
                <span style={{ fontSize: 14, color: C.muted }}>/ {UAE_DOCUMENTS.length}</span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${checklistProgress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`, borderRadius: 999, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ fontSize: 12, color: checkedDocs.size === UAE_DOCUMENTS.length ? C.success : C.muted, marginTop: 8, fontWeight: 600 }}>
                {checkedDocs.size === UAE_DOCUMENTS.length ? "✅ All docs ready!" : `${UAE_DOCUMENTS.length - checkedDocs.size} remaining`}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.border + "66", borderRadius: 12, padding: 4, width: "fit-content" }}>
            {[["all", "All Documents"], ["mandatory", "Mandatory"], ["optional", "Recommended"]].map(([k, l]) => (
              <button key={k} onClick={() => setActiveTab(k)} style={{
                background: activeTab === k ? C.white : "transparent",
                color: activeTab === k ? C.navy : C.muted,
                border: "none", borderRadius: 9, padding: "8px 18px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: activeTab === k ? "0 1px 4px rgba(15,37,87,0.1)" : "none",
                transition: "all 0.2s",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(15,37,87,0.05)" }}>
            {displayDocs.map((doc, idx) => {
              const realIdx = UAE_DOCUMENTS.findIndex(d => d.label === doc.label);
              const checked = checkedDocs.has(realIdx);
              return (
                <div
                  key={doc.label}
                  className="doc-row"
                  onClick={() => toggleDoc(realIdx)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 24px",
                    borderBottom: idx < displayDocs.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer",
                    background: checked ? "#F0FDF4" : C.white,
                    transition: "background 0.15s",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${checked ? C.success : C.border}`,
                    background: checked ? C.success : C.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: checked ? 500 : 400, color: checked ? C.success : C.navy, textDecoration: checked ? "line-through" : "none", textDecorationColor: C.success + "88" }}>
                      {doc.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                      background: doc.category === "Identity" ? "#EEF2FF" : doc.category === "Residency" ? "#F0FDF4" : doc.category === "Government" ? "#FEF3C7" : doc.category === "Income" ? "#F5F3FF" : "#F1F5F9",
                      color: doc.category === "Identity" ? "#3730A3" : doc.category === "Residency" ? "#065F46" : doc.category === "Government" ? "#92400E" : doc.category === "Income" ? "#5B21B6" : "#475569",
                    }}>{doc.category}</span>
                    {doc.mandatory && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: "#FEE2E2", color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Required</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ADVISORS ── */}
      <section id="pricing" style={{ background: C.white, padding: "90px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
            <div>
              <SectionLabel>UAE Specialists</SectionLabel>
              <SectionTitle>Local Verified Advisors</SectionTitle>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 12, maxWidth: 480, lineHeight: 1.7 }}>
                All advisors are FTA-registered, background-checked, and hold current UAE tax practitioner licences.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.successBg, border: `1px solid #A7F3D0`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>3 advisors available now</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {UAE_ADVISORS.map(a => <UAEAdvisorCard key={a.id} a={a} onBook={scrollToForm} />)}
          </div>
        </div>
      </section>

      {/* ── UAE_TIMELINE + FEES ── */}
      <section id="about" style={{ background: C.offWhite, padding: "90px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="two-col">

            {/* Timeline */}
            <div>
              <SectionLabel>Estimated Timeline</SectionLabel>
              <SectionTitle>From Application to Certificate</SectionTitle>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 14, marginBottom: 40, lineHeight: 1.7 }}>
                Timelines depend on document completeness and FTA processing load. Expedited service available on request.
              </p>

              <div style={{ position: "relative", paddingLeft: 28 }}>
                {/* Vertical line */}
                <div style={{ position: "absolute", left: 9, top: 10, bottom: 10, width: 2, background: `linear-gradient(to bottom, ${C.gold}, ${C.navyLight}90)`, borderRadius: 2 }} />

                {UAE_TIMELINE.map((t, i) => (
                  <div key={t.day} className="timeline-step" style={{ position: "relative", marginBottom: i < UAE_TIMELINE.length - 1 ? 32 : 0 }}>
                    {/* Dot */}
                    <div className="tl-dot" style={{
                      position: "absolute", left: -24, top: 4,
                      width: 16, height: 16, borderRadius: "50%",
                      background: i === 0 ? C.gold : i === UAE_TIMELINE.length - 1 ? C.success : C.border,
                      border: `3px solid ${C.white}`,
                      boxShadow: `0 0 0 2px ${i === 0 ? C.gold : i === UAE_TIMELINE.length - 1 ? C.success : C.border}`,
                      transition: "background 0.2s",
                    }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.day}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{t.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div>
              <SectionLabel>Cost Transparency</SectionLabel>
              <SectionTitle>Government Fee Breakdown</SectionTitle>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 14, marginBottom: 40, lineHeight: 1.7 }}>
                All fees disclosed upfront. No hidden charges. Government fees are separate from advisor service fees and paid directly to the FTA.
              </p>

              <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(15,37,87,0.05)" }}>
                {UAE_GOV_FEES.map((row, i) => (
                  <div key={row.item} style={{
                    padding: "18px 24px",
                    borderBottom: i < UAE_GOV_FEES.length - 1 ? `1px solid ${C.border}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{row.item}</span>
                        {!row.mandatory && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: C.offWhite, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Optional</span>}
                      </div>
                      <p style={{ fontSize: 12, color: C.muted }}>{row.note}</p>
                    </div>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 18, fontWeight: 700,
                      color: row.amount === "AED 0" ? C.success : C.navy,
                      textAlign: "right", flexShrink: 0,
                    }}>
                      {row.amount}
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  padding: "20px 24px",
                  background: `linear-gradient(135deg, ${C.navy}08, ${C.navy}04)`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Estimated Total (Typical Application)</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Government fee + advisor fee. Excludes optional items.</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 800, color: C.gold }}>AED 3,000+</p>
                    <p style={{ fontSize: 12, color: C.muted }}>~$817 USD</p>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 20,
                background: C.successBg,
                border: `1px solid #A7F3D0`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18 }}>🛡</span>
                <p style={{ fontSize: 13, color: "#065F46", lineHeight: 1.65 }}>
                  <strong>Escrow protected:</strong> Advisor fees are held in secure escrow and only released upon successful TRC delivery. No delivery, no payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING FORM ── */}
      <section ref={formRef} style={{ background: C.white, padding: "90px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel>Start Your Application</SectionLabel>
            <SectionTitle>Request a Quote or Book an Advisor</SectionTitle>
            <p style={{ fontSize: 16, color: C.muted, marginTop: 14, maxWidth: 520, margin: "14px auto 0", lineHeight: 1.7 }}>
              Fill in your details below and a verified UAE tax advisor will respond within 4 business hours with a personalised quote.
            </p>
          </div>

          <div style={{
            background: C.white,
            borderRadius: 24,
            border: `1px solid ${C.border}`,
            boxShadow: "0 8px 48px rgba(15,37,87,0.09)",
            overflow: "hidden",
          }}>
            {/* Top bar */}
            <div style={{
              background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`,
              padding: "24px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>🇦🇪</span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: C.white, fontFamily: "'Cormorant Garamond', serif" }}>UAE TRC Inquiry</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Federal Tax Authority · EmaraTax Portal</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: "🔒", label: "Encrypted" },
                  { icon: "🛡", label: "Escrow" },
                  { icon: "⚡", label: "4hr response" },
                ].map(b => (
                  <div key={b.label} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8, padding: "6px 12px",
                    fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600,
                  }}>
                    <span>{b.icon}</span>{b.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "36px 36px 40px" }}>
              <BookingForm
                preselected={bookingAdvisor}
                onClose={() => setBookingAdvisor(null)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ background: C.navy, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
            {[
              { n: "340+", l: "UAE TRCs Issued" },
              { n: "3", l: "Verified UAE Advisors" },
              { n: "98%", l: "Approval Rate" },
              { n: "4.8★", l: "Avg. Advisor Rating" },
              { n: "AED 0", l: "Hidden Fees" },
            ].map((s, i) => (
              <div key={s.l} style={{
                display: "flex", alignItems: "center", gap: i < 4 ? 32 : 0,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 800, color: C.gold }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>{s.l}</div>
                </div>
                {i < 4 && <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.12)" }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AppFooter/>
    </div>
  );
}
