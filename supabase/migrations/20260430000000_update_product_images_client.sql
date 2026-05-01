-- Update product images to client-provided photos (2026-04-30)

-- Detox Packages
UPDATE public.products SET image_url = '/products/1-day-detox.png' WHERE slug = '1-day-detox';
UPDATE public.products SET image_url = '/products/3-day-detox.png' WHERE slug = '3-day-detox';

-- Sweet Treats
UPDATE public.products SET image_url = '/products/kiwi-kwencher.png' WHERE slug = 'kiwi-kwencher';
UPDATE public.products SET image_url = '/products/pomegranate-pearadise.png' WHERE slug = 'pomegranate-pearadise';
UPDATE public.products SET image_url = '/products/apple-mango-tango.png' WHERE slug = 'apple-mango-tango';
-- NOTE: 'very berry - website.png' copied as /products/very-berry.png
-- Confirm whether this maps to 'very-very-green-goddess' or a separate product before uncommenting:
-- UPDATE public.products SET image_url = '/products/very-berry.png' WHERE slug = 'very-very-green-goddess';

-- Wellness Shots
UPDATE public.products SET image_url = '/products/wellness-shot-kale.png' WHERE slug = 'wellness-shot-kale';
UPDATE public.products SET image_url = '/products/wellness-shot-ginger.png' WHERE slug = 'wellness-shot-ginger';
UPDATE public.products SET image_url = '/products/wellness-shot-beet.png' WHERE slug = 'wellness-shot-beet';

-- Energy & Immunity Booster
UPDATE public.products SET image_url = '/products/glowin.png' WHERE slug = 'glowin';
UPDATE public.products SET image_url = '/products/immunity-boost.png' WHERE slug = 'immunity-boost';
UPDATE public.products SET image_url = '/products/bleeding-heart.png' WHERE slug = 'bleeding-heart';
UPDATE public.products SET image_url = '/products/beets-me.png' WHERE slug = 'beets-me';

-- Detox & Fat Burners
UPDATE public.products SET image_url = '/products/morning-detox.png' WHERE slug = 'morning-detox';
UPDATE public.products SET image_url = '/products/pineapple-express.png' WHERE slug = 'pineapple-express';
UPDATE public.products SET image_url = '/products/oh-sht.png' WHERE slug = 'oh-sht';
UPDATE public.products SET image_url = '/products/kale-yea.png' WHERE slug = 'kale-yea';
UPDATE public.products SET image_url = '/products/lemon-drop.png' WHERE slug = 'lemon-drop';
