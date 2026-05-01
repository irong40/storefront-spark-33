DROP POLICY IF EXISTS "Anyone can update own cart" ON public.carts;
DROP POLICY IF EXISTS "Anyone can delete own cart" ON public.carts;

CREATE POLICY "Anyone can update own cart"
  ON public.carts FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can delete own cart"
  ON public.carts FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );
