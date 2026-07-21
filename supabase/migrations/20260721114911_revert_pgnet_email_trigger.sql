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

-- Revert the pg_net webhook call added in 20260721113513. Live testing
-- showed it fires inconsistently (confirmed via Vercel logs: only 1 of 3
-- consecutive workflow_state transitions actually reached the webhook, with
-- no visibility into pg_net's internal queue to diagnose why from outside
-- the DB). An unreliable side channel is worse than none — it creates false
-- confidence that emails are covered.
--
-- The real fix lives at the application layer instead: src/AdminDashboard.jsx
-- now routes its quick-action buttons (Approve Eligibility, Reject, Mark
-- Payment Done, etc.) through the existing updateWorkflowState/
-- updatePaymentState mutation service (api/updateApplicationState.js) rather
-- than a raw dbPatch — that path was verified live to reliably call
-- sendStatusEmail() every time (confirmed via Vercel function logs showing
-- "[sendStatusEmail] Email sent").

CREATE OR REPLACE FUNCTION public.sync_application_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.workflow_state IS DISTINCT FROM OLD.workflow_state THEN
    INSERT INTO public.application_status_history (
      application_id,
      previous_state,
      new_state,
      updated_by,
      notes,
      created_at
    ) VALUES (
      NEW.id,
      OLD.workflow_state,
      NEW.workflow_state,
      coalesce(NEW.assigned_manager, COALESCE(NEW.advisor_id::text, 'system')),
      coalesce(NEW.review_state, ''),
      now()
    );

    INSERT INTO public.notifications (
      user_id,
      application_id,
      notification_type,
      title,
      body,
      action_url,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'workflow_update',
      'Application status updated',
      'Your compliance workflow has changed to ' || NEW.workflow_state,
      '/dashboard',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;
