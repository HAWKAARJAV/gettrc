import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import AppWorkspaceLayout from "../../components/AppWorkspaceLayout";
import RetailWorkspaceSidebar from "../components/RetailWorkspaceSidebar";
import WorkspaceLockedModal from "../modals/WorkspaceLockedModal";
import { getRetailRouteMeta, isRetailWorkspaceUnlocked, RETAIL_LIMITED_NAV_ITEMS, RETAIL_LOCKED_NAV_ITEMS } from "../routes/retailWorkspaceRoutes";

const STAGE_DISPLAY_LABEL = {
  pending_review:          "Under review",
  eligible:                "Eligible",
  needs_more_info:         "More info needed",
  payment_pending:         "Awaiting payment",
  payment_completed:       "Payment confirmed",
  documents_pending:       "Documents required",
  documents_under_review:  "Documents under review",
  advisor_assigned:        "With your advisor",
  processing:              "In processing",
  submitted_to_authority:  "Submitted to UAE FTA",
  completed:               "Completed",
  rejected:                "Not approved",
};
import { clearRetailCache } from "../../services/retailAuth";
import { supabase } from "../../supabaseClient";

export default function RetailWorkspaceLayout() {
  const { workspace, refresh } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [lockedTarget, setLockedTarget] = useState(null);

  const activeMeta = useMemo(() => getRetailRouteMeta(location.pathname), [location.pathname]);
  const unlocked = isRetailWorkspaceUnlocked(workspace.stage);

  const handleLogout = async () => {
    clearRetailCache();
    await supabase.auth.signOut().catch(() => {});
    navigate("/retail/login");
  };

  const handleLockedAccess = (item) => {
    if (!unlocked && RETAIL_LOCKED_NAV_ITEMS.some((lockedItem) => lockedItem.key === item.key)) {
      setLockedTarget(item);
    }
  };

  return (
    <>
    <AppWorkspaceLayout
      workspaceLabel="Retail Workspace"
      title={activeMeta.title}
      description={activeMeta.description}
      stageLabel={`Status: ${STAGE_DISPLAY_LABEL[workspace.stage] || String(workspace.stage || "Under review").replaceAll("_", " ")}`}
      accountLabel={workspace.profile?.role ? `${workspace.profile.role.charAt(0).toUpperCase()}${workspace.profile.role.slice(1)} User` : "Retail User"}
      accountValue={workspace.profile?.email || "Verified retail user"}
      sidebar={<RetailWorkspaceSidebar stage={workspace.stage} onLockedAccess={handleLockedAccess} onLogout={handleLogout} />}
    >
      <Outlet context={{ workspace, refresh }} />
    </AppWorkspaceLayout>
    {lockedTarget && (
        <WorkspaceLockedModal
          featureLabel={lockedTarget.label}
          onClose={() => setLockedTarget(null)}
          onViewEligibility={() => {
            setLockedTarget(null);
            navigate("/retail/eligibility-status");
          }}
        />
      )}
    </>
  );
}
