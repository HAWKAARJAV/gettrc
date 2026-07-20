-- Phase 5 of the eligibility/document/advisor rebuild: lets an advisor
-- record a structured eligibility determination (which of the UAE tax-
-- residency tests/bases was confirmed), and fixes a real RLS gap found
-- while wiring the advisor Overview tab to corporate eligibility data:
-- advisors were never granted SELECT on corporate_eligibility_requests
-- (only the company owner or is_admin_user() could read it), so the
-- advisor-facing corporate eligibility card would have silently returned
-- nothing without this policy.

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

-- ---------------------------------------------------------------------------
-- 1. Eligibility determination fields on applications.
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS eligibility_basis text,
  ADD COLUMN IF NOT EXISTS eligibility_determined_by uuid,
  ADD COLUMN IF NOT EXISTS eligibility_determined_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS eligibility_notes text;

-- ---------------------------------------------------------------------------
-- 2. Advisors assigned to a corporate application can read that company's
--    corporate_eligibility_requests row. Additive/permissive policy — OR'd
--    with the existing "Corporate users see own requests" policy.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Advisors see assigned corporate eligibility requests" ON public.corporate_eligibility_requests;
CREATE POLICY "Advisors see assigned corporate eligibility requests"
  ON public.corporate_eligibility_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.applicant_type = 'corporate'
        AND a.user_id = corporate_eligibility_requests.company_id
        AND a.advisor_id = auth.uid()
    )
  );
