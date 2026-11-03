-- 2026-11-03 stopgap: an order may only be created against a real Square payment.
-- process-payment records every successful charge here (service role). The orders
-- INSERT policy (next migration) accepts an order only for an unused, recent receipt.
-- Undo: drop the policy change first (20261103200100), then this table, trigger and functions.

create table if not exists public.payment_receipts (
  payment_id   text primary key,
  amount_cents integer not null,
  session_id   text,
  user_id      uuid,
  order_id     uuid,
  created_at   timestamptz not null default now()
);

alter table public.payment_receipts enable row level security;
-- No policies: only the service role (process-payment) and SECURITY DEFINER helpers touch it.
revoke all on table public.payment_receipts from public, anon, authenticated;

-- One order per payment, so a single receipt cannot back two orders.
create unique index if not exists orders_payment_id_key on public.orders (payment_id);

create or replace function public.payment_receipt_valid(p_payment_id text, p_total numeric)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from payment_receipts r
    where r.payment_id = p_payment_id
      and r.order_id is null
      and r.created_at > now() - interval '2 hours'
      -- The order total can be lower than the charge (gift cards), never higher.
      and round(p_total * 100) <= r.amount_cents + 1
  );
$$;

revoke execute on function public.payment_receipt_valid(text, numeric) from public;
grant execute on function public.payment_receipt_valid(text, numeric) to anon, authenticated, service_role;

create or replace function public.consume_payment_receipt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update payment_receipts set order_id = new.id
  where payment_id = new.payment_id and order_id is null;
  return new;
end;
$$;

revoke execute on function public.consume_payment_receipt() from public, anon, authenticated;

drop trigger if exists orders_consume_payment_receipt on public.orders;
create trigger orders_consume_payment_receipt
  after insert on public.orders
  for each row when (new.payment_id is not null)
  execute function public.consume_payment_receipt();
