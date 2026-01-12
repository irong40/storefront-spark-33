-- =============================================
-- eGift Card Feature
-- =============================================

-- Gift Card Products (denomination options)
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  is_for_self BOOLEAN DEFAULT true,
  personal_message TEXT,
  delivery_date DATE,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Users can view gift cards they purchased or received
CREATE POLICY "Users can view their gift cards"
  ON public.gift_cards FOR SELECT
  USING (
    purchaser_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can create gift cards (during purchase)
CREATE POLICY "Anyone can create gift cards"
  ON public.gift_cards FOR INSERT
  WITH CHECK (true);

-- Admins can manage all gift cards
CREATE POLICY "Admins can manage gift cards"
  ON public.gift_cards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gift card code generator function
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..16 LOOP
    IF i IN (5, 9, 13) THEN
      result := result || '-';
    END IF;
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate gift card code before insert
CREATE OR REPLACE FUNCTION set_gift_card_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_gift_card_code();
  END IF;
  NEW.balance := NEW.amount; -- Set initial balance to amount
  NEW.expires_at := NOW() + INTERVAL '1 year'; -- Gift cards expire in 1 year
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_card_before_insert
  BEFORE INSERT ON public.gift_cards
  FOR EACH ROW EXECUTE FUNCTION set_gift_card_code();

-- Update cart_items to support gift card data
ALTER TABLE public.cart_items
  ADD COLUMN gift_card_data JSONB;

-- Create index for gift card lookups
CREATE INDEX gift_cards_code_idx ON public.gift_cards(code);
CREATE INDEX gift_cards_recipient_email_idx ON public.gift_cards(recipient_email);

-- Add gift card product to products table
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order)
SELECT 
  'eGift Card',
  'egift-card',
  'The perfect gift - let them choose their favorites!',
  'Give the gift of health and wellness. Available in $25, $50, $100, $150, and $200 amounts. Send instantly or schedule delivery. Add a personalized message to make it special.',
  c.id,
  25.00,
  ARRAY['Choose amount: $25-$200', 'Instant or scheduled delivery', 'Personalized message', 'Never expires*', 'Emailed directly to recipient'],
  true,
  true,
  1
FROM public.categories c WHERE c.slug = 'subscriptions';

-- Add gift card denominations as size overrides
INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '$25', NULL, 25.00, false, 1
FROM public.products p WHERE p.slug = 'egift-card';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '$50', NULL, 50.00, false, 2
FROM public.products p WHERE p.slug = 'egift-card';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '$100', NULL, 100.00, false, 3
FROM public.products p WHERE p.slug = 'egift-card';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '$150', NULL, 150.00, false, 4
FROM public.products p WHERE p.slug = 'egift-card';

INSERT INTO public.product_size_overrides (product_id, size_name, size_oz, price, is_subscription, sort_order)
SELECT p.id, '$200', NULL, 200.00, false, 5
FROM public.products p WHERE p.slug = 'egift-card';
