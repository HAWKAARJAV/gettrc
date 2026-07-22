-- Two independent production bugs found via a full end-to-end Playwright
-- flow test (registration -> approval -> payment -> documents):
--
-- 1. applications.payment_details does not exist, but both
--    api/updateApplicationState.js (handlePaymentState) and
--    api/stripeWebhook.js write to it. Every "Mark Payment Done" admin click
--    (and every real future Stripe webhook) was throwing 42703 and failing
--    silently -- masked because an unrelated auto-cascade trigger moved
--    workflow_state forward anyway, so no history entry/email was ever
--    recorded for the payment step. Fix: add the column.
--
-- 2. create_application_from_request() (fires AFTER INSERT OR UPDATE on
--    eligibility_requests / corporate_eligibility_requests) copies
--    NEW.status verbatim into applications.workflow_state. But
--    mapApplicationWorkflowToLegacyStatus() (src/workflow/legacyRequestSync.js)
--    deliberately translates modern workflow states into legacy-only status
--    strings that were never valid workflow_state values, e.g.
--    documents_under_review -> 'needs_more_info' (retail) /
--    'needs_consultation' (corporate). When that legacy write lands, this
--    trigger fires again and tries to upsert workflow_state = 'needs_more_info',
--    which violates applications_workflow_state_check. Reproduced live: a
--    retail document upload advanced the application to
--    documents_under_review, which synced to eligibility_requests.status =
--    'needs_more_info', which then blew up this trigger.
--    Fix: sanitize the copied status through an explicit map before use, so
--    the trigger can never attempt to write a value outside the CHECK
--    constraint's allowed list. Unrecognized values fall back to
--    'pending_review' rather than raising.

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_details jsonb;

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
  v_country text := 'AE';
  v_raw_status text := coalesce(NULLIF(v_row->>'status', ''), 'pending_review');
  -- Legacy eligibility_requests.status uses a wider vocabulary than
  -- applications.workflow_state's CHECK constraint allows (e.g.
  -- 'needs_more_info', 'needs_consultation' are legacy-only, produced by
  -- mapApplicationWorkflowToLegacyStatus() and never meant to be read back
  -- as a workflow_state). Map explicitly so this can never violate
  -- applications_workflow_state_check.
  v_workflow_state text := CASE coalesce(NULLIF(v_row->>'status', ''), 'pending_review')
    WHEN 'pending_review' THEN 'pending_review'
    WHEN 'eligible' THEN 'eligible'
    WHEN 'payment_pending' THEN 'payment_pending'
    WHEN 'payment_completed' THEN 'payment_completed'
    WHEN 'documents_pending' THEN 'documents_pending'
    WHEN 'documents_under_review' THEN 'documents_under_review'
    WHEN 'advisor_assigned' THEN 'advisor_assigned'
    WHEN 'processing' THEN 'processing'
    WHEN 'submitted_to_authority' THEN 'submitted_to_authority'
    WHEN 'completed' THEN 'completed'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'needs_more_info' THEN 'documents_pending'
    WHEN 'needs_consultation' THEN 'documents_pending'
    ELSE 'pending_review'
  END;
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
