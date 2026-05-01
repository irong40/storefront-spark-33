ALTER TABLE square_merchant_tokens
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false;
