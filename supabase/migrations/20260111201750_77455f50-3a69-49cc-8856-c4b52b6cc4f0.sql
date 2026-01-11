-- Fix 1: Add admin SELECT policy for contact_submissions
CREATE POLICY "Admins can view contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add UPDATE and DELETE for admins to manage submissions
CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Improve cart_items RLS - restrict to cart owner
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can manage cart items" ON public.cart_items;

-- Create policy that restricts cart_items access to the cart's session owner
CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_items.cart_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_items.cart_id
    )
  );