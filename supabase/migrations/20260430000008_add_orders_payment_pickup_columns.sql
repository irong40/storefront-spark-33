ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pickup_date DATE,
  ADD COLUMN IF NOT EXISTS pickup_time TEXT;
