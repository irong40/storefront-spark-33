-- Security hardening, 2026-11-03. Applied to production via MCP apply_migration (version 20261103151555).
-- Pre-change state: obsidian-dev/debug-journal/backups/2026-11-03-supabase-security-pre-change.md

-- 1. Guest order PII leak: "Guest orders readable by UUID" was USING (user_id IS NULL), so the anon key
--    could list every guest order (name, email, phone, address, payment_id). RLS cannot require knowing
--    the id. Stopgap until OrderConfirmation moves to get_guest_order(): only orders from the last
--    2 hours, which covers the post-checkout redirect, the policy's only consumer.
alter policy "Guest orders readable by UUID" on public.orders
  using (user_id is null and created_at > now() - interval '2 hours');
alter policy "Guest order items readable by UUID" on public.order_items
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id and o.user_id is null
                   and o.created_at > now() - interval '2 hours'));

-- Exact-id guest lookup for OrderConfirmation; the UUID is the capability.
-- (Body superseded by 20261103151646_get_guest_order_keep_payment_id.)
create or replace function public.get_guest_order(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'admin_notes' - 'payment_id' - 'refund_id',
    'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at)
                       from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.id = p_order_id and o.user_id is null;
$$;
revoke execute on function public.get_guest_order(uuid) from public;
grant execute on function public.get_guest_order(uuid) to anon, authenticated, service_role;

-- 2. gift_cards SELECT read auth.users, which neither anon nor authenticated may read, so every
--    evaluation raised 42501. The JWT already carries the email.
alter policy "Users can view their gift cards" on public.gift_cards
  to authenticated
  using (purchaser_email = (auth.jwt() ->> 'email') or recipient_email = (auth.jwt() ->> 'email'));

-- 3. Admin policies keyed on has_role(auth.uid(), ...) can never match anon; scope them to authenticated
--    so has_role can be withdrawn from anon below without turning denials into errors.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname in ('public','storage') and 'public' = any(roles)
      and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'has_role\('
  loop
    execute format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;
-- anon already had no direct grant; it inherited EXECUTE through PUBLIC.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;

-- 4. Trigger functions: EXECUTE is checked only at CREATE TRIGGER, not when they fire.
--    The 2026-05-10 hardening revoked anon/authenticated but left PUBLIC, so anon kept access.
revoke execute on function
  public.award_order_points(),
  public.create_loyalty_member(),
  public.enforce_orders_delivery_zone(),
  public.generate_order_number(),
  public.handle_new_user(),
  public.handle_order_completion(),
  public.notify_contact_submission(),
  public.set_announcements_updated_at()
from public, anon, authenticated;

-- 5. Maintenance functions with no API caller.
revoke execute on function public.trigger_inventory_sync(), public.cleanup_old_sync_logs()
from public, anon, authenticated;

-- 6. function_search_path_mutable
alter function public.generate_gift_card_code() set search_path = public;
alter function public.set_gift_card_code() set search_path = public;
alter function public.generate_reward_code() set search_path = public;
alter function public.set_redemption_code() set search_path = public;
alter function public.cleanup_old_sync_logs() set search_path = public;
alter function public.trigger_inventory_sync() set search_path = public;
alter function public.handle_order_completion() set search_path = public;
