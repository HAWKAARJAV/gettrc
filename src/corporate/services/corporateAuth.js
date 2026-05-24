import { supabase } from "../../supabaseClient";
import { fetchLatestApplication, resolveApplicationStage } from "../../workflow/applicationService";
import { mapLegacyRequestStatusToWorkflowState } from "../../workflow/applicationWorkflow";

export const CORPORATE_ROLE = "corporate";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getEmailRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/corporate/login`;
}

export function getCorporateStage(request) {
  if (!request) return "pending_review";
  return mapLegacyRequestStatusToWorkflowState(request.status, "pending_review");
}

export async function registerCorporateApplicant(payload) {
  const email = normalizeEmail(payload.email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
      data: {
        company_name: payload.companyName,
        business_email: email,
        phone: payload.phone,
        registered_country: payload.registeredCountry,
        industry: payload.industry,
        website: payload.website || "",
        role: CORPORATE_ROLE,
        entity_type: payload.entityType,
        employee_count: payload.employeeCount,
        annual_revenue: payload.annualRevenue,
        countries_of_operation: payload.countriesOfOperation,
        uae_presence: payload.uaePresence,
        purpose: payload.purpose,
        target_jurisdiction: payload.targetJurisdiction,
        urgency: payload.urgency,
        tax_structure: payload.taxStructure,
        use_case: payload.useCase,
        eligibility_status: "pending_review",
      },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

  if (signUpData.session) {
    await supabase.auth.signOut();
  }

  return {
    user: signUpData.user,
    session: null,
    email,
  };
}

export async function loginCorporateUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
  if (error) throw error;
  return data;
}

export async function sendCorporatePasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/corporate/login`,
  });

  if (error) throw error;
  return true;
}

export async function getCorporateSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export async function fetchCorporateWorkspace(userId) {
  const [{ data: profile, error: profileError }, { data: requests, error: requestError }, application] = await Promise.all([
    supabase.from("corporate_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("corporate_eligibility_requests")
      .select("*")
      .eq("company_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    fetchLatestApplication({ userId, applicantType: CORPORATE_ROLE }).catch(() => null),
  ]);

  if (profileError) throw profileError;
  if (requestError) throw requestError;

  return {
    profile,
    request: requests?.[0] || null,
    application,
    stage: resolveApplicationStage(application, getCorporateStage(requests?.[0] || null)),
  };
}

export function saveCorporateCache(payload) {
  localStorage.setItem("trc_corporate_user", JSON.stringify(payload || {}));
}

export function readCorporateCache() {
  try {
    return JSON.parse(localStorage.getItem("trc_corporate_user") || "{}");
  } catch {
    return {};
  }
}

export function clearCorporateCache() {
  localStorage.removeItem("trc_corporate_user");
}