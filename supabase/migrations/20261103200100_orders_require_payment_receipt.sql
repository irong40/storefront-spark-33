-- 2026-11-03 stopgap: replace the "any 20+ char payment_id" check with a real receipt.
-- Requires process-payment v28+ (writes payment_receipts after each Square charge).
-- Undo: recreate the old policy:
--   create policy "Anyone can create paid orders" on public.orders for insert to public
--     with check (payment_id is not null and length(payment_id) >= 20 and payment_status = 'completed');

drop policy if exists "Anyone can create paid orders" on public.orders;
create policy "Anyone can create paid orders" on public.orders
  for insert to public
  with check (
    payment_status = 'completed'
    and public.payment_receipt_valid(payment_id, total)
  );
