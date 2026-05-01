DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;

CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND (
          (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
          OR (auth.uid() IS NULL AND carts.session_id IS NOT NULL)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND (
          (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
          OR (auth.uid() IS NULL AND carts.session_id IS NOT NULL)
        )
    )
  );
