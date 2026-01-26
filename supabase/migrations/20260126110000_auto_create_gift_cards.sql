-- Add gift_card_data to order_items to persist recipient info
ALTER TABLE public.order_items
ADD COLUMN gift_card_data JSONB;
-- Function to automatically create gift card records when purchased
CREATE OR REPLACE FUNCTION public.process_new_gift_card() RETURNS TRIGGER AS $$
DECLARE v_gift_data JSONB;
v_amount DECIMAL;
BEGIN -- Check if this item has gift card data
IF NEW.gift_card_data IS NOT NULL THEN v_gift_data := NEW.gift_card_data;
-- Amount from the order item total (or unit price if qty 1, but let's handle qty > 1?)
-- If qty > 1, we should probably generate N gift cards? 
-- For simplicity, let's assume we create ONE card with total value? 
-- NO, usually one card per item. If Qty=2, we need 2 cards? 
-- The prompt/UI likely treats them as distinct configurations. 
-- Let's assume Qty=1 for gift cards usually. 
-- If logic allows multiple, let's loop or just create one with total value?
-- Standard practice: 1 line item = 1 card configuration. 
-- We will create ONE card per row for now.
INSERT INTO public.gift_cards (
        amount,
        balance,
        purchaser_email,
        recipient_email,
        recipient_name,
        personal_message,
        delivery_date,
        order_id,
        is_for_self
    )
VALUES (
        NEW.total / NEW.quantity,
        -- Unit price as amount
        NEW.total / NEW.quantity,
        (
            SELECT email
            FROM public.orders
            WHERE id = NEW.order_id
        ),
        -- Purchaser email from order
        v_gift_data->>'recipientEmail',
        v_gift_data->>'recipientName',
        v_gift_data->>'message',
        (v_gift_data->>'deliveryDate')::date,
        NEW.order_id,
        COALESCE((v_gift_data->>'isForSelf')::boolean, false)
    );
-- If Quantity > 1, should we repeat?
-- This naive implementation creates 1 card. 
-- Improving to loop if Quantity > 1:
IF NEW.quantity > 1 THEN FOR i IN 2..NEW.quantity LOOP
INSERT INTO public.gift_cards (
        amount,
        balance,
        purchaser_email,
        recipient_email,
        recipient_name,
        personal_message,
        delivery_date,
        order_id
    )
VALUES (
        NEW.total / NEW.quantity,
        NEW.total / NEW.quantity,
        (
            SELECT email
            FROM public.orders
            WHERE id = NEW.order_id
        ),
        v_gift_data->>'recipientEmail',
        v_gift_data->>'recipientName',
        v_gift_data->>'message',
        (v_gift_data->>'deliveryDate')::date,
        NEW.order_id
    );
END LOOP;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger logic
CREATE TRIGGER on_order_item_gift_card_created
AFTER
INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.process_new_gift_card();