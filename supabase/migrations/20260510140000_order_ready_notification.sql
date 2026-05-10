-- Customer "ready for pickup / out for delivery" notification support.
-- Adds ready_notified_at to track whether the staff has already pinged
-- the customer (so the admin UI can disable the button after sending).
-- Also collapses deprecated statuses ('confirmed', 'preparing') back to
-- 'pending' since the admin UI now exposes only pending/ready/completed/cancelled.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ready_notified_at TIMESTAMPTZ;

UPDATE public.orders
SET status = 'pending'
WHERE status IN ('confirmed', 'preparing');
