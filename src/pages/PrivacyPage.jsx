import { useSEO } from "../seo/useSEO";
import { C } from "../theme/marketingColors";

const SERIF = "'Cormorant Garamond', serif";
const SANS = "'DM Sans', -apple-system, sans-serif";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy",
    description: "Privacy Policy for TRC Connect's UAE Tax Residency Certificate application platform.",
    path: "/privacy",
    type: "website",
  });

  return (
    <div style={{ background: C.offWhite, minHeight: "100vh", fontFamily: SANS }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}>
        <a href="/" style={{ color: C.gold, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>← Back to TRC Connect</a>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "16px 20px", margin: "24px 0", fontSize: 13, color: "#92400E", lineHeight: 1.7 }}>
          <strong>Draft, pending legal review.</strong> This document was prepared as an operational starting point — including a description of how the platform actually handles data today — and has not been reviewed by a qualified lawyer for compliance with UAE Federal Decree-Law No. 45 of 2021 (the Personal Data Protection Law) or other applicable regimes. It should be reviewed and formally adopted before being relied on as a binding policy.
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 38, color: C.navy, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 40 }}>Last updated: 24 July 2026</p>

        <Section title="1. What we collect">
          <p style={{ marginBottom: 12 }}><strong>Account and eligibility information:</strong> name, email, phone, nationality, and the answers you give during the eligibility questionnaire (residency status, visa type, income source, and similar details relevant to a UAE Tax Residency Certificate application).</p>
          <p><strong>Identity and financial documents:</strong> passport copies, Emirates ID, bank statements, tenancy contracts, and other supporting documents you upload as part of your application, at your advisor's request.</p>
        </Section>

        <Section title="2. How it's stored">
          <p style={{ marginBottom: 12 }}>Application data lives in a Postgres database (Supabase) with row-level access controls, so a query can only return rows belonging to the requesting user unless they're an assigned advisor or administrator.</p>
          <p>Uploaded documents are stored in a private object storage bucket, organized per application, and are not publicly accessible by URL. Access requires a signed, time-limited link generated only for you, your assigned advisor, or an administrator — verified against your specific case, not just your account type.</p>
        </Section>

        <Section title="3. Who can see it">
          <p style={{ marginBottom: 12 }}><strong>You</strong> can always see your own information and documents.</p>
          <p style={{ marginBottom: 12 }}><strong>Your assigned advisor</strong> can see your eligibility answers and documents for the purpose of reviewing and filing your application — and only for cases they're assigned to, not other applicants' cases.</p>
          <p><strong>Administrators</strong> have monitoring access to application status and audit logs to operate the platform, but the day-to-day handling of your case (eligibility review, document approval, filing) is done by your advisor, not admin staff.</p>
        </Section>

        <Section title="4. Payment data">
          <p>Payments are processed by Stripe. We never see or store your full card number — Stripe handles that directly. We keep a record of the payment amount, timestamp, and Stripe's reference IDs so we can confirm your payment and unlock your workspace.</p>
        </Section>

        <Section title="5. Emails we send">
          <p>We send transactional emails tied to your application's progress (eligibility decisions, payment confirmation, document requests, filing updates) via Resend. We don't send marketing email unless you separately opt in somewhere that says so.</p>
        </Section>

        <Section title="6. Error monitoring">
          <p>We use Sentry to catch and diagnose bugs in the platform. When something goes wrong, Sentry may capture technical details of that request (the page you were on, browser/device information, and any error message) — not your application answers or document contents.</p>
        </Section>

        <Section title="7. How long we keep it">
          <p>We keep your application data and documents for as long as your account is active and for a reasonable period afterward to meet recordkeeping obligations related to your TRC application. If you'd like your account and data deleted, contact us — we'll remove what we're not legally required to retain.</p>
        </Section>

        <Section title="8. Your choices">
          <p>You can review and update your profile information from your workspace at any time. To request a copy of your data, or deletion of your account, email <a href="mailto:support@gettrc.com" style={{ color: C.gold, fontWeight: 700 }}>support@gettrc.com</a>.</p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>If we make material changes to how we handle your data, we'll update the "Last updated" date above.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions about this policy or your data? Email <a href="mailto:support@gettrc.com" style={{ color: C.gold, fontWeight: 700 }}>support@gettrc.com</a>.</p>
        </Section>
      </div>
    </div>
  );
}
