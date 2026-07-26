import { supabase } from "../supabaseClient";
import { fetchLatestApplication, fetchApplicationWithHistory, resolveApplicationStage } from "../workflow/applicationService";
import { mapLegacyRequestStatusToWorkflowState } from "../workflow/applicationWorkflow";

export const RETAIL_ROLE = "retail";

function getEmailRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/login`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function getRetailStage(request) {
  if (!request) return "pending_review";
  // These statuses map directly to stage names used by RetailWorkspaceGuard's
  // LOCKED_STAGES set — do NOT normalise them through the legacy workflow map,
  // which would turn "needs_more_info" → "documents_pending" (not locked) and
  // prematurely unlock the retail workspace before payment is confirmed.
  const DIRECT_STAGES = ["pending_review", "needs_more_info", "rejected"];
  if (DIRECT_STAGES.includes(request.status)) return request.status;
  return mapLegacyRequestStatusToWorkflowState(request.status, "pending_review");
}

export async function registerRetailApplicant(payload) {
  const email = normalizeEmail(payload.email);
  const emailRedirectTo = getEmailRedirectTo();

  // Build metadata with snake_case keys matching the DB trigger expectations.
  // The trigger (handle_new_retail_user) reads these to populate profiles and
  // eligibility_requests rows. days_in_uae is sent as a numeric string so the
  // trigger CASE guard (retail_days_text ~ '^[0-9]+$') accepts it — now taken
  // directly from the real day-count question rather than derived from a
  // collapsed yes/no answer. meets_183_days is kept in sync for backward
  // compatibility with older rows/UI that still read that boolean column.
  const daysNum = Number(payload.daysInUaePeriod);
  const daysNumValid = Number.isFinite(daysNum) && daysNum >= 0;
  const metadata = {
    full_name:       String(payload.fullName     || "").trim(),
    phone:           String(payload.phone        || "").trim(),
    nationality:     String(payload.nationality  || "").trim(),
    role:            "retail",
    current_country: String(payload.currentCountry || "").trim(),
    uae_visa:        String(payload.uaeVisa      || "").trim(),
    emirates_id:     String(payload.emiratesId   || "").trim(),
    days_in_uae:     daysNumValid ? String(daysNum) : "",
    visa_type:       String(payload.visaType     || "").trim(),
    occupation:      String(payload.occupation   || "").trim(),
    income_source:   String(payload.incomeSource || "").trim(),
    purpose:         String(payload.purpose      || "").trim(),
    urgency:         String(payload.urgency      || "standard").trim(),
    vat_registered:  String(payload.vatRegistered  || "").trim(),
    trc_period_year: String(payload.trcPeriodYear  || "").trim(),
    meets_183_days:  daysNumValid ? (daysNum >= 183 ? "yes" : "no") : "",
    trc_purpose:     String(payload.trcPurpose     || "").trim(),
    treaty_country:  String(payload.treatyCountry  || "").trim(),
    has_permanent_residence:            String(payload.hasPermanentResidence            || "").trim(),
    has_uae_employment_or_business:     String(payload.hasUaeEmploymentOrBusiness        || "").trim(),
    is_centre_of_interests:             String(payload.isCentreOfFinancialPersonalInterests || "").trim(),
  };

  let signUpData = null;
  let signUpError = null;

  // Primary attempt: pass metadata + redirect so the DB trigger creates the
  // profile and eligibility_request rows with full form data.
  try {
    const res = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        emailRedirectTo,
        data: metadata,
      },
    });
    signUpData = res.data;
    signUpError = res.error;
  } catch (e) {
    signUpError = e;
  }

  // Retry without redirect on 500 (redirect URL mismatch in some Supabase
  // project configs) — keep the metadata so the trigger still has the data.
  if (signUpError && (signUpError.status === 500 || /redirect/i.test(String(signUpError.message || "")))) {
    try {
      const res2 = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: { data: metadata },
      });
      signUpData = res2.data;
      signUpError = res2.error;
    } catch (e2) {
      signUpError = signUpError || e2;
    }
  }

  if (signUpError) {
    try {
      console.error("Supabase signup failed:", {
        message: signUpError.message || signUpError.toString(),
        status: signUpError.status || null,
        details: signUpError.details || signUpError.data || null,
        context: { emailRedirectTo, payload },
      });
    } catch (logErr) {
      console.error("Signup error (fallback):", signUpError);
    }
    signUpError.__context = { emailRedirectTo, payload };
    throw signUpError;
  }

  const identities = signUpData.user?.identities;
  const mayBeExistingUser = Array.isArray(identities) && identities.length === 0;

  if (mayBeExistingUser) {
    await resendVerificationEmail(email);
    if (signUpData.session) await supabase.auth.signOut();
    return { user: signUpData.user, session: null, email };
  }

  // Belt-and-suspenders: if Supabase returned an active session (auto-confirm
  // or email already confirmed), do a direct upsert so the form data is
  // persisted even if the DB trigger didn't fire for any reason.
  if (signUpData.session && signUpData.user?.id) {
    const userId = signUpData.user.id;

    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        id:          userId,
        full_name:   metadata.full_name,
        email,
        phone:       metadata.phone,
        nationality: metadata.nationality,
        role:        "retail",
      }, { onConflict: "id" });
    if (profileErr) console.warn("Profile upsert (belt-and-suspenders):", profileErr.message);

    const { error: eligErr } = await supabase
      .from("eligibility_requests")
      .upsert({
        user_id:         userId,
        current_country: metadata.current_country,
        uae_visa:        metadata.uae_visa,
        emirates_id:     metadata.emirates_id,
        days_in_uae:     daysNumValid ? daysNum : null,
        visa_type:       metadata.visa_type,
        occupation:      metadata.occupation,
        income_source:   metadata.income_source,
        purpose:         metadata.purpose,
        urgency:         metadata.urgency,
        vat_registered:  metadata.vat_registered,
        trc_period_year: metadata.trc_period_year,
        meets_183_days:  metadata.meets_183_days,
        trc_purpose:     metadata.trc_purpose,
        treaty_country:  metadata.treaty_country,
        has_permanent_residence:        metadata.has_permanent_residence,
        has_uae_employment_or_business: metadata.has_uae_employment_or_business,
        is_centre_of_interests:         metadata.is_centre_of_interests,
        status:          "pending_review",
        review_notes:    "",
        payment_status:  "pending",
      }, { onConflict: "user_id" });
    if (eligErr) console.warn("Eligibility upsert (belt-and-suspenders):", eligErr.message);
  }

  if (signUpData.session) {
    await supabase.auth.signOut();
  }

  // Best-effort: notify the applicant ("we've received it") and, if the
  // creation trigger auto-assigned an advisor, notify that advisor too.
  // Never blocks or fails signup on email delivery issues.
  fetch("/api/sendInquiryEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "eligibility_submitted", email }),
  }).catch(() => {});

  return {
    user: signUpData.user,
    session: null,
    email,
  };
}

export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizeEmail(email),
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  });

  if (error) throw error;
  return true;
}

export async function loginRetailUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data?.session?.access_token && data?.session?.refresh_token) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    localStorage.setItem("trc_session", JSON.stringify(data.session));
    localStorage.setItem("trc_token", data.session.access_token);
    localStorage.setItem("trc_email", normalizeEmail(email));
    localStorage.setItem("trc_user_id", data.user?.id || data.session.user?.id || "");
  }
  return data;
}

export async function sendRetailPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) throw error;
  return true;
}

export async function getRetailSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.access_token) return data.session;

  const legacySession = readRetailSession();
  if (legacySession?.access_token && legacySession?.refresh_token) {
    const { data: restored, error: restoreError } = await supabase.auth.setSession({
      access_token: legacySession.access_token,
      refresh_token: legacySession.refresh_token,
    });
    if (restoreError) {
      // Stale / deleted-user session — clear it and fall through to null
      // (guard will redirect to /retail/login cleanly instead of crashing)
      clearRetailCache();
      return null;
    }
    return restored.session || null;
  }

  return null;
}

export async function fetchRetailWorkspace(userId) {
  const [{ data: profile, error: profileError }, { data: requests, error: requestError }, application] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("eligibility_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    fetchLatestApplication({ userId, applicantType: RETAIL_ROLE }).catch(() => null),
  ]);

  if (profileError) throw profileError;
  if (requestError) throw requestError;

  const applicationBundle = application?.id ? await fetchApplicationWithHistory(application.id).catch(() => ({ application, history: [] })) : { application: null, history: [] };

  return {
    profile,
    request: requests?.[0] || null,
    application: applicationBundle.application || application,
    applicationHistory: applicationBundle.history || [],
    stage: resolveApplicationStage(applicationBundle.application || application, getRetailStage(requests?.[0] || null)),
  };
}

export function saveRetailCache(payload) {
  localStorage.setItem("trc_retail_user", JSON.stringify(payload || {}));
}

export function readRetailCache() {
  try {
    return JSON.parse(localStorage.getItem("trc_retail_user") || "{}");
  } catch {
    return {};
  }
}

export function clearRetailCache() {
  localStorage.removeItem("trc_retail_user");
  localStorage.removeItem("trc_session");
  localStorage.removeItem("trc_token");
  localStorage.removeItem("trc_email");
  localStorage.removeItem("trc_user_id");
}

export function readRetailSession() {
  try {
    return JSON.parse(localStorage.getItem("trc_session") || "null");
  } catch {
    return null;
  }
}
