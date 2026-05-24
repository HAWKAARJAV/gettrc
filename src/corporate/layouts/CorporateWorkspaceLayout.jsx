import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import AppWorkspaceLayout from "../../components/AppWorkspaceLayout";
import CorporateWorkspaceSidebar from "../components/CorporateWorkspaceSidebar";
import CorporateWorkspaceLockedModal from "../modals/WorkspaceLockedModal";
import { getCorporateRouteMeta, isCorporateWorkspaceUnlocked, CORPORATE_LOCKED_NAV_ITEMS } from "../routes/corporateWorkspaceRoutes";
import { clearCorporateCache } from "../services/corporateAuth";
import { supabase } from "../../supabaseClient";

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

export default function CorporateWorkspaceLayout() {
  const { workspace, refresh } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [lockedTarget, setLockedTarget] = useState(null);

  const activeMeta = useMemo(() => getCorporateRouteMeta(location.pathname), [location.pathname]);
  const unlocked = isCorporateWorkspaceUnlocked(workspace.stage);

  const handleLogout = async () => {
    clearCorporateCache();
    await supabase.auth.signOut().catch(() => {});
    navigate("/corporate/login");
  };

  const handleLockedAccess = (item) => {
    if (!unlocked && CORPORATE_LOCKED_NAV_ITEMS.some((lockedItem) => lockedItem.key === item.key)) {
      setLockedTarget(item);
    }
  };

  return (
    <>
    <AppWorkspaceLayout
      workspaceLabel="Corporate Workspace"
      title={activeMeta.title}
      description={activeMeta.description}
      stageLabel={`Status: ${STAGE_DISPLAY_LABEL[workspace.stage] || String(workspace.stage || "Under review").replaceAll("_", " ")}`}
      accountLabel={workspace.profile?.company_name || "Corporate Client"}
      accountValue={workspace.profile?.business_email || "Verified corporate user"}
      sidebar={<CorporateWorkspaceSidebar stage={workspace.stage} onLockedAccess={handleLockedAccess} onLogout={handleLogout} />}
    >
      <Outlet context={{ workspace, refresh }} />
    </AppWorkspaceLayout>
    {lockedTarget && (
        <CorporateWorkspaceLockedModal
          featureLabel={lockedTarget.label}
          onClose={() => setLockedTarget(null)}
          onViewEligibility={() => {
            setLockedTarget(null);
            navigate("/corporate/eligibility-status");
          }}
        />
      )}
    </>
  );
}