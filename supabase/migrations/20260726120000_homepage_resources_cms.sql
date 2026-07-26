-- Editable "Resources" cards on the homepage ("Everything you need before you apply"),
-- so admin can add/edit/remove cards without a code change.
CREATE TABLE IF NOT EXISTS public.homepage_resources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  action_label text NOT NULL DEFAULT 'Learn more',
  -- action_type controls how the card's button behaves:
  --   'scroll' -> action_value is an in-page element id to scroll to
  --   'path'   -> action_value is an internal route (react-router)
  --   'url'    -> action_value is an external URL, opened in a new tab
  action_type  text NOT NULL DEFAULT 'scroll' CHECK (action_type IN ('scroll','path','url')),
  action_value text NOT NULL DEFAULT '',
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS homepage_resources_updated_at ON public.homepage_resources;
CREATE TRIGGER homepage_resources_updated_at
  BEFORE UPDATE ON public.homepage_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_resources_public_read" ON public.homepage_resources;
CREATE POLICY "homepage_resources_public_read" ON public.homepage_resources
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "homepage_resources_admin_manage" ON public.homepage_resources;
CREATE POLICY "homepage_resources_admin_manage" ON public.homepage_resources
  FOR ALL USING (public.is_admin_user() OR public.is_admin_email())
  WITH CHECK (public.is_admin_user() OR public.is_admin_email());

CREATE INDEX IF NOT EXISTS homepage_resources_sort_idx ON public.homepage_resources(sort_order);

-- Seed with the 3 cards currently hardcoded on the homepage.
INSERT INTO public.homepage_resources (title, description, action_label, action_type, action_value, sort_order)
SELECT * FROM (VALUES
  ('UAE eligibility guide', 'UAE-specific eligibility, document, and FTA authority requirements for TRC applicants.', 'Check Eligibility', 'scroll', 'for-who', 1),
  ('Document readiness', 'Structured checklists that convert advisor requirements into trackable client tasks and upload states.', 'View Workflow', 'scroll', 'workflow', 2),
  ('TRC articles', 'Practical guides on cross-border income, double tax treaty benefits, and common UAE TRC questions.', 'Read Blog', 'path', '/blog', 3)
) AS seed(title, description, action_label, action_type, action_value, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_resources);
