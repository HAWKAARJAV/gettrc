// HomePage.jsx — TRC Connect marketing homepage
// Extracted from TRCConnectApp.jsx so it lazy-loads as its own chunk instead
// of being bundled eagerly with the router shell (AppShell/_AppNavbarInner).
import React from "react";
import * as ReactRouterDom from "react-router-dom";
import { useSEO, ORGANIZATION_JSONLD, WEBSITE_JSONLD, LOCAL_BUSINESS_JSONLD } from "../seo/useSEO";
import { C } from "../theme/marketingColors";

// ── Local copies of small helpers also used elsewhere in TRCConnectApp.jsx —
// duplicated here (not extracted to a shared module) since they're trivial
// and only shared with one or two other places. ──────────────────────────

const MARKETING_ROUTE_TARGETS = {
  "/solutions": "solutions",
  "/pricing": "pricing",
  "/resources": "resources",
  "/about": "about",
};

function scrollToElementId(id, behavior = "smooth") {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - 84;
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
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

export default function HomePage() {
  const navigate = ReactRouterDom.useNavigate();
  const { pathname } = ReactRouterDom.useLocation();

  // /solutions, /pricing, /resources, /about all render this same component
  // and just scroll to a section — canonicalize them all to "/" so search
  // engines don't treat five URLs as duplicate/thin content.
  useSEO({
    title: "UAE Tax Residency Certificate (TRC) Platform",
    description: "Apply for your UAE Tax Residency Certificate with TRC Connect. Verified Chartered Accountants handle eligibility review, document collection, and FTA filing for individuals and companies.",
    path: "/",
    jsonLd: [ORGANIZATION_JSONLD, WEBSITE_JSONLD, LOCAL_BUSINESS_JSONLD],
  });

  React.useEffect(() => {
    const target = MARKETING_ROUTE_TARGETS[pathname];
    if (!target) return;
    const timer = window.setTimeout(() => scrollToElementId(target, "auto"), 80);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.navy, background: C.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { max-width: 100%; overflow-x: hidden; }
        ::selection { background: ${C.gold}33; }
        .nav-link { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; letter-spacing: 0.01em; }
        .nav-link:hover { color: ${C.gold}; }
        .nav-link-dark { color: ${C.navy}; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link-dark:hover { color: ${C.gold}; }
        .country-option:hover { background: ${C.offWhite}; }
        .advisor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        @media (max-width: 768px) {
          .hero-grid { display: flex !important; flex-direction: column !important; }
          .advisor-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
          .footer-cols { flex-direction: column !important; gap: 32px !important; }
          .steps-grid { flex-direction: column !important; }
          .hide-mobile { display: none !important; }
        }
        @media (max-width: 920px) {
          .marketing-nav-inner { padding: 0 16px !important; }
          .marketing-links { display: none !important; }
          .marketing-actions { gap: 8px !important; }
          .marketing-secondary-action { display: none !important; }
          .marketing-primary-action { padding: 9px 14px !important; font-size: 13px !important; }
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
                <button onClick={() => scrollToElementId('for-who')} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: 11, padding: "14px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 26px rgba(201,168,76,0.42)", letterSpacing: "0.02em" }}>
                  Get Started →
                </button>
                <button onClick={() => scrollToElementId('workflow')} style={{ background: "rgba(255,255,255,0.08)", color: C.white, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 11, padding: "14px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  See How It Works
                </button>
              </div>

              {/* real stats — no fake numbers */}
              <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, flexWrap: "wrap" }}>
                {[
                  { v: "4", l: "Role workspaces" },
                  { v: "6", l: "Workflow states" },
                  { v: "2", l: "Applicant types" },
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
      <section id="solutions" style={{ background: C.white, padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="hero-grid">
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
          ║  PRICING — enterprise-grade service packaging        ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="pricing" style={{ background: C.offWhite, padding: "80px 24px", scrollMarginTop: 96 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.4fr", gap: 44, alignItems: "start" }} className="hero-grid">
            <div>
              <SectionLabel>Pricing</SectionLabel>
              <SectionTitle>Clear packages for serious compliance operations</SectionTitle>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.8, marginTop: 16 }}>
                TRC Connect is positioned as workflow infrastructure, not a lead form. Pricing separates platform access, advisor execution, and authority fees so individuals and enterprise teams can budget cleanly.
              </p>
              <div style={{ marginTop: 22, padding: "16px 18px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Enterprise note</div>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
                  Multi-entity plans are designed for founders, holding companies, and finance teams managing renewals across employees or group structures.
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }} className="hero-grid">
              {[
                { name: "Individual", price: "Advisor-led", desc: "Best for one UAE resident application.", points: ["Eligibility review", "Document checklist", "Advisor workspace", "Case timeline"], cta: "Start Individual", action: () => navigate('/check-eligibility') },
                { name: "Corporate", price: "Case scoped", desc: "For one company or founder-led entity.", points: ["Entity assessment", "Corporate documents", "Assigned compliance manager", "Billing and reports"], cta: "Start Corporate", action: () => navigate('/corporate/check-eligibility'), featured: true },
                { name: "Enterprise", price: "Custom", desc: "For teams managing recurring TRC operations.", points: ["Multi-entity workflow", "Renewal tracking", "Audit-ready exports", "Priority support"], cta: "Discuss Fit", action: () => scrollToElementId('about') },
              ].map((plan) => (
                <div key={plan.name} style={{ background: plan.featured ? C.navy : C.white, border: `1px solid ${plan.featured ? "transparent" : C.border}`, borderRadius: 16, padding: 22, boxShadow: plan.featured ? "0 22px 48px rgba(15,37,87,0.22)" : "0 8px 22px rgba(15,37,87,0.06)" }}>
                  <div style={{ fontSize: 12, color: plan.featured ? C.goldLight : C.gold, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{plan.name}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: plan.featured ? C.white : C.navy, lineHeight: 1 }}>{plan.price}</div>
                  <p style={{ fontSize: 13, color: plan.featured ? "rgba(255,255,255,0.62)" : C.textMuted, lineHeight: 1.65, marginTop: 12, minHeight: 44 }}>{plan.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18, marginBottom: 22 }}>
                    {plan.points.map((point) => (
                      <div key={point} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: C.gold, fontWeight: 800, fontSize: 12, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 12, color: plan.featured ? "rgba(255,255,255,0.72)" : C.textMuted, lineHeight: 1.55 }}>{point}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={plan.action} style={{ width: "100%", background: plan.featured ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` : C.offWhite, color: plan.featured ? C.white : C.navy, border: plan.featured ? "none" : `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  RESOURCES                                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="resources" style={{ background: C.white, padding: "80px 24px", scrollMarginTop: 96 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 42 }}>
            <SectionLabel>Resources</SectionLabel>
            <SectionTitle>Everything you need before you apply</SectionTitle>
            <p style={{ fontSize: 15, color: C.textMuted, marginTop: 12, maxWidth: 620, margin: "12px auto 0", lineHeight: 1.75 }}>
              Guidance on UAE eligibility rules, the documents advisors typically request, and how a case moves from application to certificate.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }} className="hero-grid">
            {[
              { title: "UAE eligibility guide", desc: "UAE-specific eligibility, document, and FTA authority requirements for TRC applicants.", action: "Check Eligibility", target: "for-who" },
              { title: "Document readiness", desc: "Structured checklists that convert advisor requirements into trackable client tasks and upload states.", action: "View Workflow", target: "workflow" },
              { title: "TRC articles", desc: "Practical guides on cross-border income, double tax treaty benefits, and common UAE TRC questions.", action: "Read Blog", path: "/blog" },
            ].map((item) => (
              <div key={item.title} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, background: C.offWhite, boxShadow: "0 8px 22px rgba(15,37,87,0.05)" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 10 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, minHeight: 68 }}>{item.desc}</p>
                <button onClick={() => item.path ? navigate(item.path) : scrollToElementId(item.target)} style={{ marginTop: 18, background: "transparent", color: C.gold, border: "none", padding: 0, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  {item.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  ABOUT                                              ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section id="about" style={{ background: C.offWhite, padding: "80px 24px", scrollMarginTop: 96 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="hero-grid">
            <div>
              <SectionLabel>About TRC Connect</SectionLabel>
              <SectionTitle>A clearer way to get your UAE Tax Residency Certificate</SectionTitle>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.85, marginTop: 16 }}>
                TRC Connect pairs every applicant — individual or company — with a verified Chartered Accountant who reviews your eligibility, tells you exactly which documents are needed, and carries the case through to the Federal Tax Authority on your behalf.
              </p>
              <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.85, marginTop: 14 }}>
                No scattered email threads or WhatsApp attachments. Every request, upload, and status update lives in one workspace that you and your advisor both see.
              </p>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`, borderRadius: 18, padding: 26, boxShadow: "0 24px 60px rgba(15,37,87,0.24)", color: C.white }}>
              {[
                { k: "Who reviews your case", v: "A qualified Chartered Accountant, not an automated checklist." },
                { k: "How eligibility is decided", v: "Scored against the documents you actually provide, so you know where you stand before you apply." },
                { k: "What you can see", v: "Every document request and status change, visible on your dashboard as it happens." },
                { k: "Where it's filed", v: "Directly with the UAE Federal Tax Authority via EmaraTax." },
              ].map((row, i) => (
                <div key={row.k} style={{ padding: "15px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  <div style={{ fontSize: 11, color: C.goldLight, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>{row.k}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>{row.v}</div>
                </div>
              ))}
            </div>
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
