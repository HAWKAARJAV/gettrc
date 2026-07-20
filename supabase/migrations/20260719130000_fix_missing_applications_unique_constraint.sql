-- Critical bug fix: public.applications is missing the
-- UNIQUE (user_id, applicant_type) constraint that
-- 20260522103440_remote_schema.sql declared and that
-- create_application_from_request() relies on via
-- "ON CONFLICT (user_id, applicant_type) DO UPDATE" for the corporate path.
--
-- Discovered live: every corporate signup has been failing with a 500
-- ("Database error creating new user") because Postgres has no unique/
-- exclusion constraint matching that ON CONFLICT target (error 42P10).
-- Retail signups were unaffected — the retail path conflicts on
-- eligibility_request_id, a different (and present) constraint.
--
-- No duplicate (user_id, applicant_type) rows exist in applications as of
-- this migration (verified before writing this), so the constraint can be
-- added directly with no dedup step required.

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_key') THEN
    ALTER TABLE ONLY public.applications
      ADD CONSTRAINT applications_user_id_key UNIQUE (user_id, applicant_type);
  END IF;
END
$$;
