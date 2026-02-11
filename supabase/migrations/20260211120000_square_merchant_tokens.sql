-- Square OAuth merchant tokens
CREATE TABLE square_merchant_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  location_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only service role can read tokens (edge functions use service role)
ALTER TABLE square_merchant_tokens ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role can access (not anon, not authenticated)
