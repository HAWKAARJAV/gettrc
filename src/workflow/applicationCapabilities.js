import { getApplicationCapabilities } from "./workflowCapabilities";

export { getApplicationCapabilities };

export function getApplicationCapabilitySummary(application) {
  const caps = getApplicationCapabilities(application);
  return [
    caps.canUploadDocuments && "documents",
    caps.canAssignAdvisor && "advisor",
    caps.canSubmitToAuthority && "submission",
    caps.canAccessBilling && "billing",
    caps.canReviewDocuments && "review",
    caps.canViewAdvisor && "advisor view",
  ].filter(Boolean);
}
