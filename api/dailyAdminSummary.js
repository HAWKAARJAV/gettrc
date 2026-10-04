import { initSentry } from "./_sentry.js";
initSentry();

// Automated daily compiled report to admin — permanently off.
// Vercel Cron was removed from vercel.json; this endpoint is a no-op so
// manual hits or any stale cron cannot send mail.
export default async function handler(_req, res) {
  return res.status(200).json({
    success: true,
    skipped: true,
    reason: "Daily compiled report email is disabled.",
  });
}
