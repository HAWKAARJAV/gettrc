import { Link } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

export default function CorporateAuthShell({ children, actions = null }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 52%, #102A5D 100%)`, padding: 24, fontFamily: SANS, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", minHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", rowGap: 10 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.white }}>TRC</span>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: C.goldLight }}> Connect</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", rowGap: 10 }}>
            {actions}
            <a href="mailto:support@gettrc.com" style={{ color: C.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Need Help?</a>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}