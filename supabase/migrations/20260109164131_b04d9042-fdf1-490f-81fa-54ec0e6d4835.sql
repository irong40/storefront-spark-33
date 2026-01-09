-- =============================================
-- imPRESSive Juice Bar Database Schema
-- =============================================

-- User roles enum for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (active = true);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES public.categories(id),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[],
  features TEXT[],
  ingredients TEXT,
  nutrition_info JSONB,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (active = true);

CREATE INDEX products_category_id_idx ON public.products(category_id);
CREATE INDEX products_slug_idx ON public.products(slug);
CREATE INDEX products_featured_idx ON public.products(is_featured) WHERE is_featured = true;

-- =============================================
-- CONTACT SUBMISSIONS TABLE
-- =============================================
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- =============================================
-- BUSINESS SETTINGS TABLE
-- =============================================
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  hours JSONB,
  social_links JSONB,
  logo_url TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business settings are viewable by everyone"
  ON public.business_settings FOR SELECT
  USING (true);

-- =============================================
-- CARTS TABLE
-- =============================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create and manage carts by session"
  ON public.carts FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- CART ITEMS TABLE
-- =============================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage cart items"
  ON public.cart_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX cart_items_cart_id_idx ON public.cart_items(cart_id);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  phone TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  fulfillment_type TEXT DEFAULT 'pickup' CHECK (fulfillment_type IN ('pickup', 'delivery')),
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Order number generator function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
    lpad(nextval('order_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

-- =============================================
-- CUSTOMER PROFILES TABLE
-- =============================================
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  default_shipping_address JSONB,
  default_billing_address JSONB,
  marketing_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- USER ROLES TABLE (for admin functionality)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Cold-Pressed Juices', 'cold-pressed-juices', 'Fresh, raw juices made daily with organic produce', 1),
('Wellness Shots', 'wellness-shots', 'Concentrated health boosters in a single shot', 2),
('Detox Programs', 'detox-programs', 'Multi-day cleanse packages for reset and renewal', 3),
('Subscriptions', 'subscriptions', 'Weekly and monthly delivery plans', 4);

-- Cold-Pressed Juices
INSERT INTO public.products (name, slug, short_description, description, category_id, price, compare_at_price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Green Goddess',
  'green-goddess',
  'Our signature green juice packed with leafy greens and refreshing cucumber',
  'Start your day right with this nutrient-dense blend of organic kale, spinach, cucumber, celery, green apple, lemon, and ginger. Cold-pressed to preserve maximum nutrients and enzymes.',
  (SELECT id FROM categories WHERE slug = 'cold-pressed-juices'),
  12.99,
  NULL,
  ARRAY['100% organic ingredients', 'No added sugar', 'Rich in vitamins A, C, K', 'Made fresh daily'],
  'Organic kale, organic spinach, cucumber, celery, green apple, lemon, ginger',
  true,
  true,
  1
),
(
  'Sunrise Citrus',
  'sunrise-citrus',
  'Bright and energizing citrus blend to jumpstart your morning',
  'A vibrant combination of fresh oranges, grapefruits, carrots, and turmeric. Loaded with vitamin C and anti-inflammatory benefits.',
  (SELECT id FROM categories WHERE slug = 'cold-pressed-juices'),
  11.99,
  NULL,
  ARRAY['High in Vitamin C', 'Natural energy boost', 'Anti-inflammatory turmeric', 'No preservatives'],
  'Fresh orange, grapefruit, carrot, turmeric, black pepper',
  true,
  true,
  2
),
(
  'Berry Bliss',
  'berry-bliss',
  'Antioxidant-rich berry blend with a touch of beet',
  'Deep purple goodness combining organic berries with beet for a delicious, antioxidant-packed drink that supports heart health and recovery.',
  (SELECT id FROM categories WHERE slug = 'cold-pressed-juices'),
  13.99,
  NULL,
  ARRAY['Loaded with antioxidants', 'Supports heart health', 'Natural nitrates from beet', 'Perfect post-workout'],
  'Organic blueberries, strawberries, blackberries, beet, apple, lemon',
  false,
  true,
  3
),
(
  'Tropical Paradise',
  'tropical-paradise',
  'Escape to the tropics with this refreshing pineapple-mango blend',
  'Transport yourself to paradise with this tropical blend featuring pineapple, mango, coconut water, and a hint of lime. Hydrating and delicious.',
  (SELECT id FROM categories WHERE slug = 'cold-pressed-juices'),
  12.99,
  NULL,
  ARRAY['Naturally hydrating', 'Digestive enzymes from pineapple', 'Electrolyte-rich coconut water', 'Vacation in a bottle'],
  'Pineapple, mango, coconut water, lime, mint',
  true,
  true,
  4
);

-- Wellness Shots
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, ingredients, is_featured, is_available, sort_order) VALUES
(
  'Immunity Booster',
  'immunity-booster',
  'Powerful ginger-turmeric shot to support your immune system',
  'A concentrated 2oz shot packed with immune-supporting ingredients. Take daily for best results.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['2oz concentrated shot', 'Supports immune function', 'Anti-inflammatory', 'Take daily'],
  'Ginger, turmeric, lemon, cayenne, black pepper, raw honey',
  true,
  true,
  1
),
(
  'Energy Shot',
  'energy-shot',
  'Natural energy without the crash from green tea and ginseng',
  'Skip the coffee jitters. This shot provides clean, sustained energy from green tea, ginseng, and B-vitamins from wheatgrass.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  5.99,
  ARRAY['Natural caffeine', 'No crash', 'B-vitamins', 'Mental clarity'],
  'Green tea, ginseng, wheatgrass, lemon, raw honey',
  false,
  true,
  2
),
(
  'Digestion Aid',
  'digestion-aid',
  'Soothing shot with apple cider vinegar and ginger',
  'Support healthy digestion with this gentle but effective shot. Perfect before meals or to soothe an upset stomach.',
  (SELECT id FROM categories WHERE slug = 'wellness-shots'),
  4.99,
  ARRAY['Supports digestion', 'Balances gut pH', 'Reduces bloating', 'Take before meals'],
  'Apple cider vinegar, ginger, lemon, raw honey, cayenne',
  false,
  true,
  3
);

-- Detox Programs
INSERT INTO public.products (name, slug, short_description, description, category_id, price, compare_at_price, features, is_featured, is_available, sort_order) VALUES
(
  '3-Day Reset',
  '3-day-reset',
  'Perfect introduction to juice cleansing with 18 cold-pressed juices',
  'Our most popular cleanse for beginners. Includes 6 juices per day for 3 days, plus detailed instructions and support.',
  (SELECT id FROM categories WHERE slug = 'detox-programs'),
  149.99,
  179.99,
  ARRAY['18 cold-pressed juices', '6 juices per day', 'Beginner friendly', 'Email support included', 'Detailed cleanse guide'],
  true,
  true,
  1
),
(
  '5-Day Deep Cleanse',
  '5-day-deep-cleanse',
  'Comprehensive cleanse for experienced cleansers ready for transformation',
  'Take your wellness to the next level with our intensive 5-day program. 30 juices plus wellness shots for maximum results.',
  (SELECT id FROM categories WHERE slug = 'detox-programs'),
  249.99,
  299.99,
  ARRAY['30 cold-pressed juices', '5 wellness shots included', 'For experienced cleansers', 'Phone support included', 'Personalized guidance'],
  false,
  true,
  2
);

-- Subscriptions
INSERT INTO public.products (name, slug, short_description, description, category_id, price, features, is_featured, is_available, sort_order) VALUES
(
  'Weekly Juice Box',
  'weekly-juice-box',
  '7 juices delivered fresh to your door every week',
  'Never run out of your favorites. Choose 7 juices each week and we''ll deliver them fresh on your preferred day.',
  (SELECT id FROM categories WHERE slug = 'subscriptions'),
  69.99,
  ARRAY['7 juices per week', 'You choose the flavors', 'Free local delivery', 'Skip or cancel anytime', 'Save 20% vs individual'],
  false,
  true,
  1
),
(
  'Monthly Wellness Plan',
  'monthly-wellness-plan',
  '20 juices + 8 wellness shots delivered monthly',
  'Your complete monthly wellness solution. Mix and match juices and shots delivered in two bi-weekly shipments.',
  (SELECT id FROM categories WHERE slug = 'subscriptions'),
  199.99,
  ARRAY['20 juices per month', '8 wellness shots included', 'Split into 2 deliveries', 'Priority customer support', 'Save 25% vs individual'],
  false,
  true,
  2
);

-- Business Settings
INSERT INTO public.business_settings (business_name, tagline, description, email, phone, address_line1, city, state, zip, hours, social_links) VALUES
(
  'imPRESSive Juice Bar',
  'Cold-Pressed. Fresh Daily. Feel the Difference.',
  'We believe in the power of fresh, organic ingredients to transform your health. Every juice is cold-pressed daily using only the finest organic produce.',
  'hello@impressivejuicebar.com',
  '(555) 123-JUICE',
  '123 Main Street',
  'Anytown',
  'CA',
  '90210',
  '{"monday": "7am-7pm", "tuesday": "7am-7pm", "wednesday": "7am-7pm", "thursday": "7am-7pm", "friday": "7am-7pm", "saturday": "8am-5pm", "sunday": "8am-5pm"}',
  '{"instagram": "https://instagram.com/impressivejuice", "facebook": "https://facebook.com/impressivejuice", "tiktok": "https://tiktok.com/@impressivejuice"}'
);