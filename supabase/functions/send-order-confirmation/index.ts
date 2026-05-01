import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fix 7: HTML injection prevention
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  total: number;
}

interface OrderEmailRequest {
  email: string;
  customerName?: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  fulfillmentType: string;
  paymentStatus?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fix 6: Optional auth — validate JWT if provided, allow unauthenticated for guest checkout
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const token = authHeader.replace("Bearer ", "");
        const { error: authError } = await supabase.auth.getUser(token);
        if (authError) {
          return new Response(
            JSON.stringify({ error: "Invalid authorization token" }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        }
      }
    }

    const orderData: OrderEmailRequest = await req.json();

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orderRow, error: orderLookupError } = await serviceSupabase
      .from("orders")
      .select("id, created_at")
      .eq("order_number", orderData.orderNumber)
      .limit(1)
      .single();

    if (orderLookupError || !orderRow) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const orderAge = Date.now() - new Date(orderRow.created_at).getTime();
    if (orderAge > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: "Order confirmation window expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Sending order confirmation email to:", orderData.email);

    const {
      email,
      customerName,
      orderNumber,
      items,
      subtotal,
      tax,
      shipping,
      total,
      fulfillmentType,
      paymentStatus,
    } = orderData;

    // Fix 7: Escape user-controlled values
    const safeCustomerName = customerName ? escapeHtml(customerName) : "";
    const safeOrderNumber = escapeHtml(orderNumber);
    const safeFulfillmentType = escapeHtml(fulfillmentType || "pickup");

    // Build items HTML
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>${escapeHtml(item.product_name)}</strong><br>
            <span style="color: #6b7280;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${Number(item.total).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">&#10003;</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Order Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Thank you for your order</p>
            </div>

            <!-- Order Info -->
            <div style="padding: 24px;">
              <p style="margin: 0 0 16px; color: #374151;">
                Hi${safeCustomerName ? ` ${safeCustomerName}` : ''},
              </p>
              <p style="margin: 0 0 24px; color: #374151;">
                We've received your order and ${paymentStatus === 'completed' ? 'payment was successful' : 'are processing it'}. Here are the details:
              </p>

              <!-- Order Number Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
                      <strong style="color: #111827; font-size: 18px;">${safeOrderNumber}</strong>
                    </td>
                    <td style="text-align: right;">
                      <span style="color: #6b7280; font-size: 14px;">Fulfillment</span><br>
                      <strong style="color: #111827;">${safeFulfillmentType === 'pickup' ? '&#128205; Pickup' : '&#128666; Delivery'}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500;">Item</th>
                    <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Subtotal</td>
                  <td style="padding: 4px 0; text-align: right;">$${Number(subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Tax</td>
                  <td style="padding: 4px 0; text-align: right;">$${Number(tax).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
                  <td style="padding: 4px 0; text-align: right;">${Number(shipping) === 0 ? 'Free' : `$${Number(shipping).toFixed(2)}`}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 4px; font-size: 18px; font-weight: 600; border-top: 2px solid #e5e7eb;">Total</td>
                  <td style="padding: 12px 0 4px; text-align: right; font-size: 18px; font-weight: 600; border-top: 2px solid #e5e7eb;">$${Number(total).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Fulfillment Message -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46;">
                  ${safeFulfillmentType === 'pickup'
                    ? "&#128205; <strong>Pickup:</strong> We'll notify you when your order is ready for pickup at our store."
                    : "&#128666; <strong>Delivery:</strong> We'll notify you when your order is out for delivery."
                  }
                </p>
              </div>

              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Thank you for shopping with us!
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Fix 4: Use configurable sender with test fallback
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Order Confirmation <onboarding@resend.dev>";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Order Confirmed - ${orderNumber}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Owner alert email
    const ownerEmail = Deno.env.get("OWNER_EMAIL") || "info@impressivejb.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const confirmUrl = `${supabaseUrl}/functions/v1/confirm-order?token=${orderRow.id}`;

    const ownerItemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
            <strong>${escapeHtml(item.product_name)}</strong>
            <span style="color:#6b7280;margin-left:8px;">x${item.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">
            $${Number(item.total).toFixed(2)}
          </td>
        </tr>`
      )
      .join("");

    const ownerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

            <div style="background:#111827;padding:24px 32px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">New Order Alert</p>
              <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">Order ${safeOrderNumber}</h1>
            </div>

            <div style="padding:24px 32px;">
              <div style="background:#f3f4f6;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Customer</td>
                    <td style="text-align:right;font-weight:600;">${safeCustomerName || escapeHtml(email)}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-top:6px;">Fulfillment</td>
                    <td style="text-align:right;padding-top:6px;font-weight:600;">${safeFulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-top:6px;">Total</td>
                    <td style="text-align:right;padding-top:6px;font-weight:700;font-size:18px;">$${Number(total).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tbody>${ownerItemsHtml}</tbody>
              </table>

              <a href="${confirmUrl}" style="display:block;background:#16a34a;color:#fff;text-align:center;padding:16px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">
                &#10003; Confirm This Order
              </a>
              <p style="margin:12px 0 0;text-align:center;color:#9ca3af;font-size:12px;">
                Tap to acknowledge you've seen this order.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: fromEmail,
        to: [ownerEmail],
        subject: `New Order: ${orderNumber} — $${Number(total).toFixed(2)} (${safeFulfillmentType})`,
        html: ownerEmailHtml,
      });
      console.log("Owner alert sent to:", ownerEmail);
    } catch (ownerEmailErr) {
      console.error("Owner alert failed (non-fatal):", ownerEmailErr);
    }

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order confirmation email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
