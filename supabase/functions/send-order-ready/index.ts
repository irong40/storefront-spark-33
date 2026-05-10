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

interface ReadyEmailRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = (await req.json()) as ReadyEmailRequest;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Verify caller is admin — this function does not allow anon callers.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await serviceSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: order, error: orderErr } = await serviceSupabase
      .from("orders")
      .select("id, order_number, email, customer_name, fulfillment_type, pickup_date, pickup_time, delivery_time_window, ready_notified_at")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (order.ready_notified_at) {
      return new Response(
        JSON.stringify({ error: "Customer already notified", notifiedAt: order.ready_notified_at }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const isDelivery = order.fulfillment_type === "delivery";
    const safeName = order.customer_name ? escapeHtml(order.customer_name) : "";
    const safeOrderNumber = escapeHtml(order.order_number ?? "");
    const headline = isDelivery ? "Your order is on the way!" : "Your order is ready for pickup!";
    const bodyMsg = isDelivery
      ? "Your order is out for delivery now. Keep an eye out — it will arrive within your selected window."
      : "Your order is ready and waiting for you at imPRESSive Juice Bar, 719 High St, Portsmouth VA 23704.";
    const scheduleLabel = isDelivery
      ? (order.delivery_time_window ? escapeHtml(order.delivery_time_window) : "")
      : [order.pickup_date, order.pickup_time].filter(Boolean).map((s) => escapeHtml(String(s))).join(" ");

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            <div style="background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);padding:32px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;">
                ${isDelivery ? "&#128666;" : "&#128205;"}
              </div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;">${headline}</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 16px;color:#374151;">Hi${safeName ? ` ${safeName}` : ''},</p>
              <p style="margin:0 0 24px;color:#374151;">${bodyMsg}</p>
              <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:16px;">
                <span style="color:#6b7280;font-size:14px;">Order Number</span><br>
                <strong style="color:#111827;font-size:18px;">${safeOrderNumber}</strong>
                ${scheduleLabel ? `<br><span style="color:#6b7280;font-size:14px;margin-top:8px;display:inline-block;">${isDelivery ? "Delivery Window" : "Pickup Time"}</span><br><strong style="color:#111827;">${scheduleLabel}</strong>` : ''}
              </div>
              <p style="margin:0;color:#6b7280;font-size:14px;">Thanks for choosing imPRESSive Juice Bar!</p>
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
      to: order.email,
      subject: isDelivery
        ? `Out for Delivery - ${order.order_number}`
        : `Ready for Pickup - ${order.order_number}`,
      html,
    });
    await smtp.close();

    await serviceSupabase
      .from("orders")
      .update({ ready_notified_at: new Date().toISOString(), status: "ready" })
      .eq("id", orderId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-order-ready error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
