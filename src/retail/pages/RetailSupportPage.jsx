import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EmptyState from '../../components/EmptyState';
import { supabase } from "../../supabaseClient";
import { RETAIL_THEME } from "../../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

const STATUS_META = {
  open:        { label: "Open",        bg: "#FFFBEB", color: "#D97706" },
  in_progress: { label: "In Progress", bg: "#F5F3FF", color: "#5B21B6" },
  resolved:    { label: "Resolved",    bg: "#ECFDF5", color: "#059669" },
  closed:      { label: "Closed",      bg: "#F3F4F6", color: "#6B7280" },
};

const PRIORITY_META = {
  low:    { label: "Low",    bg: "#F3F4F6", color: "#6B7280" },
  medium: { label: "Medium", bg: "#FFFBEB", color: "#D97706" },
  high:   { label: "High",   bg: "#FEF2F2", color: "#DC2626" },
};

function Badge({ val, metaMap }) {
  const m = metaMap[val] || { label: val || "—", bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span style={{
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
      textTransform: "uppercase", letterSpacing: ".04em",
    }}>{m.label}</span>
  );
}

async function fetchTickets(userId) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createTicket({ userId, applicationId, subject, message, priority }) {
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id:        userId,
      application_id: applicationId || null,
      subject:        subject.trim(),
      message:        message.trim(),
      priority,
      status:         "open",
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default function RetailSupportPage() {
  const ctx = useOutletContext();
  const workspace = ctx?.workspace;
  const userId    = workspace?.profile?.id || workspace?.session?.user?.id;
  const appId     = workspace?.application?.id || null;

  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState(null);
  const pollRef = useRef(null);

  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [priority, setPriority] = useState("medium");

  const load = async () => {
    if (!userId) return;
    try {
      const data = await fetchTickets(userId);
      setTickets(data);
    } catch (e) {
      console.warn("Ticket fetch:", e.message);
    }
  };

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    load().finally(() => setLoading(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(load, 15_000);
    return () => clearInterval(pollRef.current);
  }, [userId]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setFormError("Subject and message are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const ticket = await createTicket({ userId, applicationId: appId, subject, message, priority });
      setTickets(prev => [ticket, ...prev]);
      setShowForm(false);
      setSubject(""); setMessage(""); setPriority("medium");
    } catch (e) {
      setFormError(e.message || "Failed to send ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const ticketById = selected ? tickets.find(t => t.id === selected) : null;

  const INPUT = {
    width: "100%", padding: "11px 14px", borderRadius: RETAIL_THEME.radius.sm,
    border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14,
    outline: "none", color: "var(--c-text)", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gap: 18, fontFamily: SANS }}>

      {/* Header card */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Need help with your UAE TRC process?</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 32, color: "var(--c-text)", marginBottom: 10 }}>Support Center</h2>
        <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>
          Get help with your eligibility status, documents, or billing. Track your tickets and admin replies here.
        </p>
      </div>

      {/* Quick contact cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
        <a href="https://wa.me/971000000000" target="_blank" rel="noreferrer"
          style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 22, textDecoration: "none", color: "var(--c-text)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>WhatsApp support</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Chat with the TRC team</div>
          <div style={{ color: "var(--c-text-muted)", fontSize: 13, lineHeight: 1.7 }}>Fast follow-up for active applicants and payment confirmation.</div>
        </a>
        <a href="mailto:support@gettrc.com"
          style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 22, textDecoration: "none", color: "var(--c-text)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Email support</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>support@gettrc.com</div>
          <div style={{ color: "var(--c-text-muted)", fontSize: 13, lineHeight: 1.7 }}>Send your question and include your registered email address.</div>
        </a>
      </div>

      {/* FAQs */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 12 }}>FAQs</div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            ["How long does review take?",  "Usually 24 to 48 hours for the first manual eligibility pass."],
            ["Why is the workspace locked?", "The TRC process is gated until eligibility and payment are confirmed."],
            ["Can I update my details?",    "Yes, your profile contact details can be updated from the Profile page."],
          ].map(([q, a]) => (
            <div key={q} style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 5 }}>{q}</div>
              <div style={{ fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tickets section */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>Support Tickets</div>
            <div style={{ color: "var(--c-text-muted)", fontSize: 13 }}>Submit an inquiry and track admin replies.</div>
          </div>
          <button onClick={() => { setShowForm(true); setSelected(null); }}
            style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
            + Raise a Ticket
          </button>
        </div>

        {/* New ticket form */}
        {showForm && (
          <div style={{ background: "var(--c-bg)", borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${"var(--c-border)"}`, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "var(--c-text)", marginBottom: 16 }}>New Support Ticket</div>

            {formError && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, border: "1px solid #FECACA" }}>{formError}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary…" style={INPUT} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}
                  style={{ ...INPUT, background: "var(--c-surface)" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Message *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Describe what you need help with…"
                style={{ ...INPUT, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ background: `linear-gradient(135deg, ${C.navy}, #1A3570)`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .6 : 1, fontFamily: SANS }}>
                {submitting ? "Sending…" : "Submit Ticket"}
              </button>
              <button onClick={() => { setShowForm(false); setFormError(null); }}
                style={{ background: "var(--c-surface)", border: `1px solid ${"var(--c-border)"}`, color: "var(--c-text)", borderRadius: RETAIL_THEME.radius.sm, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Ticket list + detail split */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--c-text-muted)", fontSize: 13 }}>Loading tickets…</div>
        ) : tickets.length === 0 && !showForm ? (
          <EmptyState
            title="No support tickets yet"
            message="Need help with your TRC process? Start a conversation with our team and we'll get back to you." 
            cta={{ label: 'Raise a ticket', onClick: () => { setShowForm(true); setSelected(null); } }}
          />
        ) : tickets.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: ticketById ? "320px 1fr" : "1fr", gap: 16 }}>
            {/* List */}
            <div style={{ border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${"var(--c-border)"}`, fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </div>
              {tickets.map(t => (
                <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
                  style={{ padding: "14px 16px", borderBottom: `1px solid ${"var(--c-border)"}`, cursor: "pointer", background: selected === t.id ? "#EEF2FF" : "transparent", borderLeft: selected === t.id ? "3px solid #5B21B6" : "3px solid transparent", transition: "background .15s" }}
                  onMouseEnter={e => { if (selected !== t.id) e.currentTarget.style.background = "var(--c-bg)"; }}
                  onMouseLeave={e => { if (selected !== t.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.subject}</div>
                    <Badge val={t.status} metaMap={STATUS_META} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge val={t.priority} metaMap={PRIORITY_META} />
                    <span style={{ fontSize: 11, color: "var(--c-text-muted)" }}>{new Date(t.created_at).toLocaleDateString()}</span>
                    {t.admin_reply && <span style={{ fontSize: 11, color: "#5B21B6", fontWeight: 700 }}>• Reply received</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail */}
            {ticketById && (
              <div style={{ border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>{ticketById.subject}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge val={ticketById.status}   metaMap={STATUS_META} />
                      <Badge val={ticketById.priority} metaMap={PRIORITY_META} />
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--c-text-muted)", padding: 4 }}>✕</button>
                </div>

                <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Your Message</div>
                <div style={{ padding: 14, background: "var(--c-bg)", borderRadius: 10, marginBottom: 18, fontSize: 14, color: "var(--c-text)", lineHeight: 1.7, border: `1px solid ${"var(--c-border)"}` }}>
                  {ticketById.message}
                </div>

                {ticketById.admin_reply ? (
                  <div style={{ marginBottom: 18, background: "#EDE9FE", borderRadius: 12, padding: "14px 16px", border: "1px solid #C4B5FD" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#5B21B6", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      🛡 Admin Reply
                      {ticketById.admin_replied_at && (
                        <span style={{ fontWeight: 400, color: "#7C3AED" }}>· {new Date(ticketById.admin_replied_at).toLocaleString()}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: "#3B0764", lineHeight: 1.7 }}>{ticketById.admin_reply}</div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 18, background: "var(--c-bg)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--c-text-muted)", border: `1px dashed ${"var(--c-border)"}` }}>
                    No reply from the support team yet.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    ["Ticket ID",    ticketById.id.slice(0, 8)],
                    ["Created",      new Date(ticketById.created_at).toLocaleString()],
                    ["Last Updated", new Date(ticketById.updated_at || ticketById.created_at).toLocaleString()],
                    ["Related Case", ticketById.application_id ? ticketById.application_id.slice(0, 8) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: "10px 0", borderBottom: `1px solid ${"var(--c-border)"}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {ticketById.status === "resolved" && (
                  <div style={{ marginTop: 16, background: "#ECFDF5", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", border: "1px solid #A7F3D0" }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>This ticket has been resolved by the support team.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
