-- Fixed-window rate limiting backed by Supabase (no external service —
-- Vercel serverless functions are stateless, so counters can't live in
-- memory). One row per (key), reset when the window expires.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies defined — with RLS enabled and none granted, only the
-- service-role key (used server-side in api/*.js) can touch this table.

-- Atomic check-and-increment. Returns true if the call is allowed (and
-- counts it), false if the caller is over the limit for the current
-- window. Row-locks the key for the duration of the check so concurrent
-- requests from the same key can't race past the limit.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO NOTHING;

  SELECT * INTO v_row FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF now() - v_row.window_start > make_interval(secs => p_window_seconds) THEN
    UPDATE public.rate_limits SET count = 1, window_start = now() WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_row.count >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;

-- Periodic cleanup isn't strictly necessary (the table stays small — one
-- row per distinct key ever seen), but prevents unbounded growth from
-- one-off keys (e.g. IPs that never return).
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start);
