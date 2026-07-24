-- Fix off-by-one in check_rate_limit(): the initial INSERT seeded count=1
-- (as if the row's creation already consumed one call), then the very next
-- check incremented it again before comparing — so a limit of 5 actually
-- blocked on the 5th call instead of the 6th. Verified live: 4 requests
-- succeeded, the 5th was rejected. Seed at count=0 instead so the first
-- real check-and-increment is what brings it to 1.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (p_key, 0, now())
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
