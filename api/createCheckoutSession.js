import Stripe from "stripe";
import { getServiceClient, verifyApplicationOwner } from "./_shared.js";

// Fee amounts are intentionally NOT hardcoded — pricing hasn't been decided
// yet. Until STRIPE_RETAIL_FEE_AED / STRIPE_CORPORATE_FEE_AED are set, this
// endpoint refuses to create a checkout session rather than charging an
// arbitrary placeholder amount.
function getFeeAedForApplicantType(applicantType) {
  const raw = applicantType === "corporate" ? process.env.STRIPE_CORPORATE_FEE_AED : process.env.STRIPE_RETAIL_FEE_AED;
  const amount = Number(raw);
  if (!raw || !Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Payments are not yet configured. Please contact support." });
    }

    const auth = (req.headers.authorization || req.headers.Authorization || "").replace("Bearer ", "");
    const { applicationId } = req.body || {};
    if (!applicationId) return res.status(400).json({ error: "applicationId required" });

    const { user, application } = await verifyApplicationOwner(auth, applicationId);

    if (application.workflow_state !== "eligible") {
      return res.status(400).json({ error: `Payment can only be started once your application is marked eligible (current state: ${application.workflow_state}).` });
    }

    const feeAed = getFeeAedForApplicantType(application.applicant_type);
    if (feeAed === null) {
      return res.status(503).json({ error: "The service fee has not been configured yet. Please contact support to proceed with payment." });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const svc = getServiceClient();
    const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", user.id).maybeSingle();

    const base = application.applicant_type === "corporate" ? "/corporate" : "/retail";
    const siteUrl = process.env.SITE_URL || "https://gettrc.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: profile?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "aed",
            unit_amount: Math.round(feeAed * 100),
            product_data: {
              name: "UAE Tax Residency Certificate — Service Fee",
              description: `TRC Connect service fee for application ${applicationId}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}${base}/eligibility-status?payment=success`,
      cancel_url: `${siteUrl}${base}/eligibility-status?payment=cancelled`,
      client_reference_id: applicationId,
      metadata: {
        applicationId,
        userId: user.id,
        applicantType: application.applicant_type,
      },
    });

    return res.status(200).json({ success: true, data: { checkoutUrl: session.url }, error: null });
  } catch (err) {
    console.error("createCheckoutSession error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
