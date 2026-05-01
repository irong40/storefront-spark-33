-- Add 6-Pack Muffin as a separate product (images already exist in public/products/)
-- Also update the existing muffin product name to clarify it's the 3-pack option

UPDATE public.products
SET
  name = '3-Pack Muffin',
  short_description = 'Fresh-baked muffins — 3-pack',
  description = 'Soft, fresh-baked muffins in a 3-pack. Ask about today''s flavor.',
  image_url = '/products/3-pack-muffin.webp'
WHERE slug = 'muffin';

INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order, image_url)
VALUES (
  '6-Pack Muffin',
  'muffin-6-pack',
  'Fresh-baked muffins — 6-pack',
  'Soft, fresh-baked muffins in a 6-pack. Perfect for sharing. Ask about today''s flavor.',
  (SELECT id FROM public.categories WHERE slug = 'food'),
  12.00,
  ARRAY['Baked fresh', 'Ask about flavors', 'Great with juice', 'Perfect for sharing'],
  false, true, 5,
  '/products/6-pack-muffin.webp'
) ON CONFLICT (slug) DO NOTHING;
