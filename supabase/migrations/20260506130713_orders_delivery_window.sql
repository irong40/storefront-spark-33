-- Applied to remote 2026-05-06 13:07:13.
-- Capture preferred delivery time window per order.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_time_window TEXT;
