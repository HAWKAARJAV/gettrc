import { RETAIL_THEME } from "../config/retailTheme";
import { generateRequiredActions } from "../workflow/generateRequiredActions";
import { getApplicationStateMeta } from "../workflow/applicationWorkflow";

const C = RETAIL_THEME.colors;


function expectedTimelineFor(application) {
  const state = application?.workflow_state || application?.review_state || application?.status || "pending_review";
  return {
    pending_review: "Initial review",
    eligible: "Payment required",
    payment_pending: "Awaiting payment",
    payment_completed: "Document intake",
    documents_pending: "Document intake",
    documents_under_review: "Document review",
    advisor_assigned: "Advisor review",
    processing: "Processing",
    submitted_to_authority: "Authority review",
    completed: "Completed",
    rejected: "Blocked",
  }[state] || "Under review";
}

export default function ApplicationStatusStrip({ application, documents = [], tasks }) {
  const currentTasks = tasks || generateRequiredActions(application, documents);
  const primaryTask = currentTasks.find((task) => task.status !== "done") || currentTasks[0];
  const blockingIssues = currentTasks.filter((task) => task.blocking);
  const stateMeta = getApplicationStateMeta(application?.workflow_state || application?.review_state || application?.status);

  const cells = [
    ["Current workflow stage", stateMeta.label || "Pending review"],
    ["Pending action", primaryTask?.title || "No pending operational tasks"],
    ["Expected timeline", expectedTimelineFor(application)],
    ["Blocking issues", blockingIssues.length ? blockingIssues.map((task) => task.title).join(", ") : "None"],
  ];

  return (
    <section style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.lg, boxShadow: RETAIL_THEME.shadows.card, padding: 16, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {cells.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: label === "Blocking issues" && value !== "None" ? C.error : C.navy, lineHeight: 1.45, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
