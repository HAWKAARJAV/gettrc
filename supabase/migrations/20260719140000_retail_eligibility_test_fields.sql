-- Phase 1 of the eligibility/document/advisor rebuild: adds the fields
-- needed to evaluate UAE's three domestic tax-residency tests (Cabinet
-- Decision 85/2022) for retail applicants — 183-day test, 90-day test
-- (day count + not-tourist-visa + employment-or-residence), and the centre
-- of financial/personal interests test.
--
-- Schema only — this migration does NOT touch handle_new_retail_user().
-- That trigger is shared with the corporate signup path (Phase 2, running
-- in parallel), so it gets one consolidated CREATE OR REPLACE afterward
-- once both phases' columns exist, rather than two migrations racing to
-- redefine the same function.

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

ALTER TABLE IF EXISTS public.eligibility_requests
  ADD COLUMN IF NOT EXISTS has_permanent_residence text,
  ADD COLUMN IF NOT EXISTS has_uae_employment_or_business text,
  ADD COLUMN IF NOT EXISTS is_centre_of_interests text;
