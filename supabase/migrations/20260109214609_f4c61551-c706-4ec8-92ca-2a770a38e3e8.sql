-- Add Square reference columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS square_catalog_id TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS square_variation_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add Square reference column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS square_category_id TEXT UNIQUE;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_products_square_catalog_id ON products(square_catalog_id);
CREATE INDEX IF NOT EXISTS idx_products_square_variation_id ON products(square_variation_id);
CREATE INDEX IF NOT EXISTS idx_categories_square_category_id ON categories(square_category_id);