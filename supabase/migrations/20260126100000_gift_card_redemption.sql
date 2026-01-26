-- Add gift card tracking to orders
ALTER TABLE public.orders
ADD COLUMN gift_card_amount DECIMAL(10, 2) DEFAULT 0,
    ADD COLUMN gift_card_code TEXT;
-- RPC to safely redeem gift card amount
-- Deducts amount from balance if sufficient funds exist
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
        code_input TEXT,
        amount_to_deduct DECIMAL(10, 2)
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
v_current_balance DECIMAL(10, 2);
v_new_balance DECIMAL(10, 2);
BEGIN -- Check if card exists and get current balance
SELECT id,
    balance INTO v_id,
    v_current_balance
FROM public.gift_cards
WHERE code = code_input;
IF v_id IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'Invalid gift card code'
);
END IF;
IF v_current_balance < amount_to_deduct THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'Insufficient balance'
);
END IF;
-- Deduct amount
UPDATE public.gift_cards
SET balance = balance - amount_to_deduct,
    updated_at = NOW(),
    redeemed_at = CASE
        WHEN (balance - amount_to_deduct) <= 0 THEN NOW()
        ELSE redeemed_at
    END
WHERE id = v_id
RETURNING balance INTO v_new_balance;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Git card redeemed successfully',
    'new_balance',
    v_new_balance,
    'deducted_amount',
    amount_to_deduct
);
END;
$$;