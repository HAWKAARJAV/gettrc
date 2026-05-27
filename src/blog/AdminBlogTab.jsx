// AdminBlogTab.jsx — Admin blog manager: list, create, edit, publish/draft, delete
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../supabaseClient";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  navy:      "#0F2557",
  navyLight: "#1A3570",
  gold:      "#C9A84C",
  goldLight: "#E2C47A",
  goldDark:  "#A07C2E",
  white:     "#FFFFFF",
  offWhite:  "#F7F8FC",
  text:      "#1E293B",
  muted:     "#64748B",
  border:    "#E2E8F0",
  success:   "#10B981",
  error:     "#EF4444",
  sidebar:   "#0D1E45",
};

const CATEGORIES = [
  "TRC Insights", "DTAA Guide", "UAE Expat", "Tax Planning",
  "NRI Corner", "Case Study", "Country Guide", "News & Updates",
];

// ── Utility ───────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readTimeEst(content) {
  const words = (content || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      background: type==="error" ? C.error : C.success,
      color:C.white, padding:"12px 20px", borderRadius:10,
      fontSize:14, fontWeight:600, boxShadow:"0 8px 30px rgba(0,0,0,.2)",
      animation:"slideIn .2s ease",
    }}>
      {type==="error" ? "❌" : "✅"} {msg}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span style={{
      background: status==="published" ? "#D1FAE5" : "#FEF3C7",
      color: status==="published" ? "#065F46" : "#92400E",
      fontSize:11, fontWeight:700, padding:"3px 10px",
      borderRadius:20, textTransform:"uppercase", letterSpacing:".05em",
    }}>
      {status==="published" ? "● Published" : "○ Draft"}
    </span>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:C.white,borderRadius:16,padding:"32px 36px",
        maxWidth:400,width:"90%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <p style={{ fontSize:36,marginBottom:12 }}>🗑️</p>
        <h3 style={{ color:C.navy,fontFamily:"'Cormorant Garamond',serif",fontSize:22,marginBottom:8 }}>Delete Post?</h3>
        <p style={{ color:C.muted,fontSize:14,lineHeight:1.6,marginBottom:24 }}>{message}</p>
        <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
          <button onClick={onCancel} style={{ padding:"10px 22px",borderRadius:8,
            border:`1px solid ${C.border}`,background:C.white,color:C.muted,
            fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"10px 22px",borderRadius:8,
            background:C.error,color:C.white,border:"none",
            fontSize:14,fontWeight:600,cursor:"pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Markdown toolbar ──────────────────────────────────────────────────────────
function MdToolbar({ textareaRef, onChange, content }) {
  const wrap = (before, after="") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const newVal = content.slice(0,start) + before + selected + after + content.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  const tools = [
    { label:"H2",  action:() => wrap("## "), title:"Heading 2" },
    { label:"H3",  action:() => wrap("### "), title:"Heading 3" },
    { label:"B",   action:() => wrap("**","**"), title:"Bold" },
    { label:"I",   action:() => wrap("*","*"), title:"Italic" },
    { label:"`",   action:() => wrap("`","`"), title:"Inline code" },
    { label:"Link",action:() => wrap("[","](url)"), title:"Link" },
    { label:"---", action:() => { const ta = textareaRef.current; if(!ta) return; const pos = ta.selectionStart; onChange(content.slice(0,pos)+"\n\n---\n\n"+content.slice(pos)); }, title:"Divider" },
    { label:"• List", action:() => wrap("- "), title:"List item" },
    { label:"> Quote", action:() => wrap("> "), title:"Blockquote" },
  ];

  return (
    <div style={{ display:"flex",gap:4,flexWrap:"wrap",padding:"8px 10px",
      background:"#F8FAFC",borderRadius:"8px 8px 0 0",border:`1px solid ${C.border}`,
      borderBottom:"none" }}>
      {tools.map(t => (
        <button key={t.label} onClick={t.action} title={t.title}
          style={{ padding:"4px 10px",borderRadius:5,border:`1px solid ${C.border}`,
            background:C.white,color:C.navy,fontSize:12,fontWeight:700,
            cursor:"pointer",fontFamily:"monospace" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Field wrappers ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
      <label style={{ fontSize:13,fontWeight:700,color:C.navy }}>{label}
        {hint && <span style={{ fontSize:12,fontWeight:400,color:C.muted,marginLeft:6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`,
  fontSize:14, fontFamily:"'DM Sans',sans-serif", color:C.text,
  background:C.white, outline:"none", width:"100%",
};

// ── Blog post editor / creator ────────────────────────────────────────────────
function BlogEditor({ initial, onSaved, onCancel }) {
  const isEdit = !!initial?.id;
  const textareaRef = React.useRef(null);

  const [form, setForm] = useState({
    title:           initial?.title           || "",
    slug:            initial?.slug            || "",
    excerpt:         initial?.excerpt         || "",
    content:         initial?.content         || "",
    category:        initial?.category        || "TRC Insights",
    tags:            (initial?.tags || []).join(", "),
    author_name:     initial?.author_name     || "TRC Connect Team",
    seo_title:       initial?.seo_title       || "",
    seo_description: initial?.seo_description || "",
    cover_image_url: initial?.cover_image_url || "",
    status:          initial?.status          || "draft",
  });

  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auto-generate slug from title (only when creating)
  useEffect(() => {
    if (!isEdit && form.title) setForm(f => ({ ...f, slug: slugify(f.title) }));
  }, [form.title, isEdit]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (statusOverride) => {
    const status = statusOverride || form.status;
    if (!form.title.trim()) { showToast("Title is required", "error"); return; }
    if (!form.slug.trim())  { showToast("Slug is required", "error"); return; }
    if (!form.content.trim()) { showToast("Content is required", "error"); return; }

    setSaving(true);
    const payload = {
      title:           form.title.trim(),
      slug:            slugify(form.slug),
      excerpt:         form.excerpt.trim() || form.title,
      content:         form.content.trim(),
      category:        form.category,
      tags:            form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      author_name:     form.author_name.trim() || "TRC Connect Team",
      seo_title:       form.seo_title.trim() || form.title,
      seo_description: form.seo_description.trim() || form.excerpt.slice(0,160),
      cover_image_url: form.cover_image_url.trim() || null,
      read_time_minutes: readTimeEst(form.content),
      status,
      published_at:    status==="published" ? (initial?.published_at || new Date().toISOString()) : null,
    };

    let error;
    if (isEdit) {
      ({ error } = await sb.from("blog_posts").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await sb.from("blog_posts").insert(payload));
    }
    setSaving(false);

    if (error) { showToast("Save failed: " + error.message, "error"); return; }
    showToast(status==="published" ? "Published! 🎉" : "Saved as draft");
    setTimeout(() => onSaved(), 600);
  };

  // Quick markdown preview (same renderer as public page)
  const renderMdPreview = (md) => {
    if (!md) return "";
    return md
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/^#{2}\s+(.+)$/gm,'<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:24px;color:#0F2557;margin:1.2em 0 .5em;font-weight:700;">$1</h2>')
      .replace(/^#{3}\s+(.+)$/gm,'<h3 style="font-family:\'Cormorant Garamond\',serif;font-size:20px;color:#0F2557;margin:1em 0 .4em;font-weight:700;">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/`([^`]+)`/g,'<code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
      .replace(/^&gt;\s+(.+)$/gm,'<blockquote style="border-left:4px solid #C9A84C;padding:10px 16px;background:#FFFBF0;margin:1em 0;font-style:italic;color:#5C4A1E;">$1</blockquote>')
      .replace(/^[-*]\s+(.+)$/gm,"<li style='font-size:16px;line-height:1.7;color:#334155;margin-bottom:.3em;'>$1</li>")
      .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid #E2E8F0;margin:1.5em 0;"/>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" style="color:#C9A84C;font-weight:600;">$1</a>')
      .split("\n\n").map(b => {
        b = b.trim(); if (!b) return "";
        if (/^</.test(b)) return b;
        return `<p style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:1em;">${b}</p>`;
      }).join("\n");
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.navy,margin:0 }}>
              {isEdit ? "Edit Post" : "New Blog Post"}
            </h2>
            <p style={{ color:C.muted,fontSize:13,marginTop:4 }}>
              {isEdit ? `Editing: ${initial.title}` : "Write, preview, and publish"}
            </p>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:"9px 18px",borderRadius:8,border:`1px solid ${C.border}`,
                background:C.white,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer" }}>
              ← Back
            </button>
            <button onClick={() => setPreview(p=>!p)}
              style={{ padding:"9px 18px",borderRadius:8,border:`1px solid ${C.border}`,
                background:preview?"#EEF2FF":C.white,color:preview?"#3730A3":C.navy,
                fontSize:13,fontWeight:600,cursor:"pointer" }}>
              {preview ? "✏️ Edit" : "👁 Preview"}
            </button>
            <button onClick={() => handleSave("draft")} disabled={saving}
              style={{ padding:"9px 18px",borderRadius:8,border:`1px solid ${C.border}`,
                background:C.white,color:C.navy,fontSize:13,fontWeight:600,cursor:"pointer",
                opacity:saving?.7:1 }}>
              Save Draft
            </button>
            <button onClick={() => handleSave("published")} disabled={saving}
              style={{ padding:"9px 20px",borderRadius:8,border:"none",
                background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
                color:C.navy,fontSize:13,fontWeight:700,cursor:"pointer",
                boxShadow:"0 2px 8px rgba(201,168,76,.35)",opacity:saving?.7:1 }}>
              {saving ? "Saving…" : isEdit ? "Update & Publish" : "Publish →"}
            </button>
          </div>
        </div>

        {preview ? (
          /* ── PREVIEW ── */
          <div style={{ background:C.white,borderRadius:16,padding:"40px 48px",
            border:`1px solid ${C.border}`,boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
            <div style={{ marginBottom:16 }}>
              <span style={{ background:"rgba(201,168,76,.15)",color:C.goldDark,
                fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20 }}>
                {form.category}
              </span>
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,
              color:C.navy,lineHeight:1.2,marginBottom:16 }}>
              {form.title || "Untitled"}
            </h1>
            <p style={{ fontSize:17,color:C.muted,lineHeight:1.7,marginBottom:32,
              paddingBottom:24,borderBottom:`1px solid ${C.border}` }}>
              {form.excerpt}
            </p>
            <div style={{ fontFamily:"'DM Sans',sans-serif" }}
              dangerouslySetInnerHTML={{ __html: renderMdPreview(form.content) }} />
          </div>
        ) : (
          /* ── EDITOR ── */
          <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
            {/* Row 1: Title + Status */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:16 }}>
              <Field label="Title *">
                <input value={form.title} onChange={set("title")}
                  placeholder="What is a TRC and why do you need one?" style={inputStyle} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={set("status")}
                  style={{ ...inputStyle, width:"auto", minWidth:130 }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
            </div>

            {/* Row 2: Slug + Category */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
              <Field label="URL Slug *" hint="auto-generated from title">
                <input value={form.slug} onChange={set("slug")} style={inputStyle}
                  placeholder="what-is-a-trc" />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={set("category")} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            {/* Excerpt */}
            <Field label="Excerpt *" hint="shown in listing & as meta description">
              <textarea value={form.excerpt} onChange={set("excerpt")} rows={3}
                placeholder="Short summary that hooks the reader…"
                style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
            </Field>

            {/* Content */}
            <Field label="Content (Markdown) *" hint={`~${readTimeEst(form.content)} min read`}>
              <MdToolbar textareaRef={textareaRef} onChange={v => setForm(f=>({...f,content:v}))} content={form.content} />
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={set("content")}
                rows={28}
                placeholder={`## Introduction\n\nWrite your article here using Markdown...\n\n## Section Title\n\nParagraph text, **bold**, *italic*, [links](url)\n\n> Blockquote tip\n\n- List item 1\n- List item 2`}
                style={{ ...inputStyle, resize:"vertical", fontFamily:"'Fira Code',monospace",
                  fontSize:13, lineHeight:1.7, borderRadius:"0 0 8px 8px" }} />
            </Field>

            {/* SEO Section */}
            <div style={{ padding:"20px",background:"#F0FDF4",borderRadius:12,
              border:"1px solid #BBF7D0" }}>
              <p style={{ fontSize:13,fontWeight:700,color:"#065F46",marginBottom:14 }}>
                🔍 SEO Settings
              </p>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <Field label="SEO Title" hint="60 chars max — defaults to post title">
                  <input value={form.seo_title} onChange={set("seo_title")}
                    placeholder={form.title || "SEO-friendly title…"} style={inputStyle}
                    maxLength={70} />
                  <span style={{ fontSize:11,color:form.seo_title.length>60?"#EF4444":C.muted }}>
                    {form.seo_title.length}/60
                  </span>
                </Field>
                <Field label="Meta Description" hint="160 chars max — defaults to excerpt">
                  <textarea value={form.seo_description} onChange={set("seo_description")} rows={2}
                    placeholder={form.excerpt.slice(0,160) || "Meta description for Google search…"}
                    style={{ ...inputStyle, resize:"vertical" }} maxLength={170} />
                  <span style={{ fontSize:11,color:form.seo_description.length>160?"#EF4444":C.muted }}>
                    {form.seo_description.length}/160
                  </span>
                </Field>
              </div>
            </div>

            {/* Author + Tags + Cover */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
              <Field label="Author Name">
                <input value={form.author_name} onChange={set("author_name")} style={inputStyle} />
              </Field>
              <Field label="Tags" hint="comma-separated">
                <input value={form.tags} onChange={set("tags")}
                  placeholder="TRC, DTAA, UAE expat, NRI" style={inputStyle} />
              </Field>
            </div>
            <Field label="Cover Image URL" hint="optional — paste a direct image URL">
              <input value={form.cover_image_url} onChange={set("cover_image_url")}
                placeholder="https://images.unsplash.com/…" style={inputStyle} />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

// ── Blog post list row ────────────────────────────────────────────────────────
function PostRow({ post, onEdit, onToggleStatus, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:"grid", gridTemplateColumns:"1fr auto auto auto",
        alignItems:"center", gap:16, padding:"16px 20px",
        borderBottom:`1px solid ${C.border}`, background:hover?"#FAFBFF":C.white,
        transition:"background .1s",
      }}>
      <div>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
          <StatusBadge status={post.status} />
          <span style={{ fontSize:11,color:C.muted }}>{post.category} · ⏱{post.read_time_minutes}m</span>
        </div>
        <p style={{ fontSize:15,fontWeight:700,color:C.navy,margin:0,lineHeight:1.3 }}>
          {post.title}
        </p>
        <p style={{ fontSize:12,color:C.muted,margin:"3px 0 0" }}>
          /blog/{post.slug} ·{" "}
          {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "Unpublished"}
        </p>
      </div>

      <button onClick={() => onToggleStatus(post)}
        style={{ padding:"7px 14px",borderRadius:7,
          border:`1px solid ${post.status==="published"?"#FCA5A5":"#6EE7B7"}`,
          background:post.status==="published"?"#FEF2F2":"#ECFDF5",
          color:post.status==="published"?"#B91C1C":"#065F46",
          fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>
        {post.status==="published" ? "Unpublish" : "Publish"}
      </button>

      <button onClick={() => onEdit(post)}
        style={{ padding:"7px 16px",borderRadius:7,border:`1px solid ${C.border}`,
          background:C.white,color:C.navy,fontSize:12,fontWeight:700,cursor:"pointer" }}>
        Edit
      </button>

      <button onClick={() => onDelete(post)}
        style={{ padding:"7px 10px",borderRadius:7,border:"none",
          background:"transparent",color:C.error,fontSize:18,cursor:"pointer" }}
        title="Delete">
        🗑
      </button>
    </div>
  );
}

// ── Main tab component ─────────────────────────────────────────────────────────
export default function AdminBlogTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "published" | "draft"

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("blog_posts")
      .select("id,slug,title,excerpt,category,tags,author_name,read_time_minutes,status,published_at,created_at")
      .order("created_at", { ascending:false });
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (post) => {
    const newStatus = post.status==="published" ? "draft" : "published";
    const updates = {
      status: newStatus,
      published_at: newStatus==="published" ? (post.published_at || new Date().toISOString()) : null,
    };
    const { error } = await sb.from("blog_posts").update(updates).eq("id", post.id);
    if (error) { showToast("Update failed: "+error.message, "error"); return; }
    showToast(newStatus==="published" ? "Post published! 🎉" : "Moved to draft");
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await sb.from("blog_posts").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    if (error) { showToast("Delete failed: "+error.message, "error"); return; }
    showToast("Post deleted");
    load();
  };

  const filtered = posts.filter(p =>
    filter==="all" ? true : p.status===filter
  );

  const stats = {
    total:     posts.length,
    published: posts.filter(p=>p.status==="published").length,
    drafts:    posts.filter(p=>p.status==="draft").length,
  };

  if (view==="create" || view==="edit") {
    return (
      <BlogEditor
        initial={editing}
        onSaved={() => { setView("list"); setEditing(null); load(); }}
        onCancel={() => { setView("list"); setEditing(null); }}
      />
    );
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {deleteTarget && (
        <ConfirmDialog
          message={`"${deleteTarget.title}" will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,
            color:C.navy,margin:"0 0 4px" }}>Blog Posts</h2>
          <p style={{ color:C.muted,fontSize:13 }}>
            Manage articles · leads are captured via in-post CTA
          </p>
        </div>
        <button onClick={() => { setEditing(null); setView("create"); }}
          style={{ padding:"10px 22px",borderRadius:10,border:"none",
            background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
            color:C.navy,fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 2px 10px rgba(201,168,76,.3)" }}>
          + New Post
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28 }}>
        {[
          { label:"Total Posts",  value:stats.total,     icon:"📄", color:C.navy },
          { label:"Published",    value:stats.published, icon:"🟢", color:"#065F46" },
          { label:"Drafts",       value:stats.drafts,    icon:"✏️", color:"#92400E" },
        ].map(s => (
          <div key={s.label} style={{ background:C.white,borderRadius:14,padding:"18px 22px",
            border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14 }}>
            <span style={{ fontSize:24 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize:24,fontWeight:700,color:s.color,margin:0 }}>{s.value}</p>
              <p style={{ fontSize:12,color:C.muted,margin:0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:20 }}>
        {["all","published","draft"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:600,
              cursor:"pointer",border:"none",
              background:filter===f ? C.navy : C.white,
              color:filter===f ? C.white : C.muted,
              boxShadow:filter===f ? "0 2px 8px rgba(15,37,87,.2)" : "0 1px 3px rgba(0,0,0,.06)" }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <a href="/blog" target="_blank" rel="noopener noreferrer"
          style={{ marginLeft:"auto",padding:"7px 16px",borderRadius:20,fontSize:12,
            fontWeight:600,color:C.gold,background:"rgba(201,168,76,.1)",
            textDecoration:"none",border:`1px solid rgba(201,168,76,.25)` }}>
          View Blog →
        </a>
      </div>

      {/* Post list */}
      <div style={{ background:C.white,borderRadius:14,border:`1px solid ${C.border}`,
        overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.04)" }}>

        {/* Table header */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr auto auto auto",
          padding:"12px 20px",background:"#F8FAFC",
          borderBottom:`1px solid ${C.border}`,gap:16 }}>
          <span style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Post</span>
          <span style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Status</span>
          <span style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Edit</span>
          <span style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Del</span>
        </div>

        {loading ? (
          <div style={{ padding:"48px",textAlign:"center",color:C.muted }}>Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"56px",textAlign:"center" }}>
            <p style={{ fontSize:36,marginBottom:12 }}>✍️</p>
            <p style={{ color:C.muted,fontSize:15 }}>
              {filter==="all" ? "No posts yet — create your first!" : `No ${filter} posts`}
            </p>
            {filter==="all" && (
              <button onClick={() => { setEditing(null); setView("create"); }}
                style={{ marginTop:16,padding:"10px 22px",borderRadius:8,border:"none",
                  background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
                  color:C.navy,fontSize:14,fontWeight:700,cursor:"pointer" }}>
                Write First Post
              </button>
            )}
          </div>
        ) : (
          filtered.map(p => (
            <PostRow
              key={p.id}
              post={p}
              onEdit={post => { setEditing(post); setView("edit"); }}
              onToggleStatus={handleToggleStatus}
              onDelete={post => setDeleteTarget(post)}
            />
          ))
        )}
      </div>

      {/* SEO tip */}
      <div style={{ marginTop:20,padding:"16px 20px",background:"#EFF6FF",
        borderRadius:10,border:"1px solid #BFDBFE",display:"flex",gap:12,alignItems:"flex-start" }}>
        <span style={{ fontSize:20 }}>💡</span>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:"#1D4ED8",margin:"0 0 2px" }}>SEO Tips for Maximum Organic Traffic</p>
          <p style={{ fontSize:12,color:"#3B82F6",margin:0,lineHeight:1.6 }}>
            Target long-tail keywords like <em>"TRC certificate UAE 2025"</em>, <em>"how to claim DTAA benefit India"</em>, <em>"NRI double taxation exemption"</em>.
            Each post auto-generates canonical URLs, JSON-LD structured data, and Open Graph tags.
            Aim for 1,000+ word posts with H2/H3 sections for best Google ranking.
          </p>
        </div>
      </div>
    </>
  );
}
