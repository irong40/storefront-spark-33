-- 2026-11-03: close the guest-order read path for good.
-- OrderConfirmation now loads guest orders through get_guest_order() (deployed 9af2271),
-- so the RLS policies that let the anon key read guest orders are no longer needed.
--
-- The gift_cards INSERT check looked up the order through RLS, which only worked for
-- guests because of the guest read policy. Move that lookup into a SECURITY DEFINER
-- helper first so guest gift-card inserts keep passing the check.
--
-- Undo: recreate the two policies from 20261103151555 and restore the inline EXISTS check.

create or replace function public.order_is_paid(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders o
    where o.id = p_order_id
      and o.payment_id is not null
      and o.payment_status = 'completed'
  );
$$;

revoke execute on function public.order_is_paid(uuid) from public;
grant execute on function public.order_is_paid(uuid) to anon, authenticated, service_role;

drop policy if exists "Gift cards must reference a paid order" on public.gift_cards;
create policy "Gift cards must reference a paid order" on public.gift_cards
  for insert to public
  with check (order_id is not null and public.order_is_paid(order_id));

drop policy if exists "Guest orders readable by UUID" on public.orders;
drop policy if exists "Guest order items readable by UUID" on public.order_items;
