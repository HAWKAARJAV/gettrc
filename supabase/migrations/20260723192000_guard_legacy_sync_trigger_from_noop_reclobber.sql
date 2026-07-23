-- Bug found live: assigning an advisor (manual "Assign Advisor" click, or
-- the new auto-assign-on-payment feature) sets applications.workflow_state
-- to 'advisor_assigned', then calls syncLegacyRequestFromApplication() to
-- mirror that into eligibility_requests.status. For states with no distinct
-- legacy vocabulary equivalent (advisor_assigned, processing,
-- submitted_to_authority, completed), mapApplicationWorkflowToLegacyStatus()
-- deliberately leaves eligibility_requests.status unchanged. But the UPDATE
-- statement still runs (even though the value doesn't change), and
-- on_eligibility_request_created_retail / on_corporate_eligibility_request_created
-- fire unconditionally on ANY UPDATE — re-invoking create_application_from_request(),
-- which re-derives workflow_state from that (unchanged) legacy status and
-- UPSERTs it straight back onto applications, silently reverting the
-- advisor_assigned transition that had just been set moments earlier.
--
-- Reproduced live: auto-assign correctly set advisor_id and returned
-- workflow_state='advisor_assigned' from the API response, but a fresh DB
-- read immediately after showed workflow_state='payment_completed' — the
-- history table even shows the clobber and the (misleadingly-timed) recovery
-- log entry back to back within the same second.
--
-- Fix: only let the trigger fire when status or payment_status actually
-- changed (or on INSERT). A no-op echo write to eligibility_requests should
-- never be able to re-derive and stomp applications.workflow_state.

-- Note: trigger WHEN clauses cannot reference TG_OP (only OLD/NEW), so
-- INSERT and UPDATE are split into separate triggers. On INSERT the
-- unconditional trigger always fires (matching prior behavior); on UPDATE,
-- IS DISTINCT FROM guards against no-op echo writes re-deriving and
-- clobbering applications.workflow_state.

DROP TRIGGER IF EXISTS on_eligibility_request_created_retail ON public.eligibility_requests;
CREATE TRIGGER on_eligibility_request_created_retail
AFTER INSERT ON public.eligibility_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_application_from_request('retail', 'trc_eligibility');

DROP TRIGGER IF EXISTS on_eligibility_request_updated_retail ON public.eligibility_requests;
CREATE TRIGGER on_eligibility_request_updated_retail
AFTER UPDATE ON public.eligibility_requests
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status
  OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
)
EXECUTE FUNCTION public.create_application_from_request('retail', 'trc_eligibility');

DROP TRIGGER IF EXISTS on_corporate_eligibility_request_created ON public.corporate_eligibility_requests;
CREATE TRIGGER on_corporate_eligibility_request_created
AFTER INSERT ON public.corporate_eligibility_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_application_from_request('corporate', 'trc_eligibility');

DROP TRIGGER IF EXISTS on_corporate_eligibility_request_updated ON public.corporate_eligibility_requests;
CREATE TRIGGER on_corporate_eligibility_request_updated
AFTER UPDATE ON public.corporate_eligibility_requests
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status
  OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
)
EXECUTE FUNCTION public.create_application_from_request('corporate', 'trc_eligibility');
