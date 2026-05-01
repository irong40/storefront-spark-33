import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  quantity: number;
  product: { price: number } | null;
  size: { price: number } | null;
  size_override: { price: number } | null;
  addons: { price: number }[] | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, sessionId, currency = "USD" } = await req.json();

    console.log("Processing payment with server-side validation:", { 
      sourceId: sourceId?.substring(0, 20) + "...", 
      sessionId,
      currency 
    });

    if (!sourceId || !sessionId) {
      console.error("Missing required parameters");
      throw new Error("Missing sourceId or sessionId");
    }

    // Initialize Supabase client with service role for server-side access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    let authedUserId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const jwt = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(jwt);
      authedUserId = user?.id ?? null;
    }

    // Find the cart by session ID
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, created_at, user_id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (cartError) {
      console.error("Cart lookup error:", cartError);
      throw new Error("Failed to verify cart");
    }

    if (!cart) {
      console.error("Cart not found for session:", sessionId);
      throw new Error("Cart not found");
    }

    const cartAge = Date.now() - new Date(cart.created_at).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (cartAge > TWENTY_FOUR_HOURS) {
      return new Response(JSON.stringify({ error: "Cart session expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authedUserId !== null && cart.user_id !== authedUserId) {
      return new Response(JSON.stringify({ error: "Cart does not belong to authenticated user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch cart items with all pricing data
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        product:products(price),
        size:product_sizes(price),
        size_override:product_size_overrides(price),
        addon_ids
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error("Cart items lookup error:", itemsError);
      throw new Error("Failed to fetch cart items");
    }

    if (!cartItems || cartItems.length === 0) {
      console.error("Cart is empty");
      throw new Error("Cart is empty");
    }

    // Read tax rate from business_settings (single source of truth)
    const { data: bizSettings } = await supabase
      .from("business_settings")
      .select("tax_rate")
      .single();
    const TAX_RATE: number = bizSettings?.tax_rate ?? 0.08;

    // Fetch addon prices separately (since addon_ids is an array)
    const allAddonIds = cartItems.flatMap(item => (item.addon_ids as string[]) || []);
    let addonsMap = new Map<string, number>();
    
    if (allAddonIds.length > 0) {
      const { data: addons } = await supabase
        .from('product_addons')
        .select('id, price')
        .in('id', allAddonIds);
      
      if (addons) {
        addonsMap = new Map(addons.map(a => [a.id, Number(a.price)]));
      }
    }

    // Calculate server-side total (matching client-side logic exactly)
    let subtotal = 0;
    for (const item of cartItems) {
      // Prioritize: size_override price > size price > product price
      let itemPrice = 0;
      
      // Handle the joined relations - they come back as objects, not arrays when using .single() joins
      const product = item.product as unknown as { price: number } | null;
      const size = item.size as unknown as { price: number } | null;
      const sizeOverride = item.size_override as unknown as { price: number } | null;
      
      if (sizeOverride && sizeOverride.price != null) {
        itemPrice = Number(sizeOverride.price);
      } else if (size && size.price != null) {
        itemPrice = Number(size.price);
      } else if (product && product.price != null) {
        itemPrice = Number(product.price);
      }

      // Add addon prices
      const addonIds = (item.addon_ids as string[]) || [];
      for (const addonId of addonIds) {
        const addonPrice = addonsMap.get(addonId);
        if (addonPrice) {
          itemPrice += addonPrice;
        }
      }

      subtotal += itemPrice * item.quantity;
    }

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    // Convert to cents for Square API
    const amountInCents = Math.round(total * 100);

    console.log("Calculated payment amount:", { 
      subtotal, 
      tax, 
      total, 
      amountInCents,
      itemCount: cartItems.length 
    });

    if (amountInCents <= 0) {
      console.error("Invalid calculated amount");
      throw new Error("Invalid order amount");
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    console.log(JSON.stringify({
      event: "payment_attempt",
      sessionId,
      ip: clientIp,
      cartTotal: amountInCents,
      ts: new Date().toISOString(),
    }));

    // Get Square credentials from DB (with env var fallback)
    const { token: squareToken, isSandbox } = await getSquareToken(supabase);

    if (!squareToken) {
      console.error("No Square access token available (DB or env)");
      throw new Error("Server configuration error: Payment service not configured");
    }

    const squareUrl = isSandbox
      ? "https://connect.squareupsandbox.com/v2/payments"
      : "https://connect.squareup.com/v2/payments";

    console.log("Using Square API:", isSandbox ? "Sandbox" : "Production");

    const payload = {
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: amountInCents,
        currency: currency,
      },
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
        },
        // Return calculated amounts for order creation
        calculatedAmounts: {
          subtotal,
          tax,
          total,
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
