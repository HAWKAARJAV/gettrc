// BlogListingPage.jsx — Public blog index, SEO-optimised for organic traffic
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../supabaseClient";
import { useSEO, WEBSITE_JSONLD, breadcrumbJsonLd } from "../seo/useSEO";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  navy:      "#0F2557",
  navyLight: "#1A3570",
  gold:      "#C9A84C",
  goldLight: "#E2C47A",
  // Literal white — text-on-dark only. Backgrounds/cards below are
  // theme-reactive (invert in dark mode via CSS vars in theme/global.css).
  white:     "#FFFFFF",
  offWhite:  "var(--c-surface-2)",
  text:      "var(--c-text)",
  muted:     "var(--c-text-muted)",
  border:    "var(--c-border)",
  card:      "var(--c-surface)",
  surface:   "var(--c-surface)",
};

// ── Category pill ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  "TRC Insights":    { bg: "#EEF2FF", color: "#3730A3" },
  "DTAA Guide":      { bg: "#FEF3C7", color: "#92400E" },
  "UAE Expat":       { bg: "#D1FAE5", color: "#065F46" },
  "Tax Planning":    { bg: "#FCE7F3", color: "#9D174D" },
  "NRI Corner":      { bg: "#E0F2FE", color: "#0369A1" },
  "Case Study":      { bg: "#F3E8FF", color: "#6B21A8" },
};

function CategoryPill({ category }) {
  const style = CATEGORY_COLORS[category] || { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, letterSpacing: ".05em", textTransform: "uppercase",
    }}>
      {category}
    </span>
  );
}

// ── Read-time badge ───────────────────────────────────────────────────────────
function ReadTime({ minutes }) {
  return (
    <span style={{ fontSize: 12, color: C.muted }}>
      ⏱ {minutes} min read
    </span>
  );
}

// ── Regular post card ─────────────────────────────────────────────────────────
function PostCard({ post }) {
  const nav = useNavigate();
  const publishedDate = post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Draft";
  return (
    <article
      onClick={() => nav(`/blog/${post.slug}`)}
      style={{
        background: C.card, borderRadius: 20, cursor: "pointer",
        border: `1px solid ${C.border}`, overflow: "hidden",
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        display: "flex", flexDirection: "column",
        boxShadow: "0 10px 28px rgba(15,37,87,.06)",
        minHeight: "100%",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 38px rgba(15,37,87,.12)"; e.currentTarget.style.borderColor = "rgba(201,168,76,.38)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 28px rgba(15,37,87,.06)"; e.currentTarget.style.borderColor = C.border; }}
    >
      {/* Cover image or gradient placeholder */}
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title} loading="lazy" decoding="async"
          style={{ width:"100%", height:148, objectFit:"cover", display:"block" }} />
      ) : (
        <div style={{
          height:148, background:`linear-gradient(135deg,${C.navy}22,${C.gold}22)`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:32,
        }}>
          📄
        </div>
      )}

      <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
          <CategoryPill category={post.category} />
          <ReadTime minutes={post.read_time_minutes} />
        </div>

        <h3 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: 18, fontWeight: 700, color: C.text,
          lineHeight: 1.25, letterSpacing:"-.01em",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "2.5em",
        }}>
          {post.title}
        </h3>

        <p style={{ fontSize:13, color:C.muted, lineHeight:1.55, flex:1, margin:0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.excerpt}
        </p>

        <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:10,
          borderTop:`1px solid ${C.border}` }}>
          <div style={{
            width:28, height:28, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:700, color:C.navy,
          }}>
            {post.author_name?.[0] || "T"}
          </div>
          <div style={{ minWidth: 0, flex:1 }}>
            <p style={{ fontSize:11, color:C.text, fontWeight:700, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{post.author_name}</p>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{publishedDate}</p>
          </div>
          <p style={{ fontSize:11, color:C.muted, margin:0, whiteSpace:"nowrap" }}>{post.read_time_minutes} min</p>
        </div>
      </div>
    </article>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <div style={{ position:"relative", maxWidth:460 }}>
      <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
        fontSize:16, color:C.muted, pointerEvents:"none" }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search articles…"
        style={{
          width:"100%", padding:"10px 14px 10px 38px",
          border:`1px solid ${C.border}`, borderRadius:12,
          fontSize:14, fontFamily:"inherit", color:C.text,
          background:C.card, outline:"none",
          boxShadow:"0 1px 4px rgba(0,0,0,.06)",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlogListingPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // "" means "All" — show every published post regardless of category.
  const [activeCategory, setActiveCategory] = useState("");

  useSEO({
    title: "TRC & UAE Tax Residency Guides",
    description: "Guides on the UAE Tax Residency Certificate (TRC), Double Taxation Avoidance Agreements, and expat tax planning, written by TRC Connect's advisor network.",
    path: "/blog",
    type: "website",
    jsonLd: [WEBSITE_JSONLD, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])],
  });

  useEffect(() => {
    sb.from("blog_posts")
      .select("id,slug,title,excerpt,cover_image_url,category,tags,author_name,read_time_minutes,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const categories = Array.from(new Set(posts.map(p => p.category))).filter(Boolean);

  useEffect(() => {
    if (activeCategory && categories.length && !categories.includes(activeCategory)) {
      setActiveCategory("");
    }
  }, [categories.join("|"), activeCategory]);

  const filtered = posts.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(circle at top, rgba(201,168,76,.10), transparent 34%), var(--c-bg)`, fontFamily:"'DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; }
      `}</style>

      {/* ── Intro card ── */}
      {/* Top padding compensates for the fixed global site nav (rendered
          once in TRCConnectApp.jsx's AppShell) — this page no longer rolls
          its own header, so it needs clearance instead. */}
      <section style={{ padding:"138px 24px 0" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{
            background:C.card,
            border:`1px solid ${C.border}`,
            borderRadius:18,
            padding:"18px",
            boxShadow:"0 12px 30px rgba(15,37,87,.06)",
          }}>
            <div style={{ display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:14, alignItems:"center" }}>
              <div>
                <span style={{ fontSize:12, fontWeight:700, color:C.gold, textTransform:"uppercase",
                  letterSpacing:".12em", display:"block", marginBottom:10 }}>
                  TRC Insights & Guides
                </span>
                <h1 style={{
                  fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,2.6vw,30px)",
                  fontWeight:700, color:C.text, lineHeight:1.08, marginBottom:8,
                }}>
                  TRC Insights, now in a cleaner card layout.
                </h1>
                <p style={{ fontSize:14, color:C.muted, lineHeight:1.55, maxWidth:620, margin:0 }}>
                  Compact article cards, clearer hierarchy, and no eligibility banner inside the blog surface.
                </p>
              </div>
              <div style={{ justifySelf:"stretch" }}>
                <SearchBar value={search} onChange={setSearch} />
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>
                  <span style={{ background:"#F8FAFC", color:C.muted, border:`1px solid ${C.border}`, padding:"7px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>
                    Card-style posts
                  </span>
                  <span style={{ background:"#F8FAFC", color:C.muted, border:`1px solid ${C.border}`, padding:"7px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>
                    Easier scanning
                  </span>
                  <span style={{ background:"#F8FAFC", color:C.muted, border:`1px solid ${C.border}`, padding:"7px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>
                    Less visual noise
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main style={{ maxWidth:1200, margin:"0 auto", padding:"18px 24px 64px" }}>

        {/* Category filter */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          <button onClick={() => setActiveCategory("")}
            style={{
              padding:"7px 12px", borderRadius:999, fontSize:11, fontWeight:700,
              cursor:"pointer", transition:"all .15s",
              background: activeCategory==="" ? C.navy : C.card,
              color: activeCategory==="" ? C.white : C.muted,
              border: activeCategory==="" ? "none" : `1px solid ${C.border}`,
              boxShadow: activeCategory==="" ? "0 8px 18px rgba(15,37,87,.18)" : "0 4px 14px rgba(15,37,87,.05)",
            }}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                padding:"7px 12px", borderRadius:999, fontSize:11, fontWeight:700,
                cursor:"pointer", border:"none", transition:"all .15s",
                background: activeCategory===cat ? C.navy : C.card,
                color: activeCategory===cat ? C.white : C.muted,
                border: activeCategory===cat ? "none" : `1px solid ${C.border}`,
                boxShadow: activeCategory===cat ? "0 8px 18px rgba(15,37,87,.18)" : "0 4px 14px rgba(15,37,87,.05)",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:C.muted, fontSize:15 }}>
            Loading articles…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <p style={{ fontSize:36, marginBottom:12 }}>📭</p>
            <p style={{ color:C.muted, fontSize:15 }}>No articles found. Try a different search.</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(3, minmax(0, 1fr))",
              gap:16,
              alignItems:"start",
            }} className="blog-grid">
              {filtered.map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        }
      `}</style>

      {/* ── Footer ── */}
      <footer style={{ background:C.navy, padding:"24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,.4)", fontSize:13 }}>
          © {new Date().getFullYear()} TRC Connect · <Link to="/blog" style={{ color:C.goldLight, textDecoration:"none" }}>Blog</Link>
          {" · "}<a href="mailto:hello@gettrc.com" style={{ color:"rgba(255,255,255,.4)", textDecoration:"none" }}>hello@gettrc.com</a>
        </p>
      </footer>
    </div>
  );
}
