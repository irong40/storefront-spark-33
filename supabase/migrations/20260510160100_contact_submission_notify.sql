-- Contact form notification pipeline.
-- Closes the silent-contact-form gap: previously, customer submissions wrote
-- to contact_submissions but nobody was emailed. Owner had to manually check
-- the admin panel. Now an AFTER INSERT trigger fires pg_net to call the
-- notify-contact-submission edge function, which emails the owner with the
-- message body and Reply-To set to the customer's email.

CREATE OR REPLACE FUNCTION public.notify_contact_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tzbwrssopmjvgvvgdvfu.supabase.co/functions/v1/notify-contact-submission',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('submissionId', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_contact_submission_notify ON public.contact_submissions;
CREATE TRIGGER on_contact_submission_notify
AFTER INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_contact_submission();

REVOKE EXECUTE ON FUNCTION public.notify_contact_submission() FROM anon, authenticated;
