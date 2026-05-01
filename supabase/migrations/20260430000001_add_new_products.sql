-- =============================================
-- Add New Products: Very Berry, Summer Breeze, Food Category
-- imPRESSive Juice Bar — 2026-04-30
-- =============================================

-- =============================================
-- SWEET TREATS: Very Berry
-- =============================================

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order, image_url)
VALUES (
  'Very Berry',
  'very-berry',
  'A bold burst of mixed berries in every sip',
  'Sweet, tangy, and packed with antioxidants. Our Very Berry blend celebrates the best of the berry world in one vibrant juice.',
  (SELECT id FROM public.categories WHERE slug = 'sweet-treats'),
  11.00,
  ARRAY['Antioxidant rich', 'Naturally sweet', 'No added sugar', 'Vitamin C packed'],
  'Strawberry, blueberry, blackberry, raspberry, apple, lemon',
  false, true, 5,
  '/products/very-berry.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '10 oz', 10, 9.00, 1 FROM public.products p WHERE p.slug = 'very-berry'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '10 oz');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '16 oz', 16, 11.00, 2 FROM public.products p WHERE p.slug = 'very-berry'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '16 oz');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '24 oz', 24, 14.00, 3 FROM public.products p WHERE p.slug = 'very-berry'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '24 oz');

-- =============================================
-- SWEET TREATS: Summer Breeze
-- =============================================

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order, image_url)
VALUES (
  'Summer Breeze',
  'summer-breeze',
  'Light, refreshing, and perfect for warm days',
  'Sip on sunshine. This breezy blend of tropical and citrus fruits is the taste of a perfect summer day.',
  (SELECT id FROM public.categories WHERE slug = 'sweet-treats'),
  11.00,
  ARRAY['Tropical flavors', 'Light and refreshing', 'Hydrating', 'No added sugar'],
  'Watermelon, cucumber, pineapple, lime, mint',
  false, true, 6,
  '/products/summer-breeze.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '10 oz', 10, 9.00, 1 FROM public.products p WHERE p.slug = 'summer-breeze'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '10 oz');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '16 oz', 16, 11.00, 2 FROM public.products p WHERE p.slug = 'summer-breeze'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '16 oz');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '24 oz', 24, 14.00, 3 FROM public.products p WHERE p.slug = 'summer-breeze'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '24 oz');

-- =============================================
-- FOOD CATEGORY (upsert)
-- =============================================

INSERT INTO public.categories (name, slug, description, sort_order, active)
VALUES ('Food', 'food', 'Fresh salads, fruit, and baked treats to pair with your juice', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- FOOD PRODUCTS
-- =============================================

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Parfait',
  'parfait',
  'Creamy layers of yogurt, granola, and fresh fruit',
  'A wholesome parfait layered with creamy yogurt, crunchy granola, and seasonal fresh fruit. The perfect complement to your juice.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  5.00,
  ARRAY['Fresh fruit', 'Creamy yogurt', 'Crunchy granola', 'Made fresh daily'],
  false, true, 1, NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Fruit Cup',
  'fruit-cup',
  'Fresh seasonal fruit, cut and ready to enjoy',
  'A cup of freshly cut seasonal fruit. Simple, clean, and delicious.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  5.00,
  ARRAY['Fresh cut fruit', 'Seasonal selection', 'No added sugar'],
  false, true, 2,
  '/products/fruit-cup.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Fruit Bowl',
  'fruit-bowl',
  'Generous bowl of fresh seasonal fruit',
  'A hearty bowl of freshly cut seasonal fruit — perfect for sharing or when you need more.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  7.50,
  ARRAY['Large portion', 'Fresh cut fruit', 'Seasonal selection', 'No added sugar'],
  false, true, 3,
  '/products/fruit-bowl.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Muffin',
  'muffin',
  'Fresh-baked muffin, single or in a pack',
  'Soft, fresh-baked muffins available individually or as a 3-pack. Ask about today''s flavor.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  4.00,
  ARRAY['Baked fresh', 'Ask about flavors', 'Great with juice'],
  false, true, 4,
  '/products/3-pack-muffin.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Caesar Salad',
  'caesar-salad',
  'Classic Caesar with crisp romaine and house dressing',
  'Crisp romaine lettuce tossed with our house Caesar dressing, croutons, and parmesan. Available in regular or large.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  6.50,
  ARRAY['Crisp romaine', 'House dressing', 'Parmesan', 'Croutons'],
  false, true, 5,
  '/products/caesar-salad.png'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  'Cobb Salad',
  'cobb-salad',
  'Loaded Cobb with fresh toppings and house dressing',
  'A hearty Cobb loaded with fresh toppings and house dressing. Available in regular or large.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  6.50,
  ARRAY['Fresh toppings', 'House dressing', 'Filling and satisfying'],
  false, true, 6,
  '/products/cobb-salad.png'
) ON CONFLICT (slug) DO NOTHING;

-- Muffin size overrides
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, 'Single', NULL, 4.00, 1 FROM public.products p WHERE p.slug = 'muffin'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = 'Single');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, '3-Pack', NULL, 7.00, 2 FROM public.products p WHERE p.slug = 'muffin'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = '3-Pack');

-- Caesar Salad size overrides
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, 'Regular', NULL, 6.50, 1 FROM public.products p WHERE p.slug = 'caesar-salad'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = 'Regular');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, 'Large', NULL, 8.00, 2 FROM public.products p WHERE p.slug = 'caesar-salad'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = 'Large');

-- Cobb Salad size overrides
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, 'Regular', NULL, 6.50, 1 FROM public.products p WHERE p.slug = 'cobb-salad'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = 'Regular');

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order)
SELECT p.id, 'Large', NULL, 8.00, 2 FROM public.products p WHERE p.slug = 'cobb-salad'
AND NOT EXISTS (SELECT 1 FROM public.product_size_overrides WHERE product_id = p.id AND size_name = 'Large');

-- Update image for existing parfait if it has none
UPDATE public.products SET image_url = NULL WHERE slug = 'parfait' AND image_url IS NULL;
