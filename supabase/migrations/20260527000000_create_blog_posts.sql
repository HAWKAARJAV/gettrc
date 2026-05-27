-- Blog posts table for SEO-driven lead generation
-- Public read, admin-only write (enforced via RLS)

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  excerpt           text NOT NULL,
  content           text NOT NULL,         -- Markdown / rich HTML
  cover_image_url   text,
  category          text NOT NULL DEFAULT 'TRC Insights',
  tags              text[] DEFAULT '{}',
  author_name       text NOT NULL DEFAULT 'TRC Connect Team',
  author_avatar     text,
  seo_title         text,
  seo_description   text,
  read_time_minutes integer DEFAULT 5,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public: read published posts only
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');

-- Service role / admin: full access (service_role bypasses RLS by default)

-- Indexes for fast slug lookup and listing
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx        ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx   ON public.blog_posts(published_at DESC) WHERE status='published';
CREATE INDEX IF NOT EXISTS blog_posts_category_idx    ON public.blog_posts(category);

-- ── Seed: first blog post ────────────────────────────────────────────────────
INSERT INTO public.blog_posts (
  slug, title, excerpt, content, category, tags,
  author_name, seo_title, seo_description, read_time_minutes,
  status, published_at
) VALUES (
  'what-is-a-tax-residency-certificate-and-why-you-need-one',
  'What Is a Tax Residency Certificate (TRC) — and Why You Need One in 2025',
  'A Tax Residency Certificate (TRC) is the official document that proves which country you are a tax resident of. Without it, you may be taxed twice on the same income. Here''s everything you need to know.',
  E'## What Is a Tax Residency Certificate (TRC)?\n\nA **Tax Residency Certificate (TRC)** is an official government-issued document that certifies you are a tax resident of a specific country for a given financial year. It is the primary document used to claim benefits under **Double Taxation Avoidance Agreements (DTAAs)**.\n\nWithout a valid TRC, you could be taxed **twice on the same income** — once in the country where the income is earned, and again in your home country.\n\n---\n\n## Who Needs a TRC?\n\nYou need a TRC if you:\n\n- **Earn income from a foreign country** — dividends, interest, royalties, business income\n- **Are an NRI (Non-Resident Indian)** receiving income in India\n- **Are an expat or remote worker** earning in a country different from where you live\n- **Run a business** with cross-border contracts, clients, or employees\n- **Have investments** (stocks, real estate, funds) in multiple countries\n- **Are a UAE resident** claiming exemption on Indian income under the India-UAE DTAA\n\n> 💡 **Did you know?** India has active DTAAs with 90+ countries. The UAE-India DTAA alone saves thousands of expats significant double taxation every year.\n\n---\n\n## What Does a TRC Prove?\n\nA TRC officially establishes:\n\n1. **Your tax residency jurisdiction** — the country where you are taxable\n2. **The tax year it applies to** — TRCs are issued per financial year\n3. **Your identity** — tied to your passport and national ID\n4. **Your eligibility for DTAA benefits** — the receiving country''s tax authority accepts the TRC as proof\n\n---\n\n## Common Countries Where TRC is Most Valuable\n\n| Country | Key DTAA Benefit |\n|---|---|\n| 🇦🇪 UAE | Zero tax on Indian income for UAE residents |\n| 🇸🇬 Singapore | Reduced withholding on dividends & royalties |\n| 🇬🇧 United Kingdom | Offset UK tax against Indian liability |\n| 🇳🇱 Netherlands | Reduced rates on business income |\n| 🇲🇹 Malta | Low tax on foreign-sourced income |\n| 🇨🇾 Cyprus | Zero capital gains tax under DTAA |\n\n---\n\n## How to Get a TRC: Step-by-Step\n\n### For UAE Residents\n1. Register with the **Federal Tax Authority (FTA)** portal\n2. Submit your residency proof (Emirates ID, tenancy agreement, utility bills)\n3. Provide your travel history showing 183+ days in UAE\n4. Pay the application fee (AED 2,000–10,000 depending on entity type)\n5. Receive your TRC — typically within 4–6 weeks\n\n### For Indian Residents\n1. File Form 10FA with the **Income Tax Department of India**\n2. Provide proof of residency and income\n3. Receive Form 10FB (the Indian TRC)\n\n---\n\n## Why Is the TRC Process Complex?\n\nMost applicants run into these roadblocks:\n\n- **Travel history documentation** — you need precise day-count calculations\n- **Residency proof standards** — not all documents are accepted\n- **Translation and apostille requirements** — for cross-border submission\n- **Annual renewal** — TRCs expire each financial year\n- **Country-specific formats** — each country has unique forms and procedures\n\nThis is where most people get stuck and overpay taxes unnecessarily.\n\n---\n\n## How TRC Connect Simplifies the Process\n\n**TRC Connect** was built specifically to solve these pain points. Our platform:\n\n✅ **Checks your eligibility automatically** — answer a few questions, get a clear yes/no in minutes\n\n✅ **Calculates your residency days** — our travel history tool does the math for you\n\n✅ **Collects and organizes your documents** — guided checklist, no guesswork\n\n✅ **Connects you to certified TRC advisors** — experts in UAE, Singapore, Malta, Cyprus, and more\n\n✅ **Tracks your application status** — real-time updates, no chasing emails\n\n---\n\n## Start Your TRC Application Today\n\nDon''t leave money on the table. If you''re earning cross-border income, a TRC could save you **thousands in unnecessary taxes** every year.\n\n[**Check Your Eligibility — Free →**](/check-eligibility)\n\n*Takes 3 minutes. No commitment required.*\n\n---\n\n*Have questions? Our advisors are available for a free 15-minute consultation. [Book a call →](/check-eligibility)*',
  'TRC Insights',
  ARRAY['TRC','tax residency certificate','DTAA','double taxation','UAE expat','NRI','tax planning'],
  'TRC Connect Team',
  'What Is a Tax Residency Certificate (TRC)? Complete Guide 2025',
  'Learn what a Tax Residency Certificate (TRC) is, who needs one, and how to apply. Avoid double taxation and claim DTAA benefits with expert guidance.',
  8,
  'published',
  now()
) ON CONFLICT (slug) DO NOTHING;
