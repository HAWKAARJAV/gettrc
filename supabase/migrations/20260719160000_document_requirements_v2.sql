-- Phase 4 of the eligibility/document/advisor rebuild: replaces the
-- near-empty (5 row) document_requirements seed data with lists matching
-- the actual FTA-required documents per eligibility scenario, per the
-- official FTA "Tax Resident and Tax Residency Certificate" guide (TPGTR1).
--
-- Old rows gated corporate documents on a `business_owner` condition key
-- that was never actually computed for corporate cases (only derived for
-- retail, from occupation text) — meaning the 3 corporate rows likely never
-- matched/displayed. This re-seed gates on `eligibilityBasis` instead, set
-- by the advisor's eligibility-determination action (falling back to the
-- preliminary computed signal while a case is still pending).
--
-- The `conditions` column now supports a recursive any/all/field+equals
-- expression tree (see requirementMatchesAnswers in
-- src/documents/documentService.js) so "either/or" requirements (e.g. the
-- 90-day test's employment-proof-OR-residence-proof) can be expressed.

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

DELETE FROM public.document_requirements WHERE country = 'AE';

INSERT INTO public.document_requirements (country, applicant_type, document_name, required, conditions, category, description, sort_order) VALUES
-- ── Retail: 183-day test ──────────────────────────────────────────────
('AE', 'retail', 'Emirates ID', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Required to evidence UAE residence for the 183-day physical presence test.', 10),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"183_day"}', 'identity',
  'Required to evidence UAE residence for the 183-day physical presence test.', 11),

-- ── Retail: 90-day test ───────────────────────────────────────────────
('AE', 'retail', 'Emirates ID', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Identity/residence proof required for the 90-day test.', 20),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"90_day"}', 'identity',
  'Identity/residence proof required for the 90-day test.', 21),
('AE', 'retail', 'Salary Certificate / Proof of UAE Employment or Business', true,
  '{"all":[{"field":"eligibilityBasis","equals":"90_day"},{"field":"hasUaeEmploymentOrBusiness","equals":"yes"}]}', 'employment',
  'Required leg of the 90-day test''s employment-or-residence condition.', 22),
('AE', 'retail', 'Certified Tenancy Contract (Ejari) or Title Deed + Utility Bill', true,
  '{"all":[{"field":"eligibilityBasis","equals":"90_day"},{"field":"hasPermanentResidence","equals":"yes"}]}', 'residence',
  'Required leg of the 90-day test''s employment-or-residence condition.', 23),

-- ── Retail: centre of financial & personal interests test ─────────────
('AE', 'retail', 'Emirates ID', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Identity/residence proof required for the interests test.', 30),
('AE', 'retail', 'UAE Residence Visa', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'identity',
  'Identity/residence proof required for the interests test.', 31),
('AE', 'retail', 'Written Statement of Financial and Personal Interests', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'declaration',
  'Explains employment, business, investment, and family/social ties supporting the interests test.', 32),
('AE', 'retail', 'Proof of Primary Residence', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'residence',
  'Required for the interests test.', 33),
('AE', 'retail', 'Proof of Income Source', true,
  '{"field":"eligibilityBasis","equals":"interests_test"}', 'employment',
  'Salary certificate, share certificate, trade licence, or bank statements.', 34),

-- ── Corporate: UAE-incorporated (mainland / free zone / offshore) ─────
('AE', 'corporate', 'Trade Licence', true,
  '{"field":"eligibilityBasis","equals":"uae_incorporation"}', 'corporate', 'Required for UAE-incorporated entities.', 40),
('AE', 'corporate', 'Lease Agreement', true,
  '{"field":"eligibilityBasis","equals":"uae_incorporation"}', 'corporate', 'Required for UAE-incorporated entities.', 41),
('AE', 'corporate', 'Certificate of Incorporation', true,
  '{"field":"eligibilityBasis","equals":"uae_incorporation"}', 'corporate', 'Required for UAE-incorporated entities.', 42),
('AE', 'corporate', 'Certified Memorandum of Association (MOA)', true,
  '{"field":"eligibilityBasis","equals":"uae_incorporation"}', 'corporate', 'Required for UAE-incorporated entities.', 43),
('AE', 'corporate', 'Authorized Signatory Proof (ID + Power of Attorney / Establishment Contract)', true,
  '{"field":"eligibilityBasis","equals":"uae_incorporation"}', 'corporate', 'Required for UAE-incorporated entities.', 44),
('AE', 'corporate', 'Corporate Tax TRN Document', true,
  '{"all":[{"field":"eligibilityBasis","equals":"uae_incorporation"},{"field":"hasCorporateTaxTrn","equals":"yes"}]}', 'corporate',
  'Only applicable if the entity holds a Corporate Tax TRN — reduces the FTA processing fee.', 45),

-- ── Corporate: foreign-incorporated, effective management & control ───
('AE', 'corporate', 'Trade Licence', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate', 'Required.', 50),
('AE', 'corporate', 'Lease Agreement', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate', 'Required.', 51),
('AE', 'corporate', 'Certificate of Incorporation', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate', 'Required.', 52),
('AE', 'corporate', 'Certified Memorandum of Association (MOA)', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate', 'Required.', 53),
('AE', 'corporate', 'Authorized Signatory Proof (ID + Power of Attorney / Establishment Contract)', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate', 'Required.', 54),
('AE', 'corporate', 'Corporate Tax TRN Document', true,
  '{"all":[{"field":"eligibilityBasis","equals":"effective_management"},{"field":"hasCorporateTaxTrn","equals":"yes"}]}', 'corporate',
  'Only applicable if the entity holds a Corporate Tax TRN.', 55),
('AE', 'corporate', 'Written Statement of Effective Management and Control', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate',
  'Required for foreign-incorporated entities claiming UAE tax residency via effective management and control.', 56),
('AE', 'corporate', 'Supporting Board / Governance Documents', true,
  '{"field":"eligibilityBasis","equals":"effective_management"}', 'corporate',
  'Board meeting minutes, delegation-of-authority records, or similar evidence supporting the effective-management claim.', 57);
