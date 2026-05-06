-- Applied to remote 2026-05-06 via Supabase MCP apply_migration.
-- Rename legacy numbered image_url paths to lowercase-hyphen scheme to match
-- the renamed files in /public/products/.

UPDATE public.products SET image_url = '/products/ginger-ale.png' WHERE slug = 'ginger-ale';
UPDATE public.products SET image_url = '/products/the-cure.png' WHERE slug = 'the-cure';
UPDATE public.products SET image_url = '/products/wellness-shot-turmeric.png' WHERE slug IN ('wellness-shot-turmeric','wellness-shot-subscription');
UPDATE public.products SET image_url = '/products/very-very-green-goddess.png' WHERE slug = 'very-very-green-goddess';
