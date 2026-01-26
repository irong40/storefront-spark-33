import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: RequestBody = await req.json();

    if (!orderId) {
      throw new Error('Missing orderId');
    }

    console.log("Processing gift cards for order:", orderId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all gift cards associated with this order
    const { data: giftCards, error: dbError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('order_id', orderId);

    if (dbError) throw dbError;

    if (!giftCards || giftCards.length === 0) {
      console.log('No gift cards found for this order.');
      return new Response(JSON.stringify({ message: 'No gift cards found' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${giftCards.length} gift cards to send.`);

    const results = [];

    // Loop through and send email for each card
    for (const card of giftCards) {
      // Skip if no recipient email (e.g. self purchase? Logic says we still send to purchaser maybe? 
      // But schema has recipient_email populated even for self usually, or logic handles it.
      // If missing, fallback to purchaser_email?
      const targetEmail = card.recipient_email || card.purchaser_email;
      const isSelf = card.purchaser_email === card.recipient_email; // approximate check

      const emailHtml = `
              <!DOCTYPE html>
              <html>
                <body style="font-family: -apple-system, sans-serif; background-color: #f9fafb; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px;">You received a gift!</h1>
                      <p style="color: rgba(255,255,255,0.9); font-size: 18px;">
                        ${card.recipient_name ? `Hi ${card.recipient_name},` : ''} 
                        ${isSelf ? "Here is your eGift Card." : "You've received an eGift Card!"}
                      </p>
                    </div>
                    
                    <div style="padding: 32px;">
                      ${card.personal_message ? `
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px; font-style: italic; color: #4b5563;">
                          "${card.personal_message}"
                        </div>
                      ` : ''}

                      <div style="border: 2px dashed #d1d5db; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">YOUR GIFT CARD CODE</p>
                        <div style="font-family: monospace; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: 2px; margin-bottom: 8px;">
                          ${card.code}
                        </div>
                        <div style="color: #16a34a; font-size: 20px; font-weight: 600;">
                          $${Number(card.amount).toFixed(2)}
                        </div>
                      </div>

                      <div style="text-align: center;">
                        <a href="${Deno.env.get("PUBLIC_SITE_URL") || "https://impressive-juice-bar.com"}" 
                           style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                          Redeem Now
                        </a>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `;

      try {
        const data = await resend.emails.send({
          from: "imPRESSive Juice Bar <gifts@resend.dev>",
          to: [targetEmail],
          subject: `You received a $${card.amount} Gift Card!`,
          html: emailHtml,
        });
        results.push({ id: card.id, success: true, data });

        // Optional: Update delivered status in DB?
        // await supabase.from('gift_cards').update({ delivered: true, delivered_at: new Date() }).eq('id', card.id);

      } catch (err: any) {
        console.error(`Failed to send email for card ${card.id}:`, err);
        results.push({ id: card.id, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
