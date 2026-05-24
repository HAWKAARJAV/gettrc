import { supabase } from "../supabaseClient";

export const ADVISOR_ROLE = "advisor";

export async function loginAdvisor(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data?.session) {
    // Persist legacy keys used elsewhere in the app
    localStorage.setItem("trc_advisor_session", JSON.stringify(data.session));
    localStorage.setItem("trc_token", data.session.access_token);
    localStorage.setItem("trc_email", String(email).trim().toLowerCase());
    localStorage.setItem("trc_user_id", data.user?.id || "");
    // Ensure the supabase client recognizes the session immediately
    try {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (e) {
      // best-effort: ignore setSession errors to avoid blocking login
    }
  }
  return data;
}

export async function getAdvisorSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.access_token) return data.session;

  try {
    const raw = localStorage.getItem("trc_advisor_session");
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.access_token && saved?.refresh_token) {
        const { data: restored, error: re } = await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token,
        });
        if (re) throw re;
        return restored.session || saved;
      }
    }
  } catch {}
  return null;
}

export async function logoutAdvisor() {
  await supabase.auth.signOut();
  localStorage.removeItem("trc_advisor_session");
  localStorage.removeItem("trc_token");
  localStorage.removeItem("trc_email");
  localStorage.removeItem("trc_user_id");
}

export async function fetchAdvisorWorkspace(userId) {
  // Step 1 — fetch profile, advisor record, and assigned cases in parallel.
  // The eligibility_requests(*) join resolves via applications.eligibility_request_id FK.
  // For corporate cases the FK is null so PostgREST returns eligibility_requests: null (safe).
  const [
    { data: profile },
    { data: advisorRows },
    { data: cases, error: casesError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("advisors").select("*").eq("user_id", userId).limit(1),
    supabase
      .from("applications")
      .select("*, eligibility_requests(*), profiles!user_id(id,full_name,email,phone,nationality,visa_type)")
      .eq("advisor_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  // Surface cases query errors during development so they're not swallowed silently.
  if (casesError) console.warn("[advisor workspace] cases query error:", casesError);

  const caseList = cases || [];
  const caseIds = caseList.map(c => c.id);

  // Step 2 — unread messages per case + open advisor tickets
  const sentinel = "00000000-0000-0000-0000-000000000000"; // avoids IN() error on empty array
  const [{ data: unreadMessages }, { data: openTickets }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, application_id")   // include application_id so we can group per-case
      .neq("sender_id", userId)
      .eq("is_read", false)
      .in("application_id", caseIds.length ? caseIds : [sentinel]),
    supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "open"),
  ]);

  // Build a per-case unread count map: { [applicationId]: number }
  const perCaseUnread = {};
  (unreadMessages || []).forEach(m => {
    if (m.application_id) {
      perCaseUnread[m.application_id] = (perCaseUnread[m.application_id] || 0) + 1;
    }
  });

  // Merge unread counts into each case so the UI can display them per-row
  const enrichedCases = caseList.map(c => ({
    ...c,
    unreadMessages: perCaseUnread[c.id] || 0,
  }));

  return {
    profile,
    advisor: advisorRows?.[0] || null,
    cases: enrichedCases,
    unreadMessageCount: (unreadMessages || []).length,
    openTicketCount: (openTickets || []).length,
  };
}
