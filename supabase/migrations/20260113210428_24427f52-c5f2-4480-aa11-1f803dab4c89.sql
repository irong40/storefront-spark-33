-- Phase 2: Extended Cart Items Schema
-- Add columns to cart_items for full variant/addon/flavor tracking

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size_id UUID REFERENCES product_sizes(id);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size_override_id UUID REFERENCES product_size_overrides(id);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS addon_ids UUID[] DEFAULT '{}';
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_flavor_ids UUID[] DEFAULT '{}';
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS gift_card_data JSONB;

-- Add index for faster lookups on variant columns
CREATE INDEX IF NOT EXISTS idx_cart_items_size_id ON cart_items(size_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_size_override_id ON cart_items(size_override_id);