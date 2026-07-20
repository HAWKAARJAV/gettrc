const EMAIL_CONTENT = {
  pending_review: {
    subject: "We're reviewing your TRC eligibility",
    emoji: "🔍",
    heading: "Your application is under review",
    body: "A specialist is manually checking your details against UAE FTA requirements. This usually takes 24–48 hours — we'll notify you as soon as there's an update.",
    cta: { label: "View Application Status", path: "/retail/eligibility-status" },
  },
  eligible: {
    subject: "Great news — you're eligible for a UAE Tax Residency Certificate",
    emoji: "✅",
    heading: "Eligibility confirmed",
    body: "Your eligibility has been verified by our compliance team. We'll reach out shortly to arrange the payment and unlock your full workspace.",
    cta: { label: "Contact Support", path: "/retail/support" },
  },
  payment_pending: {
    subject: "Action required: Complete your TRC payment",
    emoji: "💳",
    heading: "Payment step is next",
    body: "Our team will call you to complete the payment. Once confirmed, your full workspace unlocks and we begin processing your application.",
    cta: { label: "Contact Support", path: "/retail/support" },
  },
  payment_completed: {
    subject: "Payment confirmed — your TRC workspace is now unlocked",
    emoji: "🔓",
    heading: "Workspace unlocked",
    body: "Your payment has been confirmed. Your workspace is fully open — the next step is uploading your required compliance documents.",
    cta: { label: "Upload Your Documents", path: "/retail/documents" },
  },
  documents_pending: {
    subject: "Action required: Upload your TRC documents",
    emoji: "📁",
    heading: "Documents are needed",
    body: "Please upload your required compliance documents to keep your application on track. Your advisor is waiting to review them.",
    cta: { label: "Upload Documents Now", path: "/retail/documents" },
  },
  documents_under_review: {
    subject: "Your TRC documents are being reviewed",
    emoji: "🔎",
    heading: "Documents under review",
    body: "Your advisor is going through the files you've uploaded. You'll be notified if anything else is required.",
    cta: { label: "View Your Documents", path: "/retail/documents" },
  },
  advisor_assigned: {
    subject: "Your TRC advisor has been assigned",
    emoji: "⚖️",
    heading: "Your advisor is on the case",
    body: "Your application has been assigned to a TRC advisor. They're handling everything — you can message them directly through your dashboard.",
    cta: { label: "Chat with Your Advisor", path: "/retail/chat" },
  },
  processing: {
    subject: "Your TRC application is being prepared",
    emoji: "⚙️",
    heading: "Application in progress",
    body: "Your advisor is finalising the documents and preparing your submission to the UAE Federal Tax Authority.",
    cta: { label: "Chat with Your Advisor", path: "/retail/chat" },
  },
  submitted_to_authority: {
    subject: "Your TRC application has been filed with the UAE FTA",
    emoji: "📬",
    heading: "Application officially submitted",
    body: "Your application has been filed with the UAE Federal Tax Authority. A response typically takes 5–15 working days.",
    cta: { label: "View Application", path: "/retail/dashboard" },
  },
  completed: {
    subject: "🏆 Your Tax Residency Certificate is ready!",
    emoji: "🏆",
    heading: "Congratulations — your TRC has been issued!",
    body: "Your Tax Residency Certificate has been successfully issued by the UAE Federal Tax Authority. You can now download it from your dashboard.",
    cta: { label: "View Your Certificate", path: "/retail/documents" },
  },
  rejected: {
    subject: "Update on your TRC application",
    emoji: "❌",
    heading: "Application not approved",
    body: "Unfortunately your application was not approved at this stage. Please contact our support team to understand the next steps and explore your options.",
    cta: { label: "Contact Support", path: "/retail/support" },
  },
};

const FALLBACK_CONTENT = {
  subject: "Update on your TRC application",
  emoji: "📋",
  heading: "Your application has been updated",
  body: "Your TRC application status has changed. Log in to your dashboard to see the latest update.",
  cta: { label: "View Dashboard", path: "/retail/dashboard" },
};

export function renderNotesBlock(notes, heading = "Note from your advisor:") {
  if (!notes) return "";
  return `
      <div style="margin:0 0 28px;padding:16px 20px;background:#F7F8FC;border-left:3px solid #C9A84C;border-radius:6px">
        <p style="font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#0F2557;margin:0 0 6px">${heading}</p>
        <p style="font-size:14px;color:#4A5568;line-height:1.65;margin:0;white-space:pre-wrap">${notes}</p>
      </div>`;
}

function buildEmailHtml({ content, name, applicationId, siteUrl, notes, ctaUrl }) {
  const refId = (applicationId || "").slice(0, 8).toUpperCase();
  const firstName = (name || "there").split(" ")[0];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:'DM Sans',-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(15,37,87,.08)">
    <div style="background:linear-gradient(135deg,#0F2557,#1A3570);padding:36px 40px">
      <div style="margin-bottom:20px">
        <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#C9A84C">TRC Connect</span>
        <span style="font-size:11px;color:rgba(255,255,255,.5);margin-left:8px">gettrc.com</span>
      </div>
      <div style="font-size:48px;margin-bottom:12px">${content.emoji}</div>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.3">${content.heading}</h1>
      <p style="font-size:13px;color:rgba(255,255,255,.55);margin:0">Ref: ${refId}</p>
    </div>
    <div style="padding:36px 40px">
      <p style="font-size:16px;color:#0F2557;margin:0 0 16px">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A5568;line-height:1.75;margin:0 0 28px">${content.body}</p>
      ${renderNotesBlock(notes)}
      <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#A07C2E);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
        ${content.cta.label} →
      </a>
    </div>
    <div style="background:#F7F8FC;border-top:1px solid #E2E8F0;padding:20px 40px;text-align:center">
      <p style="font-size:12px;color:#6B7A99;margin:0 0 6px">You're receiving this because you have an active TRC application with us.</p>
      <p style="font-size:12px;color:#6B7A99;margin:0">
        <a href="${siteUrl}/retail/support" style="color:#C9A84C;text-decoration:none">Contact Support</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}" style="color:#C9A84C;text-decoration:none">gettrc.com</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

async function dispatchEmail({ email, subject, html, logContext }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[sendStatusEmail] RESEND_API_KEY not set — skipping email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from: "TRC Connect <notifications@gettrc.com>", to: email, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.warn(`[sendStatusEmail] Resend error (${res.status}): ${err}`);
  } else {
    console.log(`[sendStatusEmail] Email sent → ${email} (${logContext})`);
  }
}

export async function sendStatusEmail({ email, name, newState, applicationId, siteUrl = "https://gettrc.com", notes = "" }) {
  const content = EMAIL_CONTENT[newState] || FALLBACK_CONTENT;
  const ctaUrl = `${siteUrl}${content.cta.path}`;
  const html = buildEmailHtml({ content, name, applicationId, siteUrl, notes, ctaUrl });
  await dispatchEmail({ email, subject: content.subject, html, logContext: `state: ${newState}` });
}

// Advisor-facing emails — distinct from the client-facing ones above.
// Currently covers: a client's payment clearing, and a client uploading a
// document. Kept as a single function (vs. one per event) since both are
// simple "here's what happened, go look" nudges with the same shape.
const ADVISOR_EMAIL_CONTENT = {
  payment_received: ({ clientName }) => ({
    subject: "Payment received — case ready to proceed",
    emoji: "💳",
    heading: "Payment confirmed",
    body: `${clientName || "Your client"}'s payment has cleared. The case is now ready to proceed — you can begin requesting documents.`,
    cta: { label: "Open Case", path: null },
  }),
  document_uploaded: ({ clientName, documentType }) => ({
    subject: `Document uploaded: ${documentType || "a document"}`,
    emoji: "📥",
    heading: "New document uploaded",
    body: `${clientName || "Your client"} uploaded <strong>${documentType || "a document"}</strong> — it's ready for your review.`,
    cta: { label: "Review Document", path: null },
  }),
};

export async function sendAdvisorEmail({ email, name, kind, clientName = "", documentType = "", applicationId, siteUrl = "https://gettrc.com" }) {
  const builder = ADVISOR_EMAIL_CONTENT[kind];
  if (!builder) return;
  const content = builder({ clientName, documentType });
  content.cta.path = `/advisor/cases/${applicationId}`;
  const ctaUrl = `${siteUrl}${content.cta.path}`;
  const html = buildEmailHtml({ content, name, applicationId, siteUrl, notes: "", ctaUrl });
  await dispatchEmail({ email, subject: content.subject, html, logContext: `advisor ${kind}` });
}

export async function sendDocumentEmail({ email, name, kind, documentType, notes = "", applicationId, siteUrl = "https://gettrc.com", applicantType = "retail" }) {
  const basePath = applicantType === "corporate" ? "/corporate/documents" : "/retail/documents";
  const content =
    kind === "requested"
      ? {
          subject: `Action required: ${documentType} requested`,
          emoji: "📁",
          heading: "A document has been requested",
          body: `Your advisor has requested the following document for your application: <strong>${documentType}</strong>. Please upload it as soon as possible to keep your application on track.`,
          cta: { label: "Upload Your Document", path: basePath },
        }
      : {
          subject: "Action required: a document needs resubmission",
          emoji: "⚠️",
          heading: "A document needs resubmission",
          body: `Your <strong>${documentType}</strong> was reviewed and could not be accepted as submitted. Please review the note below and upload a corrected copy.`,
          cta: { label: "Resubmit Your Document", path: basePath },
        };

  const ctaUrl = `${siteUrl}${content.cta.path}`;
  const html = buildEmailHtml({ content, name, applicationId, siteUrl, notes, ctaUrl });
  await dispatchEmail({ email, subject: content.subject, html, logContext: `document ${kind}` });
}
