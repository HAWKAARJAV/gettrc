import { useEffect, useRef, useState } from "react";
import { useOutletContext, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';

const C = {
  navy:"#0F2557", navyLight:"#1A3570", gold:"#C9A84C",
  white:"#fff", offWhite:"#F7F8FC", muted:"#6B7A99", border:"#E2E8F0",
  purple:"#5B21B6",
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";
const ADMIN_THREAD = "__admin__";

// ── Data helpers ─────────────────────────────────────────────
async function fetchClientMessages(applicationId) {
  const { data } = await supabase.from("messages").select("*")
    .eq("application_id", applicationId).order("created_at", { ascending: true });
  return data || [];
}
async function sendClientMessage(applicationId, senderId, text) {
  const { data, error } = await supabase.from("messages")
    .insert({ application_id: applicationId, sender_id: senderId, sender_role: "advisor", message: text.trim() })
    .select("*").maybeSingle();
  if (error) throw error;
  return data;
}
async function markClientRead(applicationId, advisorId) {
  await supabase.from("messages").update({ is_read: true })
    .eq("application_id", applicationId).neq("sender_id", advisorId);
}
async function fetchAdminMessages(advisorId) {
  const { data } = await supabase.from("admin_advisor_messages").select("*")
    .eq("advisor_id", advisorId).order("created_at", { ascending: true });
  return data || [];
}
async function sendAdminMessage(advisorId, senderId, text) {
  const { data, error } = await supabase.from("admin_advisor_messages")
    .insert({ advisor_id: advisorId, sender_id: senderId, sender_role: "advisor", message: text.trim() })
    .select("*").maybeSingle();
  if (error) throw error;
  return data;
}
async function markAdminRead(advisorId) {
  await supabase.from("admin_advisor_messages").update({ is_read: true })
    .eq("advisor_id", advisorId).eq("sender_role", "admin");
}

// ── Sub-components ────────────────────────────────────────────
function ThreadItem({ label, sub, selected, onClick, unread, isAdmin }) {
  return (
    <div onClick={onClick}
      style={{ padding:"12px 16px", cursor:"pointer", transition:"background .15s",
        background: selected ? (isAdmin ? "#EDE9FE" : "#EEF2FF") : "transparent",
        borderLeft: selected ? `3px solid ${isAdmin ? C.purple : "#4F46E5"}` : "3px solid transparent" }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "var(--c-bg)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <div style={{ fontWeight:700, fontSize:13, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6 }}>
          {isAdmin && <span>🛡</span>}{label}
        </div>
        {unread > 0 && (
          <span style={{ background:"#EF4444", color:"#fff", fontSize:10, fontWeight:800, minWidth:18, height:18, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", flexShrink:0 }}>
            {unread}
          </span>
        )}
      </div>
      <div style={{ fontSize:11, color:"var(--c-text-muted)", marginTop:2 }}>{sub}</div>
    </div>
  );
}

function Bubble({ msg, isOwn }) {
  return (
    <div style={{ display:"flex", justifyContent:isOwn?"flex-end":"flex-start", marginBottom:10 }}>
      <div style={{ maxWidth:"72%", padding:"10px 14px",
        borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isOwn ? `linear-gradient(135deg,${C.navy},${C.navyLight})` : "var(--c-surface)",
        color: isOwn ? "#fff" : "var(--c-text)", fontSize:14, lineHeight:1.55,
        boxShadow:"0 1px 6px rgba(0,0,0,.08)", border:isOwn?"none":`1px solid ${"var(--c-border)"}` }}>
        {msg.message}
        <div style={{ fontSize:10, color:isOwn?"rgba(255,255,255,.6)":"var(--c-text-muted)", marginTop:5, textAlign:"right" }}>
          {isOwn ? "You" : (msg.sender_role === "admin" ? "Admin" : msg.sender_role)}
          {" · "}{new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdvisorChatPage() {
  const { workspace, refresh } = useOutletContext();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cases, session } = workspace;
  const advisorId = session?.user?.id;

  const initThread = params.get("app") === "admin" ? ADMIN_THREAD : (params.get("app") || ADMIN_THREAD);
  const [selectedThread, setSelectedThread] = useState(initThread);
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState("");
  const [loadingMsg, setLoadingMsg]   = useState(false);
  const [sending, setSending]         = useState(false);
  const [adminUnread, setAdminUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef   = useRef(null);
  const isAdmin   = selectedThread === ADMIN_THREAD;

  const loadMessages = async (thread) => {
    if (!thread || !advisorId) return;
    if (thread === ADMIN_THREAD) {
      const msgs = await fetchAdminMessages(advisorId);
      setMessages(msgs);
      await markAdminRead(advisorId);
      setAdminUnread(0);
    } else {
      const msgs = await fetchClientMessages(thread);
      const hadUnread = msgs.some(m => m.sender_id !== advisorId && !m.is_read);
      setMessages(msgs);
      await markClientRead(thread, advisorId);
      // The sidebar badge and per-case unread counts come from the workspace
      // (fetched once on load, polled every 20s) — reading a thread here
      // doesn't touch that cache on its own, so the badge would otherwise
      // stay stale until the next poll. Refresh it immediately, silently.
      if (hadUnread) refresh?.(true);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
  };

  const checkAdminUnread = async () => {
    if (!advisorId || selectedThread === ADMIN_THREAD) return;
    const { count } = await supabase.from("admin_advisor_messages")
      .select("id", { count:"exact", head:true })
      .eq("advisor_id", advisorId).eq("sender_role","admin").eq("is_read",false);
    setAdminUnread(count || 0);
  };

  useEffect(() => {
    if (!advisorId) return;
    setLoadingMsg(true);
    loadMessages(selectedThread).finally(() => setLoadingMsg(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadMessages(selectedThread);
      checkAdminUnread();
    }, 6_000);
    return () => clearInterval(pollRef.current);
  }, [selectedThread, advisorId]); // eslint-disable-line

  useEffect(() => { if (advisorId) checkAdminUnread(); }, [advisorId]); // eslint-disable-line

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const msg = isAdmin
        ? await sendAdminMessage(advisorId, advisorId, text)
        : await sendClientMessage(selectedThread, advisorId, text);
      setMessages(prev => [...prev, msg]);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch(e) { console.error(e); }
    finally { setSending(false); }
  };

  const switchThread = (thread) => {
    setSelectedThread(thread);
    navigate(thread === ADMIN_THREAD ? "/advisor/chat?app=admin" : `/advisor/chat?app=${thread}`, { replace:true });
  };

  const currentCase = cases.find(c => c.id === selectedThread);
  const client = currentCase?.profiles || {};

  return (
    <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", height:"calc(100vh - 90px)", background:"var(--c-surface)", borderRadius:18, border:`1px solid ${"var(--c-border)"}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(15,37,87,.05)", fontFamily:SANS }}>

      {/* ── Sidebar ── */}
      <div style={{ borderRight:`1px solid ${"var(--c-border)"}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${"var(--c-border)"}`, fontFamily:SERIF, fontSize:18, fontWeight:700, color:"var(--c-text)" }}>
          Conversations
        </div>

        {/* Admin thread — always pinned first */}
        <ThreadItem label="TRC Admin" sub="Direct admin support" isAdmin
          selected={selectedThread === ADMIN_THREAD} unread={adminUnread}
          onClick={() => switchThread(ADMIN_THREAD)} />

        <div style={{ padding:"5px 16px 4px", fontSize:10, fontWeight:700, color:"var(--c-text-muted)", textTransform:"uppercase", letterSpacing:".1em", background:"var(--c-bg)", borderTop:`1px solid ${"var(--c-border)"}`, borderBottom:`1px solid ${"var(--c-border)"}` }}>
          Client Cases
        </div>

        {cases.length === 0 && (
          <div style={{ padding: 12 }}>
            <EmptyState
              title="No assigned cases"
              message="You currently have no cases assigned. Assigned cases will appear here when the admin allocates work to you."
              cta={{ label: 'Contact admin', onClick: () => navigate('/advisor/chat?app=admin') }}
            />
          </div>
        )}
        {cases.map(app => {
          const c = app.profiles || {};
          return (
            <ThreadItem key={app.id}
              label={c.full_name || c.email || app.id.slice(0,8)}
              sub={`${app.country||"UAE"} \xB7 ${app.application_type||"TRC"}`}
              selected={selectedThread === app.id} unread={selectedThread === app.id ? 0 : (app.unreadMessages || 0)}
              onClick={() => switchThread(app.id)} />
          );
        })}
      </div>

      {/* ── Chat window ── */}
      <div style={{ display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${"var(--c-border)"}`, display:"flex", alignItems:"center", gap:12 }}>
          {isAdmin ? (
            <>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${C.purple},#7C3AED)`, color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>🛡</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--c-text)" }}>TRC Admin</div>
                <div style={{ fontSize:11, color:"var(--c-text-muted)" }}>Direct line to the TRC Connect team</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, color:"#fff", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {(client.full_name||"C").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--c-text)" }}>{client.full_name||client.email||"Client"}</div>
                <div style={{ fontSize:11, color:"var(--c-text-muted)" }}>{currentCase?.country||"UAE"} \xB7 {currentCase?.application_type||"TRC"}</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <button onClick={() => navigate(`/advisor/cases/${selectedThread}`)}
                  style={{ padding:"6px 12px", borderRadius:8, background:"var(--c-bg)", border:`1px solid ${"var(--c-border)"}`, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:SANS, color:"var(--c-text)" }}>
                  View Case →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 20px", background:"var(--c-bg)" }}>
          {loadingMsg ? (
            <div style={{ padding: 12 }}>
              <SkeletonCard height={160} />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              title={isAdmin ? "No admin messages" : "No active conversations"}
              message={isAdmin ? "No direct admin messages. Use this thread to contact operations for escalations." : "There are no active client conversations. Conversations will appear here when clients message or when assigned cases require follow-up."}
              cta={{ label: 'Send a message', onClick: () => { inputRef.current?.focus(); } }}
            />
          ) : (
            messages.map(m => <Bubble key={m.id} msg={m} isOwn={m.sender_id === advisorId} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${"var(--c-border)"}`, display:"flex", gap:10, alignItems:"flex-end" }}>
          <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();} }}
            placeholder={isAdmin ? "Message TRC Admin… (Enter to send)" : "Message client… (Enter to send)"}
            rows={2}
            style={{ flex:1, padding:"11px 14px", borderRadius:12, border:`1.5px solid ${"var(--c-border)"}`, fontFamily:SANS, fontSize:14, resize:"none", outline:"none", color:"var(--c-text)" }} />
          <button onClick={handleSend} disabled={sending||!text.trim()}
            style={{ padding:"11px 18px", borderRadius:12, color:"#fff", border:"none", fontWeight:700, fontSize:14, fontFamily:SANS, flexShrink:0,
              background: isAdmin ? `linear-gradient(135deg,${C.purple},#7C3AED)` : `linear-gradient(135deg,${C.navy},${C.navyLight})`,
              cursor: sending||!text.trim() ? "not-allowed" : "pointer",
              opacity: sending||!text.trim() ? 0.5 : 1 }}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
