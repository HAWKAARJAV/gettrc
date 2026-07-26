import { useOutletContext, useNavigate } from "react-router-dom";
import EmptyState from "../../components/EmptyState";

const C = { navy:"#0F2557", gold:"#C9A84C", goldDark:"#A07C2E", white:"#fff", offWhite:"#F7F8FC", muted:"#6B7A99", border:"#E2E8F0", success:"#059669", successBg:"#ECFDF5", warn:"#D97706", warnBg:"#FFFBEB" };
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

function StatCard({ icon, label, value, sub, color = C.navy }) {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, padding: 20, display: "flex", gap: 14, alignItems: "center", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--c-text-muted)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function WorkflowBadge({ state }) {
  const map = {
    pending_review:       ["Pending Review",       "#EFF6FF","#1D6FB8"],
    advisor_assigned:     ["Advisor Assigned",      "#ECFDF5","#059669"],
    documents_pending:    ["Docs Pending",          "#FFFBEB","#D97706"],
    documents_under_review:["Docs Under Review",   "#F5F3FF","#5B21B6"],
    processing:           ["Processing",            "#F5F3FF","#5B21B6"],
    submitted_to_authority:["Submitted",            "#ECFDF5","#059669"],
    completed:            ["Completed ✓",           "#ECFDF5","#059669"],
    rejected:             ["Rejected",              "#FEF2F2","#DC2626"],
    payment_pending:      ["Payment Pending",       "#FFFBEB","#D97706"],
    payment_completed:    ["Payment Done",          "#ECFDF5","#059669"],
  };
  const [label, bg, color] = map[state] || ["—", "#F3F4F6", "#6B7280"];
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function AdvisorDashboardPage() {
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const { cases, unreadMessageCount, openTicketCount, profile, advisor } = workspace;

  const activeCases = cases.filter(c => !["completed","rejected"].includes(c.workflow_state));
  const completedCases = cases.filter(c => c.workflow_state === "completed");
  const recentCases = cases.slice(0, 5);

  return (
    <div style={{ display: "grid", gap: 22, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ background: "var(--c-surface)", borderRadius: 18, border: `1px solid ${"var(--c-border)"}`, padding: "24px 28px", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Welcome back</div>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>
          {profile?.full_name || advisor?.name || "Advisor"}'s Dashboard
        </h2>
        <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.7 }}>
          Overview of your assigned cases, messages, and pending updates.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard icon="📁" label="Total Cases"     value={cases.length}         color={C.navy} />
        <StatCard icon="⚡" label="Active Cases"    value={activeCases.length}   color="#5B21B6" sub={`${completedCases.length} completed`} />
        <StatCard icon="💬" label="Unread Messages" value={unreadMessageCount}   color={unreadMessageCount > 0 ? "#D97706" : C.success} />
        <StatCard icon="📢" label="Open Updates"    value={openTicketCount}      color={openTicketCount > 0 ? "#DC2626" : C.success} />
      </div>

      {/* Recent cases */}
      <div style={{ background: "var(--c-surface)", borderRadius: 18, border: `1px solid ${"var(--c-border)"}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${"var(--c-border)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>Recent Cases</div>
          <button onClick={() => navigate("/advisor/cases")} style={{ background: "none", border: "none", color: C.gold, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: SANS }}>View all →</button>
        </div>
        {recentCases.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState title="No cases assigned yet" message="The admin will assign cases to you shortly. Contact admin if this seems incorrect." cta={{ label: 'Contact admin', onClick: () => navigate('/advisor/chat?app=admin') }} />
          </div>
        ) : (
          <div>
            {recentCases.map(c => {
              const client = c.profiles || {};
              return (
                <div key={c.id} onClick={() => navigate(`/advisor/cases/${c.id}`)}
                  style={{ padding: "14px 24px", borderBottom: `1px solid ${"var(--c-border)"}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.navy},#1A3570)`, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {(client.full_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--c-text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {client.full_name || client.email || "Client"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>{c.country || "UAE"} · {c.application_type || "TRC"}</div>
                  </div>
                  <WorkflowBadge state={c.workflow_state} />
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)", flexShrink: 0 }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        {[
          { icon: "📁", label: "View All Cases", action: () => navigate("/advisor/cases"), bg: C.navy },
          { icon: "💬", label: "Open Chat", action: () => navigate("/advisor/chat"), bg: "#5B21B6" },
          { icon: "📢", label: "Send Update to Admin", action: () => navigate("/advisor/updates"), bg: C.goldDark },
        ].map(({ icon, label, action, bg }) => (
          <button key={label} onClick={action} style={{ background: bg, color: "#fff", border: "none", borderRadius: 12, padding: "16px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
