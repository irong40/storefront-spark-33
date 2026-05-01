DROP POLICY IF EXISTS "Anon users can read cart by session" ON public.carts;

CREATE POLICY "Anon users can read cart by session"
  ON public.carts FOR SELECT
  USING (auth.uid() IS NULL AND session_id IS NOT NULL);
