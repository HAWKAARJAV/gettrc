import { useEffect, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const C = { navy:"#0F2557", navyLight:"#1A3570", gold:"#C9A84C", goldDark:"#A07C2E", white:"#fff", offWhite:"#F7F8FC", muted:"#6B7A99", border:"#E2E8F0", success:"#059669", successBg:"#ECFDF5", warn:"#D97706", warnBg:"#FFFBEB", error:"#DC2626", errorBg:"#FEF2F2" };
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

const STATUS_META = {
  open:        { label:"Open",        bg:"#FFFBEB", color:"#D97706" },
  in_progress: { label:"In Progress", bg:"#F5F3FF", color:"#5B21B6" },
  resolved:    { label:"Resolved",    bg:"#ECFDF5", color:"#059669" },
  closed:      { label:"Closed",      bg:"#F3F4F6", color:"#6B7280" },
};

const PRIORITY_META = {
  low:    { label:"Low",    bg:"#F3F4F6", color:"#6B7280" },
  medium: { label:"Medium", bg:"#FFFBEB", color:"#D97706" },
  high:   { label:"High",   bg:"#FEF2F2", color:"#DC2626" },
};

function Badge({ val, metaMap }) {
  const m = metaMap[val] || { label: val || "—", bg: "#F3F4F6", color: "#6B7280" };
  return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>{m.label}</span>;
}

async function fetchTickets(advisorId) {
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", advisorId)
    .order("created_at", { ascending: false });
  return data || [];
}

async function createTicket(advisorId, applicationId, subject, message, priority) {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: advisorId, application_id: applicationId || null, subject: subject.trim(), message: message.trim(), priority, status: "open" })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default function AdvisorUpdatesPage() {
  const { workspace } = useOutletContext();
  const [params] = useSearchParams();
  const { session, cases } = workspace;
  const advisorId = session?.user?.id;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!params.get("app")); // auto-open if arriving from case detail
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selected, setSelected] = useState(null);
  const pollRef = useRef(null);

  // form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [appId, setAppId] = useState(params.get("app") || "");

  const load = async () => {
    const data = await fetchTickets(advisorId);
    setTickets(data);
  };

  useEffect(() => {
    if (!advisorId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(load, 15_000);
    return () => clearInterval(pollRef.current);
  }, [advisorId]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { setFormError("Subject and message are required."); return; }
    setSubmitting(true); setFormError(null);
    try {
      const ticket = await createTicket(advisorId, appId || null, subject, message, priority);
      setTickets(prev => [ticket, ...prev]);
      setShowForm(false);
      setSubject(""); setMessage(""); setPriority("medium"); setAppId("");
    } catch (e) {
      setFormError(e.message || "Failed to send update.");
    } finally { setSubmitting(false); }
  };

  const ticketById = selected ? tickets.find(t => t.id === selected) : null;

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.navy }}>Updates & Inquiries</h2>
          <p style={{ color: C.muted, fontSize: 14 }}>Send updates or inquiries to admin. Track their status here.</p>
        </div>
        <button onClick={() => { setShowForm(true); setSelected(null); }}
          style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
          + New Update / Inquiry
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 18, fontFamily: SERIF, fontSize: 20 }}>New Update / Inquiry to Admin</div>

          {formError && (
            <div style={{ background: C.errorBg, color: C.error, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, border: `1px solid #FECACA` }}>{formError}</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary…"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, outline: "none", color: C.navy, boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, outline: "none", color: C.navy, background: C.white, boxSizing: "border-box" }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Related Case (optional)</label>
              <select value={appId} onChange={e => setAppId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, outline: "none", color: C.navy, background: C.white, boxSizing: "border-box" }}>
                <option value="">— None —</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{(c.profiles?.full_name || c.profiles?.email || c.id.slice(0,8))} ({c.country || "UAE"})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              placeholder="Describe the update or inquiry in detail…"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, outline: "none", color: C.navy, resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .6 : 1, fontFamily: SANS }}>
              {submitting ? "Sending…" : "Send to Admin"}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(null); }}
              style={{ background: C.offWhite, border: `1px solid ${C.border}`, color: C.navy, borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ticket list + detail */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: 16 }}>
        {/* Ticket list */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
              <div style={{ color: C.muted, fontSize: 14 }}>No updates sent yet.</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Use the button above to send your first update or inquiry to admin.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </div>
              {tickets.map(t => (
                <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
                  style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selected === t.id ? "#EEF2FF" : "transparent", borderLeft: selected === t.id ? "3px solid #5B21B6" : "3px solid transparent", transition: "background .15s" }}
                  onMouseEnter={e => { if (selected !== t.id) e.currentTarget.style.background = C.offWhite; }}
                  onMouseLeave={e => { if (selected !== t.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.subject}</div>
                    <Badge val={t.status} metaMap={STATUS_META} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge val={t.priority} metaMap={PRIORITY_META} />
                    <span style={{ fontSize: 11, color: C.muted }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Ticket detail panel */}
        {ticketById && (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{ticketById.subject}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge val={ticketById.status} metaMap={STATUS_META} />
                  <Badge val={ticketById.priority} metaMap={PRIORITY_META} />
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted, padding: 4 }}>✕</button>
            </div>

            {/* Your message */}
            <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Your Message</div>
            <div style={{ padding: "14px", background: C.offWhite, borderRadius: 12, marginBottom: 20, fontSize: 14, color: C.navy, lineHeight: 1.7, border: `1px solid ${C.border}` }}>
              {ticketById.message}
            </div>

            {/* Admin reply — show if present */}
            {ticketById.admin_reply ? (
              <div style={{ marginBottom: 20, background: "#EDE9FE", borderRadius: 12, padding: "14px 16px", border: "1px solid #C4B5FD" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5B21B6", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  🛡 Admin Reply
                  {ticketById.admin_replied_at && (
                    <span style={{ fontWeight: 400, color: "#7C3AED" }}>· {new Date(ticketById.admin_replied_at).toLocaleString()}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: "#3B0764", lineHeight: 1.7 }}>{ticketById.admin_reply}</div>
              </div>
            ) : (
              <div style={{ marginBottom: 20, background: C.offWhite, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.muted, border: `1px dashed ${C.border}` }}>
                No reply from admin yet.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Ticket ID", ticketById.id.slice(0, 8)],
                ["Created", new Date(ticketById.created_at).toLocaleString()],
                ["Last Updated", new Date(ticketById.updated_at || ticketById.created_at).toLocaleString()],
                ["Related Case", ticketById.application_id ? ticketById.application_id.slice(0, 8) : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{v}</div>
                </div>
              ))}
            </div>

            {ticketById.status === "resolved" && (
              <div style={{ marginTop: 18, background: C.successBg, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", border: `1px solid #A7F3D0` }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div style={{ fontSize: 14, color: C.success, fontWeight: 600 }}>This ticket has been resolved by the admin.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
