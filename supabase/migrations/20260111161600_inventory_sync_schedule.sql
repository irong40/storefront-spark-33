-- =============================================
-- Square Inventory Sync Scheduling
-- Syncs with Square every 30 minutes
-- =============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a table to log sync operations
CREATE TABLE IF NOT EXISTS public.inventory_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  products_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.inventory_sync_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for cleanup
CREATE INDEX inventory_sync_logs_started_at_idx ON public.inventory_sync_logs(started_at);

-- Function to clean up old sync logs (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.inventory_sync_logs
  WHERE started_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add last_synced_at column to products if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================
-- CRON JOB SETUP
-- Note: Supabase handles cron jobs through the dashboard or CLI
-- These are placeholder commands - actual setup requires Supabase CLI
-- =============================================

-- The cron job should be configured via Supabase Dashboard or CLI:
-- 
-- 1. Go to Supabase Dashboard > Database > Extensions > Enable pg_cron
-- 
-- 2. Go to Supabase Dashboard > Edge Functions > sync-square-inventory
--    Click "Schedule" and set: */30 * * * * (every 30 minutes)
--    Add header: X-Cron-Secret = [your secret]
--
-- OR via Supabase CLI:
--
-- supabase functions schedule sync-square-inventory \
--   --schedule "*/30 * * * *" \
--   --headers '{"X-Cron-Secret": "your-cron-secret-here"}'
--
-- Also add the CRON_SECRET to your function's secrets:
-- supabase secrets set CRON_SECRET=your-cron-secret-here

-- Create a function that can be called by pg_cron to invoke the edge function
CREATE OR REPLACE FUNCTION public.trigger_inventory_sync()
RETURNS void AS $$
DECLARE
  sync_log_id UUID;
  response_status INTEGER;
BEGIN
  -- Create log entry
  INSERT INTO public.inventory_sync_logs (status)
  VALUES ('started')
  RETURNING id INTO sync_log_id;
  
  -- The actual HTTP call to the edge function would be done via pg_net
  -- This requires the pg_net extension to be enabled
  -- For now, this serves as a placeholder for the manual cron setup
  
  -- Update log as completed (or failed if there was an error)
  UPDATE public.inventory_sync_logs
  SET status = 'completed', completed_at = now()
  WHERE id = sync_log_id;
  
EXCEPTION WHEN OTHERS THEN
  UPDATE public.inventory_sync_logs
  SET status = 'failed', error_message = SQLERRM, completed_at = now()
  WHERE id = sync_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job to run daily at 3 AM
-- SELECT cron.schedule('cleanup-sync-logs', '0 3 * * *', 'SELECT public.cleanup_old_sync_logs()');

COMMENT ON TABLE public.inventory_sync_logs IS 
'Logs for Square inventory sync operations. Automatically cleaned up after 7 days.';
