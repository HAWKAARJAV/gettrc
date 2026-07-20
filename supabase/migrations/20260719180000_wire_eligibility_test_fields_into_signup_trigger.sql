-- Consolidated trigger update for the eligibility rebuild (Phase 1 + Phase
-- 2 field wiring). handle_new_retail_user() handles BOTH retail and
-- corporate signups in one function — deliberately deferred until now,
-- after both phases' ALTER TABLE migrations landed, so a single
-- CREATE OR REPLACE wires both sets of new columns rather than two
-- migrations racing to redefine the same function and clobbering each
-- other. This is a straight copy of the function body from
-- 20260719000000_retail_trc_questionnaire_fields.sql with only the new
-- column reads/writes added — no other logic changed.

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
  user_role text := lower(coalesce(nullif(metadata->>'role', ''), 'retail'));
  retail_days_text text := nullif(metadata->>'days_in_uae', '');
  corporate_employee_count_text text := nullif(metadata->>'employee_count', '');
BEGIN
  -- Always create/update the base profile row first.
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
    IF to_regclass('public.corporate_profiles') IS NULL OR to_regclass('public.corporate_eligibility_requests') IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'Corporate signup trigger failed because corporate tables are missing.',
        DETAIL = 'Expected public.corporate_profiles and public.corporate_eligibility_requests to exist.';
    END IF;

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
      incorporation_date,
      incorporation_location,
      has_corporate_tax_trn,
      corporate_tax_trn,
      has_filed_corporate_tax_return,
      trc_purpose,
      target_treaty_country,
      effective_management_statement,
      board_meetings_in_uae,
      key_decision_makers_in_uae,
      status,
      review_notes,
      payment_status,
      assigned_specialist
    ) VALUES (
      new.id,
      metadata->>'entity_type',
      CASE
        WHEN corporate_employee_count_text ~ '^[0-9]+$' THEN corporate_employee_count_text::integer
        ELSE NULL
      END,
      metadata->>'annual_revenue',
      metadata->>'countries_of_operation',
      metadata->>'uae_presence',
      metadata->>'purpose',
      metadata->>'target_jurisdiction',
      metadata->>'urgency',
      metadata->>'tax_structure',
      metadata->>'use_case',
      nullif(metadata->>'incorporation_date', '')::date,
      metadata->>'incorporation_location',
      metadata->>'has_corporate_tax_trn',
      metadata->>'corporate_tax_trn',
      metadata->>'has_filed_corporate_tax_return',
      metadata->>'trc_purpose',
      metadata->>'target_treaty_country',
      metadata->>'effective_management_statement',
      metadata->>'board_meetings_in_uae',
      metadata->>'key_decision_makers_in_uae',
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
          incorporation_date = EXCLUDED.incorporation_date,
          incorporation_location = EXCLUDED.incorporation_location,
          has_corporate_tax_trn = EXCLUDED.has_corporate_tax_trn,
          corporate_tax_trn = EXCLUDED.corporate_tax_trn,
          has_filed_corporate_tax_return = EXCLUDED.has_filed_corporate_tax_return,
          trc_purpose = EXCLUDED.trc_purpose,
          target_treaty_country = EXCLUDED.target_treaty_country,
          effective_management_statement = EXCLUDED.effective_management_statement,
          board_meetings_in_uae = EXCLUDED.board_meetings_in_uae,
          key_decision_makers_in_uae = EXCLUDED.key_decision_makers_in_uae,
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status;

  ELSIF user_role = 'retail' THEN
    IF to_regclass('public.eligibility_requests') IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'Retail signup trigger failed because eligibility_requests is missing.',
        DETAIL = 'Expected public.eligibility_requests to exist.';
    END IF;

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
      vat_registered,
      trc_period_year,
      meets_183_days,
      trc_purpose,
      treaty_country,
      has_permanent_residence,
      has_uae_employment_or_business,
      is_centre_of_interests,
      status,
      review_notes,
      payment_status
    ) VALUES (
      new.id,
      metadata->>'current_country',
      metadata->>'uae_visa',
      metadata->>'emirates_id',
      CASE
        WHEN retail_days_text ~ '^[0-9]+$' THEN retail_days_text::integer
        ELSE NULL
      END,
      metadata->>'visa_type',
      metadata->>'occupation',
      metadata->>'income_source',
      metadata->>'purpose',
      metadata->>'urgency',
      metadata->>'vat_registered',
      metadata->>'trc_period_year',
      metadata->>'meets_183_days',
      metadata->>'trc_purpose',
      metadata->>'treaty_country',
      metadata->>'has_permanent_residence',
      metadata->>'has_uae_employment_or_business',
      metadata->>'is_centre_of_interests',
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
          vat_registered = EXCLUDED.vat_registered,
          trc_period_year = EXCLUDED.trc_period_year,
          meets_183_days = EXCLUDED.meets_183_days,
          trc_purpose = EXCLUDED.trc_purpose,
          treaty_country = EXCLUDED.treaty_country,
          has_permanent_residence = EXCLUDED.has_permanent_residence,
          has_uae_employment_or_business = EXCLUDED.has_uae_employment_or_business,
          is_centre_of_interests = EXCLUDED.is_centre_of_interests,
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status;
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION USING
      ERRCODE = SQLSTATE,
      MESSAGE = format('handle_new_retail_user failed for email=%s role=%s', coalesce(new.email, '<unknown>'), coalesce(user_role, '<unknown>')),
      DETAIL = SQLERRM,
      HINT = 'Check the profile and eligibility table schemas, and verify trigger metadata values.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_retail_user() TO service_role;
