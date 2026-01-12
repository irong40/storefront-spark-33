-- =============================================
-- Add Product Images
-- =============================================

-- Detox Packages
UPDATE public.products SET image_url = '/products/1-Day_Detox_Enhanced.png' WHERE slug = '1-day-detox';
UPDATE public.products SET image_url = '/products/3-Day_Detox_Enhanced.png' WHERE slug = '3-day-detox';

-- Sweet Treats
UPDATE public.products SET image_url = '/products/09_Kiwi_Kwencher.png' WHERE slug = 'kiwi-kwencher';
UPDATE public.products SET image_url = '/products/08_Pomegranate_PEARadise.png' WHERE slug = 'pomegranate-pearadise';
UPDATE public.products SET image_url = '/products/10_Apple_Mango_Tango.png' WHERE slug = 'apple-mango-tango';
UPDATE public.products SET image_url = '/products/12_Green_Goddess.png' WHERE slug = 'very-very-green-goddess';

-- Wellness Shots
UPDATE public.products SET image_url = '/products/01_Wellness_Shot_Turmeric.png' WHERE slug = 'wellness-shot-turmeric';
UPDATE public.products SET image_url = '/products/02_Wellness_Shot_Kale.png' WHERE slug = 'wellness-shot-kale';
UPDATE public.products SET image_url = '/products/03_Wellness_Shot_Ginger.png' WHERE slug = 'wellness-shot-ginger';
UPDATE public.products SET image_url = '/products/04_Wellness_Shot_Beet.png' WHERE slug = 'wellness-shot-beet';

-- Energy & Immunity Booster
UPDATE public.products SET image_url = '/products/07_Glowin.png' WHERE slug = 'glowin';
UPDATE public.products SET image_url = '/products/13_Immunity_Boost.png' WHERE slug = 'immunity-boost';
UPDATE public.products SET image_url = '/products/14_Ginger_Ale.png' WHERE slug = 'ginger-ale';
UPDATE public.products SET image_url = '/products/15_Bleeding_Heart.png' WHERE slug = 'bleeding-heart';
UPDATE public.products SET image_url = '/products/01_Beets_Me.png' WHERE slug = 'beets-me';

-- Detox & Fat Burners
UPDATE public.products SET image_url = '/products/16_Morning_Detox.png' WHERE slug = 'morning-detox';
UPDATE public.products SET image_url = '/products/02_Pineapple_Express.png' WHERE slug = 'pineapple-express';
UPDATE public.products SET image_url = '/products/03_Oh_Sht.png' WHERE slug = 'oh-sht';
UPDATE public.products SET image_url = '/products/04_Kale_Yeah.png' WHERE slug = 'kale-yea';
UPDATE public.products SET image_url = '/products/05_Lemon_Drop.png' WHERE slug = 'lemon-drop';
UPDATE public.products SET image_url = '/products/06_The_Cure.png' WHERE slug = 'the-cure';

-- Subscriptions
UPDATE public.products SET image_url = '/products/01_Wellness_Shot_Turmeric.png' WHERE slug = 'wellness-shot-subscription';
UPDATE public.products SET image_url = '/products/GallonSubscribe.png' WHERE slug = 'gallon-subscription';
UPDATE public.products SET image_url = '/products/4pk.png' WHERE slug = '3-pack-subscription';
