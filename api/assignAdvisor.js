import { getServiceClient, verifyAdminOrAdvisor, assignAdvisorToApplication } from "./_shared.js";
import { sendAdvisorWelcomeEmail } from "./_sendStatusEmail.js";

function generateTempPassword() {
  // Not shown anywhere in the UI — only ever sent via the welcome email —
  // so this just needs to satisfy Supabase's password rules, not be memorable.
  return `Trc-${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 100)}!`;
}

// Admin-only: creates a brand-new advisor account (auth user + profile +
// advisors row) and emails the temporary password. Merged into this file
// (dispatched by req.body.action) rather than a new route, to stay within
// the Vercel Hobby plan's 12-function cap.
async function handleCreateAdvisor(req, res, callerProfile) {
  const isAdmin = callerProfile?.role === "admin" || (callerProfile?.email || "").toLowerCase() === (process.env.ADMIN_EMAIL || "hawkwilds09@gmail.com");
  if (!isAdmin) return res.status(403).json({ error: "Only admins can create advisor accounts" });

  const { name, email } = req.body || {};
  const trimmedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!trimmedName || !normalizedEmail) return res.status(400).json({ error: "name and email required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: "Invalid email address" });

  const svc = getServiceClient();

  const { data: existingProfile } = await svc.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle();
  if (existingProfile) return res.status(409).json({ error: "An account with this email already exists" });

  const tempPassword = generateTempPassword();
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: trimmedName, role: "advisor" },
  });
  if (createErr) return res.status(400).json({ error: createErr.message || "Failed to create advisor account" });

  const userId = created.user.id;

  // Belt-and-suspenders profile upsert — the DB signup trigger should also
  // create this from user_metadata, but don't depend on trigger timing here.
  const { error: profileErr } = await svc.from("profiles").upsert({
    id: userId,
    full_name: trimmedName,
    email: normalizedEmail,
    role: "advisor",
  }, { onConflict: "id" });
  if (profileErr) console.warn("advisor profile upsert warning", profileErr);

  // advisors.user_id has no unique constraint, so ON CONFLICT upsert isn't
  // possible — but this is always a brand-new account (existingProfile was
  // already checked above), so a plain insert is correct here anyway.
  const { data: advisorRow, error: advisorErr } = await svc.from("advisors").insert({
    user_id: userId,
    name: trimmedName,
    country: "AE",
    available: true,
    verified: true,
  }).select("*").maybeSingle();
  if (advisorErr) console.warn("advisors row insert warning", advisorErr);

  try {
    await sendAdvisorWelcomeEmail({ email: normalizedEmail, name: trimmedName, tempPassword, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
  } catch (emailErr) {
    console.warn("[assignAdvisor:createAdvisor] Welcome email failed (non-fatal):", emailErr?.message || emailErr);
  }

  return res.status(200).json({ success: true, data: { userId, advisor: advisorRow || null }, error: null });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { profile: callerProfile } = await verifyAdminOrAdvisor(auth);

    if (req.body?.action === "createAdvisor") {
      return await handleCreateAdvisor(req, res, callerProfile);
    }

    const { applicationId, advisorId, notes = "" } = req.body || {};
    if (!applicationId || !advisorId) return res.status(400).json({ error: "applicationId and advisorId required" });

    const svc = getServiceClient();

    const { data: existing } = await svc.from("applications").select("id,workflow_state,user_id,advisor_id,applicant_type").eq("id", applicationId).maybeSingle();
    if (!existing) return res.status(404).json({ error: "application not found" });

    const { data: advisorRecord } = await svc.from("advisors").select("id,user_id").eq("id", advisorId).maybeSingle();
    const resolvedAdvisorUserId = advisorRecord?.user_id || advisorId;
    const { data: advisorProfile } = await svc.from("profiles").select("full_name,email").eq("id", resolvedAdvisorUserId).maybeSingle();
    const advisorLabel = advisorProfile?.full_name || advisorProfile?.email || resolvedAdvisorUserId;

    const { application: updated, historyEntry, notifications } = await assignAdvisorToApplication({
      svc, existing, advisorUserId: resolvedAdvisorUserId, advisorLabel, notes,
    });

    return res.status(200).json({ success: true, data: { application: updated }, historyEntry, notifications, error: null });
  } catch (err) {
    console.error("assignAdvisor error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
