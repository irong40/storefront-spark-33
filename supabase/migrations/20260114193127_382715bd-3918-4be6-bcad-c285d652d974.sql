-- Add archived status values to orders
-- We add new status options for archiving by time period
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (
  status IS NULL OR status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled',
    'archived_weekly', 'archived_monthly', 'archived_quarterly', 'archived_yearly'
  )
);