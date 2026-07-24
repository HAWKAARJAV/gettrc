import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  initialized = true;
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

// Drop-in replacement for the console.error(label, err) calls already at the
// bottom of every api/*.js handler — reports to Sentry (when SENTRY_DSN is
// configured) in addition to the existing console logging, without changing
// any handler's control flow or response shape.
export function captureError(label, err) {
  console.error(label, err);
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureException(err instanceof Error ? err : new Error(String(err?.message || err)), {
    extra: { label },
  });
}
