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

export default function TermsPage() {
  useSEO({
    title: "Terms of Service",
    description: "Terms of Service for TRC Connect's UAE Tax Residency Certificate application platform.",
    path: "/terms",
    type: "website",
  });

  return (
    <div style={{ background: C.offWhite, minHeight: "100vh", fontFamily: SANS }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}>
        <a href="/" style={{ color: C.gold, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>← Back to TRC Connect</a>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "16px 20px", margin: "24px 0", fontSize: 13, color: "#92400E", lineHeight: 1.7 }}>
          <strong>Draft, pending legal review.</strong> This document was prepared as an operational starting point and has not been reviewed by a qualified lawyer familiar with UAE law. It should be reviewed and formally adopted before being relied on as a binding agreement.
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 38, color: C.navy, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 40 }}>Last updated: 24 July 2026</p>

        <Section title="1. Who we are">
          <p>TRC Connect ("we", "us", "our") operates gettrc.com, a platform that helps individuals and companies prepare and submit applications for a UAE Tax Residency Certificate ("TRC") issued by the UAE Federal Tax Authority ("FTA"). By creating an account or submitting an eligibility request, you ("you", "the applicant") agree to these Terms.</p>
        </Section>

        <Section title="2. What the service is — and isn't">
          <p style={{ marginBottom: 12 }}>TRC Connect provides advisor-guided assistance with eligibility assessment, document collection, and filing support for UAE TRC applications. Every application is reviewed by a human advisor before any determination or filing action is taken.</p>
          <p>We are not the UAE Federal Tax Authority. We do not issue Tax Residency Certificates — the FTA does, at its sole discretion, based on the application we help you prepare and file. We do not guarantee that any application will be approved.</p>
        </Section>

        <Section title="3. Your account">
          <p>You're responsible for the accuracy of the information you submit and for keeping your login credentials confidential. You must be the person (or an authorized representative of the company) the application is being made for. Providing false or misleading information may result in your application being rejected and your account being suspended.</p>
        </Section>

        <Section title="4. Documents you upload">
          <p>You'll be asked to upload identity and financial documents (for example, passport copies, Emirates ID, bank statements) as part of your application. These are stored securely and access is restricted to you, your assigned advisor, and platform administrators. See our <a href="/privacy" style={{ color: C.gold, fontWeight: 700 }}>Privacy Policy</a> for how we handle this data.</p>
        </Section>

        <Section title="5. Fees and payment">
          <p style={{ marginBottom: 12 }}>Our service fee is shown to you before you pay, and is separate from any government fee charged by the FTA. Fees are processed securely through Stripe; we do not store your card details.</p>
          <p>Once your application is confirmed eligible and payment is received, your advisor begins document collection and filing on your behalf. Refunds are considered on a case-by-case basis — contact support before starting work you'd want refunded.</p>
        </Section>

        <Section title="6. Your advisor">
          <p>Once assigned, your advisor reviews your eligibility, requests any documents still needed, reviews what you upload, and files your application with the FTA once everything is ready. Advisor determinations (eligibility basis, document approval, filing) are professional judgments made on your specific file — they are not automated decisions.</p>
        </Section>

        <Section title="7. Acceptable use">
          <p>Don't use the platform to submit an application on behalf of someone who hasn't authorized you to, attempt to access another applicant's account or documents, or interfere with the platform's normal operation (including automated abuse of forms or API endpoints).</p>
        </Section>

        <Section title="8. Liability">
          <p>We provide the platform and advisory service on an "as available" basis. To the fullest extent permitted by UAE law, we aren't liable for FTA processing delays, FTA rejection of an application, or losses arising from information you provided that turned out to be inaccurate. Nothing in these Terms limits liability that can't be limited under applicable law.</p>
        </Section>

        <Section title="9. Changes to these Terms">
          <p>We may update these Terms from time to time. If we make material changes, we'll update the "Last updated" date above. Continuing to use the platform after a change means you accept the updated Terms.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions about these Terms? Email <a href="mailto:support@gettrc.com" style={{ color: C.gold, fontWeight: 700 }}>support@gettrc.com</a>.</p>
        </Section>
      </div>
    </div>
  );
}
