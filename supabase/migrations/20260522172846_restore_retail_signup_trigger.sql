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
    coalesce(metadata->>'full_name', metadata->>'name', split_part(coalesce(new.email, ''), '@', 1)),
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

DROP TRIGGER IF EXISTS on_auth_user_created_retail ON auth.users;
CREATE TRIGGER on_auth_user_created_retail
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_retail_user();

GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO service_role;
