import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { RETAIL_THEME } from "../../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS  = RETAIL_THEME.fonts.sans;

// ── Data helpers ──────────────────────────────────────────────────────────────

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
      sender_role:    "retail",
      message:        text.trim(),
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function markAdvisorMessagesRead(appId, userId) {
  // Mark messages sent by the advisor (not by this retail user) as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("application_id", appId)
    .neq("sender_id", userId)
    .eq("is_read", false);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }) {
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
          {isOwn ? "You" : "Advisor"}
          {" · "}{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Locked / no-app placeholder ───────────────────────────────────────────────

function LockedState({ label }) {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: "var(--c-text)", marginBottom: 10 }}>{label}</h2>
      <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>
        Your direct chat with the assigned advisor will be available once your workspace is unlocked after payment confirmation.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RetailChatPage() {
  const { workspace } = useOutletContext();
  const userId = workspace?.profile?.id || workspace?.session?.user?.id;
  const appId  = workspace?.application?.id;

  // Derive advisor display name from application metadata
  const advisorName = workspace?.application?.assigned_manager
    || workspace?.advisor?.name
    || "Your Advisor";

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);

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

  if (!appId) return <LockedState label="Chat Locked" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, overflow: "hidden", fontFamily: SANS }}>

      {/* Header */}
      <div style={{ padding: "16px 22px", borderBottom: `1px solid ${"var(--c-border)"}`, display: "flex", alignItems: "center", gap: 14, background: "var(--c-bg)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, #1A3570)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, flexShrink: 0 }}>
          ⚖
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "var(--c-text)" }}>{advisorName}</div>
          <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 1 }}>
            TRC Advisor · Messages update every 6 seconds
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".04em" }}>
            ● Active
          </div>
        </div>
      </div>

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
              cta={{ label: 'Send a message', onClick: () => { inputRef.current?.focus(); } }}
            />
          </div>
        ) : (
          messages.map(m => (
            <Bubble key={m.id} msg={m} isOwn={m.sender_id === userId} />
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
  );
}
