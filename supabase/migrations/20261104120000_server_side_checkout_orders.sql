-- Server-side checkout: process-payment creates the order, its items and any purchased
-- gift cards in one transaction, and applies gift cards to the charge itself.
-- All three functions are service-role only (process-payment). Nothing here changes
-- what the browser may insert; 20261104120100 removes that once the new frontend is live.
-- Undo: drop function create_checkout_order, reserve_gift_cards, release_gift_cards.

-- Debit gift cards before the Square charge. All or nothing: if any card is missing,
-- expired or short on balance, nothing is debited and the payment is not attempted.
-- p_usage: [{"code": "GC-XXXX-XXXX-XXXX", "amount": 12.34}, ...]
create or replace function public.reserve_gift_cards(p_usage jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u jsonb;
  v_amount numeric;
begin
  for u in select * from jsonb_array_elements(coalesce(p_usage, '[]'::jsonb)) loop
    v_amount := round((u->>'amount')::numeric, 2);
    if v_amount <= 0 then
      raise exception 'invalid gift card amount for %', u->>'code';
    end if;
    update gift_cards
       set balance = balance - v_amount,
           redeemed_at = case when balance - v_amount <= 0 then now() else redeemed_at end,
           updated_at = now()
     where code = upper(u->>'code')
       and status = 'active'
       and (expires_at is null or expires_at > now())
       and balance >= v_amount;
    if not found then
      raise exception 'gift card % is not available for %', u->>'code', v_amount;
    end if;
  end loop;
end;
$$;

-- Put reserved amounts back (Square declined, or the order could not be saved).
create or replace function public.release_gift_cards(p_usage jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u jsonb;
begin
  for u in select * from jsonb_array_elements(coalesce(p_usage, '[]'::jsonb)) loop
    update gift_cards
       set balance = balance + round((u->>'amount')::numeric, 2),
           redeemed_at = null,
           updated_at = now()
     where code = upper(u->>'code');
  end loop;
end;
$$;

-- Insert the order, its items and purchased gift cards together, and link the
-- loyalty redemption. Amounts and items come from process-payment's own pricing
-- of the server-side cart, never from the browser.
create or replace function public.create_checkout_order(
  p_order jsonb,
  p_items jsonb,
  p_gift_cards jsonb,
  p_redemption_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := (p_order->>'id')::uuid;
begin
  insert into orders (
    id, order_number, user_id, email, phone, customer_name, fulfillment_type,
    subtotal, tax, shipping, total, notes, admin_notes, payment_id, payment_status,
    pickup_date, pickup_time, delivery_date, delivery_time_window, shipping_address
  ) values (
    v_order_id,
    p_order->>'order_number',
    nullif(p_order->>'user_id', '')::uuid,
    p_order->>'email',
    nullif(p_order->>'phone', ''),
    nullif(p_order->>'customer_name', ''),
    coalesce(p_order->>'fulfillment_type', 'pickup'),
    (p_order->>'subtotal')::numeric,
    (p_order->>'tax')::numeric,
    (p_order->>'shipping')::numeric,
    (p_order->>'total')::numeric,
    nullif(p_order->>'notes', ''),
    nullif(p_order->>'admin_notes', ''),
    p_order->>'payment_id',
    'completed',
    nullif(p_order->>'pickup_date', '')::date,
    nullif(p_order->>'pickup_time', ''),
    nullif(p_order->>'delivery_date', '')::date,
    nullif(p_order->>'delivery_time_window', ''),
    case when jsonb_typeof(p_order->'shipping_address') = 'object' then p_order->'shipping_address' end
  );

  insert into order_items (
    order_id, product_id, product_name, product_price, quantity, total,
    size_name, size_price, is_subscription, addons, selected_flavors, dressing
  )
  select
    v_order_id,
    nullif(i->>'product_id', '')::uuid,
    i->>'product_name',
    (i->>'product_price')::numeric,
    (i->>'quantity')::int,
    (i->>'total')::numeric,
    nullif(i->>'size_name', ''),
    nullif(i->>'size_price', '')::numeric,
    coalesce((i->>'is_subscription')::boolean, false),
    coalesce(i->'addons', '[]'::jsonb),
    coalesce(i->'selected_flavors', '[]'::jsonb),
    nullif(i->>'dressing', '')
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;

  insert into gift_cards (
    id, code, amount, balance, purchaser_email, recipient_email, recipient_name,
    is_for_self, personal_message, delivery_date, status, order_id
  )
  select
    (g->>'id')::uuid,
    g->>'code',
    (g->>'amount')::numeric,
    (g->>'amount')::numeric,
    p_order->>'email',
    nullif(g->>'recipient_email', ''),
    nullif(g->>'recipient_name', ''),
    coalesce((g->>'is_for_self')::boolean, true),
    nullif(g->>'personal_message', ''),
    (g->>'delivery_date')::date,
    'active',
    v_order_id
  from jsonb_array_elements(coalesce(p_gift_cards, '[]'::jsonb)) g;

  if p_redemption_id is not null then
    update loyalty_redemptions set order_id = v_order_id
     where id = p_redemption_id and status = 'used' and order_id is null;
  end if;

  return v_order_id;
end;
$$;

revoke execute on function public.reserve_gift_cards(jsonb) from public, anon, authenticated;
revoke execute on function public.release_gift_cards(jsonb) from public, anon, authenticated;
revoke execute on function public.create_checkout_order(jsonb, jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.reserve_gift_cards(jsonb) to service_role;
grant execute on function public.release_gift_cards(jsonb) to service_role;
grant execute on function public.create_checkout_order(jsonb, jsonb, jsonb, uuid) to service_role;
