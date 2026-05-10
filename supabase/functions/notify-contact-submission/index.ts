// DB trigger calls this edge function when a new contact_submissions row is
// created. Emails the owner so they don't have to manually check the admin.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function buildSmtpClient() {
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASSWORD");
  if (!username || !password) {
    throw new Error("SMTP credentials not configured");
  }
  return new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT") || 465),
      tls: true,
      auth: { username, password },
    },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "submissionId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sub, error } = await supabase
      .from("contact_submissions")
      .select("id, name, email, subject, message, created_at")
      .eq("id", submissionId)
      .single();

    if (error || !sub) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const ownerEmail = Deno.env.get("OWNER_EMAIL") || "impressive.jb22@gmail.com";
    const fromEmail =
      Deno.env.get("MAIL_FROM") ||
      `imPRESSive Juice Bar <${Deno.env.get("SMTP_USER") || "info@impressivejb.com"}>`;

    const safeName = escapeHtml(sub.name || "Anonymous");
    const safeEmail = escapeHtml(sub.email || "");
    const safeSubject = escapeHtml(sub.subject || "(no subject)");
    const safeMsg = escapeHtml(sub.message || "");

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            <div style="background:#111827;padding:24px 32px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">New Contact Form Message</p>
              <h1 style="margin:4px 0 0;color:#fff;font-size:20px;">${safeSubject}</h1>
            </div>
            <div style="padding:24px 32px;">
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                  <td style="color:#6b7280;font-size:13px;padding:6px 0;">From</td>
                  <td style="text-align:right;font-weight:600;padding:6px 0;">${safeName}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:13px;padding:6px 0;">Email</td>
                  <td style="text-align:right;padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#16a34a;">${safeEmail}</a></td>
                </tr>
              </table>
              <div style="background:#f3f4f6;border-radius:8px;padding:16px;color:#111827;white-space:pre-wrap;">${safeMsg}</div>
              <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Reply directly to this email to respond, or open the admin panel to manage messages.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const smtp = buildSmtpClient();
    await smtp.send({
      from: fromEmail,
      to: ownerEmail,
      replyTo: sub.email || undefined,
      subject: `New contact: ${safeSubject}`,
      html,
    });
    await smtp.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-contact-submission error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
