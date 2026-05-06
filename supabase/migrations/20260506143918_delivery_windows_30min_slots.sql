-- Applied to remote 2026-05-06 14:39:18 via Supabase MCP apply_migration.
-- Replace 2 broad delivery windows with 11 30-min start slots
-- (9 AM - 1 PM and 5:30 PM - 7 PM, last slot 30 min before close).

UPDATE public.business_settings
SET delivery_windows = '["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","5:30 PM","6:00 PM","6:30 PM"]'::jsonb;

ALTER TABLE public.business_settings
  ALTER COLUMN delivery_windows SET DEFAULT '["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","5:30 PM","6:00 PM","6:30 PM"]'::jsonb;
