-- Backfill: keep applications.review_state in lock-step with workflow_state.
--
-- review_state is a legacy mirror of workflow_state. The admin retail queue
-- reads review_state first, while the advisor and retail/corporate client
-- views read workflow_state first. Three mutation endpoints
-- (assignAdvisor, updatePaymentState, stripeWebhook) historically wrote only
-- workflow_state, letting the two columns drift — so the same case could show
-- e.g. "advisor_assigned" to the advisor but "pending_review" to the admin.
--
-- Those endpoints now write both columns together. This migration repairs the
-- rows that drifted before that fix, so no existing case is left inconsistent.
UPDATE public.applications
SET review_state = workflow_state
WHERE workflow_state IS NOT NULL
  AND review_state IS DISTINCT FROM workflow_state;
