import Stripe from "stripe";
import { getServiceClient, syncLegacyRequestFromApplication, normalizeActionUrl, autoAssignSoleAdvisor } from "./_shared.js";
import { sendStatusEmail, sendAdvisorEmail } from "./_sendStatusEmail.js";

// Stripe signature verification requires the raw, unparsed request body —
// disable Vercel's default JSON body parsing for this route only.
export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("stripeWebhook called but STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET not configured");
    return res.status(503).json({ error: "Stripe is not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("stripeWebhook signature verification failed", err?.message || err);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err?.message || err}` });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const applicationId = session.metadata?.applicationId || session.client_reference_id;
      if (!applicationId) {
        console.warn("stripeWebhook: checkout session completed with no applicationId in metadata", session.id);
        return res.status(200).json({ received: true });
      }

      const svc = getServiceClient();
      const { data: existing } = await svc.from("applications").select("*").eq("id", applicationId).maybeSingle();
      if (!existing) {
        console.warn("stripeWebhook: application not found for id", applicationId);
        return res.status(200).json({ received: true });
      }

      // Idempotency: Stripe may retry webhook delivery — don't double-process.
      if (existing.payment_state === "completed") {
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      const nextPatch = {
        payment_state: "completed",
        payment_details: {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent || null,
          amount_total: session.amount_total,
          currency: session.currency,
          paid_at: new Date().toISOString(),
        },
        workflow_state: "payment_completed",
        // Mirror into the legacy review_state column the admin queue reads, so
        // the case doesn't show one state to admin and another to advisor/client.
        review_state: "payment_completed",
        completed_at: existing.completed_at,
      };

      const { data: updated, error: updateError } = await svc.from("applications").update(nextPatch).eq("id", applicationId).select("*").maybeSingle();
      if (updateError) throw updateError;

      await syncLegacyRequestFromApplication({ application: updated || existing, nextPatch, notes: "Payment confirmed via Stripe" });

      await svc.from("application_status_history").insert({
        application_id: applicationId,
        previous_state: existing.workflow_state,
        new_state: "payment_completed",
        updated_by: "system",
        notes: `Payment confirmed via Stripe (session ${session.id})`,
      });

      const actionUrl = normalizeActionUrl(null, applicationId, existing.applicant_type) + "?panel=summary&focus=payment";

      // Notify the client.
      const notifRows = [{
        user_id: existing.user_id,
        application_id: applicationId,
        notification_type: "workflow",
        title: "Payment confirmed",
        body: "Your payment has been received. Your workspace is now fully unlocked.",
        action_url: actionUrl,
        level: "info",
        created_at: new Date().toISOString(),
      }];

      // Also notify the assigned advisor, if any — they previously got nothing.
      if (existing.advisor_id) {
        notifRows.push({
          user_id: existing.advisor_id,
          application_id: applicationId,
          notification_type: "workflow",
          title: "Payment received",
          body: `Payment has been confirmed for application ${applicationId} — the case is now ready to proceed.`,
          action_url: `/advisor/cases/${applicationId}`,
          level: "info",
          created_at: new Date().toISOString(),
        });
      }
      await svc.from("notifications").insert(notifRows);

      try {
        const { data: profile } = await svc.from("profiles").select("email,full_name").eq("id", existing.user_id).maybeSingle();
        if (profile?.email) {
          await sendStatusEmail({ email: profile.email, name: profile.full_name || "", newState: "payment_completed", applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
        }
        if (existing.advisor_id) {
          const { data: advisorProfile } = await svc.from("profiles").select("email,full_name").eq("id", existing.advisor_id).maybeSingle();
          if (advisorProfile?.email) {
            await sendAdvisorEmail({ email: advisorProfile.email, name: advisorProfile.full_name || "", kind: "payment_received", clientName: profile?.full_name, applicationId, siteUrl: process.env.SITE_URL || "https://gettrc.com" });
          }
        }
      } catch (emailErr) {
        console.warn("[stripeWebhook] Status email failed (non-fatal):", emailErr?.message || emailErr);
      }

      await autoAssignSoleAdvisor(svc, updated || existing);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripeWebhook processing error", err);
    // Return 500 so Stripe retries delivery — this is a processing failure, not a bad request.
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
