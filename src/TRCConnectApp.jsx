// TRCConnectApp.jsx — TRC Connect · React + React Router
import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import * as ReactRouterDom from "react-router-dom";
import { C } from "./theme/marketingColors";
import NotificationCenter from "./components/NotificationCenter";
import WorkflowToastHost from "./components/WorkflowToastHost";

// ─── Lazy-loaded routes ─────────────────────────────────────────────────────
// Everything below is only needed once a visitor actually navigates into that
// workspace/tool — none of it should block the marketing homepage's initial
// bundle (the page search engines and Core Web Vitals actually score).
const AdminDashboard              = lazy(() => import("./AdminDashboard"));

const RetailEligibilityPage       = lazy(() => import("./pages/RetailEligibilityPage"));
const RetailLoginPage             = lazy(() => import("./pages/RetailLoginPage"));
const RetailWorkspaceGuard        = lazy(() => import("./retail/guards/RetailWorkspaceGuard"));
const RetailWorkspaceLayout       = lazy(() => import("./retail/layouts/RetailWorkspaceLayout"));
const RetailDashboardPage         = lazy(() => import("./retail/pages/RetailDashboardPage"));
const RetailEligibilityStatusPage = lazy(() => import("./retail/pages/RetailEligibilityStatusPage"));
const RetailProfilePage           = lazy(() => import("./retail/pages/RetailProfilePage"));
const RetailSupportPage           = lazy(() => import("./retail/pages/RetailSupportPage"));
const RetailDocumentsPage         = lazy(() => import("./retail/pages/RetailDocumentsPage"));
const RetailResidencyTrackerPage  = lazy(() => import("./retail/pages/RetailResidencyTrackerPage"));
const RetailChatPage              = lazy(() => import("./retail/pages/RetailChatPage"));
const RetailRequestedPage         = lazy(() => import("./retail/pages/RetailRequestedPage"));
const RetailResetPasswordPage     = lazy(() => import("./retail/pages/RetailResetPasswordPage"));

const CorporateEligibilityPage    = lazy(() => import("./corporate/pages/CorporateEligibilityPage"));
const CorporateLoginPage          = lazy(() => import("./corporate/pages/CorporateLoginPage"));
const CorporateWorkspaceGuard     = lazy(() => import("./corporate/guards/CorporateWorkspaceGuard"));
const CorporateWorkspaceLayout    = lazy(() => import("./corporate/layouts/CorporateWorkspaceLayout"));
const CorporateDashboardPage         = lazy(() => import("./corporate/pages/CorporateWorkspacePages").then(m => ({ default: m.CorporateDashboardPage })));
const CorporateDocumentsPage         = lazy(() => import("./corporate/pages/CorporateWorkspacePages").then(m => ({ default: m.CorporateDocumentsPage })));
const CorporateEligibilityStatusPage = lazy(() => import("./corporate/pages/CorporateWorkspacePages").then(m => ({ default: m.CorporateEligibilityStatusPage })));
const CorporateProfilePage           = lazy(() => import("./corporate/pages/CorporateWorkspacePages").then(m => ({ default: m.CorporateProfilePage })));
const CorporateSupportPage           = lazy(() => import("./corporate/pages/CorporateWorkspacePages").then(m => ({ default: m.CorporateSupportPage })));
const CorporateChatPage           = lazy(() => import("./corporate/pages/CorporateChatPage"));
const CorporateApplicationsPage      = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateApplicationsPage })));
const CorporateEmployeesPage         = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateEmployeesPage })));
const CorporateComplianceCenterPage  = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateComplianceCenterPage })));
const CorporateReportsPage           = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateReportsPage })));
const CorporateBillingPage           = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateBillingPage })));
const CorporateSettingsPage          = lazy(() => import("./corporate/pages/CorporateFeaturePages").then(m => ({ default: m.CorporateSettingsPage })));

const ApplicationDetailPage       = lazy(() => import("./pages/ApplicationDetailPage"));

const AdvisorLoginPage            = lazy(() => import("./pages/AdvisorLoginPage"));
const AdvisorWorkspaceGuard       = lazy(() => import("./advisor/guards/AdvisorWorkspaceGuard"));
const AdvisorWorkspaceLayout      = lazy(() => import("./advisor/layouts/AdvisorWorkspaceLayout"));
const AdvisorDashboardPage        = lazy(() => import("./advisor/pages/AdvisorDashboardPage"));
const AdvisorCasesPage            = lazy(() => import("./advisor/pages/AdvisorCasesPage"));
const AdvisorCaseDetailPage       = lazy(() => import("./advisor/pages/AdvisorCaseDetailPage"));
const AdvisorChatPage             = lazy(() => import("./advisor/pages/AdvisorChatPage"));
const AdvisorUpdatesPage          = lazy(() => import("./advisor/pages/AdvisorUpdatesPage"));
const AdvisorProfilePage          = lazy(() => import("./advisor/pages/AdvisorProfilePage"));

const BlogListingPage             = lazy(() => import("./blog/BlogListingPage"));
const BlogPostPage                = lazy(() => import("./blog/BlogPostPage"));

// Marketing homepage + orphan/dead-linked legacy pages (no live nav link
// points to /uae, /marketplace, or /onboarding — still lazy-loaded so
// they never bloat the homepage's initial bundle.
const HomePage                    = lazy(() => import("./pages/HomePage"));
const UAEPage                     = lazy(() => import("./pages/UAEPage"));
const MarketplacePage             = lazy(() => import("./pages/MarketplacePage"));
const OnboardingPage              = lazy(() => import("./pages/OnboardingPage"));

function RouteLoadingFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#091A3D" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,.15)", borderTopColor: "#C9A84C", animation: "trc-spin .8s linear infinite" }} />
      <style>{`@keyframes trc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


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
  // hash = smooth-scroll on homepage; to = hard navigate for Blog
  const NAV=[
    { label: 'Solutions', hash: 'solutions' },
    { label: 'Pricing',   hash: 'pricing'   },
    { label: 'Blog',      to:   '/blog'      },
    { label: 'Resources', hash: 'resources'  },
    { label: 'About',     hash: 'about'      },
  ];

  const scrollTo = (hash) => {
    if (pathname !== '/') {
      // Navigate home then scroll after render
      nav('/');
      setTimeout(() => {
        scrollToElementId(hash);
      }, 350);
    } else {
      scrollToElementId(hash);
    }
  };

  const closeSelector = () => setActiveSelector(null);

  React.useEffect(() => {
    if (!activeSelector) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') closeSelector(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSelector]);

  const SelectorModal = ({ eyebrow, title, subtitle, options }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(9,26,61,.72)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'center', padding: 24 }} onClick={closeSelector}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(100%, 760px)', background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: '0 36px 90px rgba(0,0,0,.28)', overflow: 'hidden' }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)`, position: 'relative' }}>
          <button onClick={closeSelector} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: C.muted, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">×</button>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 8 }}>{eyebrow}</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: C.navy, marginBottom: 8 }}>{title}</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>{subtitle}</p>
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
      <div className="marketing-nav-inner" style={{maxWidth:1300,margin:'0 auto',padding:'0 28px',
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <ReactRouterDom.Link to='/' style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:36,height:36,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
            borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚖</div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
            color:tp?C.white:C.navy}}>TRC</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,
            color:tp?C.goldLight:C.gold}}> Connect</span>
        </ReactRouterDom.Link>
        <div className="marketing-links" style={{display:'flex',alignItems:'center',gap:28}}>
          {NAV.map(l=> l.to ? (
            <ReactRouterDom.Link key={l.to} to={l.to} style={{
              color:pathname.startsWith('/blog')?C.gold:lc,
              fontSize:14,fontWeight:pathname.startsWith('/blog')?700:500,
              borderBottom:pathname.startsWith('/blog')?`2px solid ${C.gold}`:'2px solid transparent',
              paddingBottom:2,transition:'all .2s',textDecoration:'none'}}>
              {l.label}
            </ReactRouterDom.Link>
          ) : (
            <button key={l.hash} onClick={()=>scrollTo(l.hash)}
              style={{
                color:lc, fontSize:14, fontWeight:500,
                border:'none', background:'transparent', cursor:'pointer',
                borderBottom:'2px solid transparent', paddingBottom:2,
                transition:'all .2s', fontFamily:'inherit',
              }}
              onMouseEnter={e=>e.currentTarget.style.color=C.gold}
              onMouseLeave={e=>e.currentTarget.style.color=lc}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="marketing-actions" style={{display:'flex',alignItems:'center',gap:10}}>
          <NotificationCenter />
          <button className="marketing-secondary-action" onClick={() => setActiveSelector('signin')} style={{background:'transparent',border:'none',color:lc,fontSize:14,fontWeight:500,padding:'9px 14px',textDecoration:'none',cursor:'pointer'}}>
            Sign In
          </button>
          <button className="marketing-primary-action" onClick={() => setActiveSelector('eligibility')} style={{
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
          eyebrow="Sign In"
          title="Choose Your Workspace"
          subtitle="Select the compliance path that matches how you operate."
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
          eyebrow="Get Started"
          title="Check Eligibility"
          subtitle="Select the path that matches how you operate."
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
  React.useEffect(()=>{
    if (MARKETING_ROUTE_TARGETS[pathname]) return;
    window.scrollTo(0,0);
  },[pathname]);
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
  const hideGlobalNav = pathname.startsWith("/retail") || pathname.startsWith("/corporate") || pathname.startsWith("/advisor") || pathname.startsWith("/blog") || ["/check-eligibility", "/login", "/dashboard", "/admin"].includes(pathname);

  return (
    <>
      <ScrollToTop />
      {!hideGlobalNav && <_AppNavbarInner />}
      <Suspense fallback={<RouteLoadingFallback />}>
      <ReactRouterDom.Routes>
        <ReactRouterDom.Route path="/" element={<PageErrorBoundary name="Home"><HomePage/></PageErrorBoundary>} />
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
            <ReactRouterDom.Route path="applications" element={<CorporateApplicationsPage />} />
            <ReactRouterDom.Route path="applications/:id" element={<ApplicationDetailPage />} />
            <ReactRouterDom.Route path="employees" element={<CorporateEmployeesPage />} />
            <ReactRouterDom.Route path="compliance-center" element={<CorporateComplianceCenterPage />} />
            <ReactRouterDom.Route path="documents" element={<CorporateDocumentsPage />} />
            <ReactRouterDom.Route path="advisors" element={<CorporateChatPage />} />
            <ReactRouterDom.Route path="reports" element={<CorporateReportsPage />} />
            <ReactRouterDom.Route path="billing" element={<CorporateBillingPage />} />
            <ReactRouterDom.Route path="settings" element={<CorporateSettingsPage />} />
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
      </Suspense>
      <WorkflowToastHost />
    </>
  );
}
