-- Corporate workspace build-out: employees/entities roster + notification
-- preference toggle (see FEATURE 3b and 3f of the corporate workspace
-- completion task).
--
-- NOTE: this migration has NOT been applied to any database. It is provided
-- for manual review and must be run by the product owner before the
-- Employees / Entities roster (src/corporate/pages/CorporateFeaturePages.jsx
-- CorporateEmployeesPage) and the email notification preference toggle
-- (CorporateSettingsPage) will function against a live database. The
-- frontend for both features detects a missing table/column (Postgres error
-- code 42P01 / "does not exist") and falls back to a friendly
-- "not set up yet" EmptyState rather than crashing, so the app remains safe
-- to deploy ahead of this migration being applied.

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
-- 1. corporate_employees — simple roster, not yet linked to individual TRC
--    applications (that per-employee filing workflow is future work).
--    company_id references profiles(id) to match corporate_profiles' own FK
--    target (corporate_profiles.id -> profiles.id), since corporate_profiles
--    IS the company row keyed by the owning auth user's profile id.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.corporate_employees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id uuid NOT NULL,
  full_name text NOT NULL,
  email text,
  position text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.corporate_employees OWNER TO postgres;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_employees_pkey') THEN
    ALTER TABLE ONLY public.corporate_employees ADD CONSTRAINT corporate_employees_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corporate_employees_company_id_fkey') THEN
    ALTER TABLE ONLY public.corporate_employees
      ADD CONSTRAINT corporate_employees_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_corporate_employees_company_id
  ON public.corporate_employees(company_id);

ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;

-- Mirrors the "Corporate users see/update own profile" policy pattern from
-- 20260522183000_corporate_workflow_setup.sql (auth.uid()::uuid = <owner column>),
-- plus admin visibility via the same is_admin_user() helper used elsewhere.

DROP POLICY IF EXISTS "Corporate users manage own employees" ON public.corporate_employees;
CREATE POLICY "Corporate users manage own employees"
  ON public.corporate_employees
  FOR ALL
  USING (auth.uid()::uuid = company_id OR public.is_admin_user())
  WITH CHECK (auth.uid()::uuid = company_id OR public.is_admin_user());

GRANT ALL ON TABLE public.corporate_employees TO anon;
GRANT ALL ON TABLE public.corporate_employees TO authenticated;
GRANT ALL ON TABLE public.corporate_employees TO service_role;

-- ---------------------------------------------------------------------------
-- 2. corporate_profiles.notification_email_opt_in — email notification
--    preference toggle, defaulting to on.
-- ---------------------------------------------------------------------------

ALTER TABLE public.corporate_profiles
  ADD COLUMN IF NOT EXISTS notification_email_opt_in boolean NOT NULL DEFAULT true;
