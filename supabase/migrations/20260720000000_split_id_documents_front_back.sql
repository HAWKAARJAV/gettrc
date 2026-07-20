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

-- Split "Emirates ID" into separate front/back uploads, and add "Passport"
-- (front/back) which was missing from the retail document checklist
-- entirely. Renumbers sort_order within each retail eligibility-basis group
-- to leave room for the new rows.

DELETE FROM public.document_requirements WHERE country = 'AE' AND applicant_type = 'retail';

INSERT INTO public.document_requirements (country, applicant_type, document_name, required, conditions, category, description, sort_order) VALUES
-- ── Retail: 183-day test ──────────────────────────────────────────────
('AE', 'retail', 'Passport — Front Page', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Photo page of your passport, required to evidence identity for the 183-day physical presence test.', 10),
('AE', 'retail', 'Passport — Back Page', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Back page of your passport, required to evidence identity for the 183-day physical presence test.', 11),
('AE', 'retail', 'Emirates ID — Front', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Front of your Emirates ID, required to evidence UAE residence for the 183-day physical presence test.', 12),
('AE', 'retail', 'Emirates ID — Back', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Back of your Emirates ID, required to evidence UAE residence for the 183-day physical presence test.', 13),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Required to evidence UAE residence for the 183-day physical presence test.', 14),

-- ── Retail: 90-day test ───────────────────────────────────────────────
('AE', 'retail', 'Passport — Front Page', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Photo page of your passport, required for the 90-day test.', 20),
('AE', 'retail', 'Passport — Back Page', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Back page of your passport, required for the 90-day test.', 21),
('AE', 'retail', 'Emirates ID — Front', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Front of your Emirates ID, required for the 90-day test.', 22),
('AE', 'retail', 'Emirates ID — Back', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Back of your Emirates ID, required for the 90-day test.', 23),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Identity/residence proof required for the 90-day test.', 24),
('AE', 'retail', 'Salary Certificate / Proof of UAE Employment or Business', true,
  '{"all":[{"field":"eligibilityBasis","equals":"90_day"},{"field":"hasUaeEmploymentOrBusiness","equals":"yes"}]}', 'employment',
  'Required leg of the 90-day test''s employment-or-residence condition.', 25),
('AE', 'retail', 'Certified Tenancy Contract (Ejari) or Title Deed + Utility Bill', true,
  '{"all":[{"field":"eligibilityBasis","equals":"90_day"},{"field":"hasPermanentResidence","equals":"yes"}]}', 'residence',
  'Required leg of the 90-day test''s employment-or-residence condition.', 26),

-- ── Retail: centre of financial & personal interests test ─────────────
('AE', 'retail', 'Passport — Front Page', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Photo page of your passport, required for the interests test.', 30),
('AE', 'retail', 'Passport — Back Page', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Back page of your passport, required for the interests test.', 31),
('AE', 'retail', 'Emirates ID — Front', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Front of your Emirates ID, required for the interests test.', 32),
('AE', 'retail', 'Emirates ID — Back', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Back of your Emirates ID, required for the interests test.', 33),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Identity/residence proof required for the interests test.', 34),
('AE', 'retail', 'Written Statement of Financial and Personal Interests', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'declaration',
  'Explains employment, business, investment, and family/social ties supporting the interests test.', 35),
('AE', 'retail', 'Proof of Primary Residence', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'residence',
  'Required for the interests test.', 36),
('AE', 'retail', 'Proof of Income Source', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'employment',
  'Salary certificate, share certificate, trade licence, or bank statements.', 37);
