ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS owner_acknowledged_at timestamptz;
