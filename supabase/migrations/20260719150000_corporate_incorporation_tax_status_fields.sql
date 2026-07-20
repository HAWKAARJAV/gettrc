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

-- New "Incorporation & Tax Status" fields from the corporate eligibility
-- questionnaire (incorporation date/location, Corporate Tax TRN status,
-- domestic vs. treaty TRC purpose, and effective management & control
-- facts for foreign-incorporated entities).
--
-- This migration is SCHEMA-ONLY. It intentionally does NOT touch
-- public.handle_new_retail_user() (the shared auth.users signup trigger),
-- because that function also handles retail signups which are being
-- changed in parallel by a separate migration — two migrations racing to
-- CREATE OR REPLACE the same function would silently clobber each other.
-- The trigger will be updated once, separately, to read these new columns
-- (together with the retail-side columns) from raw_user_meta_data.
--
-- Until that trigger update lands, the automatic-signup-trigger path will
-- NOT populate these columns. If src/corporate/services/corporateAuth.js
-- ever grows a belt-and-suspenders direct upsert into
-- public.corporate_eligibility_requests (mirroring registerRetailApplicant
-- in src/services/retailAuth.js), it can already write to these columns
-- as soon as this migration is applied.
ALTER TABLE IF EXISTS public.corporate_eligibility_requests
  ADD COLUMN IF NOT EXISTS incorporation_date date,
  ADD COLUMN IF NOT EXISTS incorporation_location text,
  ADD COLUMN IF NOT EXISTS has_corporate_tax_trn text,
  ADD COLUMN IF NOT EXISTS corporate_tax_trn text,
  ADD COLUMN IF NOT EXISTS has_filed_corporate_tax_return text,
  ADD COLUMN IF NOT EXISTS trc_purpose text,
  ADD COLUMN IF NOT EXISTS target_treaty_country text,
  ADD COLUMN IF NOT EXISTS effective_management_statement text,
  ADD COLUMN IF NOT EXISTS board_meetings_in_uae text,
  ADD COLUMN IF NOT EXISTS key_decision_makers_in_uae text;
