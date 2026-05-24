SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_user_id_key;

ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS field_key text;

UPDATE public.assessment_questions
SET field_key = CASE
  WHEN question ILIKE '%days%uae%' THEN 'daysInUae'
  WHEN question ILIKE '%business owner%' THEN 'businessOwner'
  WHEN question ILIKE '%company name%' THEN 'companyName'
  WHEN question ILIKE '%business email%' THEN 'businessEmail'
  ELSE field_key
END
WHERE field_key IS NULL;

INSERT INTO public.assessment_questions (section, question, field_type, placeholder, required, country, applicant_type, conditional_logic, sort_order, field_key)
VALUES
  ('residency', 'Current country of residence', 'text', 'Current residence', true, 'AE', 'retail', null, 1, 'currentCountry'),
  ('residency', 'Do you hold a UAE residence visa?', 'select', 'yes/no', true, 'AE', 'retail', null, 2, 'uaeVisa'),
  ('residency', 'Is an Emirates ID available?', 'select', 'yes/no', true, 'AE', 'retail', null, 3, 'emiratesId'),
  ('residency', 'How many days were spent in the UAE?', 'number', 'e.g. 183', true, 'AE', 'retail', null, 4, 'daysInUae'),
  ('residency', 'Visa type', 'text', 'Employment, investor, freelance, family, etc.', true, 'AE', 'retail', null, 5, 'visaType'),
  ('professional', 'Occupation', 'text', 'Your role', true, 'AE', 'retail', null, 1, 'occupation'),
  ('professional', 'Income source', 'text', 'Salary, business, investments', true, 'AE', 'retail', null, 2, 'incomeSource'),
  ('professional', 'Purpose of TRC', 'text', 'Personal, corporate, banking, etc.', true, 'AE', 'retail', null, 3, 'purpose'),
  ('professional', 'Urgency level', 'select', 'standard/urgent/high', true, 'AE', 'retail', null, 4, 'urgency')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_applications_user_applicant_type
  ON public.applications(user_id, applicant_type);

CREATE INDEX IF NOT EXISTS idx_applications_advisor_id
  ON public.applications(advisor_id);

CREATE TABLE IF NOT EXISTS public.application_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_id uuid NOT NULL,
  author_id uuid,
  note_type text DEFAULT 'compliance'::text,
  body text NOT NULL,
  internal boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  application_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open'::text,
  priority text DEFAULT 'normal'::text,
  assigned_to uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.application_notes OWNER TO postgres;
ALTER TABLE public.support_tickets OWNER TO postgres;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_notes_pkey') THEN
    ALTER TABLE ONLY public.application_notes ADD CONSTRAINT application_notes_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_notes_application_id_fkey') THEN
    ALTER TABLE ONLY public.application_notes ADD CONSTRAINT application_notes_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_notes_author_id_fkey') THEN
    ALTER TABLE ONLY public.application_notes ADD CONSTRAINT application_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_pkey') THEN
    ALTER TABLE ONLY public.support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_user_id_fkey') THEN
    ALTER TABLE ONLY public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_application_id_fkey') THEN
    ALTER TABLE ONLY public.support_tickets ADD CONSTRAINT support_tickets_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_assigned_to_fkey') THEN
    ALTER TABLE ONLY public.support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_application_notes_application_id
  ON public.application_notes(application_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
  ON public.support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_application_id
  ON public.support_tickets(application_id);

ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants see applications" ON public.applications;
CREATE POLICY "Participants see applications" ON public.applications FOR SELECT USING (
  auth.uid()::uuid = user_id
  OR auth.uid()::uuid = advisor_id
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "Operations update applications" ON public.applications;
CREATE POLICY "Operations update applications" ON public.applications FOR UPDATE USING (
  auth.uid()::uuid = user_id
  OR auth.uid()::uuid = advisor_id
  OR public.is_admin_user()
) WITH CHECK (
  auth.uid()::uuid = user_id
  OR auth.uid()::uuid = advisor_id
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "Participants see application notes" ON public.application_notes;
CREATE POLICY "Participants see application notes" ON public.application_notes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_notes.application_id
        AND (
          public.is_admin_user()
          OR a.advisor_id = auth.uid()::uuid
          OR (a.user_id = auth.uid()::uuid AND application_notes.internal = false)
        )
  )
);

DROP POLICY IF EXISTS "Operations create application notes" ON public.application_notes;
CREATE POLICY "Operations create application notes" ON public.application_notes FOR INSERT WITH CHECK (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_notes.application_id
      AND a.advisor_id = auth.uid()::uuid
  )
);

DROP POLICY IF EXISTS "Users see support tickets" ON public.support_tickets;
CREATE POLICY "Users see support tickets" ON public.support_tickets FOR SELECT USING (
  user_id = auth.uid()::uuid
  OR assigned_to = auth.uid()::uuid
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "Users create support tickets" ON public.support_tickets;
CREATE POLICY "Users create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (
  user_id = auth.uid()::uuid
);

DROP POLICY IF EXISTS "Operations update support tickets" ON public.support_tickets;
CREATE POLICY "Operations update support tickets" ON public.support_tickets FOR UPDATE USING (
  assigned_to = auth.uid()::uuid
  OR public.is_admin_user()
) WITH CHECK (
  assigned_to = auth.uid()::uuid
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "Users insert own documents" ON public.documents;
CREATE POLICY "Users insert own documents" ON public.documents FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()::uuid
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id
      AND (a.user_id = auth.uid()::uuid OR a.advisor_id = auth.uid()::uuid OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Operations update documents" ON public.documents;
CREATE POLICY "Operations update documents" ON public.documents FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id
      AND (a.advisor_id = auth.uid()::uuid OR public.is_admin_user())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id
      AND (a.advisor_id = auth.uid()::uuid OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Private document objects are accessible to participants" ON storage.objects;
CREATE POLICY "Private document objects are accessible to participants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trc-private-documents'
  AND (
    auth.uid() = owner
    OR public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND (a.user_id = auth.uid()::uuid OR a.advisor_id = auth.uid()::uuid)
    )
  )
);

GRANT ALL ON TABLE public.application_notes TO anon;
GRANT ALL ON TABLE public.application_notes TO authenticated;
GRANT ALL ON TABLE public.application_notes TO service_role;
GRANT ALL ON TABLE public.support_tickets TO anon;
GRANT ALL ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;
