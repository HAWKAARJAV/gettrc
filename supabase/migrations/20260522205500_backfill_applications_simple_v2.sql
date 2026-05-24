-- Backfill applications (simple) without assuming application_status_history exists

INSERT INTO public.applications (
  id, applicant_type, user_id, advisor_id, country, application_type, eligibility_request_id,
  workflow_state, payment_state, review_state, assigned_manager, started_at, completed_at, created_at
)
SELECT
  gen_random_uuid(),
  'retail'::text,
  er.user_id,
  NULL::uuid,
  er.current_country,
  'trc_eligibility'::text,
  er.id,
  COALESCE(er.status, 'pending_review')::text,
  CASE WHEN coalesce(er.payment_status,'pending') = 'completed' THEN 'completed'::text ELSE 'pending'::text END,
  COALESCE(er.status, 'pending_review')::text,
  NULL::text,
  er.created_at,
  CASE WHEN COALESCE(er.status,'') IN ('payment_completed','completed') THEN er.created_at ELSE NULL END,
  er.created_at
FROM public.eligibility_requests er
LEFT JOIN public.applications a ON a.eligibility_request_id = er.id
WHERE a.id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='application_status_history') THEN
    INSERT INTO public.application_status_history (id, application_id, previous_state, new_state, updated_by, notes, created_at)
    SELECT gen_random_uuid(), a.id, NULL, a.workflow_state, 'system', 'Backfilled from eligibility_requests', a.created_at
    FROM public.applications a
    JOIN public.eligibility_requests er ON a.eligibility_request_id = er.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.application_status_history h WHERE h.application_id = a.id AND h.notes = 'Backfilled from eligibility_requests'
    );
  END IF;
END$$;
