import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import UnreadBadge from '../../components/UnreadBadge';
import EmptyState from '../../components/EmptyState';

const C = { navy:"#0F2557", gold:"#C9A84C", goldDark:"#A07C2E", white:"#fff", offWhite:"#F7F8FC", muted:"#6B7A99", border:"#E2E8F0" };
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

const STATE_META = {
  pending_review:          { label:"Pending Review",        bg:"#EFF6FF", color:"#1D6FB8" },
  advisor_assigned:        { label:"Advisor Assigned",      bg:"#ECFDF5", color:"#059669" },
  documents_pending:       { label:"Docs Pending",          bg:"#FFFBEB", color:"#D97706" },
  documents_under_review:  { label:"Docs Under Review",     bg:"#F5F3FF", color:"#5B21B6" },
  processing:              { label:"Processing",            bg:"#F5F3FF", color:"#5B21B6" },
  submitted_to_authority:  { label:"Submitted",             bg:"#ECFDF5", color:"#059669" },
  completed:               { label:"Completed ✓",           bg:"#ECFDF5", color:"#059669" },
  rejected:                { label:"Rejected",              bg:"#FEF2F2", color:"#DC2626" },
  payment_pending:         { label:"Payment Pending",       bg:"#FFFBEB", color:"#D97706" },
  payment_completed:       { label:"Payment Done",          bg:"#ECFDF5", color:"#059669" },
};

function Badge({ state }) {
  const m = STATE_META[state] || { label: state, bg: "#F3F4F6", color: "#6B7280" };
  return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>{m.label}</span>;
}

export default function AdvisorCasesPage() {
  const { workspace } = useOutletContext();
  const navigate = useNavigate();
  const { cases } = workspace;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const FILTERS = [
    { key: "all",    label: "All Cases" },
    { key: "active", label: "Active" },
    { key: "done",   label: "Completed" },
  ];

  const filtered = cases.filter(c => {
    const matchFilter = filter === "all" ? true
      : filter === "active" ? !["completed","rejected"].includes(c.workflow_state)
      : c.workflow_state === "completed";
    const client = c.profiles;
    const matchSearch = !search ||
      (client?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (client?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.id || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, padding: "20px 24px", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>My Cases</h2>
        <p style={{ color: "var(--c-text-muted)", fontSize: 14 }}>{cases.length} total case{cases.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "8px 16px", borderRadius: 999, border: "none", fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer", background: filter === f.key ? C.navy : "var(--c-surface)", color: filter === f.key ? "#fff" : "var(--c-text-muted)", boxShadow: "0 1px 4px rgba(15,37,87,.08)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name or ID…"
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14, outline: "none", color: "var(--c-text)" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 20 }}>
            {cases.length === 0 ? (
              <EmptyState
                title="No cases assigned yet"
                message="Your assigned cases will appear here. If you think this is an error, contact the TRC support team."
                cta={{ label: 'Contact admin', onClick: () => navigate('/advisor/chat?app=admin') }}
              />
            ) : (
              <EmptyState
                title="No cases match"
                message="Try clearing filters or updating your search to find cases."
                cta={{ label: 'Reset filters', onClick: () => { setFilter('all'); setSearch(''); } }}
              />
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 170px 90px 170px", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${"var(--c-border)"}`, background: "var(--c-bg)" }}>
              {["Client", "Country / Type", "Status", "Date", "Actions"].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</div>
              ))}
            </div>
            {filtered.map(c => {
              const client = c.profiles || {};
              return (
                <div key={c.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr 130px 170px 90px 170px", gap: 12, padding: "14px 20px", borderBottom: `1px solid ${"var(--c-border)"}`, alignItems: "center", transition: "background .15s", cursor: "pointer" }}
                  onClick={() => navigate(`/advisor/cases/${c.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--c-text)", fontSize: 14 }}>{client.full_name || client.email || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--c-text-muted)", marginTop: 2 }}>{client.email || c.id.slice(0,8)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--c-text)" }}>{c.country || "UAE"} · {c.application_type || "TRC"}</div>
                  <div><Badge state={c.workflow_state} /></div>
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>{new Date(c.created_at).toLocaleDateString()}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
                      <button onClick={e => { e.stopPropagation(); navigate(`/advisor/cases/${c.id}`); }}
                        style={{ padding: "5px 10px", borderRadius: 7, background: C.navy, color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
                        Open
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); navigate(`/advisor/cases/${c.id}?tab=messages`); }}
                          style={{ padding: "5px 10px", borderRadius: 7, background: "#F5F3FF", color: "#5B21B6", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 8 }}>
                          Chat
                        </button>
                        <UnreadBadge count={c.unreadMessages || 0} />
                      </div>
                    </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
