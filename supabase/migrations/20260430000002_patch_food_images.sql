-- Patch image URLs for food products that pre-existed the 20260430000001 migration

UPDATE public.products SET image_url = '/products/fruit-cup.png'   WHERE slug = 'fruit-cup'    AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = '/products/fruit-bowl.png'  WHERE slug = 'fruit-bowl'   AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = '/products/3-pack-muffin.png' WHERE slug = 'muffin'     AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = '/products/caesar-salad.png' WHERE slug = 'caesar-salad' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = '/products/cobb-salad.png'  WHERE slug = 'cobb-salad'   AND (image_url IS NULL OR image_url = '');
