import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdvisorWorkspace } from "../../hooks/useAdvisorWorkspace";
import { useSEO } from "../../seo/useSEO";

export default function AdvisorWorkspaceGuard() {
  const workspace = useAdvisorWorkspace();
  const location = useLocation();
  // Private workspace — every nested page inherits this noindex since none of
  // them call useSEO themselves. (The /advisor/login page sets its own noindex.)
  useSEO({ title: "Advisor Workspace", noindex: true });

  if (location.pathname.startsWith("/advisor/login")) return <Outlet />;

  if (workspace.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#fff", fontFamily: "sans-serif", gap: 12, flexDirection: "column" }}>
        <div style={{ fontSize: 14 }}>Loading advisor workspace…</div>
      </div>
    );
  }

  // Show error/retry screen BEFORE the session/role checks — a workspace
  // fetch error (or a transient failure while verifying the session itself)
  // must not silently redirect to login, since that's indistinguishable from
  // a real logout to the user and hides the real (usually temporary) problem.
  if (workspace.error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#091A3D", color: "#fff", fontFamily: "sans-serif", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", maxWidth: 380, textAlign: "center", lineHeight: 1.6 }}>
          {workspace.session ? "Your session is active but workspace data failed to load. This is usually a temporary issue." : "We couldn't verify your session. This is usually temporary — try again."}
        </p>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 18px", fontSize: 12, color: "#FBBF24", maxWidth: 480, wordBreak: "break-all", fontFamily: "monospace" }}>
          {workspace.error?.message || workspace.error?.details || String(workspace.error)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => workspace.refresh()} style={{ background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Retry
          </button>
          {!workspace.session && (
            <button onClick={() => { localStorage.clear(); window.location.assign("/advisor/login"); }}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!workspace.session) return <Navigate to="/advisor/login" replace />;

  if (workspace.profile?.role !== "advisor") return <Navigate to="/advisor/login" replace />;

  return <Outlet context={{ workspace, refresh: workspace.refresh }} />;
}
