DROP POLICY IF EXISTS "System can create transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.loyalty_transactions;

CREATE POLICY "Service role only inserts transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (false);
