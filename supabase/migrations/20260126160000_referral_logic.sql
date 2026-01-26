-- Add column to track usage
ALTER TABLE public.orders
ADD COLUMN referral_code_used TEXT;
-- RPC to check referral code
CREATE OR REPLACE FUNCTION check_referral_code(code_input TEXT) RETURNS JSONB AS $$
DECLARE referrer_record RECORD;
is_self BOOLEAN;
has_orders BOOLEAN;
BEGIN -- Find the referrer
SELECT * INTO referrer_record
FROM public.loyalty_members
WHERE referral_code = code_input;
IF referrer_record IS NULL THEN RETURN jsonb_build_object(
    'valid',
    false,
    'message',
    'Invalid referral code'
);
END IF;
-- Check for self-referral (if user is logged in)
IF auth.uid() IS NOT NULL THEN IF referrer_record.user_id = auth.uid() THEN RETURN jsonb_build_object(
    'valid',
    false,
    'message',
    'You cannot refer yourself'
);
END IF;
-- Check if user is new customer (has existing orders?)
SELECT EXISTS(
        SELECT 1
        FROM public.orders
        WHERE user_id = auth.uid()
            AND payment_status = 'completed'
    ) INTO has_orders;
IF has_orders THEN RETURN jsonb_build_object(
    'valid',
    false,
    'message',
    'Referral codes are for new customers only'
);
END IF;
END IF;
RETURN jsonb_build_object(
    'valid',
    true,
    'type',
    'referral',
    'discount_amount',
    10,
    'referrer_name',
    'your friend' -- Could fetch name from profile if public
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to award points on completion
CREATE OR REPLACE FUNCTION process_referral_reward() RETURNS TRIGGER AS $$
DECLARE referrer_loyalty_id UUID;
points_to_award INTEGER := 50;
BEGIN -- Only process if referral code was used and payment just completed
IF NEW.referral_code_used IS NOT NULL
AND NEW.payment_status = 'completed'
AND (
    OLD.payment_status IS NULL
    OR OLD.payment_status != 'completed'
)
AND NOT EXISTS (
    SELECT 1
    FROM public.referrals
    WHERE order_id = NEW.id
) THEN -- Get referrer ID
SELECT id INTO referrer_loyalty_id
FROM public.loyalty_members
WHERE referral_code = NEW.referral_code_used;
IF referrer_loyalty_id IS NOT NULL THEN -- Award points to Referrer
UPDATE public.loyalty_members
SET points_balance = points_balance + points_to_award,
    lifetime_points = lifetime_points + points_to_award
WHERE id = referrer_loyalty_id;
-- Log Transaction for Referrer
INSERT INTO public.loyalty_transactions (member_id, type, points, order_id, description)
VALUES (
        referrer_loyalty_id,
        'earn',
        points_to_award,
        NEW.id,
        'Referral Bonus'
    );
-- Create Referral Record
INSERT INTO public.referrals (
        referrer_id,
        referee_user_id,
        status,
        completed_at,
        order_id
    )
VALUES (
        referrer_loyalty_id,
        NEW.user_id,
        'completed',
        now(),
        NEW.id
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_order_referral_completed
AFTER
UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION process_referral_reward();