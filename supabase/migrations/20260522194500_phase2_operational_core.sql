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

CREATE TABLE IF NOT EXISTS public.countries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  applicant_types text[] DEFAULT ARRAY['retail'::text, 'corporate'::text],
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.country_requirements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country_id uuid NOT NULL,
  requirement_key text NOT NULL,
  requirement_label text NOT NULL,
  requirement_value text,
  requirement_type text DEFAULT 'text'::text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.country_timelines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country_id uuid NOT NULL,
  milestone_key text NOT NULL,
  label text NOT NULL,
  estimated_days integer,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.country_fees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country_id uuid NOT NULL,
  fee_key text NOT NULL,
  label text NOT NULL,
  amount numeric(12,2),
  currency text DEFAULT 'USD'::text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  applicant_type text NOT NULL,
  user_id uuid NOT NULL,
  advisor_id uuid,
  country text,
  application_type text,
  eligibility_request_id uuid,
  workflow_state text DEFAULT 'pending_review'::text,
  payment_state text DEFAULT 'pending'::text,
  review_state text DEFAULT 'pending_review'::text,
  assigned_manager text,
  started_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_id uuid NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  updated_by text,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  section text NOT NULL,
  question text NOT NULL,
  field_type text NOT NULL,
  placeholder text,
  required boolean DEFAULT true,
  country text,
  applicant_type text,
  conditional_logic jsonb,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_requirements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country text NOT NULL,
  applicant_type text NOT NULL,
  document_name text NOT NULL,
  required boolean DEFAULT true,
  conditions jsonb,
  category text,
  description text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text,
  uploaded_by uuid,
  review_status text DEFAULT 'uploaded'::text,
  reviewer_notes text,
  uploaded_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  exit_date date,
  country text NOT NULL,
  total_days integer,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  application_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text,
  action_url text,
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.countries OWNER TO postgres;
ALTER TABLE public.country_requirements OWNER TO postgres;
ALTER TABLE public.country_timelines OWNER TO postgres;
ALTER TABLE public.country_fees OWNER TO postgres;
ALTER TABLE public.applications OWNER TO postgres;
ALTER TABLE public.application_status_history OWNER TO postgres;
ALTER TABLE public.assessment_questions OWNER TO postgres;
ALTER TABLE public.document_requirements OWNER TO postgres;
ALTER TABLE public.documents OWNER TO postgres;
ALTER TABLE public.travel_history OWNER TO postgres;
ALTER TABLE public.notifications OWNER TO postgres;

-- Ensure phase-2 `applications` columns exist before adding constraints that may reference them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='applications') THEN
    ALTER TABLE public.applications
      ADD COLUMN IF NOT EXISTS applicant_type text,
      ADD COLUMN IF NOT EXISTS advisor_id uuid,
      ADD COLUMN IF NOT EXISTS application_type text,
      ADD COLUMN IF NOT EXISTS eligibility_request_id uuid,
      ADD COLUMN IF NOT EXISTS workflow_state text DEFAULT 'pending_review',
      ADD COLUMN IF NOT EXISTS payment_state text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS review_state text DEFAULT 'pending_review',
      ADD COLUMN IF NOT EXISTS assigned_manager text,
      ADD COLUMN IF NOT EXISTS started_at timestamp without time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS completed_at timestamp without time zone;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'countries_pkey') THEN
    ALTER TABLE ONLY public.countries ADD CONSTRAINT countries_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'countries_code_key') THEN
    ALTER TABLE ONLY public.countries ADD CONSTRAINT countries_code_key UNIQUE (code);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'countries_slug_key') THEN
    ALTER TABLE ONLY public.countries ADD CONSTRAINT countries_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_requirements_pkey') THEN
    ALTER TABLE ONLY public.country_requirements ADD CONSTRAINT country_requirements_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_requirements_country_id_fkey') THEN
    ALTER TABLE ONLY public.country_requirements ADD CONSTRAINT country_requirements_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_timelines_pkey') THEN
    ALTER TABLE ONLY public.country_timelines ADD CONSTRAINT country_timelines_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_timelines_country_id_fkey') THEN
    ALTER TABLE ONLY public.country_timelines ADD CONSTRAINT country_timelines_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_fees_pkey') THEN
    ALTER TABLE ONLY public.country_fees ADD CONSTRAINT country_fees_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_fees_country_id_fkey') THEN
    ALTER TABLE ONLY public.country_fees ADD CONSTRAINT country_fees_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_pkey') THEN
    ALTER TABLE ONLY public.applications ADD CONSTRAINT applications_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_key') THEN
    ALTER TABLE ONLY public.applications ADD CONSTRAINT applications_user_id_key UNIQUE (user_id, applicant_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_fkey') THEN
    ALTER TABLE ONLY public.applications ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  -- Clean up any orphaned advisor references before adding FK
  PERFORM 1;
  UPDATE public.applications SET advisor_id = NULL WHERE advisor_id IS NOT NULL AND advisor_id NOT IN (SELECT id FROM public.profiles);
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_advisor_id_fkey') THEN
    ALTER TABLE ONLY public.applications ADD CONSTRAINT applications_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_eligibility_request_id_key') THEN
    ALTER TABLE ONLY public.applications ADD CONSTRAINT applications_eligibility_request_id_key UNIQUE (eligibility_request_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_status_history_pkey') THEN
    ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_status_history_application_id_fkey') THEN
    ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_questions_pkey') THEN
    ALTER TABLE ONLY public.assessment_questions ADD CONSTRAINT assessment_questions_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_requirements_pkey') THEN
    ALTER TABLE ONLY public.document_requirements ADD CONSTRAINT document_requirements_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE contype = 'p' AND conrelid = 'public.documents'::regclass) THEN
    ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_v2_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_application_id_fkey') THEN
    ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'travel_history_pkey') THEN
    ALTER TABLE ONLY public.travel_history ADD CONSTRAINT travel_history_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_application_id_fkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
END$$;

-- If the project already has a legacy `applications` table, add missing phase-2 columns safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='applications') THEN
    ALTER TABLE public.applications
      ADD COLUMN IF NOT EXISTS applicant_type text,
      ADD COLUMN IF NOT EXISTS advisor_id uuid,
      ADD COLUMN IF NOT EXISTS application_type text,
      ADD COLUMN IF NOT EXISTS eligibility_request_id uuid,
      ADD COLUMN IF NOT EXISTS workflow_state text DEFAULT 'pending_review',
      ADD COLUMN IF NOT EXISTS payment_state text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS review_state text DEFAULT 'pending_review',
      ADD COLUMN IF NOT EXISTS assigned_manager text,
      ADD COLUMN IF NOT EXISTS started_at timestamp without time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS completed_at timestamp without time zone;
  END IF;
END$$;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_workflow_state_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_workflow_state_check
  CHECK (workflow_state IN (
    'pending_review', 'eligible', 'payment_pending', 'payment_completed',
    'documents_pending', 'documents_under_review', 'advisor_assigned',
    'processing', 'submitted_to_authority', 'completed', 'rejected'
  ));

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_payment_state_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_payment_state_check
  CHECK (payment_state IN ('pending', 'completed', 'failed', 'refunded'));

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_review_status_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_review_status_check
  CHECK (review_status IN ('pending', 'uploaded', 'under_review', 'approved', 'rejected', 'needs_resubmission'));

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_state ON public.applications(workflow_state);
CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON public.application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_travel_history_user_id ON public.travel_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

CREATE OR REPLACE FUNCTION public.create_application_from_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_applicant_type text := TG_ARGV[0];
  v_application_type text := TG_ARGV[1];
  v_user_id uuid := CASE WHEN v_applicant_type = 'corporate' THEN new.company_id ELSE new.user_id END;
  v_country text := CASE WHEN v_applicant_type = 'corporate' THEN NULL ELSE new.current_country END;
  v_workflow_state text := coalesce(new.status, 'pending_review');
  v_payment_state text := CASE WHEN coalesce(new.payment_status, 'pending') = 'completed' THEN 'completed' ELSE 'pending' END;
BEGIN
  INSERT INTO public.applications (
    applicant_type,
    user_id,
    advisor_id,
    country,
    application_type,
    eligibility_request_id,
    workflow_state,
    payment_state,
    review_state,
    assigned_manager,
    started_at,
    completed_at,
    created_at
  ) VALUES (
    v_applicant_type,
    v_user_id,
    NULL,
    v_country,
    coalesce(v_application_type, 'trc_eligibility'),
    new.id,
    v_workflow_state,
    v_payment_state,
    coalesce(new.status, 'pending_review'),
    NULL,
    coalesce(new.created_at, now()),
    CASE WHEN v_workflow_state = 'completed' THEN coalesce(new.created_at, now()) ELSE NULL END,
    coalesce(new.created_at, now())
  )
  ON CONFLICT (eligibility_request_id) DO UPDATE
    SET workflow_state = EXCLUDED.workflow_state,
        payment_state = EXCLUDED.payment_state,
        review_state = EXCLUDED.review_state,
        completed_at = EXCLUDED.completed_at;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_application_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.workflow_state IS DISTINCT FROM OLD.workflow_state THEN
    INSERT INTO public.application_status_history (
      application_id,
      previous_state,
      new_state,
      updated_by,
      notes,
      created_at
    ) VALUES (
      NEW.id,
      OLD.workflow_state,
      NEW.workflow_state,
      coalesce(NEW.assigned_manager, COALESCE(NEW.advisor_id::text, 'system')),
      coalesce(NEW.review_state, ''),
      now()
    );

    INSERT INTO public.notifications (
      user_id,
      application_id,
      notification_type,
      title,
      body,
      action_url,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'workflow_update',
      'Application status updated',
      'Your compliance workflow has changed to ' || NEW.workflow_state,
      '/dashboard',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_eligibility_request_created_retail ON public.eligibility_requests;
CREATE TRIGGER on_eligibility_request_created_retail
AFTER INSERT OR UPDATE ON public.eligibility_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_application_from_request('retail', 'trc_eligibility');

DROP TRIGGER IF EXISTS on_corporate_eligibility_request_created ON public.corporate_eligibility_requests;
CREATE TRIGGER on_corporate_eligibility_request_created
AFTER INSERT OR UPDATE ON public.corporate_eligibility_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_application_from_request('corporate', 'trc_eligibility');

DROP TRIGGER IF EXISTS on_application_state_change ON public.applications;
CREATE TRIGGER on_application_state_change
AFTER UPDATE OF workflow_state ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_application_status_history();

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Countries are readable" ON public.countries;
CREATE POLICY "Countries are readable" ON public.countries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Country requirements are readable" ON public.country_requirements;
CREATE POLICY "Country requirements are readable" ON public.country_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Country timelines are readable" ON public.country_timelines;
CREATE POLICY "Country timelines are readable" ON public.country_timelines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Country fees are readable" ON public.country_fees;
CREATE POLICY "Country fees are readable" ON public.country_fees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users see own applications" ON public.applications;
CREATE POLICY "Users see own applications" ON public.applications FOR SELECT USING (auth.uid()::uuid = user_id OR public.is_admin_user() OR public.is_admin_user());

DROP POLICY IF EXISTS "Users update own applications" ON public.applications;
CREATE POLICY "Users update own applications" ON public.applications FOR UPDATE USING (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS "Admins manage applications" ON public.applications;
CREATE POLICY "Admins manage applications" ON public.applications FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Users see own application history" ON public.application_status_history;
CREATE POLICY "Users see own application history" ON public.application_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_status_history.application_id
      AND (a.user_id = auth.uid()::uuid OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Users see own questions" ON public.assessment_questions;
CREATE POLICY "Users see own questions" ON public.assessment_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users see own document requirements" ON public.document_requirements;
CREATE POLICY "Users see own document requirements" ON public.document_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users see own documents" ON public.documents;
CREATE POLICY "Users see own documents" ON public.documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id
      AND (a.user_id = auth.uid()::uuid OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Users insert own documents" ON public.documents;
CREATE POLICY "Users insert own documents" ON public.documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users see own travel history" ON public.travel_history;
CREATE POLICY "Users see own travel history" ON public.travel_history FOR SELECT USING (user_id = auth.uid()::uuid OR public.is_admin_user());

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid()::uuid OR public.is_admin_user()) WITH CHECK (user_id = auth.uid()::uuid OR public.is_admin_user());

GRANT ALL ON TABLE public.countries TO anon;
GRANT ALL ON TABLE public.countries TO authenticated;
GRANT ALL ON TABLE public.countries TO service_role;
GRANT ALL ON TABLE public.country_requirements TO anon;
GRANT ALL ON TABLE public.country_requirements TO authenticated;
GRANT ALL ON TABLE public.country_requirements TO service_role;
GRANT ALL ON TABLE public.country_timelines TO anon;
GRANT ALL ON TABLE public.country_timelines TO authenticated;
GRANT ALL ON TABLE public.country_timelines TO service_role;
GRANT ALL ON TABLE public.country_fees TO anon;
GRANT ALL ON TABLE public.country_fees TO authenticated;
GRANT ALL ON TABLE public.country_fees TO service_role;
GRANT ALL ON TABLE public.applications TO anon;
GRANT ALL ON TABLE public.applications TO authenticated;
GRANT ALL ON TABLE public.applications TO service_role;
GRANT ALL ON TABLE public.application_status_history TO anon;
GRANT ALL ON TABLE public.application_status_history TO authenticated;
GRANT ALL ON TABLE public.application_status_history TO service_role;
GRANT ALL ON TABLE public.assessment_questions TO anon;
GRANT ALL ON TABLE public.assessment_questions TO authenticated;
GRANT ALL ON TABLE public.assessment_questions TO service_role;
GRANT ALL ON TABLE public.document_requirements TO anon;
GRANT ALL ON TABLE public.document_requirements TO authenticated;
GRANT ALL ON TABLE public.document_requirements TO service_role;
GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;
GRANT ALL ON TABLE public.travel_history TO anon;
GRANT ALL ON TABLE public.travel_history TO authenticated;
GRANT ALL ON TABLE public.travel_history TO service_role;
GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

INSERT INTO public.countries (code, name, slug, applicant_types)
VALUES
  ('AE', 'United Arab Emirates', 'uae', ARRAY['retail', 'corporate']),
  ('SG', 'Singapore', 'singapore', ARRAY['corporate']),
  ('PT', 'Portugal', 'portugal', ARRAY['retail', 'corporate']),
  ('MT', 'Malta', 'malta', ARRAY['retail', 'corporate']),
  ('CY', 'Cyprus', 'cyprus', ARRAY['retail', 'corporate'])
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.assessment_questions (section, question, field_type, placeholder, required, country, applicant_type, conditional_logic, sort_order)
VALUES
  ('company_details', 'Company name', 'text', 'Registered company name', true, 'AE', 'corporate', null, 1),
  ('company_details', 'Business email', 'email', 'business@example.com', true, 'AE', 'corporate', null, 2),
  ('residency', 'How many days were spent in the UAE?', 'number', '183', true, 'AE', 'retail', null, 1),
  ('documents', 'Is the applicant a business owner?', 'boolean', 'true/false', true, 'AE', 'retail', '{"showWhen":{"field":"occupation","equals":"business owner"}}', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.document_requirements (country, applicant_type, document_name, required, conditions, category, description, sort_order)
VALUES
  ('AE', 'corporate', 'Trade License', true, '{"business_owner":true}', 'corporate', 'Commercial license or company trade license.', 1),
  ('AE', 'corporate', 'MOA', true, '{"business_owner":true}', 'corporate', 'Memorandum of Association.', 2),
  ('AE', 'corporate', 'Certificate of Incorporation', true, '{"business_owner":true}', 'corporate', 'Incorporation evidence for the entity.', 3),
  ('AE', 'retail', 'Salary Certificate', true, '{"occupation":"employee"}', 'employment', 'Employer-provided salary certificate.', 1),
  ('AE', 'retail', 'Employment Contract', true, '{"occupation":"employee"}', 'employment', 'Current employment agreement.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.country_timelines (country_id, milestone_key, label, estimated_days, sort_order)
SELECT c.id, 'eligibility_review', 'Eligibility review', 2, 1 FROM public.countries c WHERE c.slug = 'uae'
ON CONFLICT DO NOTHING;

INSERT INTO public.country_fees (country_id, fee_key, label, amount, currency, sort_order)
SELECT c.id, 'corporate_review', 'Corporate review fee', 0, 'USD', 1 FROM public.countries c WHERE c.slug = 'uae'
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('trc-private-documents', 'trc-private-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Private document objects are accessible to participants" ON storage.objects;
CREATE POLICY "Private document objects are accessible to participants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trc-private-documents'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Users can upload private document objects" ON storage.objects;
CREATE POLICY "Users can upload private document objects"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trc-private-documents' AND auth.uid() = owner);
