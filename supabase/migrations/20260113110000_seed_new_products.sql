-- =============================================
-- Seed New Products: Sample Box, Shots, Gallon Subs
-- =============================================

-- 1. 4-Pack Sample Box (Fixed 8oz, choose 4 flavors)
-- Category: 'bundles' or 'sweet-treats'? Let's put in 'detox-packages' or create new 'bundles' category.
-- Checking existing categories... let's stick to 'detox-packages' or 'sweet-treats' for now, or just use one of them.
-- User has 'detox-fat-burners', 'energy-immunity-booster', 'sweet-treats', 'subscriptions'.
-- Let's put Sample Box in 'sweet-treats' for visibility, or default to a safe one.

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order)
SELECT 
  '4-Pack Sample Box',
  'sample-box',
  'Try 4 of our best flavors!',
  'Can''t decide? Pick 4 of your favorites in convenient 8oz bottles. Perfect for tasting or a light boost.',
  c.id,
  30.00, -- Estimated price
  ARRAY['4 x 8oz bottles', 'Choose your flavors', 'Perfect for tasting'],
  true,
  true,
  2
FROM public.categories c WHERE c.slug = 'sweet-treats';

-- 2. Wellness Shot (Single Shot, choose flavor)
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order)
SELECT 
  'Wellness Shot',
  'wellness-shot',
  'Potent health boost in a sip.',
  'Concentrated nutrition. Choose from Ginger, Turmeric, Wheatgrass, or our signature blends.',
  c.id,
  4.00, -- Estimated price
  ARRAY['2oz Potent Shot', 'Instant Boost', 'Freshly Pressed'],
  false,
  true,
  10
FROM public.categories c WHERE c.slug = 'energy-immunity-booster';

-- 3. Gallon Subscription (Weekly/Monthly)
-- We'll create a "Gallon Subscription" product where you pick the flavor.
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order)
SELECT 
  'Gallon Subscription',
  'gallon-subscription',
  'Weekly or Monthly Gallon Supply',
  'Keep your fridge stocked with a full gallon of your favorite juice. Available for pickup or delivery.',
  c.id,
  70.00, -- Base price
  ARRAY['1 Gallon Jug', 'Choose your flavor', 'Save with subscription'],
  true,
  true,
  3
FROM public.categories c WHERE c.slug = 'subscriptions';

-- 4. Half-Gallon Subscription
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order)
SELECT 
  '1/2 Gallon Subscription',
  'half-gallon-subscription',
  'Weekly or Monthly Half-Gallon Supply',
  'Perfect for personal weekly consumption. Choose your favorite juice.',
  c.id,
  35.00, -- Base price
  ARRAY['64oz Jug', 'Choose your flavor', 'Save with subscription'],
  false,
  true,
  4
FROM public.categories c WHERE c.slug = 'subscriptions';


-- =============================================
-- Add Size Overrides for Subscriptions (Intervals)
-- =============================================

-- Gallon Subscription Options
-- Weekly
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'Weekly Delivery', NULL, 70.00, true, 'weekly', 1
FROM public.products p WHERE p.slug = 'gallon-subscription';

-- Monthly
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'Monthly Delivery', NULL, 70.00, true, 'monthly', 2
FROM public.products p WHERE p.slug = 'gallon-subscription';

-- Half-Gallon Subscription Options
-- Weekly
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'Weekly Delivery', NULL, 35.00, true, 'weekly', 1
FROM public.products p WHERE p.slug = 'half-gallon-subscription';

-- Monthly
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, subscription_interval, sort_order)
SELECT p.id, 'Monthly Delivery', NULL, 35.00, true, 'monthly', 2
FROM public.products p WHERE p.slug = 'half-gallon-subscription';

