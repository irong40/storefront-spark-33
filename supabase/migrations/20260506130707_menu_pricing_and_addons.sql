-- Applied to remote 2026-05-06 13:07:07.
-- Menu pricing rebalance, new add-ons, delivery config, free juice reward.

-- Wellness shots: ensure $4
UPDATE public.products SET price = 4.00
WHERE category_id IN (SELECT id FROM public.categories WHERE slug = 'wellness-shots');

-- Existing add-ons: ginger, turmeric, spinach -> $0.50; deactivate carrot
UPDATE public.product_addons SET price = 0.50
WHERE LOWER(name) IN ('ginger','turmeric','spinach');

UPDATE public.product_addons SET active = false
WHERE LOWER(name) = 'carrot';

-- New add-ons: kale ($0.50), pineapple + mango ($1.50)
INSERT INTO public.product_addons (name, display_name, price, active, sort_order)
SELECT 'kale','+Kale',0.50,true,5
WHERE NOT EXISTS (SELECT 1 FROM public.product_addons WHERE LOWER(name)='kale');

INSERT INTO public.product_addons (name, display_name, price, active, sort_order)
SELECT 'pineapple','+Pineapple',1.50,true,6
WHERE NOT EXISTS (SELECT 1 FROM public.product_addons WHERE LOWER(name)='pineapple');

INSERT INTO public.product_addons (name, display_name, price, active, sort_order)
SELECT 'mango','+Mango',1.50,true,7
WHERE NOT EXISTS (SELECT 1 FROM public.product_addons WHERE LOWER(name)='mango');

-- 6-pack muffin: $7 and active
UPDATE public.products SET price = 7.00, active = true, is_available = true
WHERE slug = 'muffin-6-pack';

-- Delivery config in business_settings
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) DEFAULT 8.00,
  ADD COLUMN IF NOT EXISTS delivery_free_threshold numeric(10,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS delivery_windows jsonb DEFAULT '["9:00 AM - 1:00 PM","5:30 PM - 7:00 PM"]'::jsonb;

UPDATE public.business_settings
SET delivery_fee = COALESCE(delivery_fee, 8.00),
    delivery_free_threshold = COALESCE(delivery_free_threshold, 50.00),
    delivery_windows = COALESCE(delivery_windows, '["9:00 AM - 1:00 PM","5:30 PM - 7:00 PM"]'::jsonb);

-- Loyalty: Free 12oz Juice reward
INSERT INTO public.loyalty_rewards
  (name, description, points_required, reward_type, reward_value, active, sort_order)
SELECT 'Free 12oz Juice','Redeem for any 12oz cold-pressed juice',100,'free_product',0,true,1
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_rewards WHERE name='Free 12oz Juice');
