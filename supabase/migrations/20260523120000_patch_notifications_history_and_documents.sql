-- Patch: Add notifications, application_status_history, and missing columns
-- This file is idempotent: uses IF NOT EXISTS and DO blocks to avoid errors

-- Create application_status_history
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_id uuid NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  updated_by text,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

-- Ensure primary key exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_status_history_pkey') THEN
    ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id);
  END IF;
END$$;

-- Create notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  application_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text,
  action_url text,
  level text DEFAULT 'info',
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
  END IF;
END$$;

-- Add missing columns to applications/documents/advisors
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS advisor_assigned_at timestamp without time zone;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();

ALTER TABLE public.advisors ADD COLUMN IF NOT EXISTS name text;

-- Add foreign key constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'application_status_history_application_id_fkey') THEN
    ALTER TABLE ONLY public.application_status_history ADD CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_application_id_fkey') THEN
    ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Create indexes if missing
CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON public.application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- End patch
