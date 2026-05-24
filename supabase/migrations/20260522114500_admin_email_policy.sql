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

CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') = 'hawkwilds09@gmail.com';
$$;

DROP POLICY IF EXISTS "Eligibility users see own requests" ON public.eligibility_requests;
CREATE POLICY "Eligibility users see own requests"
  ON public.eligibility_requests
  FOR SELECT
  USING (auth.uid()::uuid = user_id OR public.is_admin_user() OR public.is_admin_email());

DROP POLICY IF EXISTS "Eligibility admins manage requests" ON public.eligibility_requests;
CREATE POLICY "Eligibility admins manage requests"
  ON public.eligibility_requests
  FOR ALL
  USING (public.is_admin_user() OR public.is_admin_email())
  WITH CHECK (public.is_admin_user() OR public.is_admin_email());

DROP POLICY IF EXISTS "Profiles admins can view" ON public.profiles;
CREATE POLICY "Profiles admins can view"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin_user() OR public.is_admin_email());

DROP POLICY IF EXISTS "Profiles admins can update" ON public.profiles;
CREATE POLICY "Profiles admins can update"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin_user() OR public.is_admin_email());

DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "Users see own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::uuid = id OR public.is_admin_user() OR public.is_admin_email());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::uuid = id OR public.is_admin_user() OR public.is_admin_email());

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
  IF user_role = 'retail' THEN
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

GRANT EXECUTE ON FUNCTION public.is_admin_email() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_email() TO service_role;

GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO service_role;
