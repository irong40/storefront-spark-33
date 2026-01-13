DO $$
DECLARE
    product_id uuid;
BEGIN
    SELECT id INTO product_id FROM public.products WHERE slug = '3-pack-subscription';

    -- Update Image
    UPDATE public.products 
    SET image_url = '/images/products/3-pack-subscription.png' 
    WHERE id = product_id;

    -- Clear existing overrides for this product
    DELETE FROM public.product_size_overrides WHERE product_id = product_id;

    -- Insert new overrides (16oz $50, 24oz $60)
    -- Adding both Weekly and Monthly options for each size
    INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, sort_order, is_subscription, subscription_interval)
    VALUES
    (product_id, '16 oz', 16, 50.00, 1, true, 'weekly'),
    (product_id, '16 oz', 16, 50.00, 2, true, 'monthly'),
    (product_id, '24 oz', 24, 60.00, 3, true, 'weekly'),
    (product_id, '24 oz', 24, 60.00, 4, true, 'monthly');

END $$;
