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

CREATE TABLE IF NOT EXISTS public.corporate_profiles (
    id uuid NOT NULL,
    company_name text,
    business_email text,
    phone text,
    registered_country text,
    industry text,
    website text,
    role text DEFAULT 'corporate'::text,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corporate_eligibility_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    entity_type text,
    employee_count integer,
    annual_revenue text,
    countries_of_operation text,
    uae_presence text,
    purpose text,
    target_jurisdiction text,
    urgency text,
    tax_structure text,
    use_case text,
    status text DEFAULT 'pending_review'::text,
    review_notes text,
    payment_status text DEFAULT 'pending'::text,
    assigned_specialist text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.corporate_profiles OWNER TO postgres;
ALTER TABLE public.corporate_eligibility_requests OWNER TO postgres;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_profiles_pkey') THEN
    ALTER TABLE ONLY public.corporate_profiles ADD CONSTRAINT corporate_profiles_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_profiles_id_fkey') THEN
    ALTER TABLE ONLY public.corporate_profiles ADD CONSTRAINT corporate_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_eligibility_requests_pkey') THEN
    ALTER TABLE ONLY public.corporate_eligibility_requests ADD CONSTRAINT corporate_eligibility_requests_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_eligibility_requests_company_id_key') THEN
    ALTER TABLE ONLY public.corporate_eligibility_requests ADD CONSTRAINT corporate_eligibility_requests_company_id_key UNIQUE (company_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_eligibility_requests_company_id_fkey') THEN
    ALTER TABLE ONLY public.corporate_eligibility_requests ADD CONSTRAINT corporate_eligibility_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.corporate_profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

ALTER TABLE public.corporate_eligibility_requests
  DROP CONSTRAINT IF EXISTS corporate_eligibility_requests_status_check;

ALTER TABLE public.corporate_eligibility_requests
  ADD CONSTRAINT corporate_eligibility_requests_status_check
  CHECK (status IN ('pending_review', 'eligible', 'needs_consultation', 'rejected', 'payment_pending', 'payment_completed'));

ALTER TABLE public.corporate_eligibility_requests
  DROP CONSTRAINT IF EXISTS corporate_eligibility_requests_payment_status_check;

ALTER TABLE public.corporate_eligibility_requests
  ADD CONSTRAINT corporate_eligibility_requests_payment_status_check
  CHECK (payment_status IN ('pending', 'completed'));

CREATE INDEX IF NOT EXISTS idx_corporate_eligibility_requests_company_id ON public.corporate_eligibility_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_eligibility_requests_status ON public.corporate_eligibility_requests(status);

CREATE OR REPLACE FUNCTION public.handle_new_retail_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  user_role text := coalesce(metadata->>'role', 'retail');
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    nationality,
    role,
    eligibility_status
  ) VALUES (
    new.id,
    coalesce(metadata->>'full_name', metadata->>'name', metadata->>'company_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    metadata->>'phone',
    metadata->>'nationality',
    user_role,
    coalesce(metadata->>'eligibility_status', 'pending_review')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        nationality = EXCLUDED.nationality,
        role = EXCLUDED.role,
        eligibility_status = EXCLUDED.eligibility_status;

  IF user_role = 'corporate' THEN
    INSERT INTO public.corporate_profiles (
      id,
      company_name,
      business_email,
      phone,
      registered_country,
      industry,
      website,
      role
    ) VALUES (
      new.id,
      coalesce(metadata->>'company_name', metadata->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
      coalesce(metadata->>'business_email', new.email),
      metadata->>'phone',
      metadata->>'registered_country',
      metadata->>'industry',
      metadata->>'website',
      user_role
    )
    ON CONFLICT (id) DO UPDATE
      SET company_name = EXCLUDED.company_name,
          business_email = EXCLUDED.business_email,
          phone = EXCLUDED.phone,
          registered_country = EXCLUDED.registered_country,
          industry = EXCLUDED.industry,
          website = EXCLUDED.website,
          role = EXCLUDED.role;

    INSERT INTO public.corporate_eligibility_requests (
      company_id,
      entity_type,
      employee_count,
      annual_revenue,
      countries_of_operation,
      uae_presence,
      purpose,
      target_jurisdiction,
      urgency,
      tax_structure,
      use_case,
      status,
      review_notes,
      payment_status,
      assigned_specialist
    ) VALUES (
      new.id,
      metadata->>'entity_type',
      nullif(metadata->>'employee_count', '')::integer,
      metadata->>'annual_revenue',
      metadata->>'countries_of_operation',
      metadata->>'uae_presence',
      metadata->>'purpose',
      metadata->>'target_jurisdiction',
      metadata->>'urgency',
      metadata->>'tax_structure',
      metadata->>'use_case',
      coalesce(metadata->>'eligibility_status', 'pending_review'),
      '',
      'pending',
      null
    )
    ON CONFLICT (company_id) DO UPDATE
      SET entity_type = EXCLUDED.entity_type,
          employee_count = EXCLUDED.employee_count,
          annual_revenue = EXCLUDED.annual_revenue,
          countries_of_operation = EXCLUDED.countries_of_operation,
          uae_presence = EXCLUDED.uae_presence,
          purpose = EXCLUDED.purpose,
          target_jurisdiction = EXCLUDED.target_jurisdiction,
          urgency = EXCLUDED.urgency,
          tax_structure = EXCLUDED.tax_structure,
          use_case = EXCLUDED.use_case,
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status;
  ELSE
    INSERT INTO public.eligibility_requests (
      user_id,
      current_country,
      uae_visa,
      emirates_id,
      days_in_uae,
      visa_type,
      occupation,
      income_source,
      purpose,
      urgency,
      status,
      review_notes,
      payment_status
    ) VALUES (
      new.id,
      metadata->>'current_country',
      metadata->>'uae_visa',
      metadata->>'emirates_id',
      nullif(metadata->>'days_in_uae', '')::integer,
      metadata->>'visa_type',
      metadata->>'occupation',
      metadata->>'income_source',
      metadata->>'purpose',
      metadata->>'urgency',
      coalesce(metadata->>'eligibility_status', 'pending_review'),
      '',
      'pending'
    )
    ON CONFLICT (user_id) DO UPDATE
      SET current_country = EXCLUDED.current_country,
          uae_visa = EXCLUDED.uae_visa,
          emirates_id = EXCLUDED.emirates_id,
          days_in_uae = EXCLUDED.days_in_uae,
          visa_type = EXCLUDED.visa_type,
          occupation = EXCLUDED.occupation,
          income_source = EXCLUDED.income_source,
          purpose = EXCLUDED.purpose,
          urgency = EXCLUDED.urgency,
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_retail ON auth.users;
CREATE TRIGGER on_auth_user_created_retail
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_retail_user();

ALTER TABLE public.corporate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_eligibility_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corporate users see own profile" ON public.corporate_profiles;
CREATE POLICY "Corporate users see own profile"
  ON public.corporate_profiles
  FOR SELECT
  USING (auth.uid()::uuid = id OR public.is_admin_user());

DROP POLICY IF EXISTS "Corporate users update own profile" ON public.corporate_profiles;
CREATE POLICY "Corporate users update own profile"
  ON public.corporate_profiles
  FOR UPDATE
  USING (auth.uid()::uuid = id);

DROP POLICY IF EXISTS "Corporate users see own requests" ON public.corporate_eligibility_requests;
CREATE POLICY "Corporate users see own requests"
  ON public.corporate_eligibility_requests
  FOR SELECT
  USING (auth.uid()::uuid = company_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Corporate admins manage requests" ON public.corporate_eligibility_requests;
CREATE POLICY "Corporate admins manage requests"
  ON public.corporate_eligibility_requests
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

GRANT ALL ON TABLE public.corporate_profiles TO anon;
GRANT ALL ON TABLE public.corporate_profiles TO authenticated;
GRANT ALL ON TABLE public.corporate_profiles TO service_role;
GRANT ALL ON TABLE public.corporate_eligibility_requests TO anon;
GRANT ALL ON TABLE public.corporate_eligibility_requests TO authenticated;
GRANT ALL ON TABLE public.corporate_eligibility_requests TO service_role;

GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO service_role;