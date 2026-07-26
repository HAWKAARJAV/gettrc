// AdminResourcesTab.jsx — Admin editor for the homepage "Resources" cards
// ("Everything you need before you apply"). List, add, edit, reorder, delete.
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabaseClient";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  navy: "#0F2557", navyLight: "#1A3570", gold: "#C9A84C", goldDark: "#A07C2E",
  white: "#FFFFFF", offWhite: "#F7F8FC", text: "#1E293B", muted: "#64748B",
  border: "#E2E8F0", success: "#10B981", error: "#EF4444",
};

const ACTION_TYPES = [
  { value: "scroll", label: "Scroll to section", hint: "e.g. for-who, workflow, about, resources" },
  { value: "path", label: "Internal page", hint: "e.g. /blog, /check-eligibility" },
  { value: "url", label: "External link", hint: "e.g. https://example.com/guide.pdf" },
];

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: type === "error" ? C.error : C.success, color: C.white, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.2)" }}>
      {type === "error" ? "❌" : "✅"} {msg}
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "32px 36px", maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🗑️</p>
        <h3 style={{ color: C.navy, fontFamily: "'Cormorant Garamond',serif", fontSize: 22, marginBottom: 8 }}>Delete Card?</h3>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "10px 22px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "10px 22px", borderRadius: 8, background: C.error, color: C.white, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { title: "", description: "", action_label: "Learn more", action_type: "scroll", action_value: "", is_active: true };

function CardForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const actionMeta = ACTION_TYPES.find(a => a.value === form.action_type) || ACTION_TYPES[0];

  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Title *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. UAE Filing Guide"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", color: C.navy, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description *</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="One or two sentences shown on the card."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", color: C.navy, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Button Label *</label>
            <input value={form.action_label} onChange={e => set("action_label", e.target.value)} placeholder="e.g. Read Guide"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", color: C.navy, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Button Links To</label>
            <select value={form.action_type} onChange={e => set("action_type", e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", color: C.navy, background: C.white, boxSizing: "border-box" }}>
              {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>
            Target ({actionMeta.hint})
          </label>
          <input value={form.action_value} onChange={e => set("action_value", e.target.value)} placeholder={actionMeta.hint}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", color: C.navy, boxSizing: "border-box" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.navy, cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
          Visible on homepage
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => onSave(form)} disabled={saving || !form.title.trim() || !form.description.trim() || !form.action_value.trim()}
          style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1 }}>
          {saving ? "Saving…" : "Save Card"}
        </button>
        <button onClick={onCancel} style={{ background: C.offWhite, border: `1px solid ${C.border}`, color: C.navy, borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminResourcesTab() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | card object
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from("homepage_resources").select("*").order("sort_order", { ascending: true });
    if (error) notify(error.message, "error");
    setCards(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing === "new") {
        const nextOrder = cards.length ? Math.max(...cards.map(c => c.sort_order || 0)) + 1 : 1;
        const { error } = await sb.from("homepage_resources").insert({ ...form, sort_order: nextOrder });
        if (error) throw error;
        notify("Card added");
      } else {
        const { error } = await sb.from("homepage_resources").update(form).eq("id", editing.id);
        if (error) throw error;
        notify("Card updated");
      }
      setEditing(null);
      await load();
    } catch (e) {
      notify(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await sb.from("homepage_resources").delete().eq("id", deleteTarget.id);
    if (error) notify(error.message, "error");
    else notify("Card deleted");
    setDeleteTarget(null);
    await load();
  };

  const move = async (card, dir) => {
    const idx = cards.findIndex(c => c.id === card.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cards.length) return;
    const other = cards[swapIdx];
    const [a, b] = [card.sort_order, other.sort_order];
    await Promise.all([
      sb.from("homepage_resources").update({ sort_order: b }).eq("id", card.id),
      sb.from("homepage_resources").update({ sort_order: a }).eq("id", other.id),
    ]);
    await load();
  };

  const toggleActive = async (card) => {
    await sb.from("homepage_resources").update({ is_active: !card.is_active }).eq("id", card.id);
    await load();
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Toast msg={toast?.msg} type={toast?.type} />
      {deleteTarget && (
        <ConfirmDialog message={`Delete "${deleteTarget.title}"? This can't be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy }}>Homepage Resources</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Edits the "Everything you need before you apply" cards on the homepage — no code change needed.
          </p>
        </div>
        {editing === null && (
          <button onClick={() => setEditing("new")}
            style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + New Card
          </button>
        )}
      </div>

      {editing !== null && (
        <CardForm
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading…</div>
      ) : cards.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗂️</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No cards yet. Add one to populate the homepage Resources section.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {cards.map((card, i) => (
            <div key={card.id} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, opacity: card.is_active ? 1 : 0.55 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => move(card, -1)} disabled={i === 0} title="Move up"
                  style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? C.border : C.navy, fontSize: 14 }}>▲</button>
                <button onClick={() => move(card, 1)} disabled={i === cards.length - 1} title="Move down"
                  style={{ background: "none", border: "none", cursor: i === cards.length - 1 ? "default" : "pointer", color: i === cards.length - 1 ? C.border : C.navy, fontSize: 14 }}>▼</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{card.title}</span>
                  {!card.is_active && <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.offWhite, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>Hidden</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.description}</div>
                <div style={{ fontSize: 11, color: C.gold, marginTop: 4, fontWeight: 700 }}>{card.action_label} → [{card.action_type}] {card.action_value}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggleActive(card)} title={card.is_active ? "Hide from homepage" : "Show on homepage"}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.offWhite, color: C.navy, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {card.is_active ? "Hide" : "Show"}
                </button>
                <button onClick={() => setEditing(card)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.offWhite, color: C.navy, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(card)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid #FECACA`, background: "#FEF2F2", color: C.error, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
