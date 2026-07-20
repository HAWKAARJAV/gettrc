// MarketplacePage.jsx — legacy /marketplace advisor-browsing page (no live
// nav link points here, only reachable by typing the URL directly).
// Extracted from TRCConnectApp.jsx so it lazy-loads as its own chunk.
import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../theme/marketingColors";

function Stars({ rating, size=13 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:3}}>
      {[1,2,3,4,5].map(s=>(
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s<=Math.round(rating)?"#C9A84C":"#DDE3EE"}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}

const ALL_ADVISORS = [
  {
    id: 1, name: "Amira Al-Rashid", initials: "AA", title: "Senior Tax Consultant · Big 4 Alumni",
    country: "UAE", countryCode: "AE", flag: "🇦🇪", rating: 4.9, reviews: 127, completions: 340,
    languages: ["English", "Arabic"], turnaround: 3, turnaroundLabel: "3–5 days",
    feeAED: 1299, feeUSD: 354, feeLabel: "$354", specialties: ["Free Zone TRC", "DTA Treaties", "OECD Compliance"],
    available: true, badge: "Top Rated", verified: true,
    bio: "Former KPMG UAE partner with 14+ years specialising in UAE TRC and double-tax treaty applications for HNWIs and corporates.",
  },
  {
    id: 2, name: "Rashid Al-Mansoori", initials: "RM", title: "Corporate Tax Advisor · FTA Registered",
    country: "UAE", countryCode: "AE", flag: "🇦🇪", rating: 4.8, reviews: 94, completions: 218,
    languages: ["English", "Arabic"], turnaround: 5, turnaroundLabel: "5–7 days",
    feeAED: null, feeUSD: 349, feeLabel: "$349", specialties: ["Corporate TRC", "Free Zone Setup", "OECD Compliance"],
    available: true, badge: null, verified: true,
    bio: "Dubai-based tax advisor with a decade of FTA-registered practice advising corporates on UAE TRC and free zone structuring.",
  },
  {
    id: 3, name: "Priya Nair", initials: "PN", title: "Chartered Tax Practitioner · UAE Registered",
    country: "UAE", countryCode: "AE", flag: "🇦🇪", rating: 5.0, reviews: 62, completions: 189,
    languages: ["English", "Tamil", "Hindi"], turnaround: 2, turnaroundLabel: "2–4 days",
    feeAED: null, feeUSD: 279, feeLabel: "$279", specialties: ["TRC Applications", "DTA Claims", "Expatriate Tax"],
    available: true, badge: "Fastest", verified: true,
    bio: "Dubai-based CTA with deep expertise in UAE TRC applications and cross-border individual tax planning.",
  },
  {
    id: 4, name: "Marcus Vella", initials: "MV", title: "Tax Residency Specialist · UAE Registered",
    country: "UAE", countryCode: "AE", flag: "🇦🇪", rating: 4.7, reviews: 88, completions: 156,
    languages: ["English", "Italian"], turnaround: 7, turnaroundLabel: "7–10 days",
    feeAED: null, feeUSD: 399, feeLabel: "$399", specialties: ["UAE TRC", "Free Zone TRC", "Nomad Residency"],
    available: true, badge: "Premium", verified: true,
    bio: "Abu Dhabi-based practitioner with exclusive focus on UAE TRC applications for both individual and corporate applicants.",
  },
];

const LANGUAGES_LIST  = [...new Set(ALL_ADVISORS.flatMap(a => a.languages))].sort();
const SORT_OPTIONS    = [
  { key: "rating",     label: "Highest Rated" },
  { key: "price_asc",  label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "turnaround", label: "Fastest First" },
];

/* ─── HELPERS ───────────────────────────────────────────────────── */

function Tag({ label, value, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: hov ? `${C.gold}22` : `${C.gold}14`,
        border: `1px solid ${C.gold}55`,
        color: C.goldDark, borderRadius: 20,
        fontSize: 12, fontWeight: 600, padding: "4px 10px 4px 12px",
        transition: "all 0.15s", cursor: "default",
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <span style={{ color: C.muted, fontWeight: 400, marginRight: 1 }}>{label}:</span>
      {value}
      <button onClick={onRemove}
        style={{
          background: hov ? `${C.gold}44` : "transparent",
          border: "none", cursor: "pointer", borderRadius: "50%",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
          color: C.goldDark, padding: 0, fontSize: 14, lineHeight: 1, transition: "background 0.15s",
        }}>×</button>
    </span>
  );
}

/* ─── FILTER SECTION (collapsible) ─────────────────────────────── */

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: open ? 20 : 0 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer",
          padding: "18px 0 14px", color: C.navy,
        }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.navy }}>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{
        overflow: "hidden", maxHeight: open ? 600 : 0,
        transition: "max-height 0.3s ease", opacity: open ? 1 : 0,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─── PRICE RANGE SLIDER ────────────────────────────────────────── */

function PriceRange({ min, max, value, onChange }) {
  const trackRef = useRef(null);
  const pctLo = ((value[0] - min) / (max - min)) * 100;
  const pctHi = ((value[1] - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>${value[0]}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>${value[1]}</span>
      </div>
      <div ref={trackRef} style={{ position: "relative", height: 4, background: C.border, borderRadius: 999, marginBottom: 6 }}>
        <div style={{
          position: "absolute", height: "100%", borderRadius: 999,
          left: `${pctLo}%`, right: `${100 - pctHi}%`,
          background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`,
        }}/>
        {/* Low thumb */}
        <input type="range" min={min} max={max} value={value[0]} step={10}
          onChange={e => { const v = +e.target.value; if (v < value[1] - 50) onChange([v, value[1]]); }}
          style={{ position: "absolute", width: "100%", inset: 0, opacity: 0, cursor: "pointer", height: "100%", zIndex: 2 }}/>
        {/* High thumb */}
        <input type="range" min={min} max={max} value={value[1]} step={10}
          onChange={e => { const v = +e.target.value; if (v > value[0] + 50) onChange([value[0], v]); }}
          style={{ position: "absolute", width: "100%", inset: 0, opacity: 0, cursor: "pointer", height: "100%", zIndex: 2 }}/>
        {/* Visual thumbs */}
        <div style={{ position: "absolute", left: `${pctLo}%`, top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: C.white, border: `2.5px solid ${C.gold}`, boxShadow: "0 1px 4px rgba(15,37,87,0.2)", zIndex: 1, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", left: `${pctHi}%`, top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: C.white, border: `2.5px solid ${C.gold}`, boxShadow: "0 1px 4px rgba(15,37,87,0.2)", zIndex: 1, pointerEvents: "none" }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.muted }}>${min}</span>
        <span style={{ fontSize: 11, color: C.muted }}>${max}</span>
      </div>
    </div>
  );
}

/* ─── ADVISOR CARD ──────────────────────────────────────────────── */

function MktAdvisorCard({ advisor, onQuote, viewMode }) {
  const [hov, setHov] = useState(false);
  const isGrid = viewMode === "grid";

  const badgeStyle = (badge) => {
    if (badge === "Top Rated") return { bg: "#FEF3C7", color: "#92400E" };
    if (badge === "Best Value") return { bg: C.successBg, color: C.success };
    if (badge === "Fastest") return { bg: "#EFF6FF", color: "#1E40AF" };
    if (badge === "Premium") return { bg: "#F5F3FF", color: "#5B21B6" };
    return null;
  };
  const bs = advisor.badge ? badgeStyle(advisor.badge) : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white, borderRadius: 18,
        border: `1.5px solid ${hov ? C.gold : C.border}`,
        padding: isGrid ? 26 : "22px 28px",
        display: "flex", flexDirection: isGrid ? "column" : "row",
        alignItems: isGrid ? "stretch" : "center",
        gap: isGrid ? 16 : 24,
        transition: "all 0.22s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 16px 40px rgba(15,37,87,0.11)" : "0 2px 10px rgba(15,37,87,0.05)",
        cursor: "default",
        opacity: advisor.available ? 1 : 0.78,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Verified stripe */}
      {advisor.verified && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}00, ${C.gold}, ${C.gold}00)`, opacity: hov ? 1 : 0, transition: "opacity 0.25s" }}/>
      )}

      {/* Avatar + identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{
          width: isGrid ? 52 : 56, height: isGrid ? 52 : 56, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isGrid ? 16 : 17, fontWeight: 700, color: C.white, letterSpacing: "0.05em",
          boxShadow: hov ? `0 0 0 3px ${C.gold}44` : "none", transition: "box-shadow 0.25s",
        }}>{advisor.initials}</div>

        <div style={{ flex: isGrid ? "unset" : 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>{advisor.name}</span>
            {advisor.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill={C.gold} style={{ flexShrink: 0 }}>
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            )}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 1, whiteSpace: isGrid ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{advisor.title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 16 }}>{advisor.flag}</span>
            <span style={{ fontSize: 12, color: C.navy, fontWeight: 600 }}>{advisor.country}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <Stars rating={advisor.rating} size={12}/>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{advisor.rating.toFixed(1)}</span>
        <span style={{ fontSize: 12, color: C.muted }}>({advisor.reviews})</span>
      </div>

      {/* Specialties */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: isGrid ? "unset" : 1 }}>
        {advisor.specialties.slice(0, isGrid ? 3 : 2).map(s => (
          <span key={s} style={{ background: C.offWhite2, color: C.navyLight, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.border}` }}>{s}</span>
        ))}
        {!isGrid && advisor.specialties.length > 2 && (
          <span style={{ background: C.offWhite2, color: C.muted, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.border}` }}>+{advisor.specialties.length - 2}</span>
        )}
      </div>

      {/* Languages */}
      {isGrid && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: C.muted }}>Speaks:</span>
          {advisor.languages.map(l => (
            <span key={l} style={{ fontSize: 11, color: C.navy, fontWeight: 600, background: C.offWhite, padding: "2px 7px", borderRadius: 6 }}>{l}</span>
          ))}
        </div>
      )}

      {/* Divider row: turnaround + fee */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
        paddingTop: isGrid ? 14 : 0,
        borderTop: isGrid ? `1px solid ${C.border}` : "none",
        gap: 24,
      }}>
        <div>
          <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Turnaround</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "2px 0 0" }}>{advisor.turnaroundLabel}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>From</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 800, color: C.gold, margin: "1px 0 0", lineHeight: 1 }}>{advisor.feeLabel}</p>
        </div>
      </div>

      {/* Badge + CTA */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexDirection: isGrid ? "row" : "row" }}>
        {bs && (
          <span style={{ background: bs.bg, color: bs.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            {advisor.badge}
          </span>
        )}
        <button
          onClick={() => advisor.available && onQuote(advisor)}
          style={{
            flex: 1,
            background: hov && advisor.available ? C.navy : "transparent",
            color: hov && advisor.available ? C.white : advisor.available ? C.navy : C.muted,
            border: `1.5px solid ${advisor.available ? (hov ? C.navy : C.border) : C.border}`,
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700,
            cursor: advisor.available ? "pointer" : "not-allowed",
            transition: "all 0.2s ease", whiteSpace: "nowrap",
          }}
        >
          {advisor.available ? "Request a Quote →" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

/* ─── QUOTE MODAL ───────────────────────────────────────────────── */

function QuoteModal({ advisor, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", residency: "", timeline: "", message: "" });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Please describe your requirement";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setStep(2); }, 1200);
  };

  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const inp = (k, placeholder, type = "text", err) => (
    <div>
      <input value={form[k]} type={type} placeholder={placeholder}
        onChange={e => set(k, e.target.value)}
        onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.gold}22`; }}
        onBlur={e => { e.target.style.borderColor = errors[k] ? "#FCA5A5" : C.border; e.target.style.boxShadow = "none"; }}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10, fontFamily: "inherit",
          border: `1.5px solid ${errors[k] ? "#FCA5A5" : C.border}`, fontSize: 14, color: C.navy,
          background: errors[k] ? C.errorBg : C.white, outline: "none", transition: "all 0.2s",
        }}/>
      {errors[k] && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{errors[k]}</p>}
    </div>
  );

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(9,26,61,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "fadeIn 0.2s ease",
      }}>
      <div style={{
        background: C.white, borderRadius: 24, width: "100%", maxWidth: 580,
        maxHeight: "92vh", overflow: "auto",
        boxShadow: "0 40px 100px rgba(9,26,61,0.35)",
        animation: "slideUp 0.25s ease",
      }}>
        {/* Modal header */}
        <div style={{ background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`, padding: "28px 32px", borderRadius: "24px 24px 0 0", position: "relative" }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: C.white, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}>×</button>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))`,
              border: `2px solid ${C.gold}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: "0.05em",
            }}>{advisor.initials}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.white }}>{advisor.name}</span>
                <span style={{ fontSize: 18 }}>{advisor.flag}</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{advisor.title}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <Stars rating={advisor.rating} size={11}/>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{advisor.rating.toFixed(1)} · {advisor.reviews} reviews</span>
              </div>
            </div>
          </div>

          {/* Key facts */}
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { icon: "⚡", text: advisor.turnaroundLabel },
              { icon: "💰", text: `From ${advisor.feeLabel}` },
              { icon: "🛡", text: "Escrow protected" },
            ].map(f => (
              <div key={f.text} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "5px 11px",
                fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500,
              }}>
                <span>{f.icon}</span>{f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "32px" }}>
          {step === 1 ? (
            <>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Request a Quote</h3>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
                Fill in your details and {advisor.name.split(" ")[0]} will respond within <strong style={{ color: C.navy }}>4 business hours</strong> with a personalised quote.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {inp("name", "Full name *", "text", errors.name)}
                  {inp("email", "Email address *", "email", errors.email)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {inp("phone", "Phone (optional)", "tel")}
                  <div>
                    <select value={form.residency} onChange={e => set("residency", e.target.value)}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 10, fontFamily: "inherit",
                        border: `1.5px solid ${C.border}`, fontSize: 14, color: form.residency ? C.navy : C.muted,
                        background: C.white, outline: "none", appearance: "none", cursor: "pointer",
                      }}>
                      <option value="">Residency status...</option>
                      <option>Employment Visa</option>
                      <option>Investor / Business Visa</option>
                      <option>Golden Visa</option>
                      <option>Family / Dependent</option>
                      <option>Freelance Permit</option>
                      <option>Citizen / Permanent Resident</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <select value={form.timeline} onChange={e => set("timeline", e.target.value)}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10, fontFamily: "inherit",
                      border: `1.5px solid ${C.border}`, fontSize: 14, color: form.timeline ? C.navy : C.muted,
                      background: C.white, outline: "none", appearance: "none", cursor: "pointer",
                    }}>
                    <option value="">How urgently do you need the TRC?</option>
                    <option>Urgently – within 1 week</option>
                    <option>Standard – within 2–3 weeks</option>
                    <option>Not urgent – within a month</option>
                    <option>Just exploring options</option>
                  </select>
                </div>
                <div>
                  <textarea value={form.message} onChange={e => set("message", e.target.value)}
                    onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.gold}22`; }}
                    onBlur={e => { e.target.style.borderColor = errors.message ? "#FCA5A5" : C.border; e.target.style.boxShadow = "none"; }}
                    placeholder="Describe your situation — which country is requesting the TRC, your visa type, any treaty-specific requirements... *"
                    rows={4}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10, fontFamily: "inherit",
                      border: `1.5px solid ${errors.message ? "#FCA5A5" : C.border}`,
                      fontSize: 14, color: C.navy, background: errors.message ? C.errorBg : C.white,
                      outline: "none", resize: "vertical", lineHeight: 1.6, transition: "all 0.2s",
                    }}/>
                  {errors.message && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>{errors.message}</p>}
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "11px 14px", display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>🔒</span>
                  <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                    Your data is encrypted and only shared with this advisor. Fees held in <strong>secure escrow</strong> until TRC delivery.
                  </p>
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  style={{
                    width: "100%", background: submitting ? C.gold + "99" : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                    color: C.white, border: "none", borderRadius: 12, padding: "15px",
                    fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    letterSpacing: "0.02em", boxShadow: submitting ? "none" : "0 6px 20px rgba(201,168,76,0.35)",
                    transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {submitting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5"
                        style={{ animation: "spin 0.8s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Submitting...
                    </>
                  ) : "Send Quote Request →"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
                Quote Request Sent!
              </h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 8px" }}>
                {advisor.name.split(" ")[0]} will respond to <strong style={{ color: C.navy }}>{form.email}</strong> within 4 business hours.
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
                Reference: <span style={{ fontWeight: 700, color: C.navy, fontFamily: "monospace" }}>TRC-{Date.now().toString(36).toUpperCase().slice(-6)}</span>
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={onClose} style={{
                  background: C.navy, color: C.white, border: "none", borderRadius: 11, padding: "12px 28px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Done</button>
                <button onClick={() => { setStep(1); setForm({ name: "", email: "", phone: "", residency: "", timeline: "", message: "" }); }}
                  style={{
                    background: "transparent", color: C.navy, border: `1.5px solid ${C.border}`, borderRadius: 11,
                    padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>Another Inquiry</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────────────── */
/* ─── MAIN MARKETPLACE ──────────────────────────────────────────── */

export default function MarketplacePage() {
  // Filters state
  const [filters, setFilters] = useState({
    languages: [],
    priceRange: [0, 600],
    minRating: 0,
    availableOnly: false,
  });
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [quoteAdvisor, setQuoteAdvisor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  const toggleLanguage = l => setFilters(f => ({
    ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l],
  }));
  const clearFilter = useCallback((type, val) => {
    setFilters(f => {
      if (type === "language")   return { ...f, languages:  f.languages.filter(x => x !== val) };
      if (type === "rating")     return { ...f, minRating: 0 };
      if (type === "available")  return { ...f, availableOnly: false };
      if (type === "price")      return { ...f, priceRange: [0, 600] };
      return f;
    });
  }, []);

  // Derived list
  const filtered = ALL_ADVISORS
    .filter(a => {
      if (filters.languages.length && !filters.languages.some(l => a.languages.includes(l))) return false;
      if (a.feeUSD < filters.priceRange[0] || a.feeUSD > filters.priceRange[1]) return false;
      if (a.rating < filters.minRating) return false;
      if (filters.availableOnly && !a.available) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating")     return b.rating - a.rating;
      if (sortBy === "price_asc")  return a.feeUSD - b.feeUSD;
      if (sortBy === "price_desc") return b.feeUSD - a.feeUSD;
      if (sortBy === "turnaround") return a.turnaround - b.turnaround;
      return 0;
    });

  // Active filter tags
  const activeTags = [
    ...filters.languages.map(l => ({ type: "language",  label: "Language", value: l })),
    ...(filters.minRating > 0         ? [{ type: "rating",   label: "Rating",   value: `${filters.minRating}★+` }] : []),
    ...(filters.availableOnly          ? [{ type: "available",label: "Status",   value: "Available Only" }]       : []),
    ...((filters.priceRange[0] > 0 || filters.priceRange[1] < 600) ? [{ type: "price", label: "Price", value: `$${filters.priceRange[0]}–$${filters.priceRange[1]}` }] : []),
  ];

  const clearAll = () => setFilters({ languages: [], priceRange: [0, 600], minRating: 0, availableOnly: false });

  const Sidebar = () => (
    <div style={{
      width: 268, flexShrink: 0,
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: "8px 24px 24px",
      alignSelf: "start",
      position: "sticky",
      top: 90,
      boxShadow: "0 2px 16px rgba(15,37,87,0.06)",
    }}>
      {/* Sidebar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 4px" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Filters</span>
        {activeTags.length > 0 && (
          <button onClick={clearAll} style={{ background: "none", border: "none", color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
            Clear All
          </button>
        )}
      </div>

      {/* Language */}
      <FilterSection title="Language" defaultOpen={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {LANGUAGES_LIST.map(l => {
            const checked = filters.languages.includes(l);
            const count = ALL_ADVISORS.filter(a => a.languages.includes(l)).length;
            return (
              <label key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div onClick={() => toggleLanguage(l)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${checked ? C.gold : C.border}`,
                    background: checked ? C.gold : C.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                  }}>
                  {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: C.navy, flex: 1 }}>{l}</span>
                <span style={{ fontSize: 11, color: C.muted, background: C.offWhite, padding: "1px 7px", borderRadius: 10 }}>{count}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range (USD)" defaultOpen={true}>
        <PriceRange min={0} max={600} value={filters.priceRange} onChange={v => setFilters(f => ({ ...f, priceRange: v }))}/>
      </FilterSection>

      {/* Minimum Rating */}
      <FilterSection title="Minimum Rating" defaultOpen={true}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[0, 4.5, 4.7, 4.9].map(r => (
            <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))}
              style={{
                padding: "7px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: filters.minRating === r ? C.navy : C.offWhite,
                color: filters.minRating === r ? C.white : C.muted,
                border: `1.5px solid ${filters.minRating === r ? C.navy : C.border}`,
                transition: "all 0.15s",
              }}>
              {r === 0 ? "Any" : `${r}★+`}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Available Only */}
      <div style={{ paddingTop: 18 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div onClick={() => setFilters(f => ({ ...f, availableOnly: !f.availableOnly }))}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: filters.availableOnly ? C.gold : C.border,
              position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
            }}>
            <div style={{
              position: "absolute", top: 3, left: filters.availableOnly ? 21 : 3,
              width: 16, height: 16, borderRadius: "50%",
              background: C.white, transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}/>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Available advisors only</span>
        </label>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 52 }}>Hide advisors on waitlist</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.navy, background: C.offWhite, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${C.gold}33; }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
      `}</style>

      

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 60%, #1A3A72 100%)`,
        padding: "110px 32px 60px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(${C.white} 1px, transparent 1px), linear-gradient(90deg, ${C.white} 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", right: "5%", top: "20%", width: 400, height: 400, background: `radial-gradient(circle, ${C.gold}12, transparent 70%)`, pointerEvents: "none" }}/>

        <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Home</a>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: C.goldLight, fontWeight: 600 }}>Advisor Marketplace</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px, 4.5vw, 52px)", fontWeight: 700, color: C.white, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 14 }}>
                Find Your <span style={{ color: C.gold, fontStyle: "italic" }}>TRC Advisor</span>
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 520, lineHeight: 1.7, fontWeight: 300 }}>
                {ALL_ADVISORS.length} verified UAE tax residency specialists. Transparent pricing, escrow-protected, real-time tracking.
              </p>
            </div>

            {/* Quick-search stats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { v: `${ALL_ADVISORS.filter(a => a.available).length}`, l: "Available Now" },
                { v: "130+", l: "Treaty Countries" },
                { v: "98%", l: "Approval Rate" },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 20px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 800, color: C.gold }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 40" fill={C.offWhite}><path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"/></svg>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "36px 32px 72px", display: "flex", gap: 28, alignItems: "start" }}>

        {/* Sidebar */}
        <Sidebar/>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Toolbar */}
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "14px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            boxShadow: "0 2px 8px rgba(15,37,87,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 800, color: C.gold }}>{filtered.length}</span>
                <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>advisor{filtered.length !== 1 ? "s" : ""} found</span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Sort */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Sort:</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.key} onClick={() => setSortBy(opt.key)}
                      style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: sortBy === opt.key ? C.navy : C.offWhite,
                        color: sortBy === opt.key ? C.white : C.muted,
                        border: `1px solid ${sortBy === opt.key ? C.navy : C.border}`,
                        transition: "all 0.15s", whiteSpace: "nowrap",
                      }}>{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* View toggle */}
              <div style={{ display: "flex", background: C.offWhite, borderRadius: 9, padding: 3, border: `1px solid ${C.border}` }}>
                {[["grid", "⊞"], ["list", "☰"]].map(([mode, icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{
                      width: 32, height: 28, borderRadius: 6, fontSize: 15, cursor: "pointer",
                      background: viewMode === mode ? C.white : "transparent",
                      color: viewMode === mode ? C.navy : C.muted,
                      border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: viewMode === mode ? "0 1px 3px rgba(15,37,87,0.1)" : "none",
                      transition: "all 0.15s",
                    }}>{icon}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Active:</span>
              {activeTags.map((tag, i) => (
                <Tag key={i} label={tag.label} value={tag.value} onRemove={() => clearFilter(tag.type, tag.value)}/>
              ))}
              <button onClick={clearAll} style={{
                marginLeft: "auto", fontSize: 12, fontWeight: 700, color: C.muted, background: "none",
                border: "none", cursor: "pointer", padding: "3px 8px",
              }}>Clear all ×</button>
            </div>
          )}

          {/* Cards grid / list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: C.white, borderRadius: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 10 }}>No advisors match your filters</h3>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>Try adjusting the price range, removing a language filter, or clearing all filters.</p>
              <button onClick={clearAll} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 11, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Clear All Filters</button>
            </div>
          ) : (
            <div style={{
              display: viewMode === "grid" ? "grid" : "flex",
              gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : undefined,
              flexDirection: viewMode === "list" ? "column" : undefined,
              gap: 20,
            }}>
              {filtered.map((advisor, idx) => (
                <div key={advisor.id} style={{ animation: `cardIn 0.3s ease ${idx * 0.04}s both` }}>
                  <MktAdvisorCard advisor={advisor} onQuote={setQuoteAdvisor} viewMode={viewMode}/>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {filtered.length > 0 && (
            <div style={{
              marginTop: 32,
              background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`,
              borderRadius: 20, padding: "36px 40px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 24,
            }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 6 }}>Can't find the right advisor?</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 400, lineHeight: 1.6 }}>Tell us your jurisdiction and requirements. Our concierge team will hand-match you with the ideal specialist within 24 hours.</p>
              </div>
              <button style={{
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: C.white, border: "none", borderRadius: 12,
                padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(201,168,76,0.35)", whiteSpace: "nowrap",
              }}>Talk to Concierge →</button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {quoteAdvisor && <QuoteModal advisor={quoteAdvisor} onClose={() => setQuoteAdvisor(null)}/>}
    </div>
  );
}
