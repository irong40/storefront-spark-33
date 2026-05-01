-- Fix homepage Best Sellers: remove non-juice items from featured,
-- set sort_order so top 4 are visually strong juice products.

-- Unfeat utility/non-juice items
UPDATE public.products SET is_featured = false
WHERE slug IN (
  'egift-card',
  'wellness-shot-subscription',
  'gallon-subscription',
  '3-pack-subscription',
  'half-gallon-subscription',
  'the-cure',
  'very-very-green-goddess'
);

-- Set top-4 sort order for featured juice products
UPDATE public.products SET sort_order = 1 WHERE slug = 'pomegranate-pearadise';
UPDATE public.products SET sort_order = 2 WHERE slug = 'immunity-boost';
UPDATE public.products SET sort_order = 3 WHERE slug = 'pineapple-express';
UPDATE public.products SET sort_order = 4 WHERE slug = 'morning-detox';

-- Push remaining featured products down so they don't conflict
UPDATE public.products SET sort_order = 5 WHERE slug = 'glowin';
UPDATE public.products SET sort_order = 6 WHERE slug = '1-day-detox';
UPDATE public.products SET sort_order = 7 WHERE slug = '3-day-detox';
UPDATE public.products SET sort_order = 8 WHERE slug = 'wellness-shot-turmeric';
