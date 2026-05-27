// TRCConnectApp.jsx — TRC Connect · React + React Router
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as ReactRouterDom from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabaseClient";
import RetailEligibilityPage from "./pages/RetailEligibilityPage";
import VerifyRetailEmailPage from "./pages/VerifyRetailEmailPage";
import RetailLoginPage from "./pages/RetailLoginPage";
import RetailWorkspaceGuard from "./retail/guards/RetailWorkspaceGuard";
import RetailWorkspaceLayout from "./retail/layouts/RetailWorkspaceLayout";
import RetailDashboardPage from "./retail/pages/RetailDashboardPage";
import RetailEligibilityStatusPage from "./retail/pages/RetailEligibilityStatusPage";
import RetailProfilePage from "./retail/pages/RetailProfilePage";
import RetailSupportPage from "./retail/pages/RetailSupportPage";
import RetailFeatureWorkspacePage from "./retail/pages/RetailFeatureWorkspacePage";
import RetailDocumentsPage from "./retail/pages/RetailDocumentsPage";
import RetailResidencyTrackerPage from "./retail/pages/RetailResidencyTrackerPage";
import RetailChatPage from "./retail/pages/RetailChatPage";
import RetailRequestedPage from "./retail/pages/RetailRequestedPage";
import RetailResetPasswordPage from "./retail/pages/RetailResetPasswordPage";
import CorporateEligibilityPage from "./corporate/pages/CorporateEligibilityPage";
import CorporateLoginPage from "./corporate/pages/CorporateLoginPage";
import CorporateWorkspaceGuard from "./corporate/guards/CorporateWorkspaceGuard";
import CorporateWorkspaceLayout from "./corporate/layouts/CorporateWorkspaceLayout";
import {
  CorporateDashboardPage,
  CorporateDocumentsPage,
  CorporateEligibilityStatusPage,
  CorporateFeatureWorkspacePage,
  CorporateProfilePage,
  CorporateSupportPage,
} from "./corporate/pages/CorporateWorkspacePages";
import NotificationCenter from "./components/NotificationCenter";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import WorkflowToastHost from "./components/WorkflowToastHost";
import AdvisorLoginPage from "./pages/AdvisorLoginPage";
import AdvisorWorkspaceGuard from "./advisor/guards/AdvisorWorkspaceGuard";
import AdvisorWorkspaceLayout from "./advisor/layouts/AdvisorWorkspaceLayout";
import AdvisorDashboardPage from "./advisor/pages/AdvisorDashboardPage";
import AdvisorCasesPage from "./advisor/pages/AdvisorCasesPage";
import AdvisorCaseDetailPage from "./advisor/pages/AdvisorCaseDetailPage";
import AdvisorChatPage from "./advisor/pages/AdvisorChatPage";
import AdvisorUpdatesPage from "./advisor/pages/AdvisorUpdatesPage";
import AdvisorProfilePage from "./advisor/pages/AdvisorProfilePage";
import BlogListingPage from "./blog/BlogListingPage";
import BlogPostPage from "./blog/BlogPostPage";


const C = {
  navy: "#0F2557",
  navyLight: "#1A3570",
  navyDark: "#091A3D",
  gold: "#C9A84C",
  goldLight: "#E2C47A",
  goldDark: "#A07C2E",
  white: "#FFFFFF",
  offWhite: "#F7F8FC",
  textMuted: "#6B7A99",
  border: "#E2E8F0",
};

// ── Shared UI atoms used across pages ─────────────────────────────────

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

function Chip({ children, bg="#EEF2FF", color="#3730A3" }) {
  return (
    <span style={{background:bg,color,fontSize:11,fontWeight:600,
      padding:"3px 9px",borderRadius:20,letterSpacing:".03em",whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}

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



const COUNTRIES = [
  { code: "AE", name: "UAE", flag: "🇦🇪", slug: "uae" },
  { code: "IN", name: "India", flag: "🇮🇳", slug: "india" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", slug: "uk" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", slug: "singapore" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", slug: "netherlands" },
  { code: "MT", name: "Malta", flag: "🇲🇹", slug: "malta" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", slug: "cyprus" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", slug: "portugal" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", slug: "mauritius" },
  { code: "US", name: "United States", flag: "🇺🇸", slug: "usa" },
];

const ADVISORS = [
  {
    id: 1,
    name: "Amira Al-Rashid",
    title: "Senior Tax Consultant",
    country: "UAE",
    flag: "🇦🇪",
    rating: 4.9,
    reviews: 127,
    specialties: ["TRC Applications", "Double Tax Treaties", "Free Zone Setup"],
    turnaround: "3–5 days",
    price: "From $299",
    initials: "AA",
    verified: true,
    completions: 340,
  },
  {
    id: 2,
    name: "Sebastian Hartmann",
    title: "International Tax Advisor",
    country: "Netherlands",
    flag: "🇳🇱",
    rating: 4.8,
    reviews: 94,
    specialties: ["EU Tax Residency", "30% Ruling", "OECD Compliance"],
    turnaround: "5–7 days",
    price: "From $349",
    initials: "SH",
    verified: true,
    completions: 218,
  },
  {
    id: 3,
    name: "Priya Nair",
    title: "Chartered Tax Practitioner",
    country: "Singapore",
    flag: "🇸🇬",
    rating: 5.0,
    reviews: 62,
    specialties: ["IRAS Applications", "DTA Claims", "Expatriate Tax"],
    turnaround: "2–4 days",
    price: "From $279",
    initials: "PN",
    verified: true,
    completions: 189,
  },
  {
    id: 4,
    name: "Marcus Vella",
    title: "EU Residency Specialist",
    country: "Malta",
    flag: "🇲🇹",
    rating: 4.7,
    reviews: 88,
    specialties: ["Malta TRC", "Global Residence Programme", "Nomad Residency"],
    turnaround: "7–10 days",
    price: "From $399",
    initials: "MV",
    verified: true,
    completions: 156,
  },
];

const STATS = [
  { value: "10", label: "Countries Covered", suffix: "+" },
  { value: "200", label: "Verified Advisors", suffix: "+" },
  { value: "8,400", label: "Certificates Issued", suffix: "+" },
  { value: "98", label: "Success Rate", suffix: "%" },
];

const STEPS = [
  {
    num: "01",
    title: "Select Your Country",
    desc: "Choose your target residency jurisdiction from our 10 Phase 1 countries. Our system matches you with specialists licensed in that specific territory.",
    icon: "🌍",
  },
  {
    num: "02",
    title: "Match with an Advisor",
    desc: "Browse verified local tax advisors with transparent ratings, pricing, and turnaround times. Request a quote or book directly — no surprise fees.",
    icon: "🤝",
  },
  {
    num: "03",
    title: "Receive Your TRC",
    desc: "Your advisor handles the entire application lifecycle. Track progress in real-time on your dashboard and receive your certified document securely.",
    icon: "📜",
  },
];

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

function Badge({ children, variant = "default" }) {
  const styles = {
    default: { background: "#EEF2FF", color: "#3730A3" },
    gold: { background: "#FEF3C7", color: "#92400E" },
    green: { background: "#D1FAE5", color: "#065F46" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      ...s,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 20,
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function AdvisorCard({ advisor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${hovered ? C.gold : C.border}`,
        padding: "28px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
          ? "0 20px 48px rgba(15,37,87,0.12)"
          : "0 2px 12px rgba(15,37,87,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: C.white,
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}>
            {advisor.initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                {advisor.name}
              </span>
              {advisor.verified && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={C.gold}>
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )}
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{advisor.title}</p>
          </div>
        </div>
        <span style={{ fontSize: 22 }}>{advisor.flag}</span>
      </div>

      <div>
        <StarRating rating={advisor.rating} />
        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{advisor.reviews} verified reviews · {advisor.completions} TRCs completed</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {advisor.specialties.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}>
        <div>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Turnaround</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: "2px 0 0" }}>{advisor.turnaround}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Starting at</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.gold, margin: "2px 0 0" }}>{advisor.price}</p>
        </div>
      </div>

      <button
        style={{
          background: hovered ? C.navy : "transparent",
          color: hovered ? C.white : C.navy,
          border: `1.5px solid ${C.navy}`,
          borderRadius: 10,
          padding: "11px 0",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.02em",
        }}
      >
        Request a Quote →
      </button>
    </div>
  );
}

function CounterStat({ value: target, suffix, label, delay }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const numTarget = parseInt(target.replace(/,/g, ""), 10);
        const duration = 1800;
        const step = 16;
        const totalSteps = duration / step;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / totalSteps;
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * numTarget));
          if (currentStep >= totalSteps) {
            setCount(numTarget);
            clearInterval(timer);
          }
        }, step);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const formatted = count >= 1000 ? count.toLocaleString() : count.toString();

  return (
    <div ref={ref} style={{ textAlign: "center", padding: "0 16px" }}>
      <div style={{
        fontSize: "clamp(32px, 4vw, 48px)",
        fontWeight: 800,
        color: C.gold,
        fontFamily: "'Cormorant Garamond', serif",
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}>
        {formatted}{suffix}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Client Workspace</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Live</span>
        </div>
      </div>

      {/* Application card */}
      <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 18, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Application</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>TRC-2025-4821</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>UAE · Individual · Dubai</div>
          </div>
          <div style={{ background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.35)", color: "#E2C47A", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.08em" }}>
            UNDER REVIEW
          </div>
        </div>
        {/* Progress track */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[["Intake","done"],["Assigned","done"],["Documents","done"],["Filed","active"],["Issued","pending"]].map(([label, state], i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: state === "done" ? C.gold : state === "active" ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.08)",
                  border: state === "active" ? `1.5px solid ${C.gold}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800,
                  color: state === "done" ? C.navyDark : state === "active" ? C.goldLight : "rgba(255,255,255,0.2)",
                }}>
                  {state === "done" ? "✓" : state === "active" ? "●" : ""}
                </div>
                <div style={{ fontSize: 8, color: state === "pending" ? "rgba(255,255,255,0.2)" : state === "active" ? C.goldLight : "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {label}
                </div>
              </div>
              {i < 4 && <div style={{ flex: 1, height: 1.5, background: state === "done" ? C.gold : "rgba(255,255,255,0.08)", marginBottom: 14, marginLeft: 2, marginRight: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>Required Documents</div>
        {[
          { name: "Emirates ID — front & back", done: true },
          { name: "UAE Residency Visa copy", done: true },
          { name: "GDRFA travel history report", done: false, pending: true },
        ].map((doc) => (
          <div key={doc.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              background: doc.done ? C.gold : "rgba(255,255,255,0.06)",
              border: doc.done ? "none" : "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: doc.done ? C.navyDark : "transparent", fontWeight: 800,
            }}>
              {doc.done ? "✓" : ""}
            </div>
            <span style={{ fontSize: 11, color: doc.done ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)", flex: 1 }}>{doc.name}</span>
            {doc.pending && <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 700, letterSpacing: "0.06em" }}>PENDING</span>}
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Advisor</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Amira Al-Rashid</div>
          <div style={{ fontSize: 10, color: C.goldLight, marginTop: 2 }}>UAE · Verified ✓</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Last activity</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Document review</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>4 minutes ago</div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = ReactRouterDom.useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.navy, background: C.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        ::selection { background: ${C.gold}33; }
        .nav-link { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; letter-spacing: 0.01em; }
        .nav-link:hover { color: ${C.gold}; }
        .nav-link-dark { color: ${C.navy}; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link-dark:hover { color: ${C.gold}; }
        .country-option:hover { background: ${C.offWhite}; }
        .advisor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .advisor-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
          .footer-cols { flex-direction: column !important; gap: 32px !important; }
          .steps-grid { flex-direction: column !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO                                                ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{
        background: `linear-gradient(155deg, ${C.navyDark} 0%, ${C.navy} 55%, #162D6A 100%)`,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* subtle grid overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(${C.white} 1px, transparent 1px), linear-gradient(90deg, ${C.white} 1px, transparent 1px)`, backgroundSize: "64px 64px", pointerEvents: "none" }} />
        {/* gold glow top-right */}
        <div style={{ position: "absolute", top: "5%", right: "-8%", width: 560, height: 560, background: `radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 68%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hero-grid">

            {/* ── LEFT ── */}
            <div>
              {/* pill tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 24, padding: "6px 16px", marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: C.goldLight, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  UAE Tax Residency Certificate Platform
                </span>
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5.2vw, 64px)", fontWeight: 700, color: C.white, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 22 }}>
                TRC compliance—
                <br />
                <span style={{ color: C.gold, fontStyle: "italic" }}>managed end-to-end,</span>
                <br />
                not over email.
              </h1>

              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 36, maxWidth: 460, fontWeight: 300 }}>
                A structured workflow for individuals and companies navigating UAE TRC applications — from eligibility through document collection, advisor assignment, FTA submission, and certificate delivery.
              </p>

              {/* single hero CTA — scroll to audience section */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
                <button onClick={() => document.getElementById('for-who')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: 11, padding: "14px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 26px rgba(201,168,76,0.42)", letterSpacing: "0.02em" }}>
                  Get Started →
                </button>
                <button onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: "rgba(255,255,255,0.08)", color: C.white, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 11, padding: "14px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  See How It Works
                </button>
              </div>

              {/* real stats — no fake numbers */}
              <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, flexWrap: "wrap" }}>
                {[
                  { v: "4", l: "Role workspaces" },
                  { v: "6", l: "Workflow states" },
                  { v: "10", l: "Phase 1 jurisdictions" },
                  { v: "1", l: "Unified case record" },
                ].map((s, i) => (
                  <div key={s.l} style={{ flex: "1 1 auto", paddingRight: 20, paddingLeft: i > 0 ? 20 : 0, borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 5, lineHeight: 1.3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT — Live dashboard mockup ── */}
            <div style={{ background: "rgba(9,26,61,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, backdropFilter: "blur(14px)", boxShadow: "0 32px 72px rgba(0,0,0,0.35)" }}>
              <DashboardMockup />
            </div>
          </div>
        </div>

        {/* wave */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 52" fill={C.white} xmlns="http://www.w3.org/2000/svg">
            <path d="M0,26 C480,52 960,0 1440,26 L1440,52 L0,52 Z" />
          </svg>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  COMPLIANCE SIGNALS BAR                              ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: C.navy, padding: "0 24px", marginTop: -2 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "22px 0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, justifyContent: "space-between", alignItems: "center" }}>
            {[
              { icon: "✓", text: "UAE FTA Aligned" },
              { icon: "🔒", text: "End-to-end Encrypted" },
              { icon: "👤", text: "Role-based Access Control" },
              { icon: "📋", text: "Full Audit Trail" },
              { icon: "⚖", text: "Advisor-verified Only" },
              { icon: "🌐", text: "Phase 1 · 10 Jurisdictions" },
            ].map((item, i) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.02em" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  PROBLEM — what's broken today                       ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: C.white, padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            {/* text */}
            <div>
              <SectionLabel>The actual problem</SectionLabel>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(30px, 3.8vw, 46px)", fontWeight: 700, color: C.navy, letterSpacing: "-0.02em", lineHeight: 1.18, marginBottom: 18 }}>
                TRC work isn't hard.<br />
                <span style={{ color: C.gold, fontStyle: "italic" }}>Coordinating it without a system is.</span>
              </h2>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.8, maxWidth: 420 }}>
                Documents live in WhatsApp groups. Advisors wait on clients who don't know what's missing. Admins chase updates over email. No single person has the full picture of where a case actually stands.
              </p>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.8, maxWidth: 420, marginTop: 14 }}>
                TRC Connect replaces that with a shared workspace where every document, message, and status change is visible to the right person — and only them.
              </p>
            </div>
            {/* pain cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "📎", title: "Documents scattered everywhere", desc: "Files sent over email, WhatsApp, and shared drives. No version control. No checklist. No way to know what's actually complete." },
                { icon: "🧭", title: "No one owns the next step", desc: "Clients don't know what to submit. Advisors don't know what's missing. Admins spend time chasing instead of deciding." },
                { icon: "🗂", title: "Zero audit trail", desc: "When a submission is questioned, the evidence trail is a string of forwarded emails and a memory of what happened three weeks ago." },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  FOR WHO — two clear paths                           ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="for-who" style={{ background: C.offWhite, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel>Two paths, one platform</SectionLabel>
            <SectionTitle>Built for individuals and enterprise teams</SectionTitle>
            <p style={{ fontSize: 15, color: C.textMuted, marginTop: 12, maxWidth: 580, margin: "12px auto 0", lineHeight: 1.75 }}>
              Whether you're an individual resident or a company managing compliance across entities, TRC Connect has a dedicated workspace for you.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="hero-grid">
            {/* Individual */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`, padding: "28px 28px 24px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🧾</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>For Individuals</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>
                  Employees, freelancers,<br />HNWIs & Golden Visa holders
                </div>
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {[
                    "Guided eligibility assessment — know before you apply",
                    "Advisor assigned and managed within the platform",
                    "Document checklist with one-click upload and status tracking",
                    "Real-time case timeline — intake through certificate delivery",
                    "In-platform messaging with your advisor, no email",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: C.gold, fontWeight: 800, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Typical timeline</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>10–14 working days</div>
                </div>
                <button onClick={() => navigate('/check-eligibility')} style={{ width: "100%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: 11, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(201,168,76,0.35)" }}>
                  Start Individual Application →
                </button>
              </div>
            </div>

            {/* Corporate */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(135deg, #1A3570, #243F8C)`, padding: "28px 28px 24px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🏛</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>For Companies & Enterprise</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>
                  Companies, holding structures,<br />founders & compliance teams
                </div>
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {[
                    "Separate corporate eligibility flow — entity type, UAE presence, structure",
                    "Full workspace: Applications, Documents, Advisors, Billing, Reports",
                    "Advisor document requests visible and actionable in one place",
                    "Compliance manager assigned for structured case handling",
                    "Audit-ready record of every document, approval, and submission state",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: C.gold, fontWeight: 800, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Application type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Case-by-case assessment</div>
                </div>
                <button onClick={() => navigate('/corporate/check-eligibility')} style={{ width: "100%", background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, color: C.white, border: "none", borderRadius: 11, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(15,37,87,0.25)" }}>
                  Start Corporate Application →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  PLATFORM — what you actually get inside             ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="platform-overview" style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel>Inside the platform</SectionLabel>
            <SectionTitle>Everything you need. Nothing you don't.</SectionTitle>
            <p style={{ fontSize: 15, color: C.textMuted, marginTop: 12, maxWidth: 580, margin: "12px auto 0", lineHeight: 1.75 }}>
              Your workspace unlocks progressively as your case moves forward — you only see what's relevant to where you are.
            </p>
          </div>

          {/* Two-column deep dive — retail left, corporate right */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="hero-grid">
            {/* Retail */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ background: C.navy, padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🧾</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: "0.12em" }}>Individual workspace</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginTop: 2 }}>What you see as a retail client</div>
                </div>
              </div>
              <div style={{ padding: "20px 24px", background: C.white }}>
                {[
                  { stage: "Before you apply", items: ["Guided eligibility check — know if you qualify before submitting", "Residency signals form: visa type, days in UAE, income source"] },
                  { stage: "Active case", items: ["Stage tracker: pending review → documents → processing → issued", "Document checklist with upload and advisor-requested file queue", "Live messaging with your assigned advisor"] },
                  { stage: "After issuance", items: ["Certificate download and case archive", "Support ticket thread if anything needs follow-up"] },
                ].map((group) => (
                  <div key={group.stage} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{group.stage}</div>
                    {group.items.map(item => (
                      <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ color: C.gold, fontSize: 11, fontWeight: 800, marginTop: 2, flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ background: "#1A3570", padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🏛</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: "0.12em" }}>Company workspace</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginTop: 2 }}>What you see as a corporate client</div>
                </div>
              </div>
              <div style={{ padding: "20px 24px", background: C.white }}>
                {[
                  { stage: "Eligibility & onboarding", items: ["Corporate structure form: entity type, UAE presence, jurisdiction", "Separate corporate eligibility flow — assessed by compliance team"] },
                  { stage: "Active workspace (post-payment)", items: ["Applications tab: case status and submission states", "Documents tab: advisor requests visible and uploadable directly", "Advisors tab: assigned compliance manager and contact", "Billing & Reports: invoices and certificate archive"] },
                  { stage: "Ongoing compliance", items: ["Settings: editable company profile synced to case record", "Support queue with compliance manager response thread"] },
                ].map((group) => (
                  <div key={group.stage} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{group.stage}</div>
                    {group.items.map(item => (
                      <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ color: C.gold, fontSize: 11, fontWeight: 800, marginTop: 2, flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  WORKFLOW — operational state machine                ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="workflow" style={{ background: C.offWhite, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }} className="hero-grid">
            <div>
              <SectionLabel>Workflow</SectionLabel>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 3.2vw, 40px)", fontWeight: 700, color: C.navy, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>
                How a case moves through the system
              </h2>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.8 }}>
                Every state transition is logged with a timestamp, actor, and note. Clients, advisors, and admins each see the parts of the timeline relevant to them.
              </p>
              <div style={{ marginTop: 24, padding: "16px 18px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>All transitions logged to</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.navy, background: C.offWhite, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}` }}>application_status_history</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { num: "01", state: "pending_review", title: "Client intake", desc: "Guided eligibility form captures residency type, entity, and required document set.", active: false },
                { num: "02", state: "advisor_assigned", title: "Advisor assignment", desc: "Case routed to a verified advisor. Client notified. Workspace modules unlock.", active: false },
                { num: "03", state: "documents_pending", title: "Document collection", desc: "Advisor reviews uploads, requests missing files. Client gets a clear task queue.", active: true },
                { num: "04", state: "processing", title: "FTA submission", desc: "Advisor files the application. Status logged at each authority response.", active: false },
                { num: "05", state: "submitted_to_authority", title: "Authority review", desc: "Case tracked through FTA processing. Advisor follows up on any queries.", active: false },
                { num: "06", state: "completed", title: "Certificate issued", desc: "TRC delivered digitally. Certificate, history, and audit log archived on the case record.", active: false },
              ].map((step, i) => (
                <div key={step.num} style={{ display: "flex", gap: 16, padding: "18px 20px", background: step.active ? C.navy : C.white, borderRadius: step.active ? 14 : 0, border: `1px solid ${step.active ? "transparent" : C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: step.active ? 0 : 0, position: "relative" }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.active ? C.gold : `${C.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: step.active ? C.navyDark : C.gold }}>
                      {step.num}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: step.active ? C.white : C.navy }}>{step.title}</span>
                      <code style={{ fontSize: 10, background: step.active ? "rgba(255,255,255,0.1)" : C.offWhite, color: step.active ? "rgba(255,255,255,0.5)" : C.textMuted, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>{step.state}</code>
                    </div>
                    <div style={{ fontSize: 13, color: step.active ? "rgba(255,255,255,0.62)" : C.textMuted, lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  SECURITY                                            ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: C.white, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SectionLabel>Security model</SectionLabel>
            <SectionTitle>Built around access boundaries, not trust assumptions</SectionTitle>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { icon: "🔑", title: "Row Level Security on every table", desc: "Supabase RLS policies enforce access at the database layer. Advisors see only assigned cases. Clients see only their own data." },
              { icon: "🛡", title: "Service-role isolation", desc: "All sensitive mutations — state changes, document review, advisor assignment — run through server-side Netlify Functions. The service key never touches the browser." },
              { icon: "📁", title: "Signed document URLs", desc: "Documents are stored in a private Supabase bucket. Files are served via short-lived signed URLs generated server-side only." },
              { icon: "🪪", title: "JWT verification on every function", desc: "Every Netlify function validates the caller's Supabase JWT before executing. Role is derived from the token, not from client-sent params." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "22px 22px", border: `1px solid ${C.border}`, borderRadius: 16, background: C.offWhite }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8, lineHeight: 1.35 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  FINAL CTA                                           ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 100%)`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 16 }}>Already know what you need?</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 50px)", fontWeight: 700, color: C.white, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 18 }}>
            The compliance work still needs to happen.
            <br />
            <span style={{ color: C.gold, fontStyle: "italic" }}>The question is how it's managed.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.58)", lineHeight: 1.75, marginBottom: 40, maxWidth: 540, margin: "0 auto 40px" }}>
            Scattered emails and manual tracking, or a purpose-built workspace with clear ownership, document states, and a full audit trail. Same legal requirement. Very different execution.
          </p>
          {/* returning users sign in — new users already had CTAs above */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "16px 28px" }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Already have an account?</span>
            <button onClick={() => document.getElementById('sign-in-trigger')?.click()} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(201,168,76,0.4)" }}
              id="sign-in-trigger-landing"
              onClick={() => {
                // trigger the navbar Sign In modal
                const navBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Sign In');
                navBtn?.click();
              }}>
              Sign In →
            </button>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 28 }}>
            Not a licensed tax advisory firm. All advice is provided by independently verified advisors.
          </p>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  FOOTER                                              ║
          ╚══════════════════════════════════════════════════════╝ */}
      <footer style={{ background: C.navyDark, padding: "56px 24px 28px", color: "rgba(255,255,255,0.65)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-cols" style={{ display: "flex", gap: 56, marginBottom: 40, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚖</div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.white }}>TRC<span style={{ color: C.gold, fontWeight: 400 }}> Connect</span></span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.4)", maxWidth: 220 }}>
                UAE TRC compliance infrastructure for individuals and enterprise teams.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Jurisdictions</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 28px" }}>
                {COUNTRIES.map(c => (
                  <a key={c.code} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={e => e.target.style.color = C.gold}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                  >{c.flag} {c.name}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Platform</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {["How It Works", "Pricing", "Advisor Portal", "Dashboard"].map(item => (
                  <a key={item} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                    onMouseEnter={e => e.target.style.color = C.gold}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                  >{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Legal</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {["Privacy Policy", "Terms of Service", "GDPR", "Compliance"].map(item => (
                  <a key={item} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                    onMouseEnter={e => e.target.style.color = C.gold}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                  >{item}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>© 2025 TRC Connect Ltd. Not a licensed tax advisory firm.</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Verified advisors only · Secure storage · JWT-authenticated</p>
          </div>
        </div>
      </footer>
    </div>
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
            <h4 style={{ fontSize: 12, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>Jurisdictions</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 28px" }}>
              {COUNTRIES.map(c => (
                <a key={c.code} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  onMouseEnter={e => e.target.style.color = C.gold}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >{c.flag} {c.name}</a>
              ))}
            </div>
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

const ELIGIBILITY = [
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

const DOCUMENTS = [
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

const TIMELINE = [
  { day: "Day 1", label: "Document Collection", desc: "Advisor reviews your documents and identifies any gaps. Missing items are requested within 24 hours.", color: C.gold },
  { day: "Day 2–3", label: "Application Preparation", desc: "Advisor drafts the official FTA request letter and compiles the complete submission package.", color: C.navyLight },
  { day: "Day 4–5", label: "FTA Submission", desc: "Application submitted to UAE Federal Tax Authority via the EmaraTax portal under your advisor's registered account.", color: C.navyLight },
  { day: "Day 6–10", label: "FTA Processing", desc: "The FTA reviews your application. Our advisors follow up on status updates and respond to any queries promptly.", color: C.navyLight },
  { day: "Day 10–14", label: "Certificate Issued", desc: "Approved TRC delivered digitally. Physical stamped copies arranged upon request for an additional fee.", color: C.success },
];

const GOV_FEES = [
  { item: "FTA TRC Application Fee", amount: "AED 2,000", note: "Per application, paid to Federal Tax Authority", mandatory: true },
  { item: "EmaraTax Portal Fee", amount: "AED 0", note: "No charge for portal registration", mandatory: true },
  { item: "Translation & Notarisation (if required)", amount: "AED 300–600", note: "Depends on documents; arranged by advisor", mandatory: false },
  { item: "Physical Stamped Copy", amount: "AED 150", note: "Optional; digital TRC is legally valid", mandatory: false },
  { item: "Advisor Service Fee", amount: "From AED 999", note: "Quoted upfront, held in escrow until delivery", mandatory: true },
];

/* ─── REUSABLE UI ──────────────────────────────────────────────────── */

/* ─── NAVBAR ───────────────────────────────────────────────────────── */

/* ─── FOOTER ───────────────────────────────────────────────────────── */

/* ─── ADVISOR CARD ─────────────────────────────────────────────────── */

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

function UAEPage() {
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
      <section style={{ background: C.white, padding: "90px 24px" }}>
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
      <section style={{ background: C.offWhite, padding: "90px 24px" }}>
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
      <section style={{ background: C.white, padding: "90px 24px" }}>
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
      <section style={{ background: C.offWhite, padding: "90px 24px" }}>
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



/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
/* ─── MOCK DATA ─────────────────────────────────────────────────── */
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
    id: 2, name: "Priya Nair", initials: "PN", title: "Chartered Tax Practitioner · IRAS Accredited",
    country: "Singapore", countryCode: "SG", flag: "🇸🇬", rating: 5.0, reviews: 62, completions: 189,
    languages: ["English", "Tamil", "Hindi"], turnaround: 2, turnaroundLabel: "2–4 days",
    feeAED: null, feeUSD: 279, feeLabel: "$279", specialties: ["IRAS Applications", "DTA Claims", "Expatriate Tax"],
    available: true, badge: "Fastest", verified: true,
    bio: "Singapore-based CTA with deep expertise in IRAS TRC applications and cross-border individual tax planning across ASEAN.",
  },
  {
    id: 3, name: "Sebastian Hartmann", initials: "SH", title: "International Tax Advisor · EU Specialist",
    country: "Netherlands", countryCode: "NL", flag: "🇳🇱", rating: 4.8, reviews: 94, completions: 218,
    languages: ["English", "Dutch", "German"], turnaround: 5, turnaroundLabel: "5–7 days",
    feeAED: null, feeUSD: 349, feeLabel: "$349", specialties: ["EU Tax Residency", "30% Ruling", "Dutch TRC"],
    available: true, badge: null, verified: true,
    bio: "Amsterdam-based tax lawyer advising expatriates on Dutch TRC applications and the 30% ruling for incoming professionals.",
  },
  {
    id: 4, name: "Marcus Vella", initials: "MV", title: "EU Residency Specialist · Malta Revenue Registered",
    country: "Malta", countryCode: "MT", flag: "🇲🇹", rating: 4.7, reviews: 88, completions: 156,
    languages: ["English", "Maltese", "Italian"], turnaround: 7, turnaroundLabel: "7–10 days",
    feeAED: null, feeUSD: 399, feeLabel: "$399", specialties: ["Malta TRC", "Global Residence", "Nomad Residency"],
    available: true, badge: "Premium", verified: true,
    bio: "Valletta-based practitioner with exclusive focus on Malta TRC and Global Residence Programme applications for EU and non-EU nationals.",
  },
  {
    id: 5, name: "Rajesh Subramaniam", initials: "RS", title: "Tax Consultant · ICAI Member",
    country: "India", countryCode: "IN", flag: "🇮🇳", rating: 4.6, reviews: 143, completions: 412,
    languages: ["English", "Hindi", "Tamil"], turnaround: 5, turnaroundLabel: "5–8 days",
    feeAED: null, feeUSD: 199, feeLabel: "$199", specialties: ["India TRC", "Form 10FA", "DTAA Relief"],
    available: true, badge: "Best Value", verified: true,
    bio: "Mumbai-based Chartered Accountant with 200+ Form 10FA filings. Specialises in TRC applications for NRIs and returning Indians.",
  },
  {
    id: 6, name: "Charlotte Davies", initials: "CD", title: "Tax Advisor · ATT Qualified · UK HMRC",
    country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", rating: 4.8, reviews: 71, completions: 203,
    languages: ["English", "French"], turnaround: 4, turnaroundLabel: "4–6 days",
    feeAED: null, feeUSD: 329, feeLabel: "$329", specialties: ["UK TRC", "HMRC RES1", "Non-Dom Status"],
    available: false, badge: null, verified: true,
    bio: "London-based ATT-qualified advisor processing UK TRCs via HMRC's CAAT system, with expertise in non-domicile tax structuring.",
  },
  {
    id: 7, name: "Sofia Almeida", initials: "SA", title: "Tax Specialist · AT Portal Registered",
    country: "Portugal", countryCode: "PT", flag: "🇵🇹", rating: 4.9, reviews: 55, completions: 134,
    languages: ["English", "Portuguese", "Spanish"], turnaround: 6, turnaroundLabel: "6–9 days",
    feeAED: null, feeUSD: 289, feeLabel: "$289", specialties: ["Portugal TRC", "NHR Regime", "D7 Visa Tax"],
    available: true, badge: null, verified: true,
    bio: "Lisbon-based tax advisor specialising in Portuguese TRC and Non-Habitual Resident regime applications for digital nomads and retirees.",
  },
  {
    id: 8, name: "Nikos Papadopoulos", initials: "NP", title: "Cyprus Tax Consultant · ICPAC Member",
    country: "Cyprus", countryCode: "CY", flag: "🇨🇾", rating: 4.7, reviews: 49, completions: 98,
    languages: ["English", "Greek", "Russian"], turnaround: 8, turnaroundLabel: "8–12 days",
    feeAED: null, feeUSD: 375, feeLabel: "$375", specialties: ["Cyprus TRC", "Non-Dom Benefits", "IP Box"],
    available: true, badge: null, verified: true,
    bio: "Nicosia-based certified accountant handling Cyprus TRC applications and non-domicile status for international business owners.",
  },
];

const COUNTRIES_LIST  = [...new Set(ALL_ADVISORS.map(a => a.country))].sort();
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
function MarketplacePage() {
  // Filters state
  const [filters, setFilters] = useState({
    countries: [],
    languages: [],
    priceRange: [0, 600],
    minRating: 0,
    availableOnly: false,
  });
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [quoteAdvisor, setQuoteAdvisor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  const toggleCountry = c => setFilters(f => ({
    ...f, countries: f.countries.includes(c) ? f.countries.filter(x => x !== c) : [...f.countries, c],
  }));
  const toggleLanguage = l => setFilters(f => ({
    ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l],
  }));
  const clearFilter = useCallback((type, val) => {
    setFilters(f => {
      if (type === "country")    return { ...f, countries:  f.countries.filter(x => x !== val) };
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
      if (filters.countries.length && !filters.countries.includes(a.country)) return false;
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
    ...filters.countries.map(c => ({ type: "country",   label: "Country",  value: c })),
    ...filters.languages.map(l => ({ type: "language",  label: "Language", value: l })),
    ...(filters.minRating > 0         ? [{ type: "rating",   label: "Rating",   value: `${filters.minRating}★+` }] : []),
    ...(filters.availableOnly          ? [{ type: "available",label: "Status",   value: "Available Only" }]       : []),
    ...((filters.priceRange[0] > 0 || filters.priceRange[1] < 600) ? [{ type: "price", label: "Price", value: `$${filters.priceRange[0]}–$${filters.priceRange[1]}` }] : []),
  ];

  const clearAll = () => setFilters({ countries: [], languages: [], priceRange: [0, 600], minRating: 0, availableOnly: false });

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

      {/* Country */}
      <FilterSection title="Country">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {COUNTRIES_LIST.map(c => {
            const adv = ALL_ADVISORS.find(a => a.country === c);
            const checked = filters.countries.includes(c);
            return (
              <label key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", cursor: "pointer", borderRadius: 8, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div onClick={() => toggleCountry(c)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${checked ? C.gold : C.border}`,
                    background: checked ? C.gold : C.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                  }}>
                  {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize: 14 }}>{adv?.flag}</span>
                <span style={{ fontSize: 13, color: C.navy, flex: 1 }}>{c}</span>
                <span style={{ fontSize: 11, color: C.muted, background: C.offWhite, padding: "1px 7px", borderRadius: 10 }}>
                  {ALL_ADVISORS.filter(a => a.country === c).length}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

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
                {ALL_ADVISORS.length} verified specialists across {new Set(ALL_ADVISORS.map(a => a.country)).size} countries. Transparent pricing, escrow-protected, real-time tracking.
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
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>Try adjusting the price range, removing a country filter, or clearing all filters.</p>
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



/* ─── TOKENS ─────────────────────────────────────────────────────── */
/* ─── MOCK DATA ──────────────────────────────────────────────────── */
const USER = {
  name:"Alexandra Chen", initials:"AC", email:"a.chen@example.com",
  phone:"+971 50 123 4567", nationality:"British", visaType:"Employment Visa",
  plan:"Standard", memberSince:"March 2025",
};

const STAGES = [
  { key:"submitted",    label:"Submitted",    icon:"📤", date:"12 May 2025", done:true  },
  { key:"review",       label:"Under Review",  icon:"🔍", date:"14 May 2025", done:true  },
  { key:"processing",   label:"Processing",    icon:"⚙️", date:null,          done:false, active:true },
  { key:"approved",     label:"Approved",      icon:"✅", date:null,          done:false },
  { key:"issued",       label:"TRC Issued",    icon:"📜", date:null,          done:false },
];

const APPLICATION = {
  id:"TRC-AE-2025-0847", country:"UAE", flag:"🇦🇪", advisor:"Amira Al-Rashid",
  advisorInitials:"AA", advisorTitle:"Senior Tax Consultant",
  type:"Individual TRC", submitted:"12 May 2025", expectedBy:"26 May 2025",
  govFee:"AED 2,000", advisorFee:"AED 1,299", totalFee:"AED 3,299",
  treaty:"UAE–UK Double Tax Treaty", purpose:"Claim UAE tax residency for UK HMRC",
  currentStage:2, daysElapsed:6, daysRemaining:8, progress:38,
  notes:"FTA application submitted. Currently pending initial document review by the Federal Tax Authority. No action required from applicant at this time.",
};

const DOCUMENTS_DATA = [
  { id:1, name:"Passport (all pages).pdf",           category:"Identity",   size:"2.4 MB", status:"approved",  uploaded:"10 May 2025", required:true  },
  { id:2, name:"Emirates ID – Front & Back.jpg",     category:"Identity",   size:"0.8 MB", status:"approved",  uploaded:"10 May 2025", required:true  },
  { id:3, name:"UAE Residency Visa.pdf",              category:"Residency",  size:"1.1 MB", status:"approved",  uploaded:"10 May 2025", required:true  },
  { id:4, name:"Ejari Tenancy Contract.pdf",          category:"Residency",  size:"3.2 MB", status:"approved",  uploaded:"11 May 2025", required:true  },
  { id:5, name:"GDRFA Travel History Report.pdf",    category:"Presence",   size:"0.5 MB", status:"approved",  uploaded:"11 May 2025", required:true  },
  { id:6, name:"FTA Application Request Letter.pdf", category:"Government", size:"0.2 MB", status:"pending",   uploaded:"12 May 2025", required:true  },
  { id:7, name:"Employment Contract.pdf",             category:"Income",     size:"1.8 MB", status:"approved",  uploaded:"11 May 2025", required:false },
  { id:8, name:"Bank Statements – 12 months.pdf",    category:"Financial",  size:"4.7 MB", status:"rejected",  uploaded:"11 May 2025", required:false,
    rejectionNote:"Statements appear to be from a non-UAE account. Please upload UAE bank statements only." },
];

const MESSAGES_DATA = [
  { id:1, from:"advisor", text:"Hello Alexandra! I've received your documents and will begin the pre-submission review today. Everything looks well organised so far — thank you for being thorough.", time:"Mon 12 May, 10:14", read:true },
  { id:2, from:"user",    text:"Thanks Amira! Let me know if you need anything else from my side. I'm available throughout this week.", time:"Mon 12 May, 11:02", read:true },
  { id:3, from:"advisor", text:"Quick update — I've reviewed all your documents and I noticed the bank statements are from a UK account rather than UAE. Could you upload your UAE Emirates NBD or ADCB statements instead? This is a common issue and easy to fix.", time:"Tue 13 May, 09:45", read:true },
  { id:4, from:"user",    text:"Of course — uploading them now. Should I upload all 12 months or just the last 3?", time:"Tue 13 May, 10:20", read:true },
  { id:5, from:"advisor", text:"All 12 months is preferred as the FTA typically requests the full year. Once those are uploaded I'll repackage the application and submit to EmaraTax. Estimated submission by end of today.", time:"Tue 13 May, 10:35", read:true },
  { id:6, from:"advisor", text:"Great news — the application has been submitted to the Federal Tax Authority via EmaraTax. Your reference number is FTA-TRC-2025-08847. You should receive a portal confirmation email shortly.", time:"Mon 12 May, 16:58", read:true },
  { id:7, from:"user",    text:"Perfect — got the confirmation email. What's the typical processing time from here?", time:"Wed 14 May, 08:30", read:true },
  { id:8, from:"advisor", text:"FTA typically takes 5–10 business days once submitted. We're now in the processing stage. I'll ping you the moment there's any update from their end. No action needed from you right now — just sit tight! 🎉", time:"Wed 14 May, 09:12", read:true },
];

const ACTIVITY = [
  { icon:"📤", text:"Application submitted to FTA", time:"12 May, 16:58", color:C.gold },
  { icon:"📎", text:"Bank statement flagged — needs UAE version", time:"13 May, 09:45", color:C.warn },
  { icon:"✅", text:"6 of 7 required documents approved", time:"11 May, 14:20", color:C.success },
  { icon:"💬", text:"New message from Amira Al-Rashid", time:"14 May, 09:12", color:C.info },
  { icon:"🔍", text:"Application moved to Under Review", time:"14 May, 09:00", color:C.navyLight },
];

const SETTINGS_SECTIONS = ["Personal Details", "Security", "Notifications", "Preferences"];

/* ─── HELPERS ────────────────────────────────────────────────────── */
const statusStyle = s => ({
  approved: { bg:C.successBg, color:C.success,  border:C.successBorder, label:"Approved"  },
  pending:  { bg:C.warnBg,    color:C.warn,      border:C.warnBorder,    label:"Pending"   },
  rejected: { bg:C.errorBg,   color:C.error,     border:C.errorBorder,   label:"Rejected"  },
}[s] || { bg:C.offWhite, color:C.muted, border:C.border, label:s });

const catColor = c => ({
  Identity:   { bg:"#EEF2FF", color:"#3730A3" },
  Residency:  { bg:C.successBg, color:C.success },
  Government: { bg:C.warnBg, color:C.warn },
  Income:     { bg:"#F5F3FF", color:"#5B21B6" },
  Financial:  { bg:C.infoBg, color:C.info },
  Presence:   { bg:"#FDF2F8", color:"#9D174D" },
}[c] || { bg:C.offWhite, color:C.muted });

function Avatar({ initials, size=38, bg=`linear-gradient(135deg, ${C.navy}, ${C.navyLight})` }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:bg, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.3, fontWeight:700, color:C.white, letterSpacing:"0.05em",
    }}>{initials}</div>
  );
}

function StatusBadge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`, letterSpacing:"0.04em" }}>
      {s.label}
    </span>
  );
}

function SectionHead({ label, title, action, onAction }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28, gap:12, flexWrap:"wrap" }}>
      <div>
        <span style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.12em", display:"block", marginBottom:6 }}>{label}</span>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,2.8vw,32px)", fontWeight:700, color:C.navy, lineHeight:1.15, letterSpacing:"-0.01em" }}>{title}</h2>
      </div>
      {action && <button onClick={onAction} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white, border:"none", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:"0.02em", whiteSpace:"nowrap" }}>{action}</button>}
    </div>
  );
}

/* ─── STAGE TRACKER ──────────────────────────────────────────────── */
function StageTracker({ currentStage }) {
  return (
    <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:"32px 36px", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:10 }}>
        <div>
          <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Application Progress</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.navy }}>{APPLICATION.id}</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <div style={{ background:C.warnBg, border:`1px solid ${C.warnBorder}`, borderRadius:10, padding:"7px 14px", display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:C.warn }}/>
            <span style={{ fontSize:12, fontWeight:700, color:C.warn }}>In Progress · Day {APPLICATION.daysElapsed}</span>
          </div>
          <div style={{ background:C.offWhite, border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 14px" }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>Est. completion <strong style={{ color:C.navy }}>{APPLICATION.expectedBy}</strong></span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:32 }}>
        <div style={{ height:6, background:C.offWhite2, borderRadius:999, overflow:"hidden", marginBottom:8 }}>
          <div style={{ height:"100%", width:`${APPLICATION.progress}%`, background:`linear-gradient(90deg,${C.gold},${C.goldDark})`, borderRadius:999, transition:"width 1s ease" }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:C.muted }}>{APPLICATION.progress}% complete</span>
          <span style={{ fontSize:11, color:C.muted }}>{APPLICATION.daysRemaining} days estimated remaining</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:0, position:"relative" }}>
        {STAGES.map((stage, i) => {
          const isDone   = i < currentStage;
          const isActive = i === currentStage;
          const isFuture = i > currentStage;
          return (
            <div key={stage.key} style={{ flex:1, position:"relative", display:"flex", flexDirection:"column", alignItems:"center" }}>
              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div style={{
                  position:"absolute", top:18, left:"50%", width:"100%", height:3, zIndex:0,
                  background: isDone ? `linear-gradient(90deg,${C.gold},${C.goldLight})` : C.offWhite2,
                  transition:"background 0.4s",
                }}/>
              )}

              {/* Circle */}
              <div style={{
                width:38, height:38, borderRadius:"50%", zIndex:1, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: isDone ? `linear-gradient(135deg,${C.gold},${C.goldDark})` : isActive ? C.navy : C.white,
                border: isFuture ? `2.5px solid ${C.border}` : isActive ? `3px solid ${C.gold}` : `2.5px solid ${C.gold}`,
                boxShadow: isActive ? `0 0 0 5px ${C.gold}22` : isDone ? "0 3px 10px rgba(201,168,76,0.3)" : "none",
                transition:"all 0.35s",
              }}>
                {isDone
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : isActive
                    ? <div style={{ width:10, height:10, borderRadius:"50%", background:C.gold }}/>
                    : <div style={{ width:8, height:8, borderRadius:"50%", background:C.border }}/>
                }
              </div>

              {/* Label */}
              <div style={{ marginTop:10, textAlign:"center", padding:"0 4px" }}>
                <p style={{ fontSize:12, fontWeight: isActive ? 700 : isDone ? 600 : 400, color: isFuture ? C.muted : C.navy, lineHeight:1.3 }}>{stage.label}</p>
                {stage.date && <p style={{ fontSize:10, color:C.gold, marginTop:3, fontWeight:600 }}>{stage.date}</p>}
                {isActive && <p style={{ fontSize:10, color:C.warn, marginTop:3, fontWeight:700 }}>● Active</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div style={{ marginTop:28, background:C.infoBg, border:`1px solid ${C.infoBorder}`, borderRadius:12, padding:"14px 18px", display:"flex", gap:10 }}>
        <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
        <p style={{ fontSize:13, color:C.info, lineHeight:1.65 }}>{APPLICATION.notes}</p>
      </div>
    </div>
  );
}

/* ─── OVERVIEW TAB ───────────────────────────────────────────────── */
function Overview({ onNav }) {
  const docApproved = DOCUMENTS_DATA.filter(d=>d.status==="approved").length;
  const docTotal    = DOCUMENTS_DATA.length;
  const unread      = 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <SectionHead label="Dashboard" title={`Welcome back, ${USER.name.split(" ")[0]} 👋`}/>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        {[
          { label:"Active Applications", value:"1", sub:"UAE TRC in progress", icon:"📋", color:C.gold },
          { label:"Documents Uploaded",  value:`${docApproved}/${docTotal}`, sub:`${docTotal-docApproved} need attention`, icon:"📁", color:C.info },
          { label:"Days Remaining",      value:APPLICATION.daysRemaining, sub:"Estimated completion", icon:"⏱", color:C.success },
          { label:"Advisor Rating",      value:"4.9★", sub:"Amira Al-Rashid", icon:"⭐", color:C.warn },
        ].map(s => (
          <div key={s.label} style={{
            background:C.white, borderRadius:16, border:`1px solid ${C.border}`,
            padding:"22px 22px 20px", boxShadow:"0 2px 10px rgba(15,37,87,0.05)",
            display:"flex", flexDirection:"column", gap:12,
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</span>
            </div>
            <div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:12, color:C.muted, marginTop:5 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stage tracker */}
      <StageTracker currentStage={APPLICATION.currentStage}/>

      {/* Application details + activity */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>

        {/* Application details card */}
        <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:"28px 32px", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy }}>Application Details</p>
            <span style={{ fontSize:22 }}>{APPLICATION.flag}</span>
          </div>
          {[
            { l:"Reference", v:APPLICATION.id },
            { l:"Service Type", v:APPLICATION.type },
            { l:"Jurisdiction", v:APPLICATION.country },
            { l:"Treaty", v:APPLICATION.treaty },
            { l:"Purpose", v:APPLICATION.purpose },
            { l:"Submitted", v:APPLICATION.submitted },
            { l:"Expected By", v:APPLICATION.expectedBy },
            { l:"Government Fee", v:APPLICATION.govFee },
            { l:"Advisor Fee", v:APPLICATION.advisorFee },
          ].map((r,i) => (
            <div key={r.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, padding:"11px 0", borderBottom: i<8 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize:13, color:C.muted, flexShrink:0 }}>{r.l}</span>
              <span style={{ fontSize:13, fontWeight:600, color:C.navy, textAlign:"right" }}>{r.v}</span>
            </div>
          ))}

          <div style={{ marginTop:20, display:"flex", gap:10 }}>
            <button onClick={()=>onNav("messages")} style={{ flex:1, background:C.navy, color:C.white, border:"none", borderRadius:10, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer" }}>💬 Message Advisor</button>
            <button onClick={()=>onNav("documents")} style={{ flex:1, background:"transparent", color:C.navy, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer" }}>📁 View Documents</button>
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:"28px 24px", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
          <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:20 }}>Recent Activity</p>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {ACTIVITY.map((a,i) => (
              <div key={i} style={{ display:"flex", gap:12, paddingBottom:16, position:"relative" }}>
                {i < ACTIVITY.length-1 && <div style={{ position:"absolute", left:15, top:28, bottom:0, width:1, background:C.border }}/>}
                <div style={{ width:30, height:30, borderRadius:"50%", background:C.offWhite2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, zIndex:1 }}>{a.icon}</div>
                <div>
                  <p style={{ fontSize:13, color:C.navy, lineHeight:1.4 }}>{a.text}</p>
                  <p style={{ fontSize:11, color:C.muted, marginTop:3 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advisor info strip */}
      <div style={{ background:`linear-gradient(135deg,${C.navyDark},${C.navy})`, borderRadius:18, padding:"24px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <Avatar initials="AA" size={52} bg={`linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))`}/>
          <div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:3 }}>Your Assigned Advisor</p>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.white }}>{APPLICATION.advisor}</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{APPLICATION.advisorTitle}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={()=>onNav("messages")} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white, border:"none", borderRadius:10, padding:"11px 22px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Send Message →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MY APPLICATIONS TAB ────────────────────────────────────────── */
function Applications() {
  return (
    <div>
      <SectionHead label="Applications" title="My TRC Applications" action="+ New Application"/>
      <StageTracker currentStage={APPLICATION.currentStage}/>

      {/* Application card */}
      <div style={{ marginTop:20, background:C.white, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
        <div style={{ background:`linear-gradient(135deg,${C.navyDark},${C.navy})`, padding:"20px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:36 }}>{APPLICATION.flag}</span>
            <div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.white }}>{APPLICATION.country} Tax Residency Certificate</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Ref: {APPLICATION.id}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ background:C.warnBg, color:C.warn, fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:20, border:`1px solid ${C.warnBorder}` }}>● Processing</span>
            <span style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:20 }}>Day {APPLICATION.daysElapsed} of ~{APPLICATION.daysElapsed+APPLICATION.daysRemaining}</span>
          </div>
        </div>

        <div style={{ padding:"28px 28px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
          {[
            { l:"Treaty Purpose",     v:APPLICATION.treaty },
            { l:"Submitted",          v:APPLICATION.submitted },
            { l:"Expected Delivery",  v:APPLICATION.expectedBy },
            { l:"Government Fee",     v:APPLICATION.govFee },
            { l:"Advisor Fee",        v:APPLICATION.advisorFee },
            { l:"Total Cost",         v:APPLICATION.totalFee },
          ].map(r=>(
            <div key={r.l}>
              <p style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{r.l}</p>
              <p style={{ fontSize:14, fontWeight:700, color:C.navy }}>{r.v}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop:`1px solid ${C.border}`, padding:"18px 28px", display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { icon:"📁", label:"View Documents",    color:C.navy  },
            { icon:"💬", label:"Message Advisor",   color:C.navy  },
            { icon:"🖨",  label:"Download Summary",  color:C.muted },
            { icon:"❌", label:"Cancel Application", color:C.error },
          ].map(btn=>(
            <button key={btn.label} style={{
              background:"transparent", color:btn.color,
              border:`1px solid ${btn.color==="red"?C.errorBorder:C.border}`, borderRadius:9,
              padding:"9px 16px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", gap:6, alignItems:"center",
            }}>{btn.icon} {btn.label}</button>
          ))}
        </div>
      </div>

      {/* Timeline detail */}
      <div style={{ marginTop:20, background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:"28px 32px", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
        <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:22 }}>Stage-by-Stage Breakdown</p>
        {[
          { stage:"Application Submitted",       date:"12 May 2025, 16:58", desc:"All documents compiled and application package submitted to UAE FTA via EmaraTax portal under advisor account.", done:true  },
          { stage:"Under FTA Review",            date:"14 May 2025, 09:00", desc:"The Federal Tax Authority acknowledged receipt of the application and initiated their standard document review process.", done:true  },
          { stage:"FTA Processing",              date:"In progress",        desc:"FTA is currently reviewing your residency proof and travel history. Our advisor is monitoring status daily.", active:true },
          { stage:"Approval Notification",       date:"Pending",            desc:"Upon approval, FTA will issue a digital certificate via EmaraTax. Estimated within 5–10 business days of submission.", done:false },
          { stage:"TRC Issued & Delivered",      date:"Pending",            desc:"Your TRC will be delivered digitally through your dashboard. Physical stamped copy can be arranged upon request.", done:false },
        ].map((t,i)=>(
          <div key={i} style={{ display:"flex", gap:16, paddingBottom: i<4?24:0, position:"relative" }}>
            {i<4 && <div style={{ position:"absolute", left:14, top:30, bottom:0, width:1.5, background: t.done?`linear-gradient(${C.gold},${C.gold}44)`:C.border }}/>}
            <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, zIndex:1, display:"flex", alignItems:"center", justifyContent:"center",
              background: t.done ? `linear-gradient(135deg,${C.gold},${C.goldDark})` : t.active ? C.navy : C.white,
              border: t.active ? `2px solid ${C.gold}` : t.done ? "none" : `2px solid ${C.border}`,
              boxShadow: t.active ? `0 0 0 4px ${C.gold}22` : "none",
            }}>
              {t.done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : t.active ? <div style={{ width:8,height:8,borderRadius:"50%",background:C.gold }}/> 
                : <div style={{ width:7,height:7,borderRadius:"50%",background:C.border }}/>}
            </div>
            <div style={{ paddingTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                <p style={{ fontSize:14, fontWeight:700, color: t.done||t.active?C.navy:C.muted }}>{t.stage}</p>
                <span style={{ fontSize:11, color: t.active?C.warn:t.done?C.gold:C.muted, fontWeight:t.active?700:500 }}>{t.date}</span>
                {t.active && <span style={{ fontSize:10, fontWeight:800, background:C.warnBg, color:C.warn, padding:"2px 7px", borderRadius:20, border:`1px solid ${C.warnBorder}` }}>IN PROGRESS</span>}
              </div>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, maxWidth:600 }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── UAE_DOCUMENTS TAB ──────────────────────────────────────────────── */
function Documents() {
  const [docs, setDocs] = useState(DOCUMENTS_DATA);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const fileRef = useRef(null);

  const categories = ["All", ...new Set(docs.map(d=>d.category))];
  const displayed = activeCategory==="All" ? docs : docs.filter(d=>d.category===activeCategory);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer?.files||[]);
    if (!files.length) return;
    triggerUpload(files);
  },[]);

  const handleFileInput = e => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    triggerUpload(files);
  };

  const triggerUpload = files => {
    setUploading(true);
    setTimeout(() => {
      const newDocs = files.map((f,i)=>({
        id: docs.length+i+1, name:f.name, category:"Income",
        size:`${(f.size/1048576).toFixed(1)} MB`,
        status:"pending", uploaded:"18 May 2025", required:false,
      }));
      setDocs(d=>[...d,...newDocs]);
      setUploading(false);
    }, 1400);
  };

  const stats = {
    total:   docs.length,
    approved:docs.filter(d=>d.status==="approved").length,
    pending: docs.filter(d=>d.status==="pending").length,
    rejected:docs.filter(d=>d.status==="rejected").length,
  };

  return (
    <div>
      <SectionHead label="Documents" title="Document Management" action="Upload Files" onAction={()=>fileRef.current?.click()}/>
      <input ref={fileRef} type="file" multiple onChange={handleFileInput} style={{ display:"none" }} accept=".pdf,.jpg,.jpeg,.png"/>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { l:"Total",    v:stats.total,    color:C.navy,    bg:C.offWhite2 },
          { l:"Approved", v:stats.approved, color:C.success, bg:C.successBg },
          { l:"Pending",  v:stats.pending,  color:C.warn,    bg:C.warnBg    },
          { l:"Rejected", v:stats.rejected, color:C.error,   bg:C.errorBg   },
        ].map(s=>(
          <div key={s.l} style={{ background:s.bg, borderRadius:14, padding:"16px 18px", border:`1px solid ${s.color}22` }}>
            <p style={{ fontSize:11, color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", opacity:0.7, marginBottom:6 }}>{s.l}</p>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:800, color:s.color }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={e=>{e.preventDefault();setDragging(false)}}
        onDragOver={e=>e.preventDefault()}
        onDrop={handleDrop}
        onClick={()=>!uploading&&fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?C.gold:C.border}`,
          borderRadius:16, padding:"36px 24px", textAlign:"center",
          background: dragging?`${C.gold}08`:C.white,
          cursor:"pointer", transition:"all 0.2s", marginBottom:24,
          boxShadow: dragging?"0 0 0 4px rgba(201,168,76,0.12)":"none",
        }}>
        {uploading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <p style={{ fontSize:14, fontWeight:600, color:C.gold }}>Uploading files…</p>
          </div>
        ):(
          <>
            <div style={{ fontSize:36, marginBottom:12 }}>{dragging?"📂":"📤"}</div>
            <p style={{ fontSize:15, fontWeight:700, color: dragging?C.gold:C.navy, marginBottom:6 }}>
              {dragging ? "Release to upload" : "Drag & drop files here"}
            </p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:12 }}>PDF, JPG, PNG accepted · Max 25 MB per file</p>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, background:`${C.gold}14`, border:`1px solid ${C.gold}44`, borderRadius:20, padding:"5px 16px" }}>
              Browse Files
            </span>
          </>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        {categories.map(cat=>(
          <button key={cat} onClick={()=>setActiveCategory(cat)} style={{
            padding:"7px 16px", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer",
            background: activeCategory===cat ? C.navy : C.offWhite,
            color: activeCategory===cat ? C.white : C.muted,
            border:`1px solid ${activeCategory===cat ? C.navy : C.border}`,
            transition:"all 0.15s",
          }}>{cat}</button>
        ))}
      </div>

      {/* Document list */}
      <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 90px 70px", gap:16, padding:"12px 22px", background:C.offWhite2, borderBottom:`1px solid ${C.border}` }}>
          {["Document","Category","Size","Uploaded","Status"].map(h=>(
            <span key={h} style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
          ))}
        </div>

        {displayed.map((doc,i) => {
          const cc = catColor(doc.category);
          return (
            <div key={doc.id}>
              <div style={{
                display:"grid", gridTemplateColumns:"1fr 100px 90px 90px 70px",
                gap:16, padding:"15px 22px", alignItems:"center",
                borderBottom: i<displayed.length-1?`1px solid ${C.border}`:"none",
                background:"white", transition:"background 0.15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                onMouseLeave={e=>e.currentTarget.style.background=C.white}
              >
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <div style={{ width:34,height:34,borderRadius:8,background:C.offWhite2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>
                    {doc.name.endsWith(".pdf")?"📄":"🖼"}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</p>
                    {doc.required && <span style={{ fontSize:10, color:C.error, fontWeight:700 }}>Required</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, background:cc.bg, color:cc.color, whiteSpace:"nowrap" }}>{doc.category}</span>
                <span style={{ fontSize:12, color:C.muted }}>{doc.size}</span>
                <span style={{ fontSize:12, color:C.muted }}>{doc.uploaded}</span>
                <StatusBadge status={doc.status}/>
              </div>
              {doc.status==="rejected" && doc.rejectionNote && (
                <div style={{ margin:"0 22px 14px", background:C.errorBg, border:`1px solid ${C.errorBorder}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:8 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
                  <p style={{ fontSize:12, color:C.error, lineHeight:1.6 }}>{doc.rejectionNote}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MESSAGES TAB ───────────────────────────────────────────────── */
function Messages() {
  const [messages, setMessages] = useState(MESSAGES_DATA);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = { id:messages.length+1, from:"user", text, time:"Now", read:false };
    setMessages(m=>[...m,newMsg]);
    setInput("");
    setTyping(true);

    setTimeout(()=>{
      setTyping(false);
      const replies = [
        "Thanks for the update! I'll look into that right away and get back to you within the hour.",
        "Noted — everything looks good from my end. The FTA application is progressing well.",
        "Great question. I'll check with the FTA portal and confirm the status shortly.",
        "Understood. No issues at all — we're on track for the expected delivery date.",
      ];
      setMessages(m=>[...m,{
        id:m.length+2, from:"advisor",
        text: replies[Math.floor(Math.random()*replies.length)],
        time:"Just now", read:false,
      }]);
    }, 2200);
  };

  const formatDate = (msgs, i) => {
    const dates = { "Mon 12 May":"Mon 12 May, 2025", "Tue 13 May":"Tue 13 May, 2025", "Wed 14 May":"Wed 14 May, 2025" };
    const dateKey = Object.keys(dates).find(k=>msgs[i].time.startsWith(k));
    if (!dateKey) return null;
    if (i===0) return dates[dateKey];
    const prevKey = Object.keys(dates).find(k=>msgs[i-1].time.startsWith(k));
    return dateKey!==prevKey ? dates[dateKey] : null;
  };

  return (
    <div>
      <SectionHead label="Messages" title="Advisor Conversation"/>

      <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 20px rgba(15,37,87,0.07)", display:"flex", flexDirection:"column", height:680 }}>

        {/* Thread header */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.white, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:13 }}>
            <div style={{ position:"relative" }}>
              <Avatar initials="AA" size={44}/>
              <div style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", background:C.success, border:`2px solid ${C.white}` }}/>
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:C.navy, fontFamily:"'Cormorant Garamond',serif" }}>{APPLICATION.advisor}</p>
              <p style={{ fontSize:12, color:C.success, fontWeight:600 }}>● Online · Typically replies within 2 hours</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[{ icon:"📞", tip:"Call" },{ icon:"📅", tip:"Schedule" },{ icon:"⋯", tip:"More" }].map(b=>(
              <button key={b.tip} title={b.tip} style={{ width:36,height:36,borderRadius:10,background:C.offWhite,border:`1px solid ${C.border}`,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{b.icon}</button>
            ))}
          </div>
        </div>

        {/* Application context bar */}
        <div style={{ background:C.infoBg, borderBottom:`1px solid ${C.infoBorder}`, padding:"10px 24px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:16 }}>{APPLICATION.flag}</span>
          <p style={{ fontSize:12, color:C.info, fontWeight:600 }}>Active Application: {APPLICATION.id} · <span style={{ fontWeight:400 }}>UAE TRC · Stage: Processing</span></p>
        </div>

        {/* Messages list */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 24px 8px", display:"flex", flexDirection:"column", gap:4 }}>
          {messages.map((msg,i) => {
            const isUser    = msg.from==="user";
            const dateLabel = formatDate(messages,i);
            return (
              <div key={msg.id}>
                {dateLabel && (
                  <div style={{ textAlign:"center", margin:"16px 0 12px" }}>
                    <span style={{ fontSize:11, color:C.muted, fontWeight:600, background:C.offWhite2, padding:"3px 12px", borderRadius:20 }}>{dateLabel}</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent: isUser?"flex-end":"flex-start", marginBottom:10, gap:10, alignItems:"flex-end" }}>
                  {!isUser && <Avatar initials="AA" size={30}/>}
                  <div style={{ maxWidth:"68%", display:"flex", flexDirection:"column", alignItems: isUser?"flex-end":"flex-start", gap:3 }}>
                    <div style={{
                      background: isUser ? `linear-gradient(135deg,${C.navy},${C.navyLight})` : C.offWhite2,
                      color: isUser ? C.white : C.navy,
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding:"12px 16px", fontSize:14, lineHeight:1.6,
                      boxShadow: isUser?"0 4px 14px rgba(15,37,87,0.2)":"0 2px 8px rgba(15,37,87,0.06)",
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <p style={{ fontSize:11, color:C.muted }}>{msg.time}</p>
                      {isUser && <span style={{ fontSize:11, color: msg.read?C.info:C.muted }}>{msg.read?"✓✓":"✓"}</span>}
                    </div>
                  </div>
                  {isUser && <Avatar initials={USER.initials} size={30} bg={`linear-gradient(135deg,${C.gold},${C.goldDark})`}/>}
                </div>
              </div>
            );
          })}

          {typing && (
            <div style={{ display:"flex", gap:10, alignItems:"center", paddingBottom:8 }}>
              <Avatar initials="AA" size={30}/>
              <div style={{ background:C.offWhite2, borderRadius:"18px 18px 18px 4px", padding:"12px 16px" }}>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(d=>(
                    <div key={d} style={{ width:7,height:7,borderRadius:"50%",background:C.muted,animation:`bounce 1.2s ease ${d*0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Composer */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`, flexShrink:0, background:C.white }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button title="Attach file" style={{ width:36,height:36,borderRadius:10,background:C.offWhite,border:`1px solid ${C.border}`,fontSize:16,cursor:"pointer" }}>📎</button>
              <button title="Add emoji" style={{ width:36,height:36,borderRadius:10,background:C.offWhite,border:`1px solid ${C.border}`,fontSize:16,cursor:"pointer" }}>😊</button>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex:1, padding:"11px 16px", borderRadius:12, fontFamily:"inherit",
                border:`1.5px solid ${input?C.gold:C.border}`, fontSize:14, color:C.navy,
                outline:"none", resize:"none", lineHeight:1.5,
                transition:"border-color 0.2s, box-shadow 0.2s",
                boxShadow: input?`0 0 0 3px ${C.gold}20`:"none",
              }}
            />
            <button onClick={send} disabled={!input.trim()}
              style={{
                width:42, height:42, borderRadius:12, border:"none", cursor: input.trim()?"pointer":"not-allowed",
                background: input.trim()?`linear-gradient(135deg,${C.gold},${C.goldDark})`:`${C.gold}44`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18,
                transition:"all 0.2s", boxShadow: input.trim()?"0 4px 12px rgba(201,168,76,0.35)":"none",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize:11, color:C.muted, marginTop:8, paddingLeft:2 }}>Messages are encrypted · {APPLICATION.advisor} typically responds within 2 hours</p>
        </div>
      </div>
    </div>
  );
}

/* ─── SETTINGS TAB ───────────────────────────────────────────────── */
function Settings() {
  const [activeSection, setActiveSection] = useState("Personal Details");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name:USER.name, email:USER.email, phone:USER.phone, nationality:USER.nationality, visa:USER.visaType });
  const [notifs, setNotifs] = useState({ email:true, sms:false, push:true, updates:true, marketing:false });

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };

  const inp = (label, key, type="text") => (
    <div>
      <label style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8 }}>{label}</label>
      <input value={form[key]} type={type} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
        onFocus={e=>{e.target.style.borderColor=C.gold;e.target.style.boxShadow=`0 0 0 3px ${C.gold}20`}}
        onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"}}
        style={{ width:"100%",padding:"12px 14px",borderRadius:10,fontFamily:"inherit",border:`1.5px solid ${C.border}`,fontSize:14,color:C.navy,outline:"none",transition:"all 0.2s" }}/>
    </div>
  );

  return (
    <div>
      <SectionHead label="Settings" title="Account Settings"/>
      <div style={{ display:"flex", gap:20 }}>

        {/* Section tabs */}
        <div style={{ width:200, flexShrink:0 }}>
          <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 10px rgba(15,37,87,0.05)" }}>
            {SETTINGS_SECTIONS.map((s,i)=>(
              <button key={s} onClick={()=>setActiveSection(s)} style={{
                width:"100%", textAlign:"left", padding:"13px 18px",
                background: activeSection===s ? C.offWhite2 : C.white,
                color: activeSection===s ? C.navy : C.muted,
                fontWeight: activeSection===s ? 700 : 500,
                borderLeft: activeSection===s ? `3px solid ${C.gold}` : "3px solid transparent",
                borderTop:"none", borderRight:"none",
                borderBottom: i<SETTINGS_SECTIONS.length-1 ? `1px solid ${C.border}` : "none",
                fontSize:13, cursor:"pointer", transition:"all 0.15s",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>
          <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:"32px 32px", boxShadow:"0 2px 12px rgba(15,37,87,0.05)" }}>

            {activeSection==="Personal Details" && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32, paddingBottom:28, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ position:"relative" }}>
                    <Avatar initials={USER.initials} size={64} bg={`linear-gradient(135deg,${C.gold},${C.goldDark})`}/>
                    <button style={{ position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:C.navy,border:`2px solid ${C.white}`,color:C.white,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✎</button>
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy }}>{USER.name}</p>
                    <p style={{ fontSize:12,color:C.muted,marginTop:2 }}>Member since {USER.memberSince} · {USER.plan} Plan</p>
                  </div>
                  <span style={{ marginLeft:"auto",background:`${C.gold}14`,color:C.goldDark,fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:20,border:`1px solid ${C.gold}44` }}>{USER.plan}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:28 }}>
                  {inp("Full Name","name")}
                  {inp("Email Address","email","email")}
                  {inp("Phone Number","phone","tel")}
                  {inp("Nationality","nationality")}
                </div>
                <div style={{ marginBottom:28 }}>
                  <label style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8 }}>Visa Type</label>
                  <select value={form.visa} onChange={e=>setForm(f=>({...f,visa:e.target.value}))} style={{ width:"100%",padding:"12px 14px",borderRadius:10,fontFamily:"inherit",border:`1.5px solid ${C.border}`,fontSize:14,color:C.navy,outline:"none",appearance:"none" }}>
                    <option>Employment Visa</option><option>Investor / Business Visa</option>
                    <option>Golden Visa</option><option>Family / Dependent</option><option>Freelance Permit</option>
                  </select>
                </div>
              </>
            )}

            {activeSection==="Notifications" && (
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                <p style={{ fontSize:15,fontWeight:700,color:C.navy,marginBottom:20 }}>Notification Preferences</p>
                {[
                  { key:"email",     label:"Email Notifications",       sub:"Status updates and advisor messages via email"    },
                  { key:"sms",       label:"SMS / WhatsApp Alerts",      sub:"Critical alerts and reminders via SMS"            },
                  { key:"push",      label:"Browser Push Notifications", sub:"Real-time alerts in your browser"                },
                  { key:"updates",   label:"Application Status Updates", sub:"Notify me on every stage change"                 },
                  { key:"marketing", label:"Tips & Promotional Content", sub:"New country launches, tax planning resources"    },
                ].map((n,i)=>(
                  <div key={n.key} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 0",borderBottom: i<4?`1px solid ${C.border}`:"none",gap:24 }}>
                    <div>
                      <p style={{ fontSize:14,fontWeight:600,color:C.navy }}>{n.label}</p>
                      <p style={{ fontSize:12,color:C.muted,marginTop:3 }}>{n.sub}</p>
                    </div>
                    <div onClick={()=>setNotifs(prev=>({...prev,[n.key]:!prev[n.key]}))}
                      style={{ width:44,height:24,borderRadius:12,background:notifs[n.key]?C.gold:C.border,position:"relative",transition:"background 0.2s",cursor:"pointer",flexShrink:0 }}>
                      <div style={{ position:"absolute",top:3,left:notifs[n.key]?23:3,width:18,height:18,borderRadius:"50%",background:C.white,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection==="Security" && (
              <div>
                <p style={{ fontSize:15,fontWeight:700,color:C.navy,marginBottom:20 }}>Security Settings</p>
                {[
                  { icon:"🔑", label:"Change Password",         sub:"Last changed 32 days ago",                action:"Update" },
                  { icon:"📱", label:"Two-Factor Authentication",sub:"Currently disabled — strongly recommended", action:"Enable", warn:true },
                  { icon:"📋", label:"Active Sessions",          sub:"1 active session (this device)",          action:"View" },
                  { icon:"🗑", label:"Delete Account",           sub:"Permanently remove your account and data", action:"Delete", danger:true },
                ].map((s,i)=>(
                  <div key={s.label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 0",borderBottom: i<3?`1px solid ${C.border}`:"none",gap:16 }}>
                    <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                      <div style={{ width:40,height:40,borderRadius:12,background:C.offWhite2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{s.icon}</div>
                      <div>
                        <p style={{ fontSize:14,fontWeight:600,color:C.navy }}>{s.label}</p>
                        <p style={{ fontSize:12,color: s.warn?C.warn:C.muted,marginTop:2,fontWeight:s.warn?600:400 }}>{s.sub}</p>
                      </div>
                    </div>
                    <button style={{ background:s.danger?C.errorBg:"transparent",color:s.danger?C.error:C.navy,border:`1px solid ${s.danger?C.errorBorder:C.border}`,borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer" }}>{s.action}</button>
                  </div>
                ))}
              </div>
            )}

            {activeSection==="Preferences" && (
              <div>
                <p style={{ fontSize:15,fontWeight:700,color:C.navy,marginBottom:20 }}>App Preferences</p>
                {[
                  { label:"Display Currency",   options:["USD","AED","GBP","EUR","SGD"], defaultVal:"USD" },
                  { label:"Date Format",        options:["DD MMM YYYY","MM/DD/YYYY","YYYY-MM-DD"], defaultVal:"DD MMM YYYY" },
                  { label:"Language",           options:["English","Arabic","French","Spanish"], defaultVal:"English" },
                  { label:"Timezone",           options:["Asia/Dubai (UTC+4)","Europe/London (UTC+0)","Asia/Singapore (UTC+8)","America/New_York (UTC-5)"], defaultVal:"Asia/Dubai (UTC+4)" },
                ].map((p,i)=>(
                  <div key={p.label} style={{ paddingBottom:18,marginBottom:18,borderBottom: i<3?`1px solid ${C.border}`:"none" }}>
                    <label style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8 }}>{p.label}</label>
                    <select defaultValue={p.defaultVal} style={{ width:"100%",padding:"12px 14px",borderRadius:10,fontFamily:"inherit",border:`1.5px solid ${C.border}`,fontSize:14,color:C.navy,outline:"none",appearance:"none",background:C.white }}>
                      {p.options.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Save row */}
            <div style={{ display:"flex",alignItems:"center",gap:12,paddingTop:24,borderTop:`1px solid ${C.border}`,marginTop:4 }}>
              <button onClick={handleSave} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,color:C.white,border:"none",borderRadius:11,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(201,168,76,0.35)" }}>
                {saved?"✓ Saved!":"Save Changes"}
              </button>
              <button style={{ background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 24px",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              {saved && <span style={{ fontSize:13,color:C.success,fontWeight:600,animation:"fadeIn 0.3s ease" }}>✅ Your changes have been saved.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR NAV ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { key:"overview",      label:"Overview",          icon:"◉" },
  { key:"applications",  label:"My Applications",   icon:"📋" },
  { key:"documents",     label:"Documents",         icon:"📁", badge: DOCUMENTS_DATA.filter(d=>d.status==="rejected").length||null },
  { key:"messages",      label:"Messages",          icon:"💬", badge:1 },
  { key:"settings",      label:"Settings",          icon:"⚙️" },
];

function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width:248, flexShrink:0, background:C.sidebar,
      borderRight:`1px solid rgba(255,255,255,0.07)`,
      display:"flex", flexDirection:"column",
      minHeight:"100vh", position:"sticky", top:0, alignSelf:"start", height:"100vh",
    }}>
      {/* Logo */}
      <div style={{ padding:"22px 22px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32,height:32,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚖</div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.white }}>TRC<span style={{ color:C.goldLight,fontWeight:400 }}> Connect</span></span>
        </div>
        <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.05)", borderRadius:10 }}>
          <Avatar initials={USER.initials} size={34} bg={`linear-gradient(135deg,${C.gold},${C.goldDark})`}/>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13,fontWeight:700,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{USER.name}</p>
            <p style={{ fontSize:11,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{USER.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:"14px 14px", flex:1 }}>
        <p style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 8px",marginBottom:8 }}>Navigation</p>
        {NAV_ITEMS.map(item=>{
          const isActive = active===item.key;
          return (
            <button key={item.key} onClick={()=>onNav(item.key)}
              style={{
                width:"100%",display:"flex",alignItems:"center",gap:11,
                padding:"11px 12px",borderRadius:11,marginBottom:3,
                background: isActive?"rgba(201,168,76,0.15)":"transparent",
                border: isActive?`1px solid rgba(201,168,76,0.25)`:"1px solid transparent",
                color: isActive?C.goldLight:"rgba(255,255,255,0.6)",
                fontWeight: isActive?700:400,
                fontSize:13,cursor:"pointer",textAlign:"left",
                transition:"all 0.15s",
              }}
              onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
              onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}
            >
              <span style={{ fontSize:15,flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background:C.error,color:C.white,fontSize:10,fontWeight:800,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center" }}>{item.badge}</span>
              )}
            </button>
          );
        })}

        {/* Application quick card */}
        <div style={{ margin:"18px 0 0", padding:"14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12 }}>
          <p style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Active Application</p>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
            <span style={{ fontSize:18 }}>🇦🇪</span>
            <div>
              <p style={{ fontSize:12,fontWeight:700,color:C.white }}>UAE TRC</p>
              <p style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{APPLICATION.id}</p>
            </div>
          </div>
          <div style={{ height:4,background:"rgba(255,255,255,0.08)",borderRadius:999,overflow:"hidden",marginBottom:6 }}>
            <div style={{ height:"100%",width:`${APPLICATION.progress}%`,background:`linear-gradient(90deg,${C.gold},${C.goldDark})`,borderRadius:999 }}/>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between" }}>
            <span style={{ fontSize:10,color:C.warn,fontWeight:700 }}>Processing</span>
            <span style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{APPLICATION.progress}%</span>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding:"14px 14px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <button style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:11,background:"transparent",border:"1px solid transparent",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",textAlign:"left" }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ─── TOPBAR ─────────────────────────────────────────────────────── */
function Topbar({ active }) {
  const tab = NAV_ITEMS.find(n=>n.key===active);
  return (
    <div style={{ height:64, background:C.white, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", flexShrink:0, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 8px rgba(15,37,87,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>{tab?.icon}</span>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.navy }}>{tab?.label}</h1>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button style={{ position:"relative", width:36,height:36,borderRadius:10,background:C.offWhite,border:`1px solid ${C.border}`,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          🔔
          <div style={{ position:"absolute",top:7,right:7,width:8,height:8,borderRadius:"50%",background:C.error,border:`1.5px solid ${C.white}` }}/>
        </button>
        <button style={{ width:36,height:36,borderRadius:10,background:C.offWhite,border:`1px solid ${C.border}`,fontSize:16,cursor:"pointer" }}>❓</button>
        <div style={{ width:1,height:28,background:C.border }}/>
        <Avatar initials={USER.initials} size={34} bg={`linear-gradient(135deg,${C.gold},${C.goldDark})`}/>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────── */
export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = { overview:<Overview onNav={setActiveTab}/>, applications:<Applications/>, documents:<Documents/>, messages:<Messages/>, settings:<Settings/> };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',-apple-system,sans-serif", background:C.offWhite }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${C.gold}33;}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes bounce  {0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes tabIn   {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
        input::placeholder,textarea::placeholder{color:${C.muted}99}
      `}</style>

      <Sidebar active={activeTab} onNav={setActiveTab}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowX:"hidden" }}>
        <Topbar active={activeTab}/>
        <main style={{ flex:1, padding:"32px 36px", animation:"tabIn 0.3s ease" }} key={activeTab}>
          {TABS[activeTab]}
        </main>
      </div>
    </div>
  );
}



/* ─── TOKENS ─────────────────────────────────────────────────────── */
/* ─── STATIC DATA ─────────────────────────────────────────────────── */
const ALL_LANGUAGES = [
  "English","Arabic","French","German","Spanish","Dutch",
  "Portuguese","Italian","Mandarin","Hindi","Tamil",
  "Urdu","Russian","Greek","Maltese","Japanese",
];

const SPECIALTIES_LIST = [
  "Individual TRC","Corporate TRC","Double Tax Treaties","OECD Compliance",
  "Golden Visa Tax","Free Zone Setup","Expatriate Tax","Non-Dom Status",
  "IP Box Regime","Digital Nomad Visa","Estate Planning","VAT Advisory",
];

const ONB_STEPS = [
  { num:1, label:"Personal Info",      icon:"👤", sub:"Your identity & firm" },
  { num:2, label:"Credentials",        icon:"🏛",  sub:"Licences & experience" },
  { num:3, label:"Services & Pricing", icon:"💰", sub:"Coverage & rates" },
  { num:4, label:"Review & Submit",    icon:"✅", sub:"Confirm your details" },
];

const REQUIRED_DOCS = [
  "Professional tax licence issued by national authority",
  "Government-issued photo ID (passport or national ID)",
  "Proof of professional indemnity insurance",
  "Firm registration certificate (if applicable)",
];

/* ─── INITIAL FORM STATE ─────────────────────────────────────────── */
const INIT = {
  // Step 1
  firstName:"", lastName:"", email:"", phone:"",
  country:"", firmName:"", firmWebsite:"", bio:"",
  // Step 2
  licenseNumber:"", licenseAuthority:"", licenseExpiry:"",
  yearsExp:"", qualifications:"", uploadedDocs:[],
  linkedinUrl:"", backgroundCheck:false,
  // Step 3
  countriesCovered:[], languages:[], specialties:[],
  tiers:[
    { name:"Standard", turnaround:"5–7 business days", price:"", currency:"USD", deliverables:"Digital TRC, document review, FTA/authority submission" },
    { name:"Express",  turnaround:"2–3 business days", price:"", currency:"USD", deliverables:"Priority handling, dedicated support, same-day prep" },
    { name:"Premium",  turnaround:"Next day",          price:"", currency:"USD", deliverables:"White-glove service, physical certificate, unlimited revisions" },
  ],
  escrowAgreed:false,
  // Step 4
  termsAccepted:false, codeAccepted:false,
};

/* ─── HELPERS ─────────────────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
      {children}{required && <span style={{ color:C.error, marginLeft:3 }}>*</span>}
    </label>
  );
}

function FieldWrap({ label, required, error, children, hint }) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {hint && !error && <p style={{ fontSize:11, color:C.muted, marginTop:5 }}>{hint}</p>}
      {error && <p style={{ fontSize:11, color:C.error, marginTop:5, display:"flex", alignItems:"center", gap:4 }}>⚠ {error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type="text", error, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value} type={type} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width:"100%", padding:"13px 16px", borderRadius:11, fontFamily:"inherit",
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
        background: error ? C.errorBg : disabled ? C.offWhite2 : C.white,
        fontSize:14, color:C.navy, outline:"none",
        boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
        transition:"all 0.2s",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=3, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} rows={rows}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width:"100%", padding:"13px 16px", borderRadius:11, fontFamily:"inherit",
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
        background: error ? C.errorBg : C.white,
        fontSize:14, color:C.navy, outline:"none", resize:"vertical", lineHeight:1.6,
        boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
        transition:"all 0.2s",
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:"100%", padding:"13px 42px 13px 16px", borderRadius:11, fontFamily:"inherit",
          border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
          background: error ? C.errorBg : C.white,
          fontSize:14, color: value ? C.navy : C.muted + "99",
          outline:"none", appearance:"none", cursor:"pointer",
          boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
          transition:"all 0.2s",
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"
        style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, cursor:"pointer" }} onClick={() => onChange(!checked)}>
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:C.navy }}>{label}</p>
        {sub && <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</p>}
      </div>
      <div style={{ width:46, height:26, borderRadius:13, background:checked ? C.gold : C.border, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:checked?23:3, width:20, height:20, borderRadius:"50%", background:C.white, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
      </div>
    </div>
  );
}

function SectionDivider({ title, icon }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"8px 0 4px" }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontSize:13, fontWeight:700, color:C.navy, letterSpacing:"0.01em" }}>{title}</span>
      <div style={{ flex:1, height:1, background:C.border }}/>
    </div>
  );
}

function InfoBox({ icon="ℹ️", children, variant="info" }) {
  const s = {
    info:  { bg:C.infoBg,   border:C.infoBorder,  color:C.info   },
    warn:  { bg:C.warnBg,   border:C.warnBorder,  color:C.warn   },
    success:{ bg:C.successBg,border:C.successBorder,color:C.success },
  }[variant];
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"13px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
      <span style={{ fontSize:15, flexShrink:0 }}>{icon}</span>
      <p style={{ fontSize:13, color:s.color, lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

/* ─── TAG PILL ────────────────────────────────────────────────────── */
function TagPill({ label, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        padding:"7px 14px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer",
        background: selected ? C.navy : C.white,
        color: selected ? C.white : C.muted,
        border:`1.5px solid ${selected ? C.navy : C.border}`,
        transition:"all 0.15s",
        boxShadow: selected ? "0 3px 10px rgba(15,37,87,0.2)" : "none",
      }}>
      {label}
    </button>
  );
}

function CountryChip({ country, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:7,
        padding:"8px 14px", borderRadius:11, fontSize:13, fontWeight:600, cursor:"pointer",
        background: selected ? `${C.navy}` : C.white,
        color: selected ? C.white : C.navy,
        border:`1.5px solid ${selected ? C.navy : C.border}`,
        transition:"all 0.18s",
        boxShadow: selected ? "0 4px 12px rgba(15,37,87,0.22)" : "none",
      }}>
      <span style={{ fontSize:17 }}>{country.flag}</span>
      {country.name}
      {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </button>
  );
}

/* ─── STEP PROGRESS ──────────────────────────────────────────────── */
function StepProgress({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"0 8px" }}>
      {ONB_STEPS.map((step, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        return (
          <div key={step.num} style={{ display:"flex", alignItems:"center", flex: i < ONB_STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, position:"relative" }}>
              {/* Circle */}
              <div style={{
                width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                background: isDone ? `linear-gradient(135deg,${C.gold},${C.goldDark})` : isActive ? C.navy : C.white,
                border: isDone ? "none" : isActive ? `3px solid ${C.gold}` : `2px solid ${C.border}`,
                boxShadow: isActive ? `0 0 0 6px ${C.gold}1A, 0 6px 20px rgba(15,37,87,0.15)` : isDone ? "0 4px 14px rgba(201,168,76,0.3)" : "none",
                transition:"all 0.35s ease",
                zIndex:1,
              }}>
                {isDone
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize:18 }}>{step.icon}</span>
                }
              </div>
              {/* Label */}
              <div style={{ textAlign:"center", position:"absolute", top:56, width:110, left:"50%", transform:"translateX(-50%)" }}>
                <p style={{ fontSize:12, fontWeight: isActive||isDone ? 700 : 400, color: isActive ? C.navy : isDone ? C.gold : C.muted, whiteSpace:"nowrap" }}>{step.label}</p>
                <p style={{ fontSize:10, color:C.muted, marginTop:1, whiteSpace:"nowrap" }}>{step.sub}</p>
              </div>
            </div>

            {/* Connector */}
            {i < ONB_STEPS.length - 1 && (
              <div style={{ flex:1, height:3, margin:"0 6px", marginBottom:26, borderRadius:999, background: isDone ? `linear-gradient(90deg,${C.gold},${C.goldLight})` : C.border, transition:"background 0.5s ease" }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── STEP 1: PERSONAL INFO ──────────────────────────────────────── */
function Step1({ form, setField, errors }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionDivider title="Personal Details" icon="👤"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="First Name" required error={errors.firstName}>
          <Input value={form.firstName} onChange={v=>setField("firstName",v)} placeholder="Alexandra" error={errors.firstName}/>
        </FieldWrap>
        <FieldWrap label="Last Name" required error={errors.lastName}>
          <Input value={form.lastName} onChange={v=>setField("lastName",v)} placeholder="Chen" error={errors.lastName}/>
        </FieldWrap>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Professional Email" required error={errors.email} hint="Used for advisor account and client notifications">
          <Input value={form.email} onChange={v=>setField("email",v)} placeholder="you@firm.com" type="email" error={errors.email}/>
        </FieldWrap>
        <FieldWrap label="Phone Number" required error={errors.phone} hint="Include country code, e.g. +971 50 …">
          <Input value={form.phone} onChange={v=>setField("phone",v)} placeholder="+971 50 123 4567" type="tel" error={errors.phone}/>
        </FieldWrap>
      </div>

      <SectionDivider title="Firm & Location" icon="🏢"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Country of Practice" required error={errors.country}>
          <Select value={form.country} onChange={v=>setField("country",v)} error={errors.country}
            placeholder="Select country…"
            options={COUNTRIES.map(c=>({ value:c.name, label:`${c.flag}  ${c.name}` }))}/>
        </FieldWrap>
        <FieldWrap label="Firm / Practice Name" required error={errors.firmName}>
          <Input value={form.firmName} onChange={v=>setField("firmName",v)} placeholder="Al-Rashid Tax Advisory DMCC" error={errors.firmName}/>
        </FieldWrap>
      </div>
      <FieldWrap label="Firm Website" hint="Optional — helps clients verify your practice">
        <Input value={form.firmWebsite} onChange={v=>setField("firmWebsite",v)} placeholder="https://www.yourfirm.com" type="url"/>
      </FieldWrap>
      <FieldWrap label="Professional Bio" required error={errors.bio} hint="Shown on your public advisor profile. 80–400 characters recommended.">
        <Textarea value={form.bio} onChange={v=>setField("bio",v)} rows={4} error={errors.bio}
          placeholder="Describe your background, specialisations, and what makes your TRC service exceptional. This is your pitch to potential clients…"/>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:5 }}>
          <span style={{ fontSize:11, color: form.bio.length > 400 ? C.error : C.muted }}>{form.bio.length} / 400</span>
        </div>
      </FieldWrap>

      <InfoBox icon="🔒">
        Your email and phone are kept private. Clients contact you through our encrypted messaging system — your personal details are never exposed publicly.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 2: CREDENTIALS ─────────────────────────────────────────── */
function Step2({ form, setField, errors }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer?.files||[]);
    triggerUpload(files);
  },[]);

  const triggerUpload = files => {
    if (!files.length) return;
    setUploading(true);
    setTimeout(() => {
      const newDocs = files.map(f => ({ name:f.name, size:`${(f.size/1048576).toFixed(1)} MB`, status:"uploaded" }));
      setField("uploadedDocs", [...(form.uploadedDocs||[]), ...newDocs]);
      setUploading(false);
    }, 1200);
  };

  const removeDoc = idx => setField("uploadedDocs", form.uploadedDocs.filter((_,i)=>i!==idx));

  const YRS_OPTIONS = ["Less than 1 year","1–2 years","3–5 years","6–10 years","10–15 years","15+ years"];
  const QUAL_OPTIONS = [
    "Chartered Accountant (CA / ICAI)","Chartered Tax Adviser (CTA)","Certified Public Accountant (CPA)",
    "Association of Taxation Technicians (ATT)","ICPAC Member","Tax Practitioner Certificate",
    "Law Degree (Tax Specialisation)","Masters in Taxation","Other",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionDivider title="Professional Licence" icon="🪪"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Licence / Registration Number" required error={errors.licenseNumber} hint="e.g. UAE FTA Tax Agent Registration No.">
          <Input value={form.licenseNumber} onChange={v=>setField("licenseNumber",v)} placeholder="FTA-TA-2021-0892" error={errors.licenseNumber}/>
        </FieldWrap>
        <FieldWrap label="Issuing Authority" required error={errors.licenseAuthority}>
          <Input value={form.licenseAuthority} onChange={v=>setField("licenseAuthority",v)} placeholder="UAE Federal Tax Authority" error={errors.licenseAuthority}/>
        </FieldWrap>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Licence Expiry Date" required error={errors.licenseExpiry}>
          <Input value={form.licenseExpiry} onChange={v=>setField("licenseExpiry",v)} type="date" error={errors.licenseExpiry}/>
        </FieldWrap>
        <FieldWrap label="Years of TRC Experience" required error={errors.yearsExp}>
          <Select value={form.yearsExp} onChange={v=>setField("yearsExp",v)} error={errors.yearsExp}
            placeholder="Select range…" options={YRS_OPTIONS}/>
        </FieldWrap>
      </div>
      <FieldWrap label="Highest Qualification" required error={errors.qualifications}>
        <Select value={form.qualifications} onChange={v=>setField("qualifications",v)} error={errors.qualifications}
          placeholder="Select qualification…" options={QUAL_OPTIONS}/>
      </FieldWrap>
      <FieldWrap label="LinkedIn Profile URL" hint="Helps with background verification — optional but recommended">
        <Input value={form.linkedinUrl} onChange={v=>setField("linkedinUrl",v)} placeholder="https://linkedin.com/in/yourprofile" type="url"/>
      </FieldWrap>

      <SectionDivider title="Credential Documents" icon="📎"/>

      {/* Required docs list */}
      <div style={{ background:C.offWhite2, borderRadius:14, padding:"16px 18px", border:`1px solid ${C.border}` }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.07em" }}>Required Uploads</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {REQUIRED_DOCS.map((doc, i) => {
            const uploaded = (form.uploadedDocs||[]).length > i;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:uploaded?C.success:C.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {uploaded && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize:13, color: uploaded?C.success:C.navy }}>{doc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={e=>{e.preventDefault();setDragging(false)}}
        onDragOver={e=>e.preventDefault()}
        onDrop={handleDrop}
        onClick={()=>!uploading&&fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?C.gold:errors.uploadedDocs?C.errorBorder:C.border}`,
          borderRadius:14, padding:"32px 24px", textAlign:"center",
          background: dragging?`${C.gold}08`:errors.uploadedDocs?C.errorBg:C.white,
          cursor:"pointer", transition:"all 0.2s",
          boxShadow: dragging?`0 0 0 4px ${C.gold}18`:"none",
        }}>
        <input ref={fileRef} type="file" multiple onChange={e=>triggerUpload(Array.from(e.target.files||[]))} style={{ display:"none" }} accept=".pdf,.jpg,.jpeg,.png"/>
        {uploading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <p style={{ fontSize:14, fontWeight:600, color:C.gold }}>Uploading…</p>
          </div>
        ):(
          <>
            <div style={{ fontSize:36, marginBottom:10 }}>{dragging?"📂":"📤"}</div>
            <p style={{ fontSize:15, fontWeight:700, color:dragging?C.gold:C.navy, marginBottom:6 }}>
              {dragging?"Release to upload":"Drag & drop credential documents"}
            </p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:10 }}>PDF, JPG, PNG · Max 20 MB per file</p>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, background:`${C.gold}14`, border:`1px solid ${C.gold}44`, borderRadius:20, padding:"5px 18px" }}>Browse Files</span>
          </>
        )}
      </div>
      {errors.uploadedDocs && <p style={{ fontSize:11, color:C.error, marginTop:-12 }}>⚠ {errors.uploadedDocs}</p>}

      {/* Uploaded list */}
      {(form.uploadedDocs||[]).length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {form.uploadedDocs.map((doc,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.successBg, border:`1px solid ${C.successBorder}`, borderRadius:11 }}>
              <span style={{ fontSize:20 }}>📄</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</p>
                <p style={{ fontSize:11, color:C.muted }}>{doc.size}</p>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:C.success, background:C.white, padding:"2px 9px", borderRadius:20, border:`1px solid ${C.successBorder}` }}>✓ Uploaded</span>
              <button onClick={()=>removeDoc(i)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:"2px 6px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding:"16px 18px", background:C.offWhite, border:`1px solid ${C.border}`, borderRadius:12 }}>
        <Toggle
          checked={form.backgroundCheck}
          onChange={v=>setField("backgroundCheck",v)}
          label="I consent to a background verification check"
          sub="TRC Connect runs third-party verification on all advisor credentials before approval."
        />
      </div>

      <InfoBox icon="🔐" variant="warn">
        All uploaded documents are encrypted at rest and only accessed by our verification team. They are never shared with clients or third parties.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 3: SERVICES & PRICING ─────────────────────────────────── */
function Step3({ form, setField, errors }) {
  const toggle = (key, val) => {
    const arr = form[key]||[];
    setField(key, arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);
  };

  const updateTier = (i, k, v) => {
    const tiers = [...form.tiers];
    tiers[i] = { ...tiers[i], [k]:v };
    setField("tiers", tiers);
  };

  const TIER_COLORS = [
    { border:C.border,  bg:C.white,   dot:C.muted,    label:"Standard" },
    { border:C.gold,    bg:`${C.gold}06`, dot:C.gold, label:"Express"  },
    { border:C.navy,    bg:`${C.navy}04`, dot:C.navy, label:"Premium"  },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <SectionDivider title="Countries Covered" icon="🌍"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Select all jurisdictions where you are licensed to handle TRC applications.</p>
      {errors.countriesCovered && <p style={{ fontSize:11, color:C.error }}>⚠ {errors.countriesCovered}</p>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
        {COUNTRIES.map(c=>(
          <CountryChip key={c.code} country={c}
            selected={(form.countriesCovered||[]).includes(c.name)}
            onClick={()=>toggle("countriesCovered",c.name)}/>
        ))}
      </div>

      <SectionDivider title="Languages" icon="🗣"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Languages in which you can communicate with and advise clients.</p>
      {errors.languages && <p style={{ fontSize:11, color:C.error }}>⚠ {errors.languages}</p>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {ALL_LANGUAGES.map(l=>(
          <TagPill key={l} label={l}
            selected={(form.languages||[]).includes(l)}
            onClick={()=>toggle("languages",l)}/>
        ))}
      </div>

      <SectionDivider title="Specialties" icon="⚡"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Select all service areas relevant to your practice.</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {SPECIALTIES_LIST.map(s=>(
          <TagPill key={s} label={s}
            selected={(form.specialties||[]).includes(s)}
            onClick={()=>toggle("specialties",s)}/>
        ))}
      </div>

      <SectionDivider title="Pricing Tiers" icon="💰"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Define your service packages. Clients see these when browsing your profile. You can update them anytime.</p>
      {errors.tiers && <p style={{ fontSize:11, color:C.error }}>⚠ {errors.tiers}</p>}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {form.tiers.map((tier, i) => {
          const tc = TIER_COLORS[i];
          const isGold = i===1;
          return (
            <div key={tier.name} style={{
              border:`2px solid ${tc.border}`,
              borderRadius:16, padding:"22px 24px",
              background: tc.bg,
              boxShadow: i===1?"0 6px 20px rgba(201,168,76,0.12)":i===2?"0 6px 20px rgba(15,37,87,0.08)":"none",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:tc.dot }}/>
                <span style={{ fontSize:15, fontWeight:800, color:C.navy, fontFamily:"'Cormorant Garamond',serif" }}>{tier.name}</span>
                {i===1 && <span style={{ fontSize:10, fontWeight:800, background:`${C.gold}22`, color:C.goldDark, padding:"2px 9px", borderRadius:20, letterSpacing:"0.06em" }}>MOST POPULAR</span>}
                {i===2 && <span style={{ fontSize:10, fontWeight:800, background:`${C.navy}11`, color:C.navy, padding:"2px 9px", borderRadius:20, letterSpacing:"0.06em" }}>WHITE GLOVE</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <FieldWrap label="Price (USD)" required error={i===0&&errors.tier0||i===1&&errors.tier1||i===2&&errors.tier2}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.muted, fontWeight:600 }}>$</span>
                    <input
                      value={tier.price}
                      onChange={e=>updateTier(i,"price",e.target.value)}
                      type="number" min="0" placeholder="0"
                      style={{ width:"100%", padding:"12px 14px 12px 28px", borderRadius:10, fontFamily:"inherit", border:`1.5px solid ${C.border}`, fontSize:14, color:C.navy, outline:"none" }}
                    />
                  </div>
                </FieldWrap>
                <FieldWrap label="Turnaround Time">
                  <Input value={tier.turnaround} onChange={v=>updateTier(i,"turnaround",v)} placeholder="e.g. 5–7 business days"/>
                </FieldWrap>
              </div>
              <FieldWrap label="What's Included">
                <Input value={tier.deliverables} onChange={v=>updateTier(i,"deliverables",v)} placeholder="List key deliverables…"/>
              </FieldWrap>
            </div>
          );
        })}
      </div>

      <div style={{ padding:"16px 18px", background:C.offWhite, border:`1px solid ${C.border}`, borderRadius:12 }}>
        <Toggle
          checked={form.escrowAgreed}
          onChange={v=>setField("escrowAgreed",v)}
          label="I agree to the TRC Connect Escrow Payment Policy"
          sub="Client fees are held in escrow and released only upon successful TRC delivery. Refunds are issued if the application is rejected due to advisor error."
        />
      </div>
      {errors.escrowAgreed && <p style={{ fontSize:11, color:C.error, marginTop:-12 }}>⚠ {errors.escrowAgreed}</p>}

      <InfoBox icon="💡">
        <strong>Pricing tip:</strong> Most top-rated UAE advisors price Standard at $250–$400, Express at $350–$550, and Premium at $500+. Competitive pricing combined with strong reviews drives significantly more bookings.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 4: REVIEW ──────────────────────────────────────────────── */
function Step4({ form, setField, errors, onEdit }) {
  const country = COUNTRIES.find(c=>c.name===form.country);

  const ReviewBlock = ({ title, icon, step, children }) => (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 10px rgba(15,37,87,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", background:C.offWhite2, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>{title}</span>
        </div>
        <button onClick={()=>onEdit(step)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:C.gold, display:"flex", alignItems:"center", gap:4 }}>
          ✎ Edit
        </button>
      </div>
      <div style={{ padding:"18px 22px" }}>{children}</div>
    </div>
  );

  const Row = ({ label, value }) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:13, color:C.muted, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:C.navy, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <InfoBox icon="👁" variant="info">
        Please review all details carefully before submitting. Our team will verify your credentials within <strong>2–3 business days</strong> and send you an activation email.
      </InfoBox>

      {/* Personal */}
      <ReviewBlock title="Personal Information" icon="👤" step={0}>
        <Row label="Full Name"    value={`${form.firstName} ${form.lastName}`}/>
        <Row label="Email"        value={form.email}/>
        <Row label="Phone"        value={form.phone}/>
        <Row label="Country"      value={country ? `${country.flag} ${form.country}` : form.country}/>
        <Row label="Firm"         value={form.firmName}/>
        {form.firmWebsite && <Row label="Website" value={form.firmWebsite}/>}
        {form.bio && (
          <div style={{ paddingTop:10 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Bio</p>
            <p style={{ fontSize:13, color:C.navy, lineHeight:1.65 }}>{form.bio}</p>
          </div>
        )}
      </ReviewBlock>

      {/* Credentials */}
      <ReviewBlock title="Credentials" icon="🏛" step={1}>
        <Row label="Licence Number"  value={form.licenseNumber}/>
        <Row label="Issuing Body"    value={form.licenseAuthority}/>
        <Row label="Expires"         value={form.licenseExpiry}/>
        <Row label="Experience"      value={form.yearsExp}/>
        <Row label="Qualification"   value={form.qualifications}/>
        {form.linkedinUrl && <Row label="LinkedIn" value={form.linkedinUrl}/>}
        <Row label="Documents"       value={`${(form.uploadedDocs||[]).length} file(s) uploaded`}/>
        <Row label="BG Check Consent" value={form.backgroundCheck ? "✓ Agreed" : "✗ Not agreed"}/>
      </ReviewBlock>

      {/* Services */}
      <ReviewBlock title="Services & Pricing" icon="💰" step={2}>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Countries Covered</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(form.countriesCovered||[]).map(c=>{
              const co=COUNTRIES.find(x=>x.name===c);
              return <span key={c} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:C.offWhite2, color:C.navy, border:`1px solid ${C.border}` }}>{co?.flag} {c}</span>;
            })}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Languages</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(form.languages||[]).map(l=><span key={l} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:C.offWhite2, color:C.navy, border:`1px solid ${C.border}` }}>{l}</span>)}
          </div>
        </div>
        {(form.specialties||[]).length > 0 && (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Specialties</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {form.specialties.map(s=><span key={s} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:C.infoBg, color:C.info, border:`1px solid ${C.infoBorder}` }}>{s}</span>)}
            </div>
          </div>
        )}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Pricing Tiers</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {form.tiers.map((t,i)=>(
              <div key={i} style={{ background:C.offWhite2, borderRadius:12, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{t.name}</p>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:800, color:C.gold }}>{t.price ? `$${t.price}` : "—"}</p>
                <p style={{ fontSize:11, color:C.muted, marginTop:3 }}>{t.turnaround}</p>
              </div>
            ))}
          </div>
        </div>
      </ReviewBlock>

      {/* Agreements */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 22px", display:"flex", flexDirection:"column", gap:16, boxShadow:"0 2px 10px rgba(15,37,87,0.04)" }}>
        <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:4 }}>📋 Agreements & Policies</p>

        {[
          {
            key:"termsAccepted",
            label:"I accept the TRC Connect Advisor Terms of Service",
            sub:"Including platform fees (15% per transaction), client conduct policy, and dispute resolution process.",
            err: errors.termsAccepted,
          },
          {
            key:"codeAccepted",
            label:"I agree to uphold the TRC Connect Advisor Code of Conduct",
            sub:"Commitment to accurate advice, timely delivery, transparent pricing, and professional standards.",
            err: errors.codeAccepted,
          },
        ].map(({ key, label, sub, err }) => (
          <div key={key}>
            <div
              onClick={() => setField(key, !form[key])}
              style={{ display:"flex", alignItems:"flex-start", gap:13, cursor:"pointer", padding:"14px", borderRadius:12, background: err ? C.errorBg : C.offWhite2, border:`1px solid ${err?C.errorBorder:C.border}`, transition:"all 0.15s" }}
            >
              <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1,
                border:`2px solid ${form[key]?C.gold:C.border}`, background:form[key]?C.gold:C.white,
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                {form[key] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.navy }}>{label}</p>
                <p style={{ fontSize:12, color:C.muted, marginTop:3, lineHeight:1.5 }}>{sub}</p>
              </div>
            </div>
            {err && <p style={{ fontSize:11, color:C.error, marginTop:5 }}>⚠ {err}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SUCCESS SCREEN ─────────────────────────────────────────────── */
function SuccessScreen({ form }) {
  const country = COUNTRIES.find(c=>c.name===form.country);
  const ref = `ADV-${Date.now().toString(36).toUpperCase().slice(-7)}`;
  return (
    <div style={{ textAlign:"center", padding:"60px 24px 40px", maxWidth:580, margin:"0 auto" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, margin:"0 auto 28px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 12px 36px rgba(201,168,76,0.35)", animation:"scaleIn 0.5s ease" }}>✓</div>

      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:700, color:C.navy, lineHeight:1.1, marginBottom:14 }}>
        Application Submitted!
      </h2>
      <p style={{ fontSize:16, color:C.muted, lineHeight:1.7, marginBottom:28, maxWidth:460, margin:"0 auto 28px" }}>
        Welcome to TRC Connect, <strong style={{ color:C.navy }}>{form.firstName}</strong>. Your advisor profile is now under review. We'll send a confirmation to <strong style={{ color:C.navy }}>{form.email}</strong> within 24 hours.
      </p>

      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px 28px", marginBottom:28, boxShadow:"0 4px 20px rgba(15,37,87,0.07)", textAlign:"left" }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Application Summary</p>
        {[
          { l:"Reference",       v:ref },
          { l:"Name",            v:`${form.firstName} ${form.lastName}` },
          { l:"Jurisdiction",    v:country?`${country.flag} ${form.country}`:form.country },
          { l:"Firm",            v:form.firmName },
          { l:"Documents",       v:`${(form.uploadedDocs||[]).length} uploaded` },
          { l:"Review Timeline", v:"2–3 business days" },
          { l:"Status",          v:"⏳ Pending Verification" },
        ].map(r=>(
          <div key={r.l} style={{ display:"flex", justifyContent:"space-between", gap:20, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, color:C.muted }}>{r.l}</span>
            <span style={{ fontSize:13, fontWeight:600, color:C.navy, textAlign:"right" }}>{r.v}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <button style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white, border:"none", borderRadius:12, padding:"14px 28px", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 20px rgba(201,168,76,0.35)" }}>
          Go to Advisor Dashboard →
        </button>
        <button style={{ background:"transparent", color:C.navy, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"14px 24px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Return to Homepage
        </button>
      </div>

      <p style={{ fontSize:12, color:C.muted, marginTop:24, lineHeight:1.65 }}>
        Questions? Email <a href="mailto:advisors@trcconnect.com" style={{ color:C.gold, fontWeight:700 }}>advisors@trcconnect.com</a> with your reference number <strong style={{ fontFamily:"monospace" }}>{ref}</strong>.
      </p>
    </div>
  );
}

/* ─── VALIDATION ─────────────────────────────────────────────────── */
function validate(step, form) {
  const e = {};
  if (step === 0) {
    if (!form.firstName.trim())    e.firstName    = "First name is required";
    if (!form.lastName.trim())     e.lastName     = "Last name is required";
    if (!form.email.includes("@")) e.email        = "Valid email address required";
    if (!form.phone.trim())        e.phone        = "Phone number is required";
    if (!form.country)             e.country      = "Select your country of practice";
    if (!form.firmName.trim())     e.firmName     = "Firm name is required";
    if (!form.bio.trim())          e.bio          = "A professional bio is required";
    if (form.bio.length > 400)     e.bio          = "Bio must be under 400 characters";
  }
  if (step === 1) {
    if (!form.licenseNumber.trim())   e.licenseNumber   = "Licence number is required";
    if (!form.licenseAuthority.trim())e.licenseAuthority= "Issuing authority is required";
    if (!form.licenseExpiry)          e.licenseExpiry   = "Expiry date is required";
    if (!form.yearsExp)               e.yearsExp        = "Select years of experience";
    if (!form.qualifications)         e.qualifications  = "Select your qualification";
    if (!(form.uploadedDocs||[]).length) e.uploadedDocs = "Upload at least one credential document";
  }
  if (step === 2) {
    if (!(form.countriesCovered||[]).length) e.countriesCovered = "Select at least one country";
    if (!(form.languages||[]).length)        e.languages        = "Select at least one language";
    const missingPrice = form.tiers.some(t=>!t.price);
    if (missingPrice) e.tiers = "Set a price for each service tier";
    if (!form.escrowAgreed) e.escrowAgreed = "You must agree to the escrow policy";
  }
  if (step === 3) {
    if (!form.termsAccepted) e.termsAccepted = "You must accept the Terms of Service";
    if (!form.codeAccepted)  e.codeAccepted  = "You must agree to the Code of Conduct";
  }
  return e;
}

/* ─── NAVBAR ─────────────────────────────────────────────────────── */
/* ─── ROOT ───────────────────────────────────────────────────────── */
function OnboardingPage() {
  const [step,     setStep]     = useState(0);
  const [form,     setFormData] = useState(INIT);
  const [errors,   setErrors]   = useState({});
  const [dir,      setDir]      = useState(1);    // 1=forward, -1=back
  const [animKey,  setAnimKey]  = useState(0);
  const [submitted,setSubmitted]= useState(false);
  const [submitting,setSubmitting]=useState(false);
  const topRef = useRef(null);

  const setField = useCallback((k,v) => {
    setFormData(f=>({...f,[k]:v}));
    setErrors(e=>({...e,[k]:""}));
  },[]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });

  const goNext = () => {
    const e = validate(step, form);
    if (Object.keys(e).length) { setErrors(e); scrollTop(); return; }
    setErrors({});
    setDir(1); setAnimKey(k=>k+1);
    setStep(s=>s+1); scrollTop();
  };

  const goBack = () => {
    setErrors({});
    setDir(-1); setAnimKey(k=>k+1);
    setStep(s=>s-1); scrollTop();
  };

  const goEdit = (s) => { setDir(-1); setAnimKey(k=>k+1); setStep(s); scrollTop(); };

  const handleSubmit = () => {
    const e = validate(3, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); scrollTop(); }, 1800);
  };

  const STEP_COMPS = [
    <Step1 form={form} setField={setField} errors={errors}/>,
    <Step2 form={form} setField={setField} errors={errors}/>,
    <Step3 form={form} setField={setField} errors={errors}/>,
    <Step4 form={form} setField={setField} errors={errors} onEdit={goEdit}/>,
  ];

  const completePct = submitted ? 100 : Math.round((step / ONB_STEPS.length) * 100);

  return (
    <div style={{ fontFamily:"'DM Sans',-apple-system,sans-serif", color:C.navy, background:C.offWhite, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${C.gold}33;}
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes scaleIn { from{transform:scale(0.6);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(var(--slide-x,24px))} to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
      `}</style>

      

      {/* ── HERO ── */}
      <div style={{ background:`linear-gradient(160deg,${C.navyDark} 0%,${C.navy} 55%,#1A3A72 100%)`, padding:"110px 24px 80px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.035, backgroundImage:`linear-gradient(${C.white} 1px,transparent 1px),linear-gradient(90deg,${C.white} 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", right:"5%", top:"15%", width:500, height:500, background:`radial-gradient(circle,${C.gold}10,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ maxWidth:780, margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:24, padding:"5px 16px", marginBottom:24 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.gold, display:"inline-block" }}/>
            <span style={{ fontSize:11, color:C.goldLight, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Advisor Registration</span>
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,5vw,58px)", fontWeight:700, color:C.white, lineHeight:1.1, letterSpacing:"-0.02em", marginBottom:18 }}>
            Join the TRC Connect<br/><span style={{ color:C.gold, fontStyle:"italic" }}>Advisor Network</span>
          </h1>
          <p style={{ fontSize:17, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:520, margin:"0 auto 36px", fontWeight:300 }}>
            Connect with clients seeking TRC assistance in your jurisdiction. Transparent fees, escrow-protected payments, and a full practice dashboard.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
            {[{ v:"200+", l:"Active Advisors" },{ v:"15%", l:"Platform Fee" },{ v:"48h", l:"Avg. Payout" },{ v:"98%", l:"Client Satisfaction" }].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:800, color:C.gold }}>{s.v}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, lineHeight:0 }}>
          <svg viewBox="0 0 1440 40" fill={C.offWhite}><path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"/></svg>
        </div>
      </div>

      {/* ── FORM AREA ── */}
      <div ref={topRef} style={{ maxWidth:820, margin:"0 auto", padding:"48px 24px 80px" }}>

        {!submitted ? (
          <>
            {/* Stepper */}
            <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, padding:"32px 40px 52px", marginBottom:28, boxShadow:"0 4px 20px rgba(15,37,87,0.07)" }}>
              <StepProgress current={step}/>
            </div>

            {/* Step header */}
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Step {step+1} of {ONB_STEPS.length}</p>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:700, color:C.navy }}>{ONB_STEPS[step].label}</h2>
                <p style={{ fontSize:14, color:C.muted, marginTop:4 }}>{ONB_STEPS[step].sub}</p>
              </div>
              <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ height:6, width:100, background:C.offWhite2, borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${completePct}%`, background:`linear-gradient(90deg,${C.gold},${C.goldDark})`, borderRadius:999, transition:"width 0.5s ease" }}/>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:C.gold }}>{completePct}%</span>
              </div>
            </div>

            {/* Form card */}
            <div
              key={animKey}
              style={{
                background:C.white, borderRadius:20, border:`1px solid ${C.border}`,
                padding:"36px 40px", boxShadow:"0 4px 24px rgba(15,37,87,0.08)",
                "--slide-x": dir > 0 ? "24px" : "-24px",
                animation:"fadeSlideIn 0.3s ease both",
              }}
            >
              {STEP_COMPS[step]}
            </div>

            {/* Nav buttons */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:24, gap:12, flexWrap:"wrap" }}>
              <button onClick={goBack} disabled={step===0}
                style={{
                  background:"transparent", color: step===0?C.muted:C.navy,
                  border:`1.5px solid ${step===0?C.border:C.navy}`,
                  borderRadius:12, padding:"13px 28px", fontSize:14, fontWeight:700,
                  cursor:step===0?"not-allowed":"pointer", opacity:step===0?0.4:1,
                  transition:"all 0.2s",
                }}>
                ← Back
              </button>

              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* Step dots */}
                <div style={{ display:"flex", gap:6 }}>
                  {ONB_STEPS.map((_,i)=>(
                    <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:i===step?C.gold:i<step?`${C.gold}66`:C.border, transition:"all 0.25s" }}/>
                  ))}
                </div>

                {step < ONB_STEPS.length - 1 ? (
                  <button onClick={goNext} style={{
                    background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white,
                    border:"none", borderRadius:12, padding:"13px 32px", fontSize:14, fontWeight:700,
                    cursor:"pointer", boxShadow:"0 6px 20px rgba(201,168,76,0.4)", transition:"all 0.2s",
                  }}>
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{
                      background: submitting?`${C.gold}99`:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
                      color:C.white, border:"none", borderRadius:12, padding:"13px 32px", fontSize:14, fontWeight:700,
                      cursor:submitting?"not-allowed":"pointer",
                      boxShadow:submitting?"none":"0 6px 20px rgba(201,168,76,0.4)",
                      display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                    }}>
                    {submitting ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        Submitting…
                      </>
                    ) : "Submit Application ✓"}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom trust signals */}
            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:28, flexWrap:"wrap" }}>
              {["🔒 End-to-end encrypted","🛡 15% platform fee only on success","⚡ 2–3 day review turnaround","💬 Dedicated onboarding support"].map(s=>(
                <span key={s} style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center", gap:5 }}>{s}</span>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:"0 8px 40px rgba(15,37,87,0.1)", animation:"fadeIn 0.4s ease" }}>
            <SuccessScreen form={form}/>
          </div>
        )}
      </div>
    </div>
  );
}



// ── SHARED APP NAVBAR ─────────────────────────────────────────────────
function AppNavbar() {
  const [sc,setSc] = React.useState(false);
  const location = window.__reactRouterLocation || {pathname:'/'};
  try {
    const loc = require('react-router-dom').useLocation();
    // handled below
  } catch(e){}
  return <_AppNavbarInner/>;
}

function _AppNavbarInner() {
  const [sc,setSc] = React.useState(false);
  const [activeSelector, setActiveSelector] = React.useState(null);
  const { pathname } = ReactRouterDom.useLocation();
  const nav = ReactRouterDom.useNavigate();
  React.useEffect(()=>{
    const fn=()=>setSc(window.scrollY>20);
    window.addEventListener('scroll',fn);
    return ()=>window.removeEventListener('scroll',fn);
  },[]);
  const tp = pathname==='/' && !sc;
  const lc = tp?'rgba(255,255,255,.85)':C.navy;
  const NAV=[
    { label: 'Countries', to: '/countries' },
    { label: 'Solutions', to: '/solutions' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Blog', to: '/blog' },
    { label: 'Resources', to: '/resources' },
    { label: 'About', to: '/about' },
  ];

  const closeSelector = () => setActiveSelector(null);

  const SelectorModal = ({ title, options }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(9,26,61,.72)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'center', padding: 24 }} onClick={closeSelector}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(100%, 760px)', background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: '0 36px 90px rgba(0,0,0,.28)', overflow: 'hidden' }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)`, position: 'relative' }}>
          <button onClick={closeSelector} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: C.muted, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">×</button>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 8 }}>Choose Your Workspace</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: C.navy, marginBottom: 8 }}>{title}</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>Select the compliance path that matches how you operate.</p>
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 14 }}>
          {options.map((option) => (
            <div key={option.label} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 18, borderRadius: 16, border: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.white} 0%, ${C.offWhite} 100%)`, boxShadow: '0 10px 24px rgba(15,37,87,.06)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: option.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: C.white, flexShrink: 0 }}>{option.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{option.label}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{option.description}</div>
              </div>
              <button onClick={() => { closeSelector(); window.location.assign(option.path); }} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(201,168,76,.3)' }}>{option.actionLabel}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:1000,
      padding:sc?'12px 0':'18px 0',
      background:tp?'transparent':'rgba(255,255,255,.97)',
      backdropFilter:sc?'blur(12px)':'none',
      borderBottom:sc?`1px solid ${C.border}`:'none',
      transition:'all .3s ease'}}>
      <div style={{maxWidth:1300,margin:'0 auto',padding:'0 28px',
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <ReactRouterDom.Link to='/' style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:36,height:36,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
            borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚖</div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
            color:tp?C.white:C.navy}}>TRC</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,
            color:tp?C.goldLight:C.gold}}> Connect</span>
        </ReactRouterDom.Link>
        <div style={{display:'flex',alignItems:'center',gap:28}}>
          {NAV.map(l=>(
            <ReactRouterDom.Link key={l.to} to={l.to} style={{
              color:pathname===l.to?C.gold:lc,
              fontSize:14,fontWeight:pathname===l.to?700:500,
              borderBottom:pathname===l.to?`2px solid ${C.gold}`:'2px solid transparent',
              paddingBottom:2,transition:'all .2s',textDecoration:'none'}}>
              {l.label}
            </ReactRouterDom.Link>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <NotificationCenter />
          <button onClick={() => setActiveSelector('signin')} style={{background:'transparent',border:'none',color:lc,fontSize:14,fontWeight:500,padding:'9px 14px',textDecoration:'none',cursor:'pointer'}}>
            Sign In
          </button>
          <button onClick={() => setActiveSelector('eligibility')} style={{
            background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
            color:C.white,border:'none',borderRadius:10,padding:'10px 22px',
            fontSize:14,fontWeight:600,cursor:'pointer',
            boxShadow:'0 4px 14px rgba(201,168,76,.4)'}}>
            Check Eligibility
          </button>
        </div>
      </div>
      {activeSelector === 'signin' && (
        <SelectorModal
          title="Choose Your Workspace"
          options={[
            {
              label: 'Retail Client',
              description: 'Guided personal compliance onboarding and managed retail TRC processing.',
              icon: '⚖',
              path: '/retail/login',
              actionLabel: 'Retail Login',
              gradient: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
            },
            {
              label: 'Corporate Client',
              description: 'Enterprise compliance infrastructure for companies, founders, and firms.',
              icon: '🏛',
              path: '/corporate/login',
              actionLabel: 'Corporate Login',
              gradient: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            },
            {
              label: 'Advisor Portal',
              description: 'Advisor workspace to manage assigned cases, chat with clients, and send updates to admin.',
              icon: '⚖️',
              path: '/advisor/login',
              actionLabel: 'Advisor Login',
              gradient: `linear-gradient(135deg, #5B21B6, #4C1D95)`,
            },
          ]}
        />
      )}
      {activeSelector === 'eligibility' && (
        <SelectorModal
          title="Check Eligibility"
          options={[
            {
              label: 'Retail Eligibility',
              description: 'Personal UAE TRC eligibility review for individuals and residents.',
              icon: '🧾',
              path: '/check-eligibility',
              actionLabel: 'Retail Eligibility',
              gradient: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
            },
            {
              label: 'Corporate Eligibility',
              description: 'Corporate structure review for companies, holding groups, and startups.',
              icon: '🏢',
              path: '/corporate/check-eligibility',
              actionLabel: 'Corporate Eligibility',
              gradient: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            },
          ]}
        />
      )}
    </nav>
  );
}

function ScrollToTop() {
  const {pathname} = ReactRouterDom.useLocation();
  React.useEffect(()=>{window.scrollTo(0,0);},[pathname]);
  return null;
}


class PageErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:60,fontFamily:"sans-serif",maxWidth:700,margin:"100px auto"}}>
          <h2 style={{color:"#DC2626",marginBottom:16}}>⚠ Page Error: {this.props.name}</h2>
          <pre style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,
            padding:20,fontSize:13,overflowX:"auto",color:"#991B1B"}}>
            {this.state.error.message}
          </pre>
          <p style={{marginTop:16,color:"#6B7A99",fontSize:14}}>
            Please copy the red error message above and share it.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ReactRouterDom.BrowserRouter>
      <AppShell/>
    </ReactRouterDom.BrowserRouter>
  );
}

function AppShell() {
  const { pathname } = ReactRouterDom.useLocation();
  const hideGlobalNav = pathname.startsWith("/retail") || pathname.startsWith("/corporate") || pathname.startsWith("/advisor") || pathname.startsWith("/blog") || ["/check-eligibility", "/verify-email", "/login", "/dashboard", "/admin"].includes(pathname);

  return (
    <>
      <ScrollToTop />
      {!hideGlobalNav && <_AppNavbarInner />}
      <ReactRouterDom.Routes>
        <ReactRouterDom.Route path="/" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/countries" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/solutions" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/pricing" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/resources" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/about" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/uae" element={<PageErrorBoundary name="UAE Page"><UAEPage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/marketplace" element={<PageErrorBoundary name="Marketplace"><MarketplacePage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/onboarding" element={<PageErrorBoundary name="Onboarding"><OnboardingPage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/blog" element={<PageErrorBoundary name="Blog"><BlogListingPage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/blog/:slug" element={<PageErrorBoundary name="Blog Post"><BlogPostPage/></PageErrorBoundary>} />
        <ReactRouterDom.Route path="/check-eligibility" element={<RetailEligibilityPage />} />
        <ReactRouterDom.Route path="/verify-email" element={<VerifyRetailEmailPage />} />
        <ReactRouterDom.Route path="/reset-password" element={<RetailResetPasswordPage />} />
        <ReactRouterDom.Route path="/login" element={<RetailLoginPage />} />
        <ReactRouterDom.Route path="/retail/login" element={<RetailLoginPage />} />
        <ReactRouterDom.Route path="/corporate/check-eligibility" element={<CorporateEligibilityPage />} />
        <ReactRouterDom.Route path="/corporate/login" element={<CorporateLoginPage />} />
        <ReactRouterDom.Route path="/dashboard" element={<ReactRouterDom.Navigate to="/retail/dashboard" replace />} />
        <ReactRouterDom.Route path="/eligibility-status" element={<ReactRouterDom.Navigate to="/retail/eligibility-status" replace />} />
        <ReactRouterDom.Route path="/profile" element={<ReactRouterDom.Navigate to="/retail/profile" replace />} />
        <ReactRouterDom.Route path="/support" element={<ReactRouterDom.Navigate to="/retail/support" replace />} />
        <ReactRouterDom.Route
          path="/retail"
          element={<RetailWorkspaceGuard />}
        >
          <ReactRouterDom.Route element={<RetailWorkspaceLayout />}>
            <ReactRouterDom.Route index element={<ReactRouterDom.Navigate to="dashboard" replace />} />
            <ReactRouterDom.Route path="dashboard" element={<RetailDashboardPage />} />
            <ReactRouterDom.Route path="eligibility-status" element={<RetailEligibilityStatusPage />} />
            <ReactRouterDom.Route path="profile" element={<RetailProfilePage />} />
            <ReactRouterDom.Route path="support" element={<RetailSupportPage />} />
            <ReactRouterDom.Route path="documents" element={<RetailDocumentsPage />} />
            <ReactRouterDom.Route path="chat" element={<RetailChatPage />} />
            <ReactRouterDom.Route path="requested" element={<RetailRequestedPage />} />
            <ReactRouterDom.Route path="residency" element={<RetailResidencyTrackerPage />} />
            {/* Legacy redirects — keep old URLs working */}
            <ReactRouterDom.Route path="messages" element={<ReactRouterDom.Navigate to="/retail/chat" replace />} />
            <ReactRouterDom.Route path="billing" element={<ReactRouterDom.Navigate to="/retail/requested" replace />} />
            <ReactRouterDom.Route path="applications" element={<ReactRouterDom.Navigate to="/retail/dashboard" replace />} />
            <ReactRouterDom.Route path="applications/:id" element={<ApplicationDetailPage />} />
          </ReactRouterDom.Route>
        </ReactRouterDom.Route>
        <ReactRouterDom.Route
          path="/corporate"
          element={<CorporateWorkspaceGuard />}
        >
          <ReactRouterDom.Route element={<CorporateWorkspaceLayout />}>
            <ReactRouterDom.Route index element={<ReactRouterDom.Navigate to="dashboard" replace />} />
            <ReactRouterDom.Route path="dashboard" element={<CorporateDashboardPage />} />
            <ReactRouterDom.Route path="eligibility-status" element={<CorporateEligibilityStatusPage />} />
            <ReactRouterDom.Route path="profile" element={<CorporateProfilePage />} />
            <ReactRouterDom.Route path="support" element={<CorporateSupportPage />} />
            <ReactRouterDom.Route path="applications" element={<CorporateFeatureWorkspacePage feature="applications" />} />
            <ReactRouterDom.Route path="applications/:id" element={<ApplicationDetailPage />} />
            <ReactRouterDom.Route path="employees" element={<CorporateFeatureWorkspacePage feature="employees" />} />
            <ReactRouterDom.Route path="compliance-center" element={<CorporateFeatureWorkspacePage feature="compliance" />} />
            <ReactRouterDom.Route path="documents" element={<CorporateDocumentsPage />} />
            <ReactRouterDom.Route path="advisors" element={<CorporateFeatureWorkspacePage feature="advisors" />} />
            <ReactRouterDom.Route path="reports" element={<CorporateFeatureWorkspacePage feature="reports" />} />
            <ReactRouterDom.Route path="billing" element={<CorporateFeatureWorkspacePage feature="billing" />} />
            <ReactRouterDom.Route path="settings" element={<CorporateFeatureWorkspacePage feature="settings" />} />
          </ReactRouterDom.Route>
        </ReactRouterDom.Route>
        <ReactRouterDom.Route path="/admin" element={<AdminDashboard />} />
        <ReactRouterDom.Route path="/advisor/login" element={<AdvisorLoginPage />} />
        <ReactRouterDom.Route
          path="/advisor"
          element={<AdvisorWorkspaceGuard />}
        >
          <ReactRouterDom.Route element={<AdvisorWorkspaceLayout />}>
            <ReactRouterDom.Route index element={<ReactRouterDom.Navigate to="dashboard" replace />} />
            <ReactRouterDom.Route path="dashboard" element={<AdvisorDashboardPage />} />
            <ReactRouterDom.Route path="cases" element={<AdvisorCasesPage />} />
            <ReactRouterDom.Route path="cases/:id" element={<AdvisorCaseDetailPage />} />
            <ReactRouterDom.Route path="chat" element={<AdvisorChatPage />} />
            <ReactRouterDom.Route path="updates" element={<AdvisorUpdatesPage />} />
            <ReactRouterDom.Route path="profile" element={<AdvisorProfilePage />} />
          </ReactRouterDom.Route>
        </ReactRouterDom.Route>
        <ReactRouterDom.Route path="*" element={<ReactRouterDom.Navigate to="/" replace />} />
      </ReactRouterDom.Routes>
      <WorkflowToastHost />
    </>
  );
}
