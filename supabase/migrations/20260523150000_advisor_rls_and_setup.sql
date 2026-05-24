-- ============================================================
-- Advisor RLS + Setup Migration
-- Fixes three critical gaps:
--   1. messages table — advisors couldn't SELECT, INSERT, or UPDATE
--   2. profiles table — advisors couldn't see their clients' profiles
--   3. Ensure advisors table and profiles.role='advisor' support works
-- ============================================================

SET client_min_messages = warning;
SET row_security = off;

-- ── 1. MESSAGES TABLE ────────────────────────────────────────
-- Original policy covered only sender + client.
-- Advisors assigned to the application must also be able to:
--   • SELECT  — read conversation history
--   • INSERT  — send messages (as sender)
--   • UPDATE  — mark messages as is_read = true

DROP POLICY IF EXISTS "Users see own messages" ON public.messages;

-- SELECT: sender | client | advisor | admin
CREATE POLICY "Participants see messages" ON public.messages
FOR SELECT USING (
  auth.uid()::uuid = sender_id
  OR application_id IN (
    SELECT id FROM public.applications
    WHERE user_id   = auth.uid()::uuid
       OR advisor_id = auth.uid()::uuid
  )
  OR public.is_admin_user()
);

-- INSERT: must be the sender AND must be a participant
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid()::uuid = sender_id
  AND application_id IN (
    SELECT id FROM public.applications
    WHERE user_id   = auth.uid()::uuid
       OR advisor_id = auth.uid()::uuid
  )
);

-- UPDATE: only to mark is_read; any participant can flip it
DROP POLICY IF EXISTS "Participants mark messages read" ON public.messages;
CREATE POLICY "Participants mark messages read" ON public.messages
FOR UPDATE USING (
  application_id IN (
    SELECT id FROM public.applications
    WHERE user_id   = auth.uid()::uuid
       OR advisor_id = auth.uid()::uuid
  )
  OR public.is_admin_user()
) WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications
    WHERE user_id   = auth.uid()::uuid
       OR advisor_id = auth.uid()::uuid
  )
  OR public.is_admin_user()
);


-- ── 2. PROFILES TABLE ────────────────────────────────────────
-- Original policy only allowed a user to see their own row.
-- Advisors need to see their clients' profiles (for names/emails
-- shown in the case detail and chat pages).
-- Clients get to see their assigned advisor's profile too.

DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;

CREATE POLICY "Users and participants see profiles" ON public.profiles
FOR SELECT USING (
  -- own profile
  auth.uid()::uuid = id
  -- admin can see all
  OR public.is_admin_user()
  -- advisor can see clients assigned to them
  OR id IN (
    SELECT user_id FROM public.applications WHERE advisor_id = auth.uid()::uuid
  )
  -- client can see their advisor's profile
  OR id IN (
    SELECT advisor_id FROM public.applications WHERE user_id = auth.uid()::uuid
  )
);

-- Existing UPDATE policy (own profile only) stays as-is.
-- Users can already update their own profiles.


-- ── 3. ADVISORS TABLE ────────────────────────────────────────
-- Already has: CREATE POLICY "Anyone can view advisors" USING (true)
-- That SELECT policy is fine.  Add INSERT/UPDATE for admin only
-- so future admin UI can manage advisors.

DROP POLICY IF EXISTS "Admin manages advisors" ON public.advisors;
CREATE POLICY "Admin manages advisors" ON public.advisors
FOR ALL USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());


-- ── 4. SUPPORT TICKETS — advisor can see their own tickets ───
-- Existing policy: user_id = auth.uid() OR assigned_to = auth.uid() OR admin
-- Advisor inserts with user_id = their uid, so SELECT and INSERT are fine.
-- But UPDATE is restricted to assigned_to (admin). This is correct — admin
-- resolves tickets, advisor only creates/reads. No changes needed here.


-- ── HELPER: Create an advisor user (run manually in Supabase SQL editor) ──
-- After creating a user via Supabase Auth dashboard, run:
--
--   UPDATE public.profiles SET role = 'advisor' WHERE email = 'advisor@example.com';
--
--   INSERT INTO public.advisors (user_id, name, country, languages, specialties, available, verified)
--   SELECT id, full_name, 'UAE', ARRAY['English'], ARRAY['TRC', 'Tax Residency'], true, true
--   FROM public.profiles WHERE email = 'advisor@example.com';
--
-- The advisor can then log in at /advisor/login.
-- ─────────────────────────────────────────────────────────────
