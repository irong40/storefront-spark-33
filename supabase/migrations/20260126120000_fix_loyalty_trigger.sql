-- Fix duplicate and incorrect loyalty triggers
-- Drop incorrect trigger from 20260113130000 if it exists
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
DROP FUNCTION IF EXISTS public.handle_order_completion();
-- Update the main loyalty trigger function to:
-- 1. Trigger on payment_status = 'completed' (not just order status)
-- 2. Deduct gift card usage from points earned (avoid double dipping)
CREATE OR REPLACE FUNCTION public.award_order_points() RETURNS TRIGGER AS $$
DECLARE member UUID;
points_earned INTEGER;
cash_spent DECIMAL(10, 2);
BEGIN -- Award points if payment is completed AND (it wasn't completed before OR it's a new insert)
IF NEW.payment_status = 'completed'
AND (
    OLD.payment_status IS NULL
    OR OLD.payment_status != 'completed'
) THEN -- Get member id
SELECT id INTO member
FROM public.loyalty_members
WHERE user_id = NEW.user_id;
-- If user is logged in but has no loyalty record, create one?
-- (We have a trigger on auth.users create, but maybe they signed up before loyalty existed?)
IF member IS NULL
AND NEW.user_id IS NOT NULL THEN
INSERT INTO public.loyalty_members (user_id, points_balance, lifetime_points)
VALUES (NEW.user_id, 0, 0)
RETURNING id INTO member;
END IF;
IF member IS NOT NULL THEN -- Calculate net cash spent (Total - Tax? - Shipping? - GiftCard?)
-- Usually points on Subtotal? Or Total? 
-- PRD says: "1 point per $1 spent".
-- Let's use (Total - GiftCardAmount). 
-- Note: If we want to exclude Tax/Shipping, we should use Subtotal. 
-- Let's stick to Total for now as it's simpler for users, OR Subtotal if generous.
-- Implementation: Total - GiftCardAmount.
cash_spent := NEW.total - COALESCE(NEW.gift_card_amount, 0);
IF cash_spent > 0 THEN points_earned := FLOOR(cash_spent);
-- Update member balance
UPDATE public.loyalty_members
SET points_balance = points_balance + points_earned,
    lifetime_points = lifetime_points + points_earned,
    updated_at = now()
WHERE id = member;
-- Record transaction
INSERT INTO public.loyalty_transactions (member_id, type, points, order_id, description)
VALUES (
        member,
        'earn',
        points_earned,
        NEW.id,
        'Points earned from order ' || NEW.order_number
    );
END IF;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_order_complete_points ON public.orders;
CREATE TRIGGER on_order_complete_points
AFTER
INSERT
    OR
UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.award_order_points();