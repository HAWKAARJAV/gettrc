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
  v_country text := CASE
    WHEN v_applicant_type = 'corporate' THEN NULL
    ELSE NULLIF(v_row->>'current_country', '')
  END;
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
    CASE WHEN v_workflow_state = 'completed' THEN coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now()) ELSE NULL END,
    coalesce((NULLIF(v_row->>'created_at', ''))::timestamp without time zone, now())
  )
  ON CONFLICT (eligibility_request_id) DO UPDATE
    SET workflow_state = EXCLUDED.workflow_state,
        payment_state = EXCLUDED.payment_state,
        review_state = EXCLUDED.review_state,
        completed_at = EXCLUDED.completed_at;

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
