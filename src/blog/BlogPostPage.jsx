// BlogPostPage.jsx — Individual blog post with full SEO + JSON-LD structured data
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  surface:   "#FBFCFE",
};

// ── SEO head injection ────────────────────────────────────────────────────────
function useSEO(post) {
  useEffect(() => {
    if (!post) return;
    const title = post.seo_title || post.title;
    const desc  = post.seo_description || post.excerpt;
    const url   = `https://gettrc.com/blog/${post.slug}`;

    document.title = title + " | TRC Connect";

    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", url, true);
    if (post.cover_image_url) setMeta("og:image", post.cover_image_url, true);
    setMeta("article:published_time", post.published_at, true);
    setMeta("article:author", post.author_name, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = url;

    // JSON-LD structured data (Article schema for Google rich results)
    const existingLd = document.getElementById("blog-ld");
    if (existingLd) existingLd.remove();
    const existingFaqLd = document.getElementById("blog-faq-ld");
    if (existingFaqLd) existingFaqLd.remove();

    const script = document.createElement("script");
    script.id = "blog-ld";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.cover_image_url || "https://gettrc.com/og-default.png",
      "author": { "@type": "Organization", "name": post.author_name },
      "publisher": {
        "@type": "Organization",
        "name": "TRC Connect",
        "logo": { "@type": "ImageObject", "url": "https://gettrc.com/logo.png" },
      },
      "datePublished": post.published_at,
      "dateModified": post.updated_at || post.published_at,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "keywords": (post.tags || []).join(", "),
    });
    document.head.appendChild(script);

    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.id = "blog-breadcrumb-ld";
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://gettrc.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://gettrc.com/blog" },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    });
    document.head.appendChild(breadcrumbScript);

    const faqScript = document.createElement("script");
    faqScript.id = "blog-faq-ld";
    faqScript.type = "application/ld+json";
    faqScript.text = JSON.stringify(buildFaqSchema(post));
    document.head.appendChild(faqScript);

    return () => {
      ["blog-ld", "blog-breadcrumb-ld", "blog-faq-ld"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [post]);
}

// ── Minimal markdown renderer (no external deps) ─────────────────────────────
function renderMarkdown(md) {
  if (!md) return "";

  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // Headings
    .replace(/^#{4}\s+(.+)$/gm, (_, text) => `<h4 class="md-h4" id="${slugifyText(text)}">${text}</h4>`)
    .replace(/^#{3}\s+(.+)$/gm, (_, text) => `<h3 class="md-h3" id="${slugifyText(text)}">${text}</h3>`)
    .replace(/^#{2}\s+(.+)$/gm, (_, text) => `<h2 class="md-h2" id="${slugifyText(text)}">${text}</h2>`)
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>')

    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')

    // Blockquote
    .replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-bq">$1</blockquote>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr class="md-hr"/>')

    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
      const isExternal = href.startsWith("http");
      return `<a href="${href}" class="md-link"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    })

    // Table — parse header row
    .replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_, header, rows) => {
      const th = header.split("|").filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join("");
      const tr = rows.trim().split("\n").map(row => {
        const tds = row.split("|").filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
      return `<div class="md-table-wrap"><table class="md-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
    })

    // Unordered list
    .replace(/((?:^[-*]\s+.+\n?)+)/gm, match => {
      const items = match.trim().split("\n").map(line => `<li>${line.replace(/^[-*]\s+/, "")}</li>`).join("");
      return `<ul class="md-ul">${items}</ul>`;
    })

    // Ordered list
    .replace(/((?:^\d+\.\s+.+\n?)+)/gm, match => {
      const items = match.trim().split("\n").map(line => `<li>${line.replace(/^\d+\.\s+/, "")}</li>`).join("");
      return `<ol class="md-ol">${items}</ol>`;
    })

    // Paragraphs: wrap lines not already wrapped
    .split("\n\n")
    .map(block => {
      block = block.trim();
      if (!block) return "";
      if (/^<(h[1-6]|ul|ol|blockquote|hr|div|table)/.test(block)) return block;
      return `<p class="md-p">${block.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return html;
}

// ── Markdown CSS ──────────────────────────────────────────────────────────────
const MD_CSS = `
  .md-h1,.md-h2,.md-h3,.md-h4{font-family:'Cormorant Garamond',serif;font-weight:700;color:#0F2557;line-height:1.25;margin:1.6em 0 .6em;}
  .md-h1{font-size:clamp(26px,3vw,38px);}
  .md-h2{font-size:clamp(22px,2.5vw,30px);padding-bottom:8px;border-bottom:2px solid #E2E8F0;}
  .md-h3{font-size:clamp(18px,2vw,24px);}
  .md-h4{font-size:17px;}
  .md-p{font-size:17px;line-height:1.8;color:#334155;margin:0 0 1.2em;}
  .md-link{color:#C9A84C;text-decoration:underline;text-underline-offset:3px;font-weight:600;}
  .md-link:hover{color:#A07C2E;}
  .md-ul,.md-ol{padding-left:1.5em;margin:0 0 1.2em;}
  .md-ul li,.md-ol li{font-size:17px;line-height:1.75;color:#334155;margin-bottom:.4em;}
  .md-bq{border-left:4px solid #C9A84C;margin:1.4em 0;padding:12px 20px;background:#FFFBF0;border-radius:0 8px 8px 0;font-size:16px;color:#5C4A1E;font-style:italic;}
  .md-code{background:#F1F5F9;color:#0F2557;padding:2px 7px;border-radius:5px;font-family:'Fira Code',monospace;font-size:14px;}
  .md-hr{border:none;border-top:1px solid #E2E8F0;margin:2em 0;}
  .md-table-wrap{overflow-x:auto;margin:1.4em 0;}
  .md-table{width:100%;border-collapse:collapse;font-size:15px;}
  .md-table th{background:#0F2557;color:#fff;padding:10px 16px;text-align:left;font-weight:600;}
  .md-table td{padding:10px 16px;border-bottom:1px solid #E2E8F0;color:#334155;}
  .md-table tr:nth-child(even) td{background:#F7F8FC;}
  strong{font-weight:700;}
  em{font-style:italic;}
`;

// ── Share bar ─────────────────────────────────────────────────────────────────
function ShareBar({ url, title }) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
      <span style={{ fontSize:13, fontWeight:600, color:C.muted }}>Share:</span>
      {[
        { label:"Twitter/X", color:"#000", href:`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, icon:"𝕏" },
        { label:"LinkedIn",  color:"#0A66C2", href:`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, icon:"in" },
        { label:"WhatsApp",  color:"#25D366", href:`https://wa.me/?text=${encodedTitle}%20${encoded}`, icon:"💬" },
      ].map(({ label, color, href, icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer"
          style={{
            background: color, color:"#fff", padding:"6px 14px", borderRadius:7,
            textDecoration:"none", fontSize:13, fontWeight:700,
            display:"flex", alignItems:"center", gap:5,
          }}>
          <span>{icon}</span> {label}
        </a>
      ))}
    </div>
  );
}

// ── Tag pill ──────────────────────────────────────────────────────────────────
function Tag({ label }) {
  return (
    <span style={{
      background: "#F1F5F9", color: C.muted, fontSize:12,
      fontWeight:600, padding:"4px 10px", borderRadius:6,
    }}>#{label}</span>
  );
}

function slugifyText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractHeadings(md) {
  return (md || "")
    .split("\n")
    .map(line => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (!match) return null;
      return {
        level: match[1].length,
        text: match[2].trim(),
        id: slugifyText(match[2]),
      };
    })
    .filter(Boolean);
}

function buildFaqSchema(post) {
  const faqItems = [
    {
      question: `How long does it take to get a TRC in ${post.category === "Country Guide" ? "this market" : "the UAE"}?`,
      answer: "The timeline depends on residency status, document readiness, and the review queue. A complete submission is the fastest path to approval.",
    },
    {
      question: "What documents improve TRC approval chances?",
      answer: "Clear passport copies, visa/residency proof, travel evidence, tax records, and any supporting income or address documents help reduce back-and-forth.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO(post);
  const tocItems = extractHeadings(post?.content);
  const faqItems = post ? [
    {
      question: `How long does it take to get a TRC in ${post.category === "Country Guide" ? "this market" : "the UAE"}?`,
      answer: "The timeline depends on residency status, document readiness, and the review queue. A complete submission is the fastest path to approval.",
    },
    {
      question: "What documents improve TRC approval chances?",
      answer: "Clear passport copies, visa/residency proof, travel evidence, tax records, and any supporting income or address documents help reduce back-and-forth.",
    },
  ] : [];

  useEffect(() => {
    sb.from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setPost(data);
        setLoading(false);
        // Fetch related posts (same category, exclude current)
        sb.from("blog_posts")
          .select("id,slug,title,excerpt,category,read_time_minutes,published_at,author_name")
          .eq("status", "published")
          .eq("category", data.category)
          .neq("slug", slug)
          .limit(3)
          .order("published_at", { ascending:false })
          .then(({ data:rel }) => setRelated(rel || []));
      });
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", color:C.muted, fontSize:15 }}>
      Loading article…
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", fontFamily:"'DM Sans',sans-serif", gap:16 }}>
      <p style={{ fontSize:56 }}>📭</p>
      <h2 style={{ color:C.navy, fontFamily:"'Cormorant Garamond',serif", fontSize:28 }}>Article not found</h2>
      <Link to="/blog" style={{ color:C.gold, fontWeight:600 }}>← Back to Blog</Link>
    </div>
  );

  const postUrl = `https://gettrc.com/blog/${post.slug}`;

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(circle at top, rgba(201,168,76,.10), transparent 34%), linear-gradient(180deg, #F7F8FC 0%, #EEF2F8 100%)`, fontFamily:"'DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; } body { margin:0; }
        ${MD_CSS}
      `}</style>

      <header style={{ background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`, padding:"14px 0", borderBottom:`1px solid rgba(255,255,255,.08)`, boxShadow:"0 8px 30px rgba(15,37,87,.18)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:32,height:32,background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚖</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.white }}>
              TRC<span style={{ color:C.goldLight,fontWeight:400 }}> Connect</span>
            </span>
          </Link>
          <nav style={{ display:"flex", gap:24, alignItems:"center" }}>
            <Link to="/blog" style={{ color:"rgba(255,255,255,.7)", textDecoration:"none", fontSize:14 }}>← Blog</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth:1200, margin:"0 auto", padding:"22px 24px 72px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize:13, marginBottom:14, color:C.muted }}>
          <Link to="/" style={{ color:C.muted, textDecoration:"none" }}>Home</Link>
          <span style={{ margin:"0 8px" }}>/</span>
          <Link to="/blog" style={{ color:C.muted, textDecoration:"none" }}>Blog</Link>
          <span style={{ margin:"0 8px" }}>/</span>
          <span style={{ color:C.navy, fontWeight:700 }}>{post.category}</span>
        </nav>

        <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:24, alignItems:"start" }}>
          <article style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:24, overflow:"hidden", boxShadow:"0 18px 50px rgba(15,37,87,.08)" }}>
            <div style={{ padding:"28px" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
                <span style={{ background:"rgba(201,168,76,.14)", color:C.navy, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:".05em", textTransform:"uppercase" }}>{post.category}</span>
                <span style={{ fontSize:12, color:C.muted }}>⏱ {post.read_time_minutes} min read</span>
                <span style={{ fontSize:12, color:C.muted }}>Published {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }) : "Draft"}</span>
              </div>

              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(30px,4vw,46px)", fontWeight:700, color:C.navy, lineHeight:1.1, marginBottom:14 }}>
                {post.title}
              </h1>

              <p style={{ fontSize:17, color:C.muted, lineHeight:1.7, marginBottom:20, maxWidth:760 }}>
                {post.excerpt}
              </p>

              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:"flex",alignItems:"center",justifyContent:"center", fontSize:16,fontWeight:700,color:C.navy }}>
                  {post.author_name?.[0] || "T"}
                </div>
                <div>
                  <p style={{ fontSize:14,fontWeight:700,color:C.navy,margin:0 }}>{post.author_name}</p>
                  <p style={{ fontSize:12,color:C.muted,margin:0 }}>TRC Connect editorial team</p>
                </div>
              </div>
            </div>

            {post.cover_image_url && (
              <div style={{ padding:"0 28px 28px" }}>
                <img src={post.cover_image_url} alt={post.title} loading="lazy" decoding="async" style={{ width:"100%", borderRadius:18, boxShadow:"0 12px 40px rgba(0,0,0,.10)", display:"block", aspectRatio:"16 / 9", objectFit:"cover" }} />
              </div>
            )}

            <div style={{ padding:"0 28px 28px" }}>
              {tocItems.length > 0 && (
                <section style={{ maxWidth:760, margin:"0 auto 24px", padding:"18px 20px", background:"#F8FAFC", borderRadius:16, border:`1px solid ${C.border}` }}>
                  <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:700, color:C.navy, textTransform:"uppercase", letterSpacing:".08em" }}>On this page</p>
                  <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:8 }}>
                    {tocItems.map(item => (
                      <li key={item.id} style={{ fontSize:13, lineHeight:1.5 }}>
                        <a href={`#${item.id}`} style={{ color:C.goldDark, textDecoration:"none", fontWeight:600 }}>{item.text}</a>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div style={{ maxWidth:760, margin:"0 auto" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

              {post.tags?.length > 0 && (
                <div style={{ maxWidth:760, margin:"28px auto 0", display:"flex", gap:8, flexWrap:"wrap", paddingTop:24, borderTop:`1px solid ${C.border}` }}>
                  {post.tags.map(t => <Tag key={t} label={t} />)}
                </div>
              )}

              {faqItems.length > 0 && (
                <section style={{ maxWidth:760, margin:"32px auto 0", padding:"24px", background:C.offWhite, borderRadius:18, border:`1px solid ${C.border}` }}>
                  <h2 style={{ margin:"0 0 14px", fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.navy }}>Frequently asked questions</h2>
                  <div style={{ display:"grid", gap:12 }}>
                    {faqItems.map(item => (
                      <div key={item.question} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
                        <h3 style={{ margin:"0 0 8px", fontSize:15, color:C.navy, lineHeight:1.4 }}>{item.question}</h3>
                        <p style={{ margin:0, fontSize:13, color:C.muted, lineHeight:1.65 }}>{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section style={{ maxWidth:760, margin:"32px auto 0", padding:"24px", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`, borderRadius:18, color:C.white }}>
                <p style={{ margin:0, fontSize:12, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:C.goldLight }}>Need help with your TRC?</p>
                <h2 style={{ margin:"10px 0 10px", fontFamily:"'Cormorant Garamond',serif", fontSize:28, lineHeight:1.15 }}>Book a consultation or download the checklist.</h2>
                <p style={{ margin:"0 0 18px", fontSize:14, color:"rgba(255,255,255,.72)", lineHeight:1.7 }}>Get the document list, eligibility review, and filing support before you submit your application.</p>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <Link to="/check-eligibility" style={{ background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, padding:"12px 18px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>Check Eligibility</Link>
                  <a href="mailto:hello@gettrc.com" style={{ background:"rgba(255,255,255,.08)", color:C.white, padding:"12px 18px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700, border:"1px solid rgba(255,255,255,.12)" }}>Book Consultation</a>
                </div>
              </section>

              <div style={{ maxWidth:760, margin:"28px auto 0", padding:"22px 24px", background:"#F8FAFC", borderRadius:16, border:`1px solid ${C.border}` }}>
                <ShareBar url={postUrl} title={post.title} />
              </div>

              <div style={{ maxWidth:760, margin:"28px auto 0", padding:"28px", background:C.white, borderRadius:16, border:`1px solid ${C.border}`, display:"flex", gap:20, alignItems:"flex-start" }}>
                <div style={{ width:56, height:56, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, display:"flex",alignItems:"center",justifyContent:"center", fontSize:22,fontWeight:700,color:C.gold }}>
                  {post.author_name?.[0] || "T"}
                </div>
                <div>
                  <p style={{ fontWeight:700, color:C.navy, fontSize:15, margin:"0 0 4px" }}>{post.author_name}</p>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, margin:0 }}>
                    TRC Connect helps individuals and companies navigate Tax Residency Certificates and Double Taxation Avoidance Agreements across 90+ countries. Our certified advisors have processed thousands of TRC applications.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <aside style={{ position:"sticky", top:24, display:"grid", gap:16 }}>
            <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:18, padding:18, boxShadow:"0 10px 28px rgba(15,37,87,.06)" }}>
              <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:C.gold }}>Jump to section</p>
              <p style={{ margin:"0 0 10px", fontSize:13, color:C.muted }}>Quick scan for key headings and decision points.</p>
              {tocItems.length > 0 ? (
                <div style={{ display:"grid", gap:8 }}>
                  {tocItems.map(item => (
                    <a key={item.id} href={`#${item.id}`} style={{ textDecoration:"none", color:C.navy, fontSize:13, fontWeight:600, lineHeight:1.4 }}>{item.text}</a>
                  ))}
                </div>
              ) : (
                <p style={{ margin:0, fontSize:13, color:C.muted }}>This article is a shorter guide with no section headings yet.</p>
              )}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section style={{ maxWidth:1200, margin:"32px auto 0" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:C.navy, marginBottom:18 }}>Related Articles</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
              {related.map(r => (
                <div key={r.id} onClick={() => nav(`/blog/${r.slug}`)} style={{ background:C.white, borderRadius:16, padding:"18px", border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", flexDirection:"column", justifyContent:"space-between", gap:14, transition:"box-shadow .15s, transform .15s", boxShadow:"0 8px 24px rgba(15,37,87,.06)" }} onMouseEnter={e => { e.currentTarget.style.boxShadow="0 14px 30px rgba(15,37,87,.12)"; e.currentTarget.style.transform="translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow="0 8px 24px rgba(15,37,87,.06)"; e.currentTarget.style.transform=""; }}>
                  <div>
                    <p style={{ fontSize:12,fontWeight:700,color:C.gold,marginBottom:8, textTransform:"uppercase", letterSpacing:".08em" }}>{r.category}</p>
                    <p style={{ fontSize:16,fontWeight:700,color:C.navy,lineHeight:1.35, margin:0 }}>{r.title}</p>
                    <p style={{ fontSize:13,color:C.muted,marginTop:6 }}>⏱ {r.read_time_minutes} min read</p>
                  </div>
                  <span style={{ color:C.gold,fontSize:14,fontWeight:700, alignSelf:"flex-end" }}>Read Guide →</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ background:C.navy, padding:"24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,.4)", fontSize:13 }}>
          © {new Date().getFullYear()} TRC Connect ·{" "}
          <Link to="/blog" style={{ color:C.goldLight, textDecoration:"none" }}>Blog</Link>
        </p>
      </footer>
    </div>
  );
}
