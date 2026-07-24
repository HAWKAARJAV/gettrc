import { useState } from "react";
import { Outlet, NavLink, useNavigate, useOutletContext } from "react-router-dom";
import { logoutAdvisor } from "../../services/advisorAuth";
import UnreadBadge from "../../components/UnreadBadge";
import NotificationCenter from "../../components/NotificationCenter";

const C = {
  navy: "#0F2557", navyDark: "#091A3D", sidebar: "#0A1F4E",
  gold: "#C9A84C", goldLight: "#E2C47A", goldDark: "#A07C2E",
  white: "#FFFFFF", offWhite: "#F7F8FC", muted: "#6B7A99", border: "#E2E8F0",
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

const NAV = [
  { to: "/advisor/dashboard", icon: "📊", label: "Dashboard",  badge: null },
  { to: "/advisor/cases",     icon: "📁", label: "My Cases",   badge: "cases" },
  { to: "/advisor/chat",      icon: "💬", label: "Chat",       badge: "unreadMessageCount" },
  { to: "/advisor/updates",   icon: "📢", label: "Updates",    badge: "openTicketCount" },
  { to: "/advisor/profile",   icon: "👤", label: "Profile",    badge: null },
];

function NavItem({ to, icon, label, badgeVal, collapsed }) {
  return (
    <NavLink to={to} end={to === "/advisor/dashboard"} style={({ isActive }) => ({
      display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "12px 0" : "12px 16px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: 10, textDecoration: "none", transition: "all .18s",
      background: isActive ? "rgba(201,168,76,.15)" : "transparent",
      color: isActive ? C.goldLight : "rgba(255,255,255,.7)",
      fontWeight: isActive ? 700 : 500, fontSize: 14,
      borderLeft: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
    })}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span style={{ flex: 1, fontFamily: SANS }}>{label}</span>}
      {!collapsed && badgeVal > 0 && (
        <UnreadBadge count={badgeVal} />
      )}
    </NavLink>
  );
}

export default function AdvisorWorkspaceLayout() {
  const ctx = useOutletContext();
  const { workspace } = ctx;
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdvisor();
    navigate("/advisor/login");
  };

  const badgeMap = {
    cases: workspace.cases?.length || 0,
    unreadMessageCount: workspace.unreadMessageCount || 0,
    openTicketCount: workspace.openTicketCount || 0,
  };

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: SANS, background: C.offWhite }}>
      <style>{`
        .awl2-sidebar { flex-shrink: 0; }
        .awl2-backdrop { display: none; }
        .awl2-hamburger { display: none; }
        @media (max-width: 880px) {
          .awl2-sidebar {
            position: fixed; top: 0; left: 0; z-index: 60; height: 100vh; width: 240px !important;
            transform: translateX(${mobileOpen ? "0" : "-100%"});
            transition: transform .25s ease;
          }
          .awl2-backdrop {
            display: ${mobileOpen ? "block" : "none"};
            position: fixed; inset: 0; background: rgba(9,26,61,.5); z-index: 50;
          }
          .awl2-hamburger { display: inline-flex !important; }
          .awl2-page { padding: 16px !important; }
        }
      `}</style>
      {/* Sidebar */}
      <aside className="awl2-sidebar" onClick={() => setMobileOpen(false)} style={{ width: sidebarW, minHeight: "100vh", background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width .2s", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        {/* Brand */}
        <div style={{ padding: collapsed ? "20px 0" : "20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚖</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.white, lineHeight: 1 }}>TRC Connect</div>
              <div style={{ fontSize: 10, color: C.goldLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>Advisor Portal</div>
            </div>
          )}
        </div>

        {/* Advisor chip */}
        {!collapsed && workspace.profile && (
          <div style={{ margin: "14px 12px 0", background: "rgba(255,255,255,.06)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.profile.full_name || workspace.advisor?.name || workspace.profile.email}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>
              Advisor
            </div>
          </div>
        )}

        {/* Nav */}
          <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map(n => (
              <NavItem
                key={n.to}
                to={n.to}
                icon={n.icon}
                label={n.label}
                badgeVal={n.badge ? badgeMap[n.badge] : 0}
                collapsed={collapsed}
              />
            ))}
          </nav>

        {/* Footer */}
        <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: 8, color: "rgba(255,255,255,.6)", padding: "8px 0", cursor: "pointer", fontSize: 16, fontFamily: SANS }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "→" : "←"}
          </button>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, color: "#FCA5A5", padding: "8px 0", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
          >
            {collapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </aside>
      <div className="awl2-backdrop" onClick={() => setMobileOpen(false)} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="awl2-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{ display: "none", flexShrink: 0, width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontSize: 16, cursor: "pointer", alignItems: "center", justifyContent: "center" }}
            >
              ☰
            </button>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Advisor Dashboard</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <NotificationCenter />
            {workspace.unreadMessageCount > 0 && (
              <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
                💬 {workspace.unreadMessageCount} unread
              </span>
            )}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 13, fontWeight: 700 }}>
              {(workspace.profile?.full_name || workspace.advisor?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="awl2-page" style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
          <Outlet context={{ workspace, refresh: ctx.refresh }} />
        </main>
      </div>
    </div>
  );
}
