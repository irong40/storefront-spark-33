-- Drop the broken policy that queries auth.users
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Create a fixed policy that doesn't query auth.users
-- Authenticated users can view orders where they are the owner (by user_id)
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Also fix the order_items policy that has the same issue
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;

CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
  );