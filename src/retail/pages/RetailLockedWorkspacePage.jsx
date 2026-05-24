import { useNavigate } from "react-router-dom";
import WorkspaceLockedModal from "../modals/WorkspaceLockedModal";

export default function RetailLockedWorkspacePage({ featureLabel }) {
  const navigate = useNavigate();

  return (
    <WorkspaceLockedModal
      mode="inline"
      featureLabel={featureLabel}
      onViewEligibility={() => navigate("/retail/eligibility-status")}
    />
  );
}
