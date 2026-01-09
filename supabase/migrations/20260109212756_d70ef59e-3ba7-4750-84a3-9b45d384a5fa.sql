-- Allow admins to update business settings
CREATE POLICY "Admins can update business settings" 
ON public.business_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));