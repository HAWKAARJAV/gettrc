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

  if (!workspace.session) {
    return <Navigate to="/corporate/login" replace />;
  }

  if (workspace.profile?.role && workspace.profile.role !== "corporate") {
    return <Navigate to="/corporate/check-eligibility" replace />;
  }

  return <Outlet context={{ workspace, refresh: workspace.refresh }} />;
}