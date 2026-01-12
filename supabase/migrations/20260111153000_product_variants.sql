-- =============================================
-- Product Sizes and Add-ons
-- =============================================

-- Product Sizes (global/default sizing options)
CREATE TABLE public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size_oz INTEGER, -- null for gallon sizes or special products
  price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sizes are viewable by everyone"
  ON public.product_sizes FOR SELECT
  USING (active = true);

-- Product-specific size/price overrides
CREATE TABLE public.product_size_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size_name TEXT NOT NULL,
  size_oz INTEGER,
  price DECIMAL(10,2) NOT NULL,
  is_subscription BOOLEAN DEFAULT false,
  subscription_interval TEXT, -- 'monthly', 'weekly', etc.
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_size_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product size overrides are viewable by everyone"
  ON public.product_size_overrides FOR SELECT
  USING (active = true);

-- Product Add-ons (ingredient extras)
CREATE TABLE public.product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL, -- e.g., "+Ginger"
  price DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addons are viewable by everyone"
  ON public.product_addons FOR SELECT
  USING (active = true);

-- Update cart_items to support sizes and addons
ALTER TABLE public.cart_items 
  ADD COLUMN size_id UUID REFERENCES public.product_sizes(id),
  ADD COLUMN size_override_id UUID REFERENCES public.product_size_overrides(id),
  ADD COLUMN addon_ids UUID[] DEFAULT '{}',
  ADD COLUMN is_subscription BOOLEAN DEFAULT false;

-- Update order_items to store size and addons info
ALTER TABLE public.order_items
  ADD COLUMN size_name TEXT,
  ADD COLUMN size_price DECIMAL(10,2),
  ADD COLUMN is_subscription BOOLEAN DEFAULT false,
  ADD COLUMN addons JSONB DEFAULT '[]';

-- =============================================
-- Seed Default Size Options (for regular juices)
-- =============================================
INSERT INTO public.product_sizes (name, size_oz, price, sort_order) VALUES
('10 oz', 10, 7.00, 1),
('16 oz', 16, 9.00, 2),
('24 oz', 24, 12.00, 3),
('1/2 Gallon', NULL, 35.00, 4),
('Gallon', NULL, 70.00, 5);

-- =============================================
-- Seed 1 Day Detox Specific Sizes
-- =============================================
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '16 oz', 16, 27.95, false, 1
FROM public.products p WHERE p.slug = '1-day-detox';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '24 oz', 24, 34.95, false, 2
FROM public.products p WHERE p.slug = '1-day-detox';

-- =============================================
-- Seed 3 Day Detox Options (One-time & Subscription)
-- =============================================
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'One-Time Purchase', NULL, 114.95, false, NULL, 1
FROM public.products p WHERE p.slug = '3-day-detox';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'Monthly Subscription', NULL, 114.95, true, 'monthly', 2
FROM public.products p WHERE p.slug = '3-day-detox';

-- =============================================
-- Seed 3 Pack Subscription Options
-- Size + Payment interval combinations
-- =============================================

-- 16oz Bi-Weekly ($50 every 2 weeks)
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, '16oz - Bi-Weekly Payment', 16, 50.00, true, 'biweekly', 1
FROM public.products p WHERE p.slug = '3-pack-subscription';

-- 16oz Monthly ($100/month)
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, '16oz - Monthly Payment', 16, 100.00, true, 'monthly', 2
FROM public.products p WHERE p.slug = '3-pack-subscription';

-- 24oz Bi-Weekly ($50 every 2 weeks)
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, '24oz - Bi-Weekly Payment', 24, 50.00, true, 'biweekly', 3
FROM public.products p WHERE p.slug = '3-pack-subscription';

-- 24oz Monthly ($100/month)
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, '24oz - Monthly Payment', 24, 100.00, true, 'monthly', 4
FROM public.products p WHERE p.slug = '3-pack-subscription';

-- =============================================
-- Add flavor selection support to cart_items
-- =============================================
ALTER TABLE public.cart_items
  ADD COLUMN selected_flavor_ids UUID[] DEFAULT '{}';

-- Update order_items to store selected flavors
ALTER TABLE public.order_items
  ADD COLUMN selected_flavors JSONB DEFAULT '[]';

-- =============================================
-- Seed Add-on Options
-- =============================================
INSERT INTO public.product_addons (name, display_name, price, sort_order) VALUES
('standard', 'Standard', 0, 1),
('ginger', '+Ginger', 1.50, 2),
('turmeric', '+Turmeric', 1.50, 3),
('spinach', '+Spinach', 1.50, 4),
('carrot', '+Carrot', 1.50, 5);

-- Add admin policies
CREATE POLICY "Admins can manage sizes"
  ON public.product_sizes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage addons"
  ON public.product_addons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage size overrides"
  ON public.product_size_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
