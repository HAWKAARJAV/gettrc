import { useLocation, useNavigate } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";
import { CORPORATE_FULL_NAV_ITEMS, CORPORATE_LIMITED_NAV_ITEMS, CORPORATE_LOCKED_NAV_ITEMS, isCorporateWorkspaceUnlocked } from "../routes/corporateWorkspaceRoutes";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;

export default function CorporateWorkspaceSidebar({ stage, onLogout, onLockedAccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const unlocked = isCorporateWorkspaceUnlocked(stage);
  const visibleItems = unlocked ? CORPORATE_FULL_NAV_ITEMS : CORPORATE_LIMITED_NAV_ITEMS;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleItemClick = (item) => {
    if (!unlocked && CORPORATE_LOCKED_NAV_ITEMS.some((lockedItem) => lockedItem.key === item.key)) {
      onLockedAccess?.(item);
      return;
    }
    if (item.key === "logout") {
      onLogout?.();
      return;
    }
    navigate(item.path);
  };

  return (
    <aside style={{ width: 274, minHeight: "100vh", background: C.sidebar, color: C.white, display: "flex", flexDirection: "column", position: "sticky", top: 0 }}>
      <div style={{ padding: 22, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏛</div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, lineHeight: 1, color: C.white }}>TRC</div>
            <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: 1, color: C.goldLight }}>Corporate</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,.06)", borderRadius: RETAIL_THEME.radius.sm, padding: 12, border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 6 }}>
            {unlocked ? "Enterprise Workspace" : "Corporate Eligibility"}
          </div>
          <div style={{ fontSize: 13, color: C.white, lineHeight: 1.5 }}>
            {unlocked ? "Full workspace unlocked" : "Complete onboarding to unlock the compliance workspace"}
          </div>
        </div>
      </div>

      <nav style={{ padding: "14px 0 0", flex: 1 }}>
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          const locked = !unlocked && CORPORATE_LOCKED_NAV_ITEMS.some((lockedItem) => lockedItem.key === item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                background: active ? "rgba(201,168,76,.14)" : "transparent",
                border: "none",
                color: active ? C.goldLight : C.white,
                textAlign: "left",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                borderLeft: active ? `3px solid ${C.gold}` : "3px solid transparent",
                opacity: locked ? 0.42 : active ? 1 : 0.92,
              }}
            >
              <span style={{ width: 18, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
              {locked && (
                <span style={{ marginLeft: "auto", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: C.goldLight }}>Locked</span>
              )}
            </button>
          );
        })}

        {!unlocked && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.42)", letterSpacing: ".14em", textTransform: "uppercase", padding: "0 18px 12px" }}>
              Locked
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CORPORATE_LOCKED_NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onLockedAccess?.(item)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 18px",
                      background: active ? "rgba(201,168,76,.08)" : "transparent",
                      border: "none",
                      color: "rgba(255,255,255,.38)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      opacity: active ? 0.55 : 0.42,
                    }}
                  >
                    <span style={{ width: 18, textAlign: "center", opacity: 0.8 }}>🔒</span>
                    <span>{item.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: C.goldLight }}>Locked</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div style={{ padding: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            background: "rgba(255,255,255,.06)",
            color: C.white,
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: RETAIL_THEME.radius.sm,
            padding: "12px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}