import React from "react";
import { RETAIL_THEME } from "../config/retailTheme";

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
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.offWhite, fontFamily: SANS }}>
      {sidebar}

      <main style={{ flex: 1, padding: "32px 36px", minWidth: 0 }}>
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{workspaceLabel}</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 34, color: C.navy, marginBottom: 6 }}>{title}</h1>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 760 }}>{description}</p>
            {stageLabel && <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{stageLabel}</p>}
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px", boxShadow: RETAIL_THEME.shadows.card }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Account</div>
            <div style={{ fontSize: 14, color: C.navy, fontWeight: 700 }}>{accountValue}</div>
            <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em" }}>{accountLabel}</div>
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
