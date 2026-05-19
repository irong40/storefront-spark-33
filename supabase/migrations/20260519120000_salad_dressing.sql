-- Salad dressing selection: persisted on both cart_items (mid-flight) and
-- order_items (post-purchase). NULL = not applicable (non-salad product).
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS dressing TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS dressing TEXT;

COMMENT ON COLUMN cart_items.dressing IS 'Salad dressing choice: Ranch | Italian | Caesar. NULL for non-salad items.';
COMMENT ON COLUMN order_items.dressing IS 'Salad dressing choice: Ranch | Italian | Caesar. NULL for non-salad items.';
