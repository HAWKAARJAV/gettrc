-- ============================================================
-- TRC Connect — Full DB setup migration
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

SET client_min_messages = warning;

-- ── HELPER: ensure is_admin_user() exists ───────────────────
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 1. eligibility_requests ─────────────────────────────────
DROP POLICY IF EXISTS "Admin sees all eligibility_requests" ON public.eligibility_requests;
CREATE POLICY "Admin sees all eligibility_requests"
  ON public.eligibility_requests
  FOR ALL
  USING (public.is_admin_user() OR user_id = auth.uid());

-- ── 2. applications ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin sees all applications" ON public.applications;
CREATE POLICY "Admin sees all applications"
  ON public.applications
  FOR ALL
  USING (public.is_admin_user() OR user_id = auth.uid() OR advisor_id = auth.uid());

-- ── 3. application_status_history ───────────────────────────
DROP POLICY IF EXISTS "Admin sees all history" ON public.application_status_history;
CREATE POLICY "Admin sees all history"
  ON public.application_status_history
  FOR ALL
  USING (public.is_admin_user());

-- ── 4. documents ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin sees all documents" ON public.documents;
CREATE POLICY "Admin sees all documents"
  ON public.documents
  FOR ALL
  USING (public.is_admin_user() OR uploaded_by = auth.uid());

-- ── 5. support_tickets — advisor sees own, admin sees all ───
DROP POLICY IF EXISTS "Admin sees all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users see own tickets" ON public.support_tickets;
CREATE POLICY "support_tickets_access"
  ON public.support_tickets
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin_user());

-- Add admin reply columns if not already there
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_replied_at timestamptz;

-- ── 6. profiles — user sees own, admin sees all ─────────────
DROP POLICY IF EXISTS "Admin sees all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "profiles_access"
  ON public.profiles
  FOR ALL
  USING (id = auth.uid() OR public.is_admin_user());

-- ── 7. advisors — advisor sees own, admin sees all ──────────
DROP POLICY IF EXISTS "Admin sees all advisors" ON public.advisors;
DROP POLICY IF EXISTS "Advisors see own" ON public.advisors;
CREATE POLICY "advisors_access"
  ON public.advisors
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin_user());

-- ── 8. admin_advisor_messages — NEW TABLE for direct chat ───
CREATE TABLE IF NOT EXISTS public.admin_advisor_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text        NOT NULL CHECK (sender_role IN ('admin', 'advisor')),
  message     text        NOT NULL,
  is_read     boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.admin_advisor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_advisor_messages_access" ON public.admin_advisor_messages;
CREATE POLICY "admin_advisor_messages_access"
  ON public.admin_advisor_messages
  FOR ALL
  USING (advisor_id = auth.uid() OR public.is_admin_user());

-- Index for fast per-advisor queries
CREATE INDEX IF NOT EXISTS idx_admin_advisor_messages_advisor_id
  ON public.admin_advisor_messages (advisor_id, created_at);
