import { getServiceClient } from "./_shared.js";
import { getClientIp, enforceRateLimit } from "./_rateLimit.js";
import { initSentry, captureError } from "./_sentry.js";
import { sendStatusEmail, sendAdvisorEmail } from "./_sendStatusEmail.js";
initSentry();

// Merged with the "eligibility submitted" notification (dispatched on
// `type`) to stay within the Vercel Hobby plan's 12-serverless-function cap
// — same reasoning as api/updateApplicationState.js. Both are public,
// unauthenticated endpoints fired before any session exists (contact form /
// just-completed signup), so they share the same no-auth + IP-rate-limit shape.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (req.body?.type === "eligibility_submitted") return handleEligibilitySubmitted(req, res);
  return handleInquiry(req, res);
}

async function handleEligibilitySubmitted(req, res) {
  const svc = getServiceClient();
  const ip = getClientIp(req);
  const allowed = await enforceRateLimit(req, res, svc, {
    key: `elig-submit-notify:${ip}`,
    limit: 10,
    windowSeconds: 600,
    message: "Too many requests. Please try again in a few minutes.",
  });
  if (!allowed) return;

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    const siteUrl = process.env.SITE_URL || "https://gettrc.com";
    const { data: profile } = await svc.from("profiles").select("id,full_name,email").eq("email", email).maybeSingle();
    if (!profile?.id) {
      // The signup DB trigger may not have run yet, or signup failed upstream.
      return res.status(200).json({ success: true, skipped: "no profile found" });
    }

    const { data: application } = await svc
      .from("applications")
      .select("id,advisor_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    try {
      await sendStatusEmail({ email: profile.email, name: profile.full_name || "", newState: "pending_review", applicationId: application?.id || "", siteUrl });
    } catch (e) {
      console.warn("[sendInquiryEmail:eligibility_submitted] applicant email failed (non-fatal):", e?.message || e);
    }

    if (application?.advisor_id) {
      try {
        const { data: advisorProfile } = await svc.from("profiles").select("full_name,email").eq("id", application.advisor_id).maybeSingle();
        if (advisorProfile?.email) {
          await sendAdvisorEmail({ email: advisorProfile.email, name: advisorProfile.full_name || "", kind: "new_case_assigned", clientName: profile.full_name, applicationId: application.id, siteUrl });
        }
      } catch (e) {
        console.warn("[sendInquiryEmail:eligibility_submitted] advisor email failed (non-fatal):", e?.message || e);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    captureError("sendInquiryEmail(eligibility_submitted) error", err);
    // Non-fatal by design — caller (signup flow) should not treat this as a failure.
    return res.status(200).json({ success: false, error: err?.message || String(err) });
  }
}

async function handleInquiry(req, res) {
  // Public, unauthenticated endpoint — the only protection against spam
  // (and unbounded Resend usage) is IP-based rate limiting.
  const svc = getServiceClient();
  const ip = getClientIp(req);
  const allowed = await enforceRateLimit(req, res, svc, {
    key: `inquiry:${ip}`,
    limit: 5,
    windowSeconds: 600,
    message: "Too many inquiries sent. Please try again in a few minutes.",
  });
  if (!allowed) return;

  const { name, email, country, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "name, email, and message required" });

  const resendApiKey = process.env.RESEND_API_KEY;
  const inquiryToEmail = process.env.INQUIRY_TO_EMAIL || "arinjay2009@gmail.com";
  const siteUrl = process.env.SITE_URL || "https://gettrc.com";

  if (!resendApiKey) return res.status(500).json({ error: "Missing RESEND_API_KEY" });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "TRC Connect <notifications@gettrc.com>",
        to: inquiryToEmail,
        subject: `New TRC Inquiry from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0F2557;padding:32px;border-radius:12px 12px 0 0">
              <h1 style="color:#C9A84C;margin:0;font-size:24px">New TRC Inquiry</h1>
              <p style="color:rgba(255,255,255,.7);margin:8px 0 0">gettrc.com</p>
            </div>
            <div style="background:#F7F8FC;padding:32px;border-radius:0 0 12px 12px;border:1px solid #E2E8F0">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#6B7A99;width:140px">Name</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#0F2557;font-weight:600">${name}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#6B7A99">Email</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#0F2557;font-weight:600">${email}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#6B7A99">Country</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;color:#0F2557;font-weight:600">${country || "—"}</td></tr>
                <tr><td style="padding:10px 0;color:#6B7A99;vertical-align:top">Message</td>
                    <td style="padding:10px 0;color:#0F2557">${message}</td></tr>
              </table>
              <a href="${siteUrl}/admin" style="display:inline-block;margin-top:24px;background:#C9A84C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">View in Admin Panel →</a>
            </div>
          </div>
        `,
      }),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);
  } catch (err) {
    captureError("sendInquiryEmail error", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
