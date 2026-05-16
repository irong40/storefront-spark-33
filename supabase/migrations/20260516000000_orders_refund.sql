-- Add refund tracking to orders + extend status enum
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (
  status IS NULL OR status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled',
    'refunded', 'partially_refunded',
    'archived_weekly', 'archived_monthly', 'archived_quarterly', 'archived_yearly'
  )
);
