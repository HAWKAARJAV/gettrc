import { useEffect } from "react";

export const SITE_URL = "https://gettrc.com";
export const SITE_NAME = "TRC Connect";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_DESCRIPTION =
  "TRC Connect pairs UAE Tax Residency Certificate applicants with verified Chartered Accountants who review eligibility, manage documents, and file with the Federal Tax Authority.";

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const MAX_JSONLD_SLOTS = 6;

/**
 * Sets title, meta description, canonical, robots, OpenGraph, Twitter Card,
 * and JSON-LD for the current route. Call once per page component. The next
 * page's useSEO call overwrites these tags on mount, which is sufficient for
 * an SPA since a full page load always re-renders index.html's static
 * defaults first.
 *
 * @param {object} opts
 * @param {string} opts.title - Page title. " | TRC Connect" is appended
 *   unless already present.
 * @param {string} opts.description - Meta description (~150-160 chars).
 * @param {string} [opts.path] - Route path for canonical/OG url, e.g. "/blog".
 *   Defaults to the current location.
 * @param {string} [opts.image] - Absolute OG/Twitter image URL.
 * @param {string} [opts.type] - OG type: "website" | "article".
 * @param {boolean} [opts.noindex] - Set true for private/gated pages.
 * @param {object|object[]} [opts.jsonLd] - One or more JSON-LD objects to inject.
 */
export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
} = {}) {
  useEffect(() => {
    if (!title) return;
    const resolvedPath = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${resolvedPath}`;

    document.title = fullTitle;
    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setLinkTag("canonical", url);

    setMetaTag("property", "og:site_name", SITE_NAME);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:image", image);
    setMetaTag("property", "og:locale", "en_US");

    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", image);

    const ldItems = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
    for (let i = 0; i < MAX_JSONLD_SLOTS; i++) {
      setJsonLd(`seo-ld-${i}`, ldItems[i] || null);
    }
  }, [title, description, path, image, type, noindex, jsonLd]);
}

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: DEFAULT_DESCRIPTION,
  areaServed: "AE",
};

// TRC Connect is the online brand; Sorting Tax Advisory is the operating
// legal entity and registered office this schema describes.
export const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_NAME,
  alternateName: "Sorting Tax Advisory",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  image: DEFAULT_OG_IMAGE,
  description: DEFAULT_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Vipul Trade Centre, Sohna Road, Sector 48",
    addressLocality: "Gurugram",
    addressRegion: "Haryana",
    addressCountry: "IN",
  },
  areaServed: "AE",
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

/** items: [{ name, path }] in order from Home to the current page. */
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
