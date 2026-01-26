-- Add loyalty redemption tracking to orders
ALTER TABLE public.orders
ADD COLUMN loyalty_redemption_id UUID REFERENCES public.loyalty_redemptions(id),
    ADD COLUMN loyalty_discount_amount DECIMAL(10, 2) DEFAULT 0;
-- RPC to validate and get loyalty reward details
CREATE OR REPLACE FUNCTION public.check_loyalty_code(code_input TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_redemption RECORD;
v_reward RECORD;
BEGIN -- Get redemption details
SELECT * INTO v_redemption
FROM public.loyalty_redemptions
WHERE code = code_input
    AND status = 'active'
    AND expires_at > NOW();
IF v_redemption IS NULL THEN RETURN jsonb_build_object(
    'valid',
    false,
    'message',
    'Invalid or expired reward code'
);
END IF;
-- Get reward details
SELECT * INTO v_reward
FROM public.loyalty_rewards
WHERE id = v_redemption.reward_id
    AND active = true;
IF v_reward IS NULL THEN RETURN jsonb_build_object(
    'valid',
    false,
    'message',
    'Reward is no longer available'
);
END IF;
-- Return full details
RETURN jsonb_build_object(
    'valid',
    true,
    'redemption_id',
    v_redemption.id,
    'reward_type',
    v_reward.reward_type,
    'reward_value',
    v_reward.reward_value,
    'reward_name',
    v_reward.name,
    'min_order_amount',
    v_reward.min_order_amount,
    'product_id',
    v_reward.product_id
);
END;
$$;
-- RPC to mark redemption as used
CREATE OR REPLACE FUNCTION public.use_loyalty_redemption(
        redemption_id_input UUID,
        order_id_input UUID
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Update the redemption
UPDATE public.loyalty_redemptions
SET status = 'used',
    order_id = order_id_input,
    used_at = NOW()
WHERE id = redemption_id_input
    AND status = 'active';
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'Redemption not found or already used'
);
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Reward redeemed successfully'
);
END;
$$;