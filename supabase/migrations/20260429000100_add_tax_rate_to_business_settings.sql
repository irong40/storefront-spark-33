-- Single source of truth for tax rate.
-- Both the frontend (via business_settings query) and the process-payment
-- edge function read from this column, eliminating the duplicated hardcoded 0.08.
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.08;
