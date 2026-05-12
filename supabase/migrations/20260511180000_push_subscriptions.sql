-- Web push subscriptions for admin/owner order notifications.
-- One row per browser/device the owner enrolls.

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins manage their own subscriptions.
CREATE POLICY "Admins read own subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert own subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
