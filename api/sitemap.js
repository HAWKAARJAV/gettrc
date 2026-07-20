import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://gettrc.com";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Static, public, content/conversion pages. Pure auth/login pages are
// intentionally excluded — they aren't content a searcher wants indexed.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/check-eligibility", changefreq: "monthly", priority: "0.8" },
  { path: "/corporate/check-eligibility", changefreq: "monthly", priority: "0.8" },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchPublishedBlogPosts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("sitemap: missing Supabase env vars, skipping blog posts");
    return [];
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from("blog_posts")
      .select("slug,updated_at,published_at")
      .eq("status", "published")
      .not("slug", "is", null);

    if (error) {
      console.error("sitemap: failed to fetch blog posts", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("sitemap: unexpected error fetching blog posts", err);
    return [];
  }
}

export default async function handler(req, res) {
  const entries = STATIC_ROUTES.map((route) =>
    urlEntry({
      loc: `${SITE_URL}${route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    })
  );

  const posts = await fetchPublishedBlogPosts();
  for (const post of posts) {
    if (!post?.slug) continue;
    const lastmodRaw = post.updated_at || post.published_at;
    const lastmod = lastmodRaw ? new Date(lastmodRaw).toISOString().split("T")[0] : null;
    entries.push(
      urlEntry({
        loc: `${SITE_URL}/blog/${post.slug}`,
        lastmod,
        changefreq: "monthly",
        priority: "0.7",
      })
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(xml);
}
