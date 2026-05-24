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

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS eligibility_status text DEFAULT 'pending_review';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_eligibility_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_eligibility_status_check
  CHECK (eligibility_status IN ('pending_review', 'eligible', 'rejected', 'needs_more_info', 'payment_pending', 'payment_completed'));

CREATE TABLE IF NOT EXISTS public.eligibility_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_country text,
    uae_visa text,
    emirates_id text,
    days_in_uae integer,
    visa_type text,
    occupation text,
    income_source text,
    purpose text,
    urgency text,
    status text DEFAULT 'pending_review'::text,
    review_notes text,
    payment_status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.eligibility_requests OWNER TO postgres;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eligibility_requests_pkey') THEN
    ALTER TABLE ONLY public.eligibility_requests ADD CONSTRAINT eligibility_requests_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eligibility_requests_user_id_key') THEN
    ALTER TABLE ONLY public.eligibility_requests ADD CONSTRAINT eligibility_requests_user_id_key UNIQUE (user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eligibility_requests_user_id_fkey') THEN
    ALTER TABLE ONLY public.eligibility_requests ADD CONSTRAINT eligibility_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

ALTER TABLE public.eligibility_requests
  DROP CONSTRAINT IF EXISTS eligibility_requests_status_check;

ALTER TABLE public.eligibility_requests
  ADD CONSTRAINT eligibility_requests_status_check
  CHECK (status IN ('pending_review', 'eligible', 'rejected', 'needs_more_info', 'payment_pending', 'payment_completed'));

ALTER TABLE public.eligibility_requests
  DROP CONSTRAINT IF EXISTS eligibility_requests_payment_status_check;

ALTER TABLE public.eligibility_requests
  ADD CONSTRAINT eligibility_requests_payment_status_check
  CHECK (payment_status IN ('pending', 'completed'));

CREATE INDEX IF NOT EXISTS idx_eligibility_requests_user_id ON public.eligibility_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_requests_status ON public.eligibility_requests(status);

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()::uuid
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_retail_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
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
    coalesce(metadata->>'full_name', metadata->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    metadata->>'phone',
    metadata->>'nationality',
    coalesce(metadata->>'role', 'retail'),
    coalesce(metadata->>'eligibility_status', 'pending_review')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        nationality = EXCLUDED.nationality,
        role = EXCLUDED.role,
        eligibility_status = EXCLUDED.eligibility_status;

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

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_retail ON auth.users;
CREATE TRIGGER on_auth_user_created_retail
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_retail_user();

ALTER TABLE public.eligibility_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eligibility users see own requests" ON public.eligibility_requests;
CREATE POLICY "Eligibility users see own requests"
  ON public.eligibility_requests
  FOR SELECT
  USING (auth.uid()::uuid = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Eligibility admins manage requests" ON public.eligibility_requests;
CREATE POLICY "Eligibility admins manage requests"
  ON public.eligibility_requests
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Profiles admins can view" ON public.profiles;
CREATE POLICY "Profiles admins can view"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Profiles admins can update" ON public.profiles;
CREATE POLICY "Profiles admins can update"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "Users see own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::uuid = id OR public.is_admin_user());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::uuid = id);

GRANT ALL ON TABLE public.eligibility_requests TO anon;
GRANT ALL ON TABLE public.eligibility_requests TO authenticated;
GRANT ALL ON TABLE public.eligibility_requests TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO service_role;

GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO service_role;