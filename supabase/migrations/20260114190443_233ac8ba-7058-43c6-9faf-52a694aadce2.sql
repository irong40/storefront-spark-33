-- Add pickup date and time columns to orders table
ALTER TABLE public.orders
ADD COLUMN pickup_date date,
ADD COLUMN pickup_time text;