-- Create a function to call the status update edge function
-- Note: This uses pg_net extension for async HTTP calls. If not available,
-- you can set up a Database Webhook in Supabase Dashboard instead.
-- Option 1: Using pg_net (if enabled)
-- CREATE OR REPLACE FUNCTION public.notify_order_status_change()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status != OLD.status THEN
--     PERFORM net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/send-order-status-update',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := jsonb_build_object(
--         'email', NEW.email,
--         'customerName', NEW.customer_name,
--         'orderNumber', NEW.order_number,
--         'newStatus', NEW.status,
--         'fulfillmentType', NEW.fulfillment_type,
--         'trackingUrl', current_setting('app.frontend_url') || '/order-tracking?order=' || NEW.order_number || '&email=' || NEW.email
--       )
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- Option 2: Create a simple status_history table for tracking/auditing
-- The edge function can be called via Database Webhook
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by UUID REFERENCES auth.users(id)
);
-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
-- Admin can view all
CREATE POLICY "Admins can view status history" ON public.order_status_history FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
                AND role = 'admin'
        )
    );
-- Trigger to log status changes and prepare for webhook
CREATE OR REPLACE FUNCTION public.log_order_status_change() RETURNS TRIGGER AS $$ BEGIN -- Only act if status actually changed
    IF NEW.status != OLD.status THEN -- Insert into history
INSERT INTO public.order_status_history (order_id, old_status, new_status)
VALUES (NEW.id, OLD.status, NEW.status);
-- Update the order's updated_at timestamp
NEW.updated_at := now();
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change BEFORE
UPDATE ON public.orders FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT
        FROM NEW.status
    ) EXECUTE FUNCTION public.log_order_status_change();
-- Add updated_at column if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE public.orders
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
END IF;
END $$;
-- IMPORTANT: To enable email sending, set up a Database Webhook in Supabase Dashboard:
-- Table: order_status_history
-- Events: INSERT
-- URL: https://[project-ref].supabase.co/functions/v1/send-order-status-update
-- Headers: Authorization: Bearer [service_role_key]
--
-- The webhook payload will need to be transformed. Alternatively, create an
-- Edge Function that queries the orders table using the order_id from the webhook.