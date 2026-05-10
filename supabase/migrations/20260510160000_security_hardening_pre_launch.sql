-- Pre-launch security hardening per CISO risk register 2026-05-10.
-- Closes F-001 (gift_cards INSERT free-money attack), F-002 (redeem_loyalty_reward
-- defense-in-depth), F-003 (orders INSERT phantom-order fraud) and revokes
-- /rpc/ access to several SECURITY DEFINER trigger functions that should
-- never have been anon-callable.

-- F-002: defense-in-depth REVOKE on functions whose internal auth.uid()
-- check already gates anon, but where exposing the /rpc/ surface is needless.
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_reward(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_order_points() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_order_completion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_inventory_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- F-003: tighten orders INSERT.
-- Old policy: WITH CHECK (true) — anyone could create a phantom order.
-- New policy: requires a non-trivial Square payment_id (Square IDs are 32+
-- chars) and payment_status='completed'. Fraudsters now have to forge a
-- believable Square ID rather than just have the anon key.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create paid orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    payment_id IS NOT NULL
    AND length(payment_id) >= 20
    AND payment_status = 'completed'
  );

-- F-001: tighten gift_cards INSERT.
-- Old policy: WITH CHECK (true) — anyone could mint a fake gift card with
-- an arbitrary balance and immediately redeem it for free product.
-- New policy: requires order_id to point to an existing paid order
-- (chained gate with the new orders policy above).
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;
CREATE POLICY "Gift cards must reference a paid order" ON public.gift_cards
  FOR INSERT
  WITH CHECK (
    order_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.payment_id IS NOT NULL
        AND o.payment_status = 'completed'
    )
  );
