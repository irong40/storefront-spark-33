-- Gift card delivery pipeline.
-- 1. Enable pg_net so cron can call edge functions.
-- 2. Schedule a daily cron at 12:00 UTC (8 AM ET) that invokes
--    process-gift-card-deliveries, which scans for active gift cards whose
--    delivery_date has arrived but delivered=false, and sends each via SMTP.
-- Storefront checkout fires send-gift-card immediately for any card whose
-- delivery_date is today or earlier; this cron handles future-dated cards.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Idempotent re-schedule
DO $$
BEGIN
  PERFORM cron.unschedule('gift-card-deliveries-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'gift-card-deliveries-daily',
  '0 12 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://tzbwrssopmjvgvvgdvfu.supabase.co/functions/v1/process-gift-card-deliveries',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
