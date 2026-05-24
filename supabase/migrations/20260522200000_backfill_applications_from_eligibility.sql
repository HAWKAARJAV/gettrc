-- Backfill applications from legacy eligibility_requests
-- Inserts applications for retail eligibility_requests which do not yet have an applications row

WITH to_insert AS (
  SELECT
    gen_random_uuid() AS id,
    'retail'::text AS applicant_type,
    er.user_id,
    NULL::uuid AS advisor_id,
    er.current_country AS country,
    'trc_eligibility'::text AS application_type,
    er.id AS eligibility_request_id,
    COALESCE(er.status, 'pending_review')::text AS workflow_state,
    CASE WHEN coalesce(er.payment_status,'pending') = 'completed' THEN 'completed'::text ELSE 'pending'::text END AS payment_state,
    COALESCE(er.status, 'pending_review')::text AS review_state,
    NULL::text AS assigned_manager,
    er.created_at AS started_at,
    CASE WHEN COALESCE(er.status,'') IN ('payment_completed','completed') THEN er.created_at ELSE NULL END AS completed_at,
    er.created_at AS created_at,
    er.id AS legacy_request_id
  FROM public.eligibility_requests er
  LEFT JOIN public.applications a ON a.eligibility_request_id = er.id
  WHERE a.id IS NULL
)
INSERT INTO public.applications (
  id, applicant_type, user_id, advisor_id, country, application_type, eligibility_request_id,
  workflow_state, payment_state, review_state, assigned_manager, started_at, completed_at, created_at
)
SELECT id, applicant_type, user_id, advisor_id, country, application_type, eligibility_request_id,
  workflow_state, payment_state, review_state, assigned_manager, started_at, completed_at, created_at
FROM to_insert
ON CONFLICT (eligibility_request_id) DO NOTHING;

WITH to_insert AS (
  SELECT
    gen_random_uuid() AS id,
    er.id AS legacy_request_id,
    COALESCE(er.status, 'pending_review')::text AS workflow_state,
    er.created_at AS created_at
  FROM public.eligibility_requests er
  LEFT JOIN public.applications a ON a.eligibility_request_id = er.id
  WHERE a.id IS NULL
)
INSERT INTO public.application_status_history (id, application_id, previous_state, new_state, updated_by, notes, created_at)
SELECT
  gen_random_uuid(),
  a.id,
  NULL,
  to_insert.workflow_state,
  'system',
  'Backfilled from eligibility_requests',
  to_insert.created_at
FROM public.applications a
JOIN to_insert ON a.eligibility_request_id = to_insert.legacy_request_id;
