-- RPC to check gift card balance by code
-- Returns balance if found, null if not.
-- SECURITY DEFINER allows unauthenticated users (or any user) to call this without selecting from the table directly via RLS.

CREATE OR REPLACE FUNCTION public.check_gift_card_balance(code_input TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT balance INTO v_balance
  FROM public.gift_cards
  WHERE code = code_input;
  
  RETURN v_balance;
END;
$$;
