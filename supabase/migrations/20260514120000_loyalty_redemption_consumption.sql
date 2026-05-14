-- Track what a loyalty redemption was actually applied to.
-- The existing loyalty_redemptions table already has order_id, status, used_at —
-- this migration adds the audit detail needed to support real checkout
-- consumption (cheapest-eligible-line discount, % off / $ off / free shipping).

ALTER TABLE public.loyalty_redemptions
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS applied_to_product_id UUID REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS applied_to_size_name TEXT;

-- A code is consumed exactly once. The redemption row is the source of truth;
-- this partial unique index guarantees we never link two orders to the same
-- redemption even if a retry path slips through application logic.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_redemptions_order_id_unique
  ON public.loyalty_redemptions(order_id)
  WHERE order_id IS NOT NULL;

-- Link a 'used' redemption to the order that consumed it. Called by the
-- client right after the orders row is inserted (process-payment marks the
-- redemption used during the Square charge, but doesn't yet know the order_id
-- because the order insert happens client-side).
CREATE OR REPLACE FUNCTION public.link_redemption_to_order(
  p_redemption_id UUID,
  p_order_id      UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_user_id UUID;
  v_current_status TEXT;
  v_current_order  UUID;
BEGIN
  SELECT lm.user_id, lr.status, lr.order_id
    INTO v_member_user_id, v_current_status, v_current_order
  FROM loyalty_redemptions lr
  JOIN loyalty_members lm ON lm.id = lr.member_id
  WHERE lr.id = p_redemption_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Caller must own the redemption
  IF v_member_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Only link if it's actually been consumed and not already linked
  IF v_current_status <> 'used' OR v_current_order IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE loyalty_redemptions
  SET order_id = p_order_id
  WHERE id = p_redemption_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.link_redemption_to_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_redemption_to_order(UUID, UUID) TO authenticated;
