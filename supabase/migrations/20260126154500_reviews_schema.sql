-- Create enum for review status
CREATE TYPE public.review_status AS ENUM ('published', 'pending', 'hidden');
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    status public.review_status DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Prevent multiple reviews for same product by same user?
    -- Optional constraint: ONE review per product per user
    UNIQUE(user_id, product_id)
);
-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Policies
-- Public Read: Everyone can see 'published' reviews
CREATE POLICY "Public can view published reviews" ON public.reviews FOR
SELECT USING (status = 'published');
-- User Write: Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- User Update: Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews FOR
UPDATE USING (auth.uid() = user_id);
-- User Delete: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
-- Admin: Admins can view/edit/delete all
CREATE POLICY "Admins can do everything with reviews" ON public.reviews FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
            AND role = 'admin'
    )
);
-- Function to check verified purchase on insert
CREATE OR REPLACE FUNCTION public.check_verified_purchase() RETURNS TRIGGER AS $$ BEGIN -- Check if user has purchased this product in a completed order
    IF EXISTS (
        SELECT 1
        FROM public.orders o
            JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.user_id = NEW.user_id
            AND oi.product_id = NEW.product_id
            AND o.payment_status = 'completed'
    ) THEN NEW.is_verified_purchase := true;
ELSE NEW.is_verified_purchase := false;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger
CREATE TRIGGER set_verified_purchase_flag BEFORE
INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.check_verified_purchase();