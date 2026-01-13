-- Phase 1: Gift Card System
-- Create gift_cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  original_amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'cancelled')),
  purchased_by UUID REFERENCES auth.users(id),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  delivery_date DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_card_transactions table
CREATE TABLE public.gift_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund')),
  amount NUMERIC NOT NULL,
  order_id UUID REFERENCES orders(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Gift card policies
CREATE POLICY "Anyone can view gift cards by code" ON public.gift_cards
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create gift cards" ON public.gift_cards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update gift cards" ON public.gift_cards
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gift cards" ON public.gift_cards
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Gift card transaction policies
CREATE POLICY "Anyone can view transactions for accessible gift cards" ON public.gift_card_transactions
  FOR SELECT USING (true);

CREATE POLICY "System can create transactions" ON public.gift_card_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage transactions" ON public.gift_card_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate gift card codes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'GC-';
  i INTEGER;
  segment TEXT;
BEGIN
  -- Generate 3 segments of 4 characters each: GC-XXXX-XXXX-XXXX
  FOR s IN 1..3 LOOP
    segment := '';
    FOR i IN 1..4 LOOP
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    IF s = 1 THEN
      result := result || segment;
    ELSE
      result := result || '-' || segment;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Function to check gift card balance
CREATE OR REPLACE FUNCTION public.check_gift_card_balance(gift_card_code TEXT)
RETURNS TABLE(
  id UUID,
  code TEXT,
  balance NUMERIC,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.code,
    gc.balance,
    gc.status,
    gc.expires_at
  FROM gift_cards gc
  WHERE gc.code = UPPER(gift_card_code)
    AND gc.status = 'active'
    AND (gc.expires_at IS NULL OR gc.expires_at > now());
END;
$$;

-- Function to redeem gift card
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  gift_card_code TEXT,
  redeem_amount NUMERIC,
  for_order_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  remaining_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gc_record RECORD;
  new_balance NUMERIC;
BEGIN
  -- Find the gift card
  SELECT * INTO gc_record
  FROM gift_cards gc
  WHERE gc.code = UPPER(gift_card_code)
  FOR UPDATE;

  -- Validate gift card exists
  IF gc_record IS NULL THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Validate status
  IF gc_record.status != 'active' THEN
    RETURN QUERY SELECT false, 'Gift card is not active'::TEXT, gc_record.balance;
    RETURN;
  END IF;

  -- Validate expiration
  IF gc_record.expires_at IS NOT NULL AND gc_record.expires_at < now() THEN
    UPDATE gift_cards SET status = 'expired' WHERE id = gc_record.id;
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Validate balance
  IF gc_record.balance < redeem_amount THEN
    RETURN QUERY SELECT false, 'Insufficient balance'::TEXT, gc_record.balance;
    RETURN;
  END IF;

  -- Calculate new balance
  new_balance := gc_record.balance - redeem_amount;

  -- Update gift card
  UPDATE gift_cards 
  SET 
    balance = new_balance,
    status = CASE WHEN new_balance <= 0 THEN 'depleted' ELSE 'active' END,
    updated_at = now()
  WHERE id = gc_record.id;

  -- Record transaction
  INSERT INTO gift_card_transactions (gift_card_id, type, amount, order_id, description)
  VALUES (gc_record.id, 'redemption', redeem_amount, for_order_id, 'Redeemed at checkout');

  RETURN QUERY SELECT true, 'Gift card redeemed successfully'::TEXT, new_balance;
END;
$$;

-- Trigger to set gift card code on insert
CREATE OR REPLACE FUNCTION public.set_gift_card_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      new_code := generate_gift_card_code();
      SELECT EXISTS(SELECT 1 FROM gift_cards WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_gift_card_code_trigger
  BEFORE INSERT ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_gift_card_code();

-- Update timestamp trigger
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);
CREATE INDEX idx_gift_cards_recipient_email ON gift_cards(recipient_email);
CREATE INDEX idx_gift_card_transactions_gift_card_id ON gift_card_transactions(gift_card_id);