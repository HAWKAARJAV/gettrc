-- blog_posts had a public-read RLS policy but no INSERT/UPDATE/DELETE policy
-- for admins, so every save from the admin Blog editor was silently failing:
-- UPDATE matched zero RLS-visible rows (no error, no-op) and INSERT hard-failed
-- with a row-level security violation. Every post that currently exists was
-- written directly via a service-role script, never through the actual UI.
DROP POLICY IF EXISTS "Blog posts admins manage" ON public.blog_posts;
CREATE POLICY "Blog posts admins manage"
  ON public.blog_posts
  FOR ALL
  USING (public.is_admin_user() OR public.is_admin_email())
  WITH CHECK (public.is_admin_user() OR public.is_admin_email());
