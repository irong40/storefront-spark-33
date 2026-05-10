-- Make set_order_number trigger respect client-supplied order_number.
-- Previously the trigger unconditionally overwrote NEW.order_number, which
-- caused a mismatch between the value the frontend used to call
-- send-order-confirmation (the client-generated number) and the value
-- actually stored in the orders row (the trigger-generated number),
-- producing a 404 "Order not found" and no receipt email.

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
