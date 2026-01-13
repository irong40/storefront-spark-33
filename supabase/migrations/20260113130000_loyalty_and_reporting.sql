-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Function to handle new user signup (Loyalty Bonus)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, loyalty_points)
  VALUES (new.id, new.email, 25); -- 25 Points Signup Bonus
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update loyalty points on order completion
CREATE OR REPLACE FUNCTION public.handle_order_completion() 
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER;
BEGIN
  -- Only process if payment is completed and we have a user_id
  IF NEW.payment_status = 'completed' AND NEW.user_id IS NOT NULL THEN
    
    -- Calculate points (1 point per dollar, floored)
    points_to_add := FLOOR(NEW.total);
    
    -- Update profile
    UPDATE public.profiles
    SET 
      loyalty_points = loyalty_points + points_to_add,
      total_spent = total_spent + NEW.total,
      updated_at = now()
    WHERE id = NEW.user_id;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order completion
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_order_completion();

-- REPORTING VIEWS --

-- Weekly Sales
CREATE OR REPLACE VIEW public.sales_weekly AS
SELECT 
  to_char(created_at, 'IYYY-IW') as period,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total)::DECIMAL(10,2) as average_order_value
FROM public.orders
WHERE payment_status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;

-- Monthly Sales
CREATE OR REPLACE VIEW public.sales_monthly AS
SELECT 
  to_char(created_at, 'YYYY-MM') as period,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total)::DECIMAL(10,2) as average_order_value
FROM public.orders
WHERE payment_status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;

-- Quarterly Sales
CREATE OR REPLACE VIEW public.sales_quarterly AS
SELECT 
  to_char(created_at, 'YYYY-"Q"Q') as period,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total)::DECIMAL(10,2) as average_order_value
FROM public.orders
WHERE payment_status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;

-- Yearly Sales
CREATE OR REPLACE VIEW public.sales_yearly AS
SELECT 
  to_char(created_at, 'YYYY') as period,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total)::DECIMAL(10,2) as average_order_value
FROM public.orders
WHERE payment_status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;
