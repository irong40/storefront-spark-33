-- Add referral code to loyalty members
ALTER TABLE public.loyalty_members
ADD COLUMN referral_code TEXT UNIQUE;
CREATE INDEX idx_loyalty_referral_code ON public.loyalty_members(referral_code);
-- Create Referrals Table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.loyalty_members(id) NOT NULL,
    referee_email TEXT,
    -- Optional, if invited via email
    referee_user_id UUID REFERENCES auth.users(id),
    -- Linked when they sign up/order
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending, completed
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    order_id UUID REFERENCES public.orders(id) -- The order that completed the referral
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view their referrals" ON public.referrals FOR
SELECT USING (
        referrer_id IN (
            SELECT id
            FROM public.loyalty_members
            WHERE user_id = auth.uid()
        )
    );
-- Function to generate random referral code (6 chars, uppercase)
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
result TEXT := '';
i INTEGER;
exists_check BOOLEAN;
BEGIN LOOP result := '';
FOR i IN 1..6 LOOP result := result || substr(
    chars,
    floor(random() * length(chars) + 1)::integer,
    1
);
END LOOP;
SELECT EXISTS(
        SELECT 1
        FROM public.loyalty_members
        WHERE referral_code = result
    ) INTO exists_check;
EXIT
WHEN NOT exists_check;
END LOOP;
RETURN result;
END;
$$ LANGUAGE plpgsql;
-- Trigger to assign referral code on insert (or update if null)
CREATE OR REPLACE FUNCTION set_referral_code() RETURNS TRIGGER AS $$ BEGIN IF NEW.referral_code IS NULL THEN NEW.referral_code := generate_referral_code();
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ensure_referral_code BEFORE
INSERT
    OR
UPDATE ON public.loyalty_members FOR EACH ROW EXECUTE FUNCTION set_referral_code();
-- Backfill: Update existing members
UPDATE public.loyalty_members
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;