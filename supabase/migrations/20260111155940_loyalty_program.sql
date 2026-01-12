-- =============================================
-- imPRESSive Loyalty Program
-- =============================================

-- Loyalty program members
CREATE TABLE public.loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own loyalty info
CREATE POLICY "Users can view own loyalty info"
  ON public.loyalty_members FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own loyalty info (through functions)
CREATE POLICY "Users can update own loyalty info"  
  ON public.loyalty_members FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert on signup
CREATE POLICY "Allow loyalty member creation"
  ON public.loyalty_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage loyalty members"
  ON public.loyalty_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Points transactions history
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.loyalty_members(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire', 'adjustment')),
  points INTEGER NOT NULL, -- positive for earn, negative for redeem
  order_id UUID REFERENCES public.orders(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.loyalty_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (true);

-- Loyalty rewards catalog
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_product', 'free_shipping')),
  reward_value DECIMAL(10,2), -- percent or fixed amount
  product_id UUID REFERENCES public.products(id), -- for free product rewards
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards are viewable by everyone"
  ON public.loyalty_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage rewards"
  ON public.loyalty_rewards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Redeemed rewards (for tracking and applying to orders)
CREATE TABLE public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.loyalty_members(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.loyalty_rewards(id) NOT NULL,
  points_spent INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  order_id UUID REFERENCES public.orders(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.loyalty_redemptions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.loyalty_members WHERE user_id = auth.uid()
    )
  );

-- Generate redemption code
CREATE OR REPLACE FUNCTION generate_reward_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'RWD-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate redemption code
CREATE OR REPLACE FUNCTION set_redemption_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_reward_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER redemption_before_insert
  BEFORE INSERT ON public.loyalty_redemptions
  FOR EACH ROW EXECUTE FUNCTION set_redemption_code();

-- Function to create loyalty member on signup (bonus 25 points)
CREATE OR REPLACE FUNCTION public.create_loyalty_member()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id UUID;
BEGIN
  -- Create loyalty member
  INSERT INTO public.loyalty_members (user_id, points_balance, lifetime_points)
  VALUES (NEW.id, 25, 25)
  RETURNING id INTO new_member_id;
  
  -- Record the signup bonus transaction
  INSERT INTO public.loyalty_transactions (member_id, type, points, description)
  VALUES (new_member_id, 'bonus', 25, 'Welcome bonus - Thanks for signing up!');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create loyalty member on user signup
CREATE TRIGGER on_user_created_loyalty
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_loyalty_member();

-- Function to award points on order completion
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS TRIGGER AS $$
DECLARE
  member UUID;
  points_earned INTEGER;
BEGIN
  -- Only award points when order is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get member id
    SELECT id INTO member FROM public.loyalty_members 
    WHERE user_id = NEW.user_id;
    
    IF member IS NOT NULL THEN
      -- Calculate points (1 point per dollar)
      points_earned := FLOOR(NEW.total);
      
      -- Update member balance
      UPDATE public.loyalty_members
      SET 
        points_balance = points_balance + points_earned,
        lifetime_points = lifetime_points + points_earned,
        updated_at = now()
      WHERE id = member;
      
      -- Record transaction
      INSERT INTO public.loyalty_transactions (member_id, type, points, order_id, description)
      VALUES (member, 'earn', points_earned, NEW.id, 'Points earned from order ' || NEW.order_number);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_complete_points
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_order_points();

-- Seed initial rewards
INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reward_value, sort_order) VALUES
('$5 Off', 'Get $5 off your next order', 50, 'discount_fixed', 5.00, 1),
('$10 Off', 'Get $10 off your next order', 100, 'discount_fixed', 10.00, 2),
('$25 Off', 'Get $25 off your next order', 250, 'discount_fixed', 25.00, 3),
('15% Off', 'Get 15% off your entire order', 150, 'discount_percent', 15.00, 4),
('Free Shipping', 'Free delivery on your next order', 75, 'free_shipping', 0.00, 5),
('Free Wellness Shot', 'Redeem for any wellness shot', 60, 'free_product', NULL, 6);

-- Create indexes
CREATE INDEX loyalty_members_user_id_idx ON public.loyalty_members(user_id);
CREATE INDEX loyalty_transactions_member_id_idx ON public.loyalty_transactions(member_id);
CREATE INDEX loyalty_redemptions_member_id_idx ON public.loyalty_redemptions(member_id);
CREATE INDEX loyalty_redemptions_code_idx ON public.loyalty_redemptions(code);
