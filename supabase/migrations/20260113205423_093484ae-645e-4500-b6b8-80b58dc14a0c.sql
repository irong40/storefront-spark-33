-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create product_sizes table (global standard sizes)
CREATE TABLE public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  size_oz INTEGER,
  price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_addons table (add-on ingredients)
CREATE TABLE public.product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_size_overrides table (per-product custom sizes/pricing)
CREATE TABLE public.product_size_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_name TEXT NOT NULL,
  size_oz INTEGER,
  price DECIMAL(10,2) NOT NULL,
  is_subscription BOOLEAN NOT NULL DEFAULT false,
  subscription_interval TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, size_name)
);

-- Enable RLS on all tables
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_size_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_sizes
CREATE POLICY "Anyone can view active sizes" ON public.product_sizes
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage sizes" ON public.product_sizes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for product_addons
CREATE POLICY "Anyone can view active addons" ON public.product_addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON public.product_addons
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for product_size_overrides
CREATE POLICY "Anyone can view active size overrides" ON public.product_size_overrides
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage size overrides" ON public.product_size_overrides
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update timestamp triggers
CREATE TRIGGER update_product_sizes_timestamp
  BEFORE UPDATE ON public.product_sizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_addons_timestamp
  BEFORE UPDATE ON public.product_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_size_overrides_timestamp
  BEFORE UPDATE ON public.product_size_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed standard sizes
INSERT INTO public.product_sizes (name, size_oz, price, sort_order) VALUES
  ('10 oz', 10, 7.99, 1),
  ('16 oz', 16, 9.99, 2),
  ('32 oz', 32, 17.99, 3),
  ('Half Gallon', 64, 32.99, 4),
  ('Gallon', 128, 59.99, 5);

-- Seed common add-ons
INSERT INTO public.product_addons (name, display_name, price, sort_order) VALUES
  ('standard', 'Standard (No Add-ons)', 0.00, 0),
  ('ginger', 'Extra Ginger', 0.75, 1),
  ('turmeric', 'Turmeric Boost', 0.75, 2),
  ('cayenne', 'Cayenne Kick', 0.50, 3),
  ('lemon', 'Extra Lemon', 0.50, 4),
  ('spinach', 'Spinach Power', 0.75, 5),
  ('protein', 'Plant Protein', 1.50, 6),
  ('cbd', 'CBD Oil (25mg)', 3.00, 7);