-- Minimal phase-2 compatibility fixes for existing legacy schema

-- Add missing application columns if they don't exist
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applicant_type text,
  ADD COLUMN IF NOT EXISTS advisor_id uuid,
  ADD COLUMN IF NOT EXISTS application_type text,
  ADD COLUMN IF NOT EXISTS eligibility_request_id uuid,
  ADD COLUMN IF NOT EXISTS workflow_state text DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS payment_state text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_state text DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS assigned_manager text,
  ADD COLUMN IF NOT EXISTS started_at timestamp without time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at timestamp without time zone;

-- Add missing document columns and migrate old values
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS reviewer_notes text;

-- Copy legacy document status fields into new columns where available
UPDATE public.documents SET review_status = status WHERE review_status IS NULL AND status IS NOT NULL;
UPDATE public.documents SET reviewer_notes = rejection_note WHERE reviewer_notes IS NULL AND rejection_note IS NOT NULL;
