import React, { useState } from "react";
import { RETAIL_THEME } from "../config/retailTheme";
import NotificationCenter from "./NotificationCenter";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

export default function AppWorkspaceLayout({
  sidebar,
  workspaceLabel,
  title,
  description,
  stageLabel,
  accountLabel,
  accountValue,
  statusStrip,
  children,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--c-bg)", fontFamily: SANS }}>
      <style>{`
        .awl-sidebar { flex-shrink: 0; }
        .awl-backdrop { display: none; }
        .awl-hamburger { display: none; }
        @media (max-width: 880px) {
          .awl-sidebar {
            position: fixed; top: 0; left: 0; height: 100vh; z-index: 60;
            transform: translateX(${mobileNavOpen ? "0" : "-100%"});
            transition: transform .25s ease;
          }
          .awl-backdrop {
            display: ${mobileNavOpen ? "block" : "none"};
            position: fixed; inset: 0; background: rgba(9,26,61,.5); z-index: 50;
          }
          .awl-hamburger { display: inline-flex !important; }
          .awl-main { padding: 20px 16px !important; }
        }
      `}</style>

      <div className="awl-sidebar" onClick={() => setMobileNavOpen(false)}>
        {sidebar}
      </div>
      <div className="awl-backdrop" onClick={() => setMobileNavOpen(false)} />

      <main className="awl-main" style={{ flex: 1, padding: "32px 36px", minWidth: 0 }}>
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
            <button
              className="awl-hamburger"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              style={{ display: "none", flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", fontSize: 18, cursor: "pointer", alignItems: "center", justifyContent: "center" }}
            >
              ☰
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{workspaceLabel}</div>
              <h1 style={{ fontFamily: SERIF, fontSize: 34, color: "var(--c-text)", marginBottom: 6 }}>{title}</h1>
              <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 760 }}>{description}</p>
              {stageLabel && <p style={{ color: "var(--c-text-muted)", fontSize: 13, marginTop: 8 }}>{stageLabel}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 12px", boxShadow: RETAIL_THEME.shadows.card }}>
              <NotificationCenter />
            </div>
            <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px", boxShadow: RETAIL_THEME.shadows.card }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Account</div>
              <div style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 700 }}>{accountValue}</div>
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em" }}>{accountLabel}</div>
            </div>
          </div>
        </div>

        {statusStrip && (
          <div style={{ marginBottom: 18 }}>
            {statusStrip}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
