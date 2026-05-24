-- ============================================================
-- Advisor Document Management Migration
-- Adds:
--   1. FK: applications.eligibility_request_id → eligibility_requests.id
--      (fixes silent PostgREST join failure in advisor workspace)
--   2. document_requests table — advisors request specific docs from clients
--   3. RLS: advisors can read documents for their assigned applications
--   4. RLS: advisors can read eligibility_requests for their applications
--   5. RLS: retail users can see document_requests addressed to them
-- ============================================================

SET client_min_messages = warning;

-- ── 1. FK: applications → eligibility_requests ──────────────
-- Without this FK PostgREST cannot resolve eligibility_requests(*) joins,
-- causing the advisor workspace query to silently return nothing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_eligibility_request_id_fkey') THEN
    ALTER TABLE ONLY public.applications
      ADD CONSTRAINT applications_eligibility_request_id_fkey
      FOREIGN KEY (eligibility_request_id)
      REFERENCES public.eligibility_requests(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END$$;


-- ── 2. document_requests table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_requests (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id   uuid        NOT NULL REFERENCES public.applications(id)   ON DELETE CASCADE,
  requested_by     uuid        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  document_type    text        NOT NULL,
  description      text,
  status           text        DEFAULT 'pending'
                               CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_document_requests_application_id
  ON public.document_requests (application_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_requested_by
  ON public.document_requests (requested_by);


-- ── 3. RLS: document_requests ────────────────────────────────

-- Advisor can INSERT requests for their own applications
DROP POLICY IF EXISTS "Advisors create document requests" ON public.document_requests;
CREATE POLICY "Advisors create document requests"
  ON public.document_requests
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND application_id IN (
      SELECT id FROM public.applications WHERE advisor_id = auth.uid()
    )
  );

-- Advisor can SELECT/UPDATE their own requests
DROP POLICY IF EXISTS "Advisors manage own document requests" ON public.document_requests;
CREATE POLICY "Advisors manage own document requests"
  ON public.document_requests
  FOR ALL
  USING (
    requested_by = auth.uid()
    OR public.is_admin_user()
  );

-- Client (retail/corporate) can see requests for their application
DROP POLICY IF EXISTS "Clients see their document requests" ON public.document_requests;
CREATE POLICY "Clients see their document requests"
  ON public.document_requests
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

-- Client can mark requests fulfilled (when they upload)
DROP POLICY IF EXISTS "Clients fulfil document requests" ON public.document_requests;
CREATE POLICY "Clients fulfil document requests"
  ON public.document_requests
  FOR UPDATE
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (status = 'fulfilled');


-- ── 4. RLS: documents — advisors can read docs for their cases ──
-- Existing policies only allow: admin, uploaded_by, user_id.
-- Advisors must also read documents belonging to their assigned applications.

DROP POLICY IF EXISTS "Advisors read case documents" ON public.documents;
CREATE POLICY "Advisors read case documents"
  ON public.documents
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE advisor_id = auth.uid()
    )
  );


-- ── 5. RLS: eligibility_requests — advisors can read for their apps ──
DROP POLICY IF EXISTS "Advisors read assigned eligibility requests" ON public.eligibility_requests;
CREATE POLICY "Advisors read assigned eligibility requests"
  ON public.eligibility_requests
  FOR SELECT
  USING (
    id IN (
      SELECT eligibility_request_id
      FROM public.applications
      WHERE advisor_id = auth.uid()
        AND eligibility_request_id IS NOT NULL
    )
  );


-- ── 6. Add reviewed_by / reviewed_at columns to documents ────
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reviewed_by  uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reviewed_at  timestamptz;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS advisor_comment text;

-- ── end ───────────────────────────────────────────────────────
