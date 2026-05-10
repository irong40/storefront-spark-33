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

interface SendGiftCardRequest {
  giftCardId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftCardId } = (await req.json()) as SendGiftCardRequest;
    if (!giftCardId) {
      return new Response(
        JSON.stringify({ error: "giftCardId required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: gc, error: gcErr } = await serviceSupabase
      .from("gift_cards")
      .select("id, code, amount, balance, purchaser_email, recipient_email, recipient_name, is_for_self, personal_message, delivered, status")
      .eq("id", giftCardId)
      .single();

    if (gcErr || !gc) {
      return new Response(
        JSON.stringify({ error: "Gift card not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (gc.delivered) {
      return new Response(
        JSON.stringify({ error: "Gift card already delivered" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (gc.status !== "active") {
      return new Response(
        JSON.stringify({ error: `Gift card not active (status=${gc.status})` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Decide recipient. is_for_self overrides; otherwise prefer recipient_email.
    const sendToEmail = gc.is_for_self
      ? gc.purchaser_email
      : (gc.recipient_email || gc.purchaser_email);
    const greetName = gc.is_for_self
      ? "there"
      : (gc.recipient_name || "there");
    const fromName = gc.is_for_self
      ? "you"
      : (escapeHtml(gc.purchaser_email || "a friend"));

    const safeCode = escapeHtml(gc.code);
    const safeName = escapeHtml(greetName);
    const safeMsg = gc.personal_message ? escapeHtml(gc.personal_message) : "";
    const amount = Number(gc.amount).toFixed(2);
    const balanceUrl = "https://impressivejb.com/gift-card-balance";

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            <div style="background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);padding:32px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;">
                &#127873;
              </div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;">
                ${gc.is_for_self ? "Your Gift Card is Here!" : "You've Received a Gift!"}
              </h1>
              <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">
                ${gc.is_for_self ? "Thanks for your purchase" : `A gift from ${fromName}`}
              </p>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 16px;color:#374151;">Hi ${safeName},</p>
              <p style="margin:0 0 24px;color:#374151;">
                ${gc.is_for_self
                  ? `Your imPRESSive Juice Bar gift card is ready to use. Save this email — your code is below.`
                  : `${fromName} sent you an imPRESSive Juice Bar gift card. Keep this email handy — you'll need the code to redeem it at checkout.`}
              </p>

              ${safeMsg ? `
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 6px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">A note for you</p>
                <p style="margin:0;color:#78350f;font-style:italic;">${safeMsg}</p>
              </div>` : ''}

              <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px dashed #16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#065f46;font-size:14px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Gift Card Value</p>
                <p style="margin:0 0 16px;color:#064e3b;font-size:42px;font-weight:700;">$${amount}</p>
                <p style="margin:0 0 4px;color:#065f46;font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Redemption Code</p>
                <p style="margin:0;color:#064e3b;font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:.1em;">${safeCode}</p>
              </div>

              <div style="text-align:center;margin-bottom:24px;">
                <a href="https://impressivejb.com" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                  Shop Now
                </a>
              </div>

              <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:16px;">
                <p style="margin:0 0 8px;color:#111827;font-weight:600;">How to use:</p>
                <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">
                  <li>Add items to your cart at imPRESSive Juice Bar</li>
                  <li>At checkout, enter your gift card code in the "Gift Card" field</li>
                  <li>The card balance is applied to your order total</li>
                </ol>
              </div>

              <p style="margin:0;color:#6b7280;font-size:13px;text-align:center;">
                Check your balance any time at <a href="${balanceUrl}" style="color:#16a34a;">${balanceUrl}</a>
              </p>
            </div>
            <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">imPRESSive Juice Bar &middot; 719 High St, Portsmouth VA 23704</p>
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
      to: sendToEmail,
      subject: gc.is_for_self
        ? `Your Gift Card - ${gc.code}`
        : `You've received a $${amount} gift card!`,
      html,
    });
    await smtp.close();

    await serviceSupabase
      .from("gift_cards")
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .eq("id", giftCardId);

    console.log("Gift card sent:", { giftCardId, code: gc.code, sendToEmail });

    return new Response(JSON.stringify({ success: true, sentTo: sendToEmail }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-gift-card error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
