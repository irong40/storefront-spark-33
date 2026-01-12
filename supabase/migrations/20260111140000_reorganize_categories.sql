-- =============================================
-- Reorganize Categories and Products
-- imPRESSive Juice Bar
-- =============================================

-- First, delete existing products and categories (cascade will handle references)
DELETE FROM public.products;
DELETE FROM public.categories;

-- =============================================
-- INSERT NEW CATEGORIES
-- =============================================
INSERT INTO public.categories (name, slug, description, sort_order, active) VALUES
('Detox Packages', 'detox-packages', 'Complete cleanse programs for full body reset', 1, true),
('Sweet Treats', 'sweet-treats', 'Delicious fruit-forward juices that taste like dessert', 2, true),
('Wellness Shots', 'wellness-shots', 'Concentrated health boosters in a single shot', 3, true),
('Energy & Immunity Booster', 'energy-immunity-booster', 'Power up your day and strengthen your defenses', 4, true),
('Detox & Fat Burners', 'detox-fat-burners', 'Metabolism-boosting blends to help you feel your best', 5, true),
('Subscriptions', 'subscriptions', 'Save with recurring delivery plans', 6, true);

-- =============================================
-- DETOX PACKAGES
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, compare_at_price, features, is_featured, is_available, sort_order) VALUES
(
  '1 Day Detox',
  '1-day-detox',
  'Perfect introduction to cleansing - 16oz or 24oz sizes',
  'A gentle one-day reset to kickstart your wellness journey. Choose your size: 16oz ($27.95) or 24oz ($34.95).',
  (SELECT id FROM categories WHERE slug = 'detox-packages'),
  27.95,
  NULL,
  ARRAY['Choose 16oz or 24oz', 'Beginner friendly', 'Detailed cleanse guide', 'Same day pickup available'],
  true,
  true,
  1
),
(
  '3 Day Detox',
  '3-day-detox',
  'Deep cleanse program - One-time or Monthly Subscription',
  'Our comprehensive 3-day cleanse for a full body reset. Available as one-time purchase ($114.95) or monthly subscription ($114.95/month).',
  (SELECT id FROM categories WHERE slug = 'detox-packages'),
  114.95,
  NULL,
  ARRAY['Complete 3-day program', 'One-time or Subscribe', 'Email support included', 'Detailed cleanse guide', 'Monthly auto-delivery available'],
  true,
  true,
  2
);

-- =============================================
-- SWEET TREATS
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Kiwi Kwencher',
  'kiwi-kwencher',
  'Refreshing kiwi blend that satisfies your sweet tooth',
  'A tropical escape in every sip. Fresh kiwi paired with sweet fruits for a naturally delicious treat.',
  (SELECT id FROM categories WHERE slug = 'sweet-treats'),
  10.99,
  ARRAY['Naturally sweet', 'High in Vitamin C', 'No added sugar', 'Refreshing taste'],
  'Kiwi, green apple, pear, lemon, mint',
  false,
  true,
  1
),
(
  'Pomegranate PEARadise',
  'pomegranate-pearadise',
  'Antioxidant-rich pomegranate meets sweet pear perfection',
  'A heavenly combination of pomegranate and ripe pears. Loaded with antioxidants and naturally sweet.',
  (SELECT id FROM categories WHERE slug = 'sweet-treats'),
  11.99,
  ARRAY['Antioxidant rich', 'Heart healthy', 'Naturally sweet', 'Beautiful color'],
  'Pomegranate, pear, apple, lemon',
  true,
  true,
  2
),
(
  'Apple Mango Tango',
  'apple-mango-tango',
  'Tropical dance of apple and mango flavors',
  'Let your taste buds dance with this perfect pairing of crisp apple and tropical mango.',
  (SELECT id FROM categories WHERE slug = 'sweet-treats'),
  10.99,
  ARRAY['Tropical flavor', 'Kid approved', 'Vitamin rich', 'Dessert alternative'],
  'Mango, apple, orange, lemon',
  false,
  true,
  3
),
(
  'Very Very Green Goddess',
  'very-very-green-goddess',
  'Our greenest juice with a naturally sweet finish',
  'Don''t let the green color fool you - this goddess is sweet and delicious while packing serious nutrition.',
  (SELECT id FROM categories WHERE slug = 'sweet-treats'),
  12.99,
  ARRAY['Nutrient dense', 'Surprisingly sweet', 'Vitamins A, C, K', 'Energy boost'],
  'Spinach, kale, green apple, pineapple, lemon, ginger',
  true,
  true,
  4
);

-- =============================================
-- WELLNESS SHOTS
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Wellness Shot - Turmeric',
  'wellness-shot-turmeric',
  'Anti-inflammatory turmeric powerhouse in a 2oz shot',
  'Golden goodness with powerful anti-inflammatory benefits. Take daily for best results.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['2oz concentrated shot', 'Anti-inflammatory', 'Curcumin power', 'Take daily'],
  'Turmeric, ginger, lemon, black pepper, raw honey',
  true,
  true,
  1
),
(
  'Wellness Shot - Kale',
  'wellness-shot-kale',
  'Concentrated greens nutrition in one powerful shot',
  'Get your daily greens in seconds. Packed with vitamins and minerals from organic kale.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['2oz concentrated shot', 'Nutrient dense', 'Detoxifying', 'Energy boost'],
  'Kale, spinach, lemon, ginger, apple',
  false,
  true,
  2
),
(
  'Wellness Shot - Ginger',
  'wellness-shot-ginger',
  'Spicy ginger shot to kickstart digestion and immunity',
  'A fiery shot that wakes up your system and supports digestive health.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['2oz concentrated shot', 'Digestive support', 'Immune boost', 'Warming'],
  'Fresh ginger, lemon, cayenne, raw honey',
  false,
  true,
  3
),
(
  'Wellness Shot - Beet',
  'wellness-shot-beet',
  'Natural nitrates for energy and endurance',
  'Beet power for athletes and active lifestyles. Supports blood flow and stamina.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['2oz concentrated shot', 'Natural nitrates', 'Athletic performance', 'Heart healthy'],
  'Beet, carrot, ginger, lemon',
  false,
  true,
  4
);

-- =============================================
-- ENERGY & IMMUNITY BOOSTER
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Glowin',
  'glowin',
  'Radiant skin starts from within with this beauty blend',
  'Feed your skin with this glow-inducing juice packed with vitamins and antioxidants for radiant results.',
  (SELECT id FROM categories WHERE slug = 'energy-immunity-booster'),
  12.99,
  ARRAY['Skin health', 'Antioxidant rich', 'Collagen support', 'Beauty from within'],
  'Carrot, orange, ginger, turmeric, lemon',
  true,
  true,
  1
),
(
  'Immunity Boost',
  'immunity-boost',
  'Powerful immune support blend to keep you healthy',
  'Load up on immune-strengthening vitamins and minerals. Perfect during cold season or anytime you need extra protection.',
  (SELECT id FROM categories WHERE slug = 'energy-immunity-booster'),
  11.99,
  ARRAY['Vitamin C packed', 'Zinc support', 'Daily protection', 'Cold and flu fighter'],
  'Orange, grapefruit, lemon, ginger, turmeric, cayenne',
  true,
  true,
  2
),
(
  'Ginger-Ale',
  'ginger-ale',
  'Natural ginger refreshment with a healthy twist',
  'All the ginger flavor you love without the sugar. Naturally effervescent and refreshing.',
  (SELECT id FROM categories WHERE slug = 'energy-immunity-booster'),
  9.99,
  ARRAY['Natural refreshment', 'Digestive aid', 'Low calorie', 'No added sugar'],
  'Fresh ginger, lemon, apple, sparkling water',
  false,
  true,
  3
),
(
  'Bleeding Heart',
  'bleeding-heart',
  'Deep red beet juice for heart health and vitality',
  'Show your heart some love with this vibrant beet-based blend that supports cardiovascular health.',
  (SELECT id FROM categories WHERE slug = 'energy-immunity-booster'),
  11.99,
  ARRAY['Heart healthy', 'Natural nitrates', 'Blood pressure support', 'Endurance boost'],
  'Beet, pomegranate, apple, carrot, ginger',
  false,
  true,
  4
),
(
  'Beets Me',
  'beets-me',
  'Earthy beet blend that will surprise and delight',
  'Think you don''t like beets? This balanced blend will change your mind with its smooth, approachable flavor.',
  (SELECT id FROM categories WHERE slug = 'energy-immunity-booster'),
  10.99,
  ARRAY['Beginner friendly', 'Natural energy', 'Iron rich', 'Smooth flavor'],
  'Beet, apple, carrot, lemon, ginger',
  false,
  true,
  5
);

-- =============================================
-- DETOX & FAT BURNERS
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Morning Detox',
  'morning-detox',
  'Start your day with this gentle cleansing blend',
  'The perfect morning ritual to wake up your digestive system and set the tone for a healthy day.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  11.99,
  ARRAY['Morning ritual', 'Gentle cleanse', 'Digestive support', 'Energy boost'],
  'Lemon, ginger, apple, cucumber, mint',
  true,
  true,
  1
),
(
  'Pineapple Express',
  'pineapple-express',
  'Tropical metabolism booster with digestive enzymes',
  'Ride the express train to better digestion with pineapple''s natural bromelain enzymes and metabolism-boosting ingredients.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  12.99,
  ARRAY['Metabolism boost', 'Digestive enzymes', 'Tropical taste', 'Fat burning support'],
  'Pineapple, grapefruit, lemon, ginger, cayenne',
  true,
  true,
  2
),
(
  'Oh Sh*t',
  'oh-sht',
  'Powerful digestive cleanse - you''ve been warned!',
  'Our most intense cleansing juice. Gets things moving! Not for the faint of heart.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  12.99,
  ARRAY['Intense cleanse', 'Digestive reset', 'Powerful formula', 'Fast acting'],
  'Apple, lemon, ginger, cayenne, activated charcoal, aloe vera',
  false,
  true,
  3
),
(
  'Kale Yea',
  'kale-yea',
  'Green detox power that tastes amazing',
  'Say KALE YEA to this energizing green blend that proves healthy can be delicious.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  11.99,
  ARRAY['Detoxifying greens', 'Great taste', 'Nutrient dense', 'Energizing'],
  'Kale, cucumber, celery, green apple, lemon, ginger',
  false,
  true,
  4
),
(
  'Lemon Drop',
  'lemon-drop',
  'Citrus cleanse that melts away toxins',
  'Bright, zesty, and cleansing. This lemon-forward juice supports natural detoxification.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  10.99,
  ARRAY['Alkalizing', 'Vitamin C', 'Detoxifying', 'Refreshing'],
  'Lemon, lime, grapefruit, ginger, honey, cayenne',
  false,
  true,
  5
),
(
  'The Cure',
  'the-cure',
  'Ultimate hangover and recovery blend',
  'Had a rough night? The Cure is here to help. Hydrating, replenishing, and restorative.',
  (SELECT id FROM categories WHERE slug = 'detox-fat-burners'),
  13.99,
  ARRAY['Hangover relief', 'Electrolyte rich', 'Hydrating', 'Recovery support'],
  'Coconut water, watermelon, cucumber, lemon, ginger, sea salt',
  true,
  true,
  6
);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order) VALUES
(
  'Wellness Shot Subscription',
  'wellness-shot-subscription',
  '30 wellness shots delivered monthly - save 20%',
  'Never miss a day of wellness. Get 30 shots (your choice of flavors) delivered fresh each month.',
  (SELECT id FROM categories WHERE slug = 'subscriptions'),
  149.99,
  ARRAY['30 shots per month', 'Choose your flavors', 'Save 20%', 'Free delivery', 'Cancel anytime'],
  true,
  true,
  1
),
(
  '1/2 Gallon & Full Gallon Subscription',
  'gallon-subscription',
  'Bulk juice delivery for the whole family - save 25%',
  'Stock up and save! Choose half gallon or full gallon sizes of your favorite juices delivered weekly or bi-weekly.',
  (SELECT id FROM categories WHERE slug = 'subscriptions'),
  89.99,
  ARRAY['Choose your size', 'Weekly or bi-weekly', 'Save 25%', 'Free delivery', 'Perfect for families'],
  true,
  true,
  2
),
(
  '3 Pack Subscription',
  '3-pack-subscription',
  'Choose 3 flavors, delivered weekly - Bi-weekly or Monthly payment',
  'Pick any 3 juices from our menu and have them delivered weekly. Choose your size (16oz or 24oz) and payment schedule. Bi-weekly: $50 every 2 weeks. Monthly: $100/month.',
  (SELECT id FROM categories WHERE slug = 'subscriptions'),
  50.00,
  ARRAY['Choose 3 flavors', 'Weekly delivery', '16oz ($110) or 24oz ($120)', 'Bi-weekly ($50) or Monthly ($100) payment', 'Cancel anytime'],
  true,
  true,
  3
);
