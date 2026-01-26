-- Add flags for product badging
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products(is_bestseller);
-- Update seed data to have some examples
UPDATE public.products
SET is_bestseller = true
WHERE slug IN (
        'kiwi-kwencher',
        'very-berry',
        'wellness-shot-turmeric'
    );
UPDATE public.products
SET is_new = true
WHERE slug IN ('lemon-drop', 'kale-yea');
-- Set some items to 0 stock for testing "Sold Out" badge
UPDATE public.products
SET stock_quantity = 0
WHERE slug = 'summer-breeze';
-- Set some items to low stock
UPDATE public.products
SET stock_quantity = 3
WHERE slug = 'apple-mango-tango';