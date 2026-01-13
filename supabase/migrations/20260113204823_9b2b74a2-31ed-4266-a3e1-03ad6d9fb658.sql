-- Create loyalty_members table
CREATE TABLE public.loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_tier CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Create loyalty_transactions table
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('earn', 'redeem', 'bonus', 'expire', 'adjustment'))
);

-- Create loyalty_rewards table
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_reward_type CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_product', 'free_shipping'))
);

-- Create loyalty_redemptions table
CREATE TABLE public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'used', 'expired'))
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_members
CREATE POLICY "Users can view own loyalty member" ON public.loyalty_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty members" ON public.loyalty_members
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert loyalty members" ON public.loyalty_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update loyalty members" ON public.loyalty_members
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loyalty_members WHERE id = member_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert transactions" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.loyalty_members WHERE id = member_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- RLS Policies for loyalty_rewards
CREATE POLICY "Anyone can view active rewards" ON public.loyalty_rewards
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage rewards" ON public.loyalty_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_redemptions
CREATE POLICY "Users can view own redemptions" ON public.loyalty_redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loyalty_members WHERE id = member_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create own redemptions" ON public.loyalty_redemptions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.loyalty_members WHERE id = member_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all redemptions" ON public.loyalty_redemptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to generate redemption codes
CREATE OR REPLACE FUNCTION public.generate_reward_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'RWD-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to auto-generate redemption code
CREATE OR REPLACE FUNCTION public.set_redemption_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_reward_code();
    SELECT EXISTS(SELECT 1 FROM loyalty_redemptions WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_redemption_code_trigger
  BEFORE INSERT ON public.loyalty_redemptions
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION public.set_redemption_code();

-- Function to update loyalty member timestamp
CREATE OR REPLACE FUNCTION public.update_loyalty_member_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_loyalty_member_timestamp
  BEFORE UPDATE ON public.loyalty_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_member_timestamp();

-- Function to calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(lifetime_pts INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF lifetime_pts >= 1000 THEN RETURN 'platinum';
  ELSIF lifetime_pts >= 500 THEN RETURN 'gold';
  ELSIF lifetime_pts >= 200 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$;

-- Insert seed rewards
INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reward_value, min_order_amount, sort_order) VALUES
  ('$5 Off Your Order', 'Get $5 off any order of $15 or more', 50, 'discount_fixed', 5.00, 15.00, 1),
  ('$10 Off Your Order', 'Get $10 off any order of $25 or more', 100, 'discount_fixed', 10.00, 25.00, 2),
  ('$25 Off Your Order', 'Get $25 off any order of $50 or more', 250, 'discount_fixed', 25.00, 50.00, 3),
  ('15% Off Entire Order', 'Get 15% off your entire order', 150, 'discount_percent', 15.00, 0, 4),
  ('Free Shipping', 'Get free shipping on your next order', 75, 'free_shipping', NULL, 0, 5),
  ('Free Wellness Shot', 'Get a free wellness shot of your choice', 60, 'free_product', NULL, 0, 6);