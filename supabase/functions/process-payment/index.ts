import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, amount, currency = "USD", customerId } = await req.json();

    console.log("Processing payment:", { sourceId: sourceId?.substring(0, 20) + "...", amount, currency, customerId });

    if (!sourceId || !amount) {
      console.error("Missing required parameters");
      throw new Error("Missing sourceId or amount");
    }

    // Get Square credentials from environment
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN");

    if (!squareToken) {
      console.error("SQUARE_ACCESS_TOKEN not configured");
      throw new Error("Server configuration error: Payment service not configured");
    }

    // Determine if we're in sandbox mode based on the token prefix
    const isSandbox = squareToken.startsWith("EAAAl") || squareToken.startsWith("sandbox");
    const squareUrl = isSandbox
      ? "https://connect.squareupsandbox.com/v2/payments"
      : "https://connect.squareup.com/v2/payments";

    console.log("Using Square API:", isSandbox ? "Sandbox" : "Production");

    const payload = {
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: Math.round(amount), // Amount in cents
        currency: currency,
      },
      customer_id: customerId, // Optional, but required if source_id is a Card ID
    };

    console.log("Sending payment request to Square...");

    const squareResponse = await fetch(squareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${squareToken}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify(payload),
    });

    const squareData = await squareResponse.json();

    if (!squareResponse.ok) {
      console.error("Square API error:", JSON.stringify(squareData));
      const errorMessage = squareData.errors?.[0]?.detail || "Payment processing failed";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Payment successful:", squareData.payment?.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: squareData.payment?.id,
          status: squareData.payment?.status,
          receiptUrl: squareData.payment?.receipt_url,
          cardDetails: squareData.payment?.card_details ? {
            last4: squareData.payment.card_details.card?.last_4,
            brand: squareData.payment.card_details.card?.card_brand,
          } : null,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Payment processing error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
