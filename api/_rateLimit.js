// Fixed-window rate limiting backed by Supabase (see
// supabase/migrations/20260724191100_rate_limits.sql) — Vercel serverless
// functions are stateless per-invocation, so an in-memory counter wouldn't
// work across requests.

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Returns true if the request is allowed (and counts it against the
// window), false if the caller is over the limit. Fails open (allows the
// request) if the rate-limit check itself errors — a broken limiter should
// never be the reason a legitimate request fails.
export async function checkRateLimit(svc, key, { limit, windowSeconds }) {
  try {
    const { data, error } = await svc.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("[rateLimit] check failed, failing open", error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.warn("[rateLimit] check threw, failing open", err);
    return true;
  }
}

export async function enforceRateLimit(req, res, svc, { key, limit, windowSeconds, message }) {
  const allowed = await checkRateLimit(svc, key, { limit, windowSeconds });
  if (!allowed) {
    res.status(429).json({ error: message || "Too many requests. Please try again shortly." });
    return false;
  }
  return true;
}
