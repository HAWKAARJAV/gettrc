-- Tracks when the advisor last viewed a support ticket, so the sidebar
-- "Updates" badge can reflect unseen admin replies instead of just open status.
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS advisor_viewed_at timestamptz;
