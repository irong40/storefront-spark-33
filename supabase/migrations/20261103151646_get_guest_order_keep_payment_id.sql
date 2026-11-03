-- OrderConfirmation renders "Payment ID", so keep it for parity with the old direct read.
create or replace function public.get_guest_order(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'admin_notes' - 'refund_id',
    'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at)
                       from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.id = p_order_id and o.user_id is null;
$$;
