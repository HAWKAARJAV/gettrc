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

-- The client-facing status emails (EMAIL_CONTENT in api/_sendStatusEmail.js)
-- were only ever sent by whichever Node mutation endpoint happened to call
-- sendStatusEmail() directly. Two real gaps that leaves:
--   1. The admin panel's "Approve Eligibility" / "Mark Payment Done" quick
--      actions PATCH the applications/eligibility_requests tables directly
--      from the browser (dbPatch in src/AdminDashboard.jsx) — no Node
--      function runs at all, so no email fires.
--   2. assignAdvisor's syncLegacyRequestFromApplication call can cascade
--      through the legacy eligibility_requests <-> applications sync
--      triggers (create_application_from_request), advancing workflow_state
--      further than the endpoint that was actually called — those follow-on
--      transitions never touch sendStatusEmail either.
--
-- sync_application_status_history() already fires on every single
-- workflow_state change regardless of cause (that's how in-app notifications
-- stay complete) — so it's the one correct choke point for the email too.
-- pg_net lets a trigger fire an async, fire-and-forget HTTP call to a Vercel
-- API route that actually sends the email (Postgres has no email/SMTP
-- capability of its own).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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

    -- Fire-and-forget: email the client via the Vercel webhook. Never lets a
    -- network failure here block the actual state-change transaction.
    BEGIN
      PERFORM extensions.http_post(
        url := 'https://gettrc.com/api/createNotification',
        body := jsonb_build_object(
          'applicationId', NEW.id,
          'userId', NEW.user_id,
          'newState', NEW.workflow_state
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', '86823dcbaa1590c8fbe93b9546722d78c554bee4394530c1'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- pg_net not available / request failed — never block the state change.
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
