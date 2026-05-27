// BlogListingPage.jsx — Public blog index, SEO-optimised for organic traffic
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../supabaseClient";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  navy:      "#0F2557",
  navyLight: "#1A3570",
  gold:      "#C9A84C",
  goldLight: "#E2C47A",
  white:     "#FFFFFF",
  offWhite:  "#F7F8FC",
  text:      "#1E293B",
  muted:     "#64748B",
  border:    "#E2E8F0",
  card:      "#FFFFFF",
};

// ── SEO head injection ────────────────────────────────────────────────────────
function useSEO({ title, description, canonical }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    setMeta("og:url", canonical, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, [title, description, canonical]);
}

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

// ── Hero post card ────────────────────────────────────────────────────────────
function HeroCard({ post }) {
  const nav = useNavigate();
  return (
    <div
      onClick={() => nav(`/blog/${post.slug}`)}
      style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
        borderRadius: 20, padding: "48px 56px", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 18,
        position: "relative", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(15,37,87,.2)",
        transition: "transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 28px 70px rgba(15,37,87,.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 20px 60px rgba(15,37,87,.2)"; }}
    >
      {/* decorative circle */}
      <div style={{ position:"absolute", right:-40, top:-40, width:200, height:200,
        background:"rgba(201,168,76,.08)", borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ background:"rgba(201,168,76,.2)", color:C.goldLight,
          fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20,
          letterSpacing:".05em", textTransform:"uppercase" }}>
          {post.category}
        </span>
        <ReadTime minutes={post.read_time_minutes} />
      </div>

      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "clamp(24px,3vw,36px)", fontWeight: 700,
        color: C.white, lineHeight: 1.2, maxWidth: 700,
      }}>
        {post.title}
      </h2>

      <p style={{ fontSize: 15, color: "rgba(255,255,255,.7)", lineHeight: 1.7, maxWidth: 640 }}>
        {post.excerpt}
      </p>

      <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:8 }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:700, color:C.navy, flexShrink:0,
        }}>
          {post.author_name?.[0] || "T"}
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:C.white }}>{post.author_name}</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>
            {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }) : ""}
          </p>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
          color:C.goldLight, fontSize:14, fontWeight:600 }}>
          Read article <span style={{ fontSize:18 }}>→</span>
        </div>
      </div>
    </div>
  );
}

// ── Regular post card ─────────────────────────────────────────────────────────
function PostCard({ post }) {
  const nav = useNavigate();
  return (
    <article
      onClick={() => nav(`/blog/${post.slug}`)}
      style={{
        background: C.card, borderRadius: 16, cursor: "pointer",
        border: `1px solid ${C.border}`, overflow: "hidden",
        transition: "transform .2s, box-shadow .2s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(15,37,87,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Cover image or gradient placeholder */}
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title}
          style={{ width:"100%", height:180, objectFit:"cover" }} />
      ) : (
        <div style={{
          height:180, background:`linear-gradient(135deg,${C.navy}22,${C.gold}22)`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40,
        }}>
          📄
        </div>
      )}

      <div style={{ padding:"22px 24px 28px", display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <CategoryPill category={post.category} />
          <ReadTime minutes={post.read_time_minutes} />
        </div>

        <h3 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: 21, fontWeight: 700, color: C.navy,
          lineHeight: 1.3, letterSpacing:"-.01em",
        }}>
          {post.title}
        </h3>

        <p style={{ fontSize:14, color:C.muted, lineHeight:1.65, flex:1 }}>
          {post.excerpt.length > 130 ? post.excerpt.slice(0, 130) + "…" : post.excerpt}
        </p>

        <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:8,
          borderTop:`1px solid ${C.border}` }}>
          <div style={{
            width:28, height:28, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:700, color:C.navy,
          }}>
            {post.author_name?.[0] || "T"}
          </div>
          <p style={{ fontSize:12, color:C.muted, flex:1 }}>{post.author_name}</p>
          <p style={{ fontSize:12, color:C.muted }}>
            {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "Draft"}
          </p>
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
          width:"100%", padding:"11px 16px 11px 42px",
          border:`1px solid ${C.border}`, borderRadius:10,
          fontSize:14, fontFamily:"inherit", color:C.text,
          background:C.white, outline:"none",
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
  const [activeCategory, setActiveCategory] = useState("All");

  useSEO({
    title: "TRC Blog — Tax Residency Certificate Guides, DTAA Tips & Expat Insights",
    description: "Expert articles on Tax Residency Certificates, Double Taxation Avoidance, UAE expat tax planning, NRI tax obligations, and more. Free guides by TRC Connect.",
    canonical: "https://gettrc.com/blog",
  });

  useEffect(() => {
    sb.from("blog_posts")
      .select("id,slug,title,excerpt,cover_image_url,category,tags,author_name,read_time_minutes,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map(p => p.category)))];

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const hero = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ minHeight:"100vh", background:C.offWhite, fontFamily:"'DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; }
      `}</style>

      {/* ── Header bar ── */}
      <header style={{
        background:C.navy, padding:"14px 0",
        borderBottom:`2px solid ${C.gold}`,
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:32,height:32,background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
              borderRadius:8, display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚖</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.white }}>
              TRC<span style={{ color:C.goldLight, fontWeight:400 }}> Connect</span>
            </span>
          </Link>
          <nav style={{ display:"flex", gap:24, alignItems:"center" }}>
            <Link to="/" style={{ color:"rgba(255,255,255,.7)", textDecoration:"none", fontSize:14 }}>Home</Link>
            <Link to="/blog" style={{ color:C.goldLight, textDecoration:"none", fontSize:14, fontWeight:600 }}>Blog</Link>
            <Link to="/check-eligibility" style={{
              background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
              color:C.navy, padding:"8px 18px", borderRadius:8,
              textDecoration:"none", fontSize:13, fontWeight:700,
            }}>Check Eligibility</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section style={{ background:`linear-gradient(180deg,${C.navy} 0%,${C.offWhite} 100%)`, padding:"56px 24px 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.goldLight, textTransform:"uppercase",
              letterSpacing:".12em", display:"block", marginBottom:12 }}>
              TRC Insights & Guides
            </span>
            <h1 style={{
              fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,5vw,52px)",
              fontWeight:700, color:C.white, lineHeight:1.15, marginBottom:16,
            }}>
              Everything You Need to Know<br/>About Tax Residency
            </h1>
            <p style={{ fontSize:16, color:"rgba(255,255,255,.65)", maxWidth:560, margin:"0 auto 28px" }}>
              Expert guides on TRC applications, DTAA benefits, expat tax planning, and how to legally reduce your tax burden.
            </p>
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"40px 24px 80px" }}>

        {/* Category filter */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:36 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                padding:"7px 16px", borderRadius:20, fontSize:13, fontWeight:600,
                cursor:"pointer", border:"none", transition:"all .15s",
                background: activeCategory===cat ? C.navy : C.white,
                color: activeCategory===cat ? C.white : C.muted,
                boxShadow: activeCategory===cat ? "0 2px 8px rgba(15,37,87,.2)" : "0 1px 3px rgba(0,0,0,.06)",
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
            {/* Hero post */}
            {hero && !search && activeCategory === "All" && <div style={{ marginBottom:40 }}><HeroCard post={hero} /></div>}

            {/* Grid */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
              gap:24,
            }}>
              {(search || activeCategory !== "All" ? filtered : rest).map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </>
        )}

        {/* CTA banner */}
        {!loading && (
          <div style={{
            marginTop:64, background:`linear-gradient(135deg,${C.navy},${C.navyLight})`,
            borderRadius:20, padding:"40px 48px", textAlign:"center",
            boxShadow:"0 12px 40px rgba(15,37,87,.15)",
          }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.goldLight,
              textTransform:"uppercase", letterSpacing:".1em", marginBottom:10 }}>
              Ready to get started?
            </p>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30,
              fontWeight:700, color:C.white, marginBottom:12 }}>
              Check Your TRC Eligibility — Free
            </h3>
            <p style={{ color:"rgba(255,255,255,.65)", fontSize:15, marginBottom:24, maxWidth:480, margin:"0 auto 24px" }}>
              Answer 5 questions and find out if you qualify for a Tax Residency Certificate in minutes.
            </p>
            <Link to="/check-eligibility" style={{
              background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
              color:C.navy, padding:"14px 32px", borderRadius:10,
              textDecoration:"none", fontSize:15, fontWeight:700,
              display:"inline-block", boxShadow:"0 4px 15px rgba(201,168,76,.4)",
            }}>
              Check My Eligibility →
            </Link>
          </div>
        )}
      </main>

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
