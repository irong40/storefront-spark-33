-- Create enum for subscription status if it doesn't exist
CREATE TYPE public.subscription_status AS ENUM (
    'pending',
    'active',
    'paused',
    'canceled',
    'failed'
);
-- Table to map Supabase User ID to Square Customer ID
CREATE TABLE IF NOT EXISTS public.user_payment_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    square_customer_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(square_customer_id)
);
-- Enable RLS for user_payment_profiles
ALTER TABLE public.user_payment_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payment profile" ON public.user_payment_profiles FOR
SELECT USING (auth.uid() = user_id);
-- subscriptions table (Local mirror of Square Subscription)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    square_subscription_id TEXT NOT NULL,
    status public.subscription_status NOT NULL DEFAULT 'pending',
    -- Product info (snapshot)
    product_id UUID REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_size_overrides(id),
    -- Optional, if specific variant
    product_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    interval TEXT NOT NULL,
    -- 'WEEKLY', 'MONTHLY'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR
SELECT USING (auth.uid() = user_id);
-- Subscription Logs / History (For audit)
CREATE TABLE IF NOT EXISTS public.subscription_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    -- 'created', 'renewed', 'paused', 'canceled', 'failed'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS for logs
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription logs" ON public.subscription_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.subscriptions
            WHERE subscriptions.id = subscription_logs.subscription_id
                AND subscriptions.user_id = auth.uid()
        )
    );
-- Admins can view all
CREATE POLICY "Admins can view all payment profiles" ON public.user_payment_profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can view all subscription logs" ON public.subscription_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
                AND role = 'admin'
        )
    );