import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function buildSmtpClient() {
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASSWORD");
  if (!username || !password) {
    throw new Error("SMTP credentials not configured (SMTP_USER / SMTP_PASSWORD)");
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

interface ReplyRequest {
  submissionId: string;
  replyText: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller — must be an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submissionId, replyText }: ReplyRequest = await req.json();
    if (!submissionId || !replyText?.trim()) {
      return new Response(
        JSON.stringify({ error: "submissionId and replyText required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: submission, error: subErr } = await service
      .from("contact_submissions")
      .select("id, name, email, subject, message")
      .eq("id", submissionId)
      .single();
    if (subErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = submission.name ? escapeHtml(submission.name) : "";
    const safeOrigSubject = submission.subject ? escapeHtml(submission.subject) : "your message";
    const safeOrigMessage = submission.message ? escapeHtml(submission.message) : "";
    const safeReply = escapeHtml(replyText).replace(/\n/g, "<br>");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <div style="background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);padding:24px 32px;">
              <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">imPRESSive Juice Bar</h1>
            </div>
            <div style="padding:24px 32px;color:#374151;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi${safeName ? ` ${safeName}` : ""},</p>
              <p style="margin:0 0 16px;">Thanks for reaching out${submission.subject ? ` about <em>${safeOrigSubject}</em>` : ""}. Here's our reply:</p>
              <div style="border-left:4px solid #16a34a;background:#f0fdf4;padding:14px 18px;border-radius:6px;margin:0 0 24px;">
                ${safeReply}
              </div>
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
                imPRESSive Juice Bar &middot; 719 High St, Portsmouth, VA 23704 &middot;
                <a href="tel:+17573816980" style="color:#16a34a;">757.381.6980</a>
              </p>
            </div>
            <div style="background:#f3f4f6;padding:14px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                ${submission.subject ? `In reply to: ${safeOrigSubject}<br>` : ""}
                Your original message:<br>
                <span style="color:#6b7280;">${safeOrigMessage}</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail =
      Deno.env.get("MAIL_FROM") ||
      `imPRESSive Juice Bar <${Deno.env.get("SMTP_USER") || "info@impressivejb.com"}>`;

    const smtp = buildSmtpClient();
    await smtp.send({
      from: fromEmail,
      to: submission.email,
      replyTo: Deno.env.get("SMTP_USER") || "info@impressivejb.com",
      subject: submission.subject ? `Re: ${submission.subject}` : "Re: your message",
      html: emailHtml,
    });

    await service
      .from("contact_submissions")
      .update({
        status: "replied",
        reply_message: replyText,
        replied_at: new Date().toISOString(),
        replied_by: userData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contact-reply error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
