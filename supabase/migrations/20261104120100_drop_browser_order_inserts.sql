-- APPLY ONLY AFTER the server-side checkout is live and a real order has been verified
-- (process-payment returns `order`, OrderConfirmation shows it, the receipt is linked).
-- From then on only process-payment (service role) creates orders, items and purchased
-- gift cards, so the browser loses all three INSERT paths.
-- Admin-issued gift cards still go through "Admins can manage gift cards".
-- Undo: recreate the three policies as they were in 20261103200100 / 20261103190000:
--   create policy "Anyone can create paid orders" on public.orders for insert to public
--     with check (payment_status = 'completed' and public.payment_receipt_valid(payment_id, total));
--   create policy "Anyone can create order items" on public.order_items for insert to public with check (true);
--   create policy "Gift cards must reference a paid order" on public.gift_cards for insert to public
--     with check (order_id is not null and public.order_is_paid(order_id));

drop policy if exists "Anyone can create paid orders" on public.orders;
drop policy if exists "Anyone can create order items" on public.order_items;
drop policy if exists "Gift cards must reference a paid order" on public.gift_cards;
