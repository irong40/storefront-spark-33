import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
    email: string;
    customerName?: string;
    orderNumber: string;
    newStatus: string;
    fulfillmentType: string;
    trackingUrl?: string;
}

// Status-specific messaging
const STATUS_CONFIG: Record<string, { subject: string; emoji: string; heading: string; message: string }> = {
    confirmed: {
        subject: "Order Confirmed",
        emoji: "✅",
        heading: "Your order has been confirmed!",
        message: "We've received your order and are getting it ready.",
    },
    processing: {
        subject: "Order Being Prepared",
        emoji: "👨‍🍳",
        heading: "We're preparing your order!",
        message: "Our team is hard at work making your fresh juices and smoothies.",
    },
    ready: {
        subject: "Order Ready",
        emoji: "🎉",
        heading: "Your order is ready!",
        message: "", // Dynamic based on fulfillment_type
    },
    completed: {
        subject: "Order Completed",
        emoji: "🙏",
        heading: "Thank you for your order!",
        message: "We hope you enjoy your order. See you again soon!",
    },
    cancelled: {
        subject: "Order Cancelled",
        emoji: "❌",
        heading: "Order Cancelled",
        message: "Your order has been cancelled. If you have questions, please contact us.",
    },
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const data: StatusUpdateRequest = await req.json();
        const { email, customerName, orderNumber, newStatus, fulfillmentType, trackingUrl } = data;

        console.log(`Sending status update email for order ${orderNumber}: ${newStatus}`);

        const config = STATUS_CONFIG[newStatus];
        if (!config) {
            console.log(`No email configured for status: ${newStatus}`);
            return new Response(JSON.stringify({ success: true, skipped: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Dynamic message for "ready" status
        let statusMessage = config.message;
        if (newStatus === 'ready') {
            statusMessage = fulfillmentType === 'pickup'
                ? "Your order is ready for pickup at our store!"
                : "Your order is out for delivery!";
        }

        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">${config.emoji}</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">
                ${config.heading}
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">
              <p style="margin: 0 0 16px; color: #374151;">
                Hi${customerName ? ` ${customerName}` : ''},
              </p>
              
              <p style="margin: 0 0 24px; color: #374151;">
                ${statusMessage}
              </p>

              <!-- Order Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
                <strong style="color: #111827; font-size: 18px;">${orderNumber}</strong>
              </div>

              ${trackingUrl ? `
              <!-- Track Button -->
              <a href="${trackingUrl}" style="display: block; background-color: #16a34a; color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; margin-bottom: 24px;">
                Track Your Order
              </a>
              ` : ''}

              <!-- Footer -->
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Questions? Reply to this email or contact us at hello@impressivejuice.com
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

        const { error } = await resend.emails.send({
            from: "imPRESSive Juice Bar <orders@impressivejuice.com>",
            to: [email],
            subject: `${config.emoji} ${config.subject} - ${orderNumber}`,
            html: emailHtml,
        });

        if (error) {
            console.error("Email send error:", error);
            throw error;
        }

        console.log("Status update email sent successfully");

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error sending status update email:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

serve(handler);
