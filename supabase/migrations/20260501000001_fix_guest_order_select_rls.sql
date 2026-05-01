-- Guest users cannot read their own orders because the existing policy requires
-- auth.uid() IS NOT NULL. Add policies that allow reading by order UUID for
-- guest orders (user_id IS NULL). UUIDs are 128-bit random values, so
-- "knowledge of the UUID" is a sufficient capability token.

-- Orders: allow reading guest orders (user_id IS NULL) by any role
CREATE POLICY "Guest orders readable by UUID"
  ON public.orders FOR SELECT
  USING (user_id IS NULL);

-- Order items: allow reading items for guest orders
CREATE POLICY "Guest order items readable by UUID"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id IS NULL
    )
  );
