-- UAE-only product decision: the platform no longer supports multi-country
-- jurisdiction selection. This migration:
--   1. Drops the unused multi-country reference tables (country_requirements,
--      country_timelines, country_fees, countries) that backed the old
--      "which country" platform selector. These tables are not queried
--      anywhere in application code (grep confirmed no `.from('countries')`
--      or similar reads outside of their own creation/seed migration,
--      20260522194500_phase2_operational_core.sql) — they only ever seeded
--      themselves and fed the (now removed) country picker.
--   2. Normalizes and locks `public.applications.country` and
--      `public.advisors.country` to 'AE' going forward via DEFAULT + CHECK.
--   3. Re-points `create_application_from_request()` to hardcode country
--      to 'AE' instead of deriving it from `current_country`, matching the
--      UAE-only product decision.
--
-- NOTE: this migration is provided for manual review only. It has not been
-- applied/run against any database as part of this change.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ---------------------------------------------------------------------------
-- 1. Drop unused multi-country reference tables.
--    Child tables first (FK -> countries), then countries itself.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.country_requirements CASCADE;
DROP TABLE IF EXISTS public.country_timelines CASCADE;
DROP TABLE IF EXISTS public.country_fees CASCADE;

-- public.countries: dropped only after confirming (via repo-wide grep) that
-- no application code or other migration reads from it beyond the three
-- child tables above, which are dropped first. If a future audit finds a
-- live dependency on public.countries that this migration missed, that
-- dependency must be removed/migrated before this DROP is applied.
DROP TABLE IF EXISTS public.countries CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Normalize existing data, then lock applications.country and
--    advisors.country to 'AE'.
-- ---------------------------------------------------------------------------

-- Normalize any existing non-UAE / null values before adding the CHECK
-- constraint, so this migration is internally consistent and would not fail
-- if applied against data seeded during the old multi-country era.
UPDATE public.applications SET country = 'AE' WHERE country IS DISTINCT FROM 'AE';
UPDATE public.advisors SET country = 'AE' WHERE country IS DISTINCT FROM 'AE';

ALTER TABLE public.applications ALTER COLUMN country SET DEFAULT 'AE';
ALTER TABLE public.advisors ALTER COLUMN country SET DEFAULT 'AE';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_country_uae_only') THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_country_uae_only CHECK (country = 'AE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advisors_country_uae_only') THEN
    ALTER TABLE public.advisors
      ADD CONSTRAINT advisors_country_uae_only CHECK (country = 'AE');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Hardcode create_application_from_request() to 'AE' instead of deriving
--    country from current_country. This CREATE OR REPLACE targets the same
--    function signature/body last defined in
--    20260526000000_fix_corporate_application_trigger.sql, with only the
--    v_country derivation changed. It is self-contained and safe to redefine
--    here (rather than editing the historical migration file).
--
--    NOTE: `assessment_questions.country` and the retail/corporate
--    eligibility-request backfill migrations that copy `current_country` /
--    `registered_country` into `applications.country` are intentionally left
--    untouched — those columns are applicant-context fields, not the
--    platform's country selector, and the CHECK constraint above already
--    guarantees `applications.country` can only ever be 'AE' regardless of
--    what those upstream columns contain.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_application_from_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_applicant_type text := TG_ARGV[0];
  v_application_type text := TG_ARGV[1];
  v_row jsonb := to_jsonb(new);
  v_user_id uuid := CASE
    WHEN v_applicant_type = 'corporate' THEN NULLIF(v_row->>'company_id', '')::uuid
    ELSE NULLIF(v_row->>'user_id', '')::uuid
  END;
  -- UAE-only product: country is always 'AE', no longer derived from
  -- new.current_country.
  v_country text := 'AE';
  v_workflow_state text := coalesce(NULLIF(v_row->>'status', ''), 'pending_review');
  v_payment_state text := CASE
    WHEN coalesce(NULLIF(v_row->>'payment_status', ''), 'pending') = 'completed' THEN 'completed'
    ELSE 'pending'
  END;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'create_application_from_request could not determine the parent user id',
      DETAIL = format('applicant_type=%s row=%s', coalesce(v_applicant_type, '<unknown>'), v_row::text);
  END IF;

  IF v_applicant_type = 'corporate' THEN
    -- Corporate: eligibility_request_id FK points to retail-only eligibility_requests table.
    -- Set NULL and upsert on the (user_id, applicant_type) unique constraint instead.
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
      NULL,
      v_workflow_state,
      v_payment_state,
      coalesce(NULLIF(v_row->>'status', ''), 'pending_review'),
      NULL,
      coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now()),
      CASE WHEN v_workflow_state = 'completed'
        THEN coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now())
        ELSE NULL
      END,
      coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now())
    )
    ON CONFLICT (user_id, applicant_type) DO UPDATE
      SET workflow_state = EXCLUDED.workflow_state,
          payment_state  = EXCLUDED.payment_state,
          review_state   = EXCLUDED.review_state,
          completed_at   = EXCLUDED.completed_at;

  ELSE
    -- Retail: use eligibility_request_id (valid FK to eligibility_requests table)
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
      coalesce(NULLIF(v_row->>'status', ''), 'pending_review'),
      NULL,
      coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now()),
      CASE WHEN v_workflow_state = 'completed'
        THEN coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now())
        ELSE NULL
      END,
      coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now())
    )
    ON CONFLICT (eligibility_request_id) DO UPDATE
      SET workflow_state = EXCLUDED.workflow_state,
          payment_state  = EXCLUDED.payment_state,
          review_state   = EXCLUDED.review_state,
          completed_at   = EXCLUDED.completed_at;

  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION USING
      ERRCODE = SQLSTATE,
      MESSAGE = format('create_application_from_request failed for applicant_type=%s', coalesce(v_applicant_type, '<unknown>')),
      DETAIL = SQLERRM,
      HINT = 'Check the request table schema and trigger arguments.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application_from_request() TO anon;
GRANT EXECUTE ON FUNCTION public.create_application_from_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_application_from_request() TO service_role;
