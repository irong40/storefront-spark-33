-- Update Wellness Shot Price
UPDATE public.products
SET price = 3.00
WHERE slug = 'wellness-shot';

-- Confirm it has no variants/overrides that would override this price
DELETE FROM public.product_size_overrides WHERE product_id IN (SELECT id FROM public.products WHERE slug = 'wellness-shot');
