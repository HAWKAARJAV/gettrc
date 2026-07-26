import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EmptyState from "../../components/EmptyState";
import SkeletonCard from "../../components/SkeletonCard";
import { RETAIL_THEME } from "../../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

// ── Data helpers ──────────────────────────────────────────────────────────────
// Mirrors src/retail/pages/RetailChatPage.jsx's data layer exactly, except
// messages sent from this workspace are tagged sender_role: "corporate".

async function fetchMessages(appId) {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("application_id", appId)
    .order("created_at", { ascending: true });
  return data || [];
}

async function sendMessage(appId, userId, text) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      application_id: appId,
      sender_id:      userId,
      sender_role:    "corporate",
      message:        text.trim(),
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function markAdvisorMessagesRead(appId, userId) {
  // Mark messages sent by the advisor (not by this corporate user) as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("application_id", appId)
    .neq("sender_id", userId)
    .eq("is_read", false);
}

async function fetchAssignedAdvisor(advisorId) {
  if (!advisorId) return null;
  try {
    const { data } = await supabase
      .from("advisors")
      .select("*")
      .eq("user_id", advisorId)
      .maybeSingle();
    if (data) return data;
  } catch {
    // fall through to profiles lookup below
  }
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", advisorId)
      .maybeSingle();
    return data ? { name: data.full_name || data.email } : null;
  } catch {
    return null;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, advisorName }) {
  return (
    <div style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "70%",
        padding: "10px 14px",
        borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isOwn
          ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`
          : "var(--c-surface)",
        color: isOwn ? "var(--c-surface)" : "var(--c-text)",
        fontSize: 14, lineHeight: 1.55,
        boxShadow: "0 1px 6px rgba(0,0,0,.08)",
        border: isOwn ? "none" : `1px solid ${"var(--c-border)"}`,
      }}>
        <div>{msg.message}</div>
        <div style={{ fontSize: 10, color: isOwn ? "rgba(255,255,255,.65)" : "var(--c-text-muted)", marginTop: 5, textAlign: "right" }}>
          {isOwn ? "You" : advisorName}
          {" · "}{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

function LockedState({ label, message }) {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: "var(--c-text)", marginBottom: 10 }}>{label}</h2>
      <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>{message}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CorporateChatPage() {
  const { workspace } = useOutletContext();
  const userId = workspace?.profile?.id || workspace?.session?.user?.id;
  const appId  = workspace?.application?.id;
  const advisorId = workspace?.application?.advisor_id;

  const [advisor, setAdvisor]   = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);

  const advisorName = advisor?.name || workspace?.application?.assigned_manager || "Your Compliance Manager";

  useEffect(() => {
    let mounted = true;
    setAdvisorLoading(true);
    fetchAssignedAdvisor(advisorId)
      .then((a) => { if (mounted) setAdvisor(a); })
      .finally(() => { if (mounted) setAdvisorLoading(false); });
    return () => { mounted = false; };
  }, [advisorId]);

  const load = async () => {
    if (!appId || !userId) return;
    const msgs = await fetchMessages(appId);
    setMessages(msgs);
    await markAdvisorMessagesRead(appId, userId);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    load().finally(() => setLoading(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(load, 6_000);
    return () => clearInterval(pollRef.current);
  }, [appId, userId]); // eslint-disable-line

  const handleSend = async () => {
    if (!text.trim() || !appId || !userId) return;
    setSending(true);
    try {
      const msg = await sendMessage(appId, userId, text);
      if (msg) setMessages(prev => [...prev, msg]);
      setText("");
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    } catch (e) {
      console.error("Send message failed:", e);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!appId) {
    return (
      <LockedState
        label="Chat Locked"
        message="Your direct chat with the assigned advisor will be available once your workspace is unlocked after payment confirmation."
      />
    );
  }

  if (!advisorLoading && !advisorId) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
          <EmptyState
            title="No advisor assigned yet"
            message="A compliance manager will be assigned to your company shortly. You'll be able to message them directly here once assigned."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: SANS }}>
      {/* Advisor info card */}
      <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, #1A3570)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, flexShrink: 0 }}>
          ⚖
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "var(--c-text)" }}>{advisorLoading ? "Loading…" : advisorName}</div>
          <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 1 }}>
            {advisor?.specialties?.length ? advisor.specialties.join(", ") : "Compliance Manager"} · TRC Advisor
          </div>
        </div>
        <div style={{ background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".04em" }}>
          ● Active
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 260px)", minHeight: 420, background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden" }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", background: "var(--c-bg)" }}>
          {loading ? (
            <div style={{ padding: 12 }}>
              <SkeletonCard height={120} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ paddingTop: 12 }}>
              <EmptyState
                title="No messages yet"
                message="Your advisor will reach out once they start work on your application. You can also send them a message below."
                cta={{ label: "Send a message", onClick: () => { inputRef.current?.focus(); } }}
              />
            </div>
          ) : (
            messages.map(m => (
              <Bubble key={m.id} msg={m} isOwn={m.sender_id === userId} advisorName={advisorName} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${"var(--c-border)"}`, display: "flex", gap: 10, alignItems: "flex-end", background: "var(--c-surface)" }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message your advisor… (Enter to send, Shift+Enter for new line)"
            rows={2}
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 12,
              border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS,
              fontSize: 14, resize: "none", outline: "none", color: "var(--c-text)",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            style={{
              padding: "11px 20px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
              fontFamily: SANS, flexShrink: 0,
              cursor: sending || !text.trim() ? "not-allowed" : "pointer",
              opacity: sending || !text.trim() ? 0.5 : 1,
            }}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
