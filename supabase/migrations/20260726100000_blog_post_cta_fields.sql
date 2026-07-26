-- Optional per-post Call to Action override. When null, BlogPostPage falls
-- back to the default "Check Eligibility" banner copy/links.
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cta_heading      text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cta_text         text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cta_button_label text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cta_button_url   text;
