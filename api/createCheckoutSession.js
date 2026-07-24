import Stripe from "stripe";
import { getServiceClient, verifyApplicationOwner } from "./_shared.js";
import { initSentry, captureError } from "./_sentry.js";
initSentry();

// Fee amounts live in public.platform_settings (editable without a
// redeploy — see supabase/migrations/20260724144400_platform_settings_pricing.sql),
// with the Vercel env vars as a fallback if a setting is ever missing. This
// endpoint refuses to create a checkout session rather than charging an
// arbitrary placeholder amount if pricing isn't configured. Total payable
// = the FTA's published government fee for the applicant's tier + our flat
// service fee on top:
//   - Retail, already a registered taxpayer (vat_registered = "yes"): govt
//     AED 550 -> stripe_retail_registered_fee_aed (govt + our fee)
//   - Retail, not registered:                     govt AED 1,050 -> stripe_retail_unregistered_fee_aed
//   - Corporate:                                   govt AED 1,800 -> stripe_corporate_fee_aed
async function getSetting(svc, key, envFallback) {
  const { data } = await svc.from("platform_settings").select("value").eq("key", key).maybeSingle();
  const raw = data?.value ?? envFallback;
  const amount = Number(raw);
  return (raw === undefined || raw === null || !Number.isFinite(amount) || amount <= 0) ? null : amount;
}

async function getFeeAedForApplication(application, svc) {
  if (application.applicant_type === "corporate") {
    return getSetting(svc, "stripe_corporate_fee_aed", process.env.STRIPE_CORPORATE_FEE_AED);
  }

  let vatRegistered = "no";
  if (application.eligibility_request_id) {
    const { data: elig } = await svc.from("eligibility_requests").select("vat_registered").eq("id", application.eligibility_request_id).maybeSingle();
    vatRegistered = String(elig?.vat_registered || "no").trim().toLowerCase();
  }
  return vatRegistered === "yes"
    ? getSetting(svc, "stripe_retail_registered_fee_aed", process.env.STRIPE_RETAIL_REGISTERED_FEE_AED)
    : getSetting(svc, "stripe_retail_unregistered_fee_aed", process.env.STRIPE_RETAIL_UNREGISTERED_FEE_AED);
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

    const svc = getServiceClient();
    const feeAed = await getFeeAedForApplication(application, svc);
    if (feeAed === null) {
      return res.status(503).json({ error: "The service fee has not been configured yet. Please contact support to proceed with payment." });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    captureError("createCheckoutSession error", err);
    return res.status(err?.status || 500).json({ error: err?.message || String(err) });
  }
}
