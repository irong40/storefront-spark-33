DROP POLICY IF EXISTS "Anyone can create and manage carts by session" ON public.carts;

CREATE POLICY "Authenticated users can read own carts"
  ON public.carts FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Anon users can read cart by session"
  ON public.carts FOR SELECT
  USING (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::jsonb->>'x-cart-session-id');

CREATE POLICY "Anyone can insert carts"
  ON public.carts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own cart"
  ON public.carts FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::jsonb->>'x-cart-session-id')
  );

CREATE POLICY "Anyone can delete own cart"
  ON public.carts FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_id = current_setting('request.headers', true)::jsonb->>'x-cart-session-id')
  );

DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;

CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND (
          (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
          OR (auth.uid() IS NULL AND carts.session_id = current_setting('request.headers', true)::jsonb->>'x-cart-session-id')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND (
          (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
          OR (auth.uid() IS NULL AND carts.session_id = current_setting('request.headers', true)::jsonb->>'x-cart-session-id')
        )
    )
  );
