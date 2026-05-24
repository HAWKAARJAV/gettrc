import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Functions will throw later if env not set
}

export function getServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export function normalizeActionUrl(actionUrl, applicationId, applicantType = 'retail') {
  try {
    if (!applicationId) return actionUrl || `/${applicantType === 'corporate' ? 'corporate' : 'retail'}`;
    const base = applicantType === 'corporate' ? '/corporate' : '/retail';
    const expected = `${base}/applications/${applicationId}`;
    if (!actionUrl || typeof actionUrl !== 'string') return expected;
    // reject generic dashboard fallbacks
    const cleaned = actionUrl.trim();
    if (cleaned === '/dashboard' || cleaned === `${base}/dashboard`) return expected;
    // if actionUrl doesn't include the application id, prefer the expected link
    if (!cleaned.includes(applicationId)) return expected;
    // ensure it starts with a slash
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  } catch {
    return actionUrl;
  }
}

export async function verifyAdminOrAdvisor(accessToken) {
  if (!accessToken) throw { status: 401, message: "Missing access token" };
  const svc = getServiceClient();
  const { data, error } = await svc.auth.getUser(accessToken);
  if (error) throw { status: 401, message: "Invalid token" };
  const user = data?.user || data;
  if (!user || !user.id) throw { status: 401, message: "Unauthenticated" };

  // Fetch profile to check role — allow admin or advisor
  const { data: profile } = await svc.from("profiles").select("id,role,email").eq("id", user.id).maybeSingle();
  const isAdminEmail = profile?.email && String(profile.email).toLowerCase() === (process.env.ADMIN_EMAIL || "hawkwilds09@gmail.com");
  const role = profile?.role || null;
  if (!isAdminEmail && role !== "admin" && role !== "advisor" && role !== "specialist") {
    throw { status: 403, message: "Insufficient role" };
  }

  return { user, profile };
}
