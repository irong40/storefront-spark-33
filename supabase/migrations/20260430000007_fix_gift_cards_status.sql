ALTER TABLE public.gift_cards
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'depleted', 'expired', 'cancelled'));

UPDATE public.gift_cards SET status = 'active' WHERE status IS NULL OR status = '';

-- Drop old function (different return type) then recreate
DROP FUNCTION IF EXISTS public.check_gift_card_balance(TEXT);

CREATE OR REPLACE FUNCTION public.check_gift_card_balance(gift_card_code TEXT)
RETURNS TABLE(
  id UUID,
  code TEXT,
  balance NUMERIC,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.code,
    gc.balance,
    gc.status,
    gc.expires_at
  FROM gift_cards gc
  WHERE gc.code = UPPER(gift_card_code)
    AND gc.status = 'active'
    AND (gc.expires_at IS NULL OR gc.expires_at > now());
END;
$$;
