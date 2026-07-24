-- Generic key/value settings table so pricing (and future config) can be
-- changed without a redeploy. No RLS policies are defined, so with RLS
-- enabled, only the service-role key (used server-side in api/*.js) can
-- read/write it — clients get nothing.
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Seed the current TRC service fee tiers (govt fee + our flat AED 500),
-- matching what was previously hardcoded via Vercel env vars.
INSERT INTO public.platform_settings (key, value) VALUES
  ('stripe_retail_registered_fee_aed', '1050'),
  ('stripe_retail_unregistered_fee_aed', '1550'),
  ('stripe_corporate_fee_aed', '2300')
ON CONFLICT (key) DO NOTHING;
