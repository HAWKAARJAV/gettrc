import { Navigate, Outlet } from "react-router-dom";
import { useCorporateWorkspace } from "../hooks/useCorporateWorkspace";
import { useSEO } from "../../seo/useSEO";

export default function CorporateWorkspaceGuard() {
  const workspace = useCorporateWorkspace();
  // Private workspace — every nested page inherits this noindex since none of
  // them call useSEO themselves.
  useSEO({ title: "Corporate Workspace", noindex: true });

  if (workspace.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        Loading enterprise workspace…
      </div>
    );
  }

  // An error (including a transient failure while verifying the session
  // itself) must never be treated as "not logged in" — checking it before
  // the session check avoids bouncing an authenticated user to
  // /corporate/login on a network blip during refresh.
  if (workspace.error) {
    const errMsg = workspace.error?.message || workspace.error?.details || String(workspace.error);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#FFFFFF", fontFamily: "sans-serif", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ fontSize: 16, maxWidth: 420, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
          {workspace.session ? "Your session is active but we couldn't load your workspace data." : "We couldn't verify your session. This is usually temporary — try again."}
        </p>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 18px", fontSize: 12, color: "#FBBF24", maxWidth: 480, wordBreak: "break-all", fontFamily: "monospace" }}>{errMsg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => workspace.refresh()}
            style={{ background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Retry
          </button>
          {!workspace.session && (
            <button onClick={() => { localStorage.clear(); window.location.assign("/corporate/login"); }}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!workspace.session) {
    return <Navigate to="/corporate/login" replace />;
  }

  if (workspace.profile?.role && workspace.profile.role !== "corporate") {
    return <Navigate to="/corporate/check-eligibility" replace />;
  }

  return <Outlet context={{ workspace, refresh: workspace.refresh }} />;
}