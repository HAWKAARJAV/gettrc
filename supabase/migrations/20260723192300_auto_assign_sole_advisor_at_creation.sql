-- Product decision: there's exactly one advisor account now (advisor1@gmail.com)
-- and every application should reach them immediately, not just after
-- payment — the advisor drives eligibility determination, document review,
-- and filing directly; admin becomes monitor-only.
--
-- create_application_from_request() already runs on every new
-- eligibility_requests/corporate_eligibility_requests row. After its
-- existing INSERT/UPSERT into applications, additionally auto-assign
-- advisor_id (not workflow_state — that still only transitions to
-- 'advisor_assigned' via the payment-completion path in _shared.js, so the
-- existing "assign unlocks after payment" semantics elsewhere in the admin
-- UI keep working) to the sole available+verified advisor, when exactly one
-- exists and the case has none yet. If a second advisor is ever added, this
-- intentionally backs off rather than guessing.

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
  v_app_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'create_application_from_request could not determine the parent user id',
      DETAIL = format('applicant_type=%s row=%s', coalesce(v_applicant_type, '<unknown>'), v_row::text);
  END IF;

  IF v_applicant_type = 'corporate' THEN
    INSERT INTO public.applications (
      applicant_type, user_id, advisor_id, country, application_type,
      eligibility_request_id, workflow_state, payment_state, review_state,
      assigned_manager, started_at, completed_at, created_at
    ) VALUES (
      v_applicant_type, v_user_id, NULL, v_country, coalesce(v_application_type, 'trc_eligibility'),
      NULL, v_workflow_state, v_payment_state, coalesce(NULLIF(v_row->>'status', ''), 'pending_review'),
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
          completed_at   = EXCLUDED.completed_at
    RETURNING id INTO v_app_id;

  ELSE
    INSERT INTO public.applications (
      applicant_type, user_id, advisor_id, country, application_type,
      eligibility_request_id, workflow_state, payment_state, review_state,
      assigned_manager, started_at, completed_at, created_at
    ) VALUES (
      v_applicant_type, v_user_id, NULL, v_country, coalesce(v_application_type, 'trc_eligibility'),
      new.id, v_workflow_state, v_payment_state, coalesce(NULLIF(v_row->>'status', ''), 'pending_review'),
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
          completed_at   = EXCLUDED.completed_at
    RETURNING id INTO v_app_id;

  END IF;

  -- Auto-assign the sole advisor immediately, regardless of workflow_state,
  -- so they see every case from pending_review onward. Only when exactly one
  -- available+verified advisor exists and none is assigned yet.
  IF v_app_id IS NOT NULL THEN
    UPDATE public.applications a
    SET advisor_id = sole.user_id,
        advisor_assigned_at = coalesce(a.advisor_assigned_at, now())
    FROM (SELECT user_id FROM public.advisors WHERE available AND verified) AS sole
    WHERE a.id = v_app_id
      AND a.advisor_id IS NULL
      AND (SELECT count(*) FROM public.advisors WHERE available AND verified) = 1;
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

-- Backfill: assign the sole advisor to every existing case that has none yet,
-- so this applies retroactively, not just to new signups.
UPDATE public.applications a
SET advisor_id = sole.user_id,
    advisor_assigned_at = coalesce(a.advisor_assigned_at, now())
FROM (SELECT user_id FROM public.advisors WHERE available AND verified) AS sole
WHERE a.advisor_id IS NULL
  AND (SELECT count(*) FROM public.advisors WHERE available AND verified) = 1;
