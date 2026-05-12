-- Capture preferred delivery date on orders (paired with delivery_time_window).
-- Customers were only able to choose a window, not a date.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_date DATE;
