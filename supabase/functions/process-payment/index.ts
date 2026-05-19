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

// Simple in-memory rate limiter per session (resets on cold start)
const recentPayments = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 3; // max 3 payment attempts per session per minute

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const timestamps = recentPayments.get(sessionId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recentPayments.set(sessionId, recent);
  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }
  recent.push(now);
  recentPayments.set(sessionId, recent);
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, sessionId, currency = "USD", redemptionId } = await req.json();

    console.log("Processing payment with server-side validation:", {
      sourceId: sourceId?.substring(0, 20) + "...",
      sessionId,
      currency,
      hasRedemption: !!redemptionId,
    });

    if (!sourceId || !sessionId) {
      console.error("Missing required parameters");
      throw new Error("Missing sourceId or sessionId");
    }

    // --- Authentication ---
    // verify_jwt is false in config to support guest checkout.
    // If an Authorization header is present, validate the JWT.
    // For guest checkout, the sessionId + cart validation below serves as proof of a valid session.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      throw new Error("Server configuration error");
    }

    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // The Supabase client always sends the anon key as Bearer for guests, so
      // a failed user lookup is expected for guest checkout and must NOT 401 —
      // the sessionId + cart validation below is the guest authorization proof.
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user) {
        authenticatedUserId = user.id;
        console.log("Authenticated user:", authenticatedUserId);
      }
    }

    // --- Rate Limiting ---
    if (isRateLimited(sessionId)) {
      console.error("Rate limited session:", sessionId);
      return new Response(
        JSON.stringify({ error: "Too many payment attempts. Please wait before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for server-side access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the cart by session ID — this validates the guest session
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

    if (authenticatedUserId !== null && cart.user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Cart does not belong to authenticated user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch cart items with all pricing data (plus slug + size_oz for loyalty
    // + category slug so we can ignore stale juice-size IDs on non-juice items)
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        product_id,
        product:products(price, slug, category:categories(slug)),
        size:product_sizes(price, name, size_oz),
        size_override:product_size_overrides(price, size_name, size_oz),
        addon_ids
      `)
      .eq('cart_id', cart.id);

    // Only these categories may price off the global product_sizes table.
    // Anything else (food, wellness-shots, detox-packages, subscriptions,
    // uncategorized) must ignore size.price even if a stale cart row carries
    // a size_id — fall through to product.price instead.
    const JUICE_SIZE_CATEGORIES = new Set([
      "sweet-treats",
      "energy-immunity-booster",
      "detox-fat-burners",
    ]);

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
      const product = item.product as unknown as
        | { price: number; category?: { slug?: string } | null }
        | null;
      const size = item.size as unknown as { price: number } | null;
      const sizeOverride = item.size_override as unknown as { price: number } | null;
      const categorySlug = product?.category?.slug ?? "";
      const canUseGlobalSize = JUICE_SIZE_CATEGORIES.has(categorySlug);

      if (sizeOverride && sizeOverride.price != null) {
        itemPrice = Number(sizeOverride.price);
      } else if (canUseGlobalSize && size && size.price != null) {
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

    // --- Loyalty redemption (optional) ---
    // Validate, compute discount, and reserve the code BEFORE charging Square.
    // One reward per order: caller passes at most one redemptionId.
    type LoyaltyApplied = {
      redemption_id: string;
      reward_type: string;
      discount: number;
      applied_to_product_id: string | null;
      applied_to_size_name: string | null;
      free_shipping: boolean;
    } | null;
    let loyaltyApplied: LoyaltyApplied = null;

    if (redemptionId) {
      if (!authenticatedUserId) {
        console.error("Loyalty redemption attempted without authentication");
        throw new Error("Sign in to use a loyalty reward");
      }

      const { data: redemption, error: redemptionErr } = await supabase
        .from("loyalty_redemptions")
        .select(`
          id, status, expires_at, member_id, points_spent,
          member:loyalty_members(user_id),
          reward:loyalty_rewards(reward_type, reward_value, product_id, min_order_amount, active)
        `)
        .eq("id", redemptionId)
        .maybeSingle();

      if (redemptionErr || !redemption) {
        console.error("Redemption lookup failed:", redemptionErr);
        throw new Error("Loyalty reward not found");
      }

      const member = redemption.member as unknown as { user_id: string } | null;
      const reward = redemption.reward as unknown as {
        reward_type: string;
        reward_value: number | null;
        product_id: string | null;
        min_order_amount: number | null;
        active: boolean;
      } | null;

      if (!member || member.user_id !== authenticatedUserId) {
        throw new Error("This reward belongs to a different account");
      }
      if (redemption.status !== "active") {
        throw new Error("This reward has already been used or expired");
      }
      if (new Date(redemption.expires_at).getTime() < Date.now()) {
        throw new Error("This reward has expired");
      }
      if (!reward || !reward.active) {
        throw new Error("This reward is no longer offered");
      }
      const minOrder = Number(reward.min_order_amount ?? 0);
      if (subtotal < minOrder) {
        throw new Error(`Minimum order of $${minOrder.toFixed(2)} required to use this reward`);
      }

      // Compute the discount against the validated server-side cart.
      let discount = 0;
      let appliedProductId: string | null = null;
      let appliedSizeName: string | null = null;
      let freeShipping = false;

      if (reward.reward_type === "discount_fixed") {
        discount = Math.min(Number(reward.reward_value ?? 0), subtotal);
      } else if (reward.reward_type === "discount_percent") {
        discount = subtotal * (Number(reward.reward_value ?? 0) / 100);
      } else if (reward.reward_type === "free_shipping") {
        freeShipping = true; // tax/total already exclude shipping in this fn — see note below
      } else if (reward.reward_type === "free_product") {
        // Pick the cheapest eligible line. Eligible = (a) matches reward.product_id if set,
        // (b) otherwise any line whose effective size_oz === 10.
        type EligibleLine = {
          unitPrice: number;
          productId: string;
          sizeName: string | null;
        };
        const eligible: EligibleLine[] = [];
        for (const item of cartItems) {
          const product = item.product as unknown as { price: number; slug: string | null } | null;
          const size = item.size as unknown as { price: number; name: string | null; size_oz: number | null } | null;
          const sizeOverride = item.size_override as unknown as {
            price: number;
            size_name: string | null;
            size_oz: number | null;
          } | null;

          let unitPrice = 0;
          let sizeOz: number | null = null;
          let sizeName: string | null = null;
          if (sizeOverride && sizeOverride.price != null) {
            unitPrice = Number(sizeOverride.price);
            sizeOz = sizeOverride.size_oz ?? null;
            sizeName = sizeOverride.size_name ?? null;
          } else if (size && size.price != null) {
            unitPrice = Number(size.price);
            sizeOz = size.size_oz ?? null;
            sizeName = size.name ?? null;
          } else if (product && product.price != null) {
            unitPrice = Number(product.price);
          }

          const productId = (item as { product_id: string }).product_id;
          const matchesProduct = reward.product_id
            ? productId === reward.product_id
            : sizeOz === 10;
          if (matchesProduct && unitPrice > 0) {
            eligible.push({ unitPrice, productId, sizeName });
          }
        }
        if (eligible.length === 0) {
          throw new Error(
            reward.product_id
              ? "This reward requires the matching product in your cart"
              : "This reward requires a 10 oz juice in your cart",
          );
        }
        eligible.sort((a, b) => a.unitPrice - b.unitPrice);
        const cheapest = eligible[0];
        discount = cheapest.unitPrice;
        appliedProductId = cheapest.productId;
        appliedSizeName = cheapest.sizeName;
      }

      // Reserve the code now: flip to 'used' before charging Square. If the
      // Square charge fails below we restore it. order_id is patched in by the
      // client right after the orders row is inserted.
      const { error: reserveErr } = await supabase
        .from("loyalty_redemptions")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
          discount_amount: Number(discount.toFixed(2)),
          applied_to_product_id: appliedProductId,
          applied_to_size_name: appliedSizeName,
        })
        .eq("id", redemptionId)
        .eq("status", "active"); // optimistic concurrency
      if (reserveErr) {
        console.error("Failed to reserve redemption:", reserveErr);
        throw new Error("Could not reserve loyalty reward — try again");
      }

      loyaltyApplied = {
        redemption_id: redemptionId,
        reward_type: reward.reward_type,
        discount: Number(discount.toFixed(2)),
        applied_to_product_id: appliedProductId,
        applied_to_size_name: appliedSizeName,
        free_shipping: freeShipping,
      };
    }

    const loyaltyDiscount = loyaltyApplied?.discount ?? 0;
    const total = Math.max(0, subtotal + tax - loyaltyDiscount);

    // Convert to cents for Square API
    const amountInCents = Math.round(total * 100);

    console.log("Calculated payment amount:", {
      subtotal,
      tax,
      loyaltyDiscount,
      total,
      amountInCents,
      itemCount: cartItems.length
    });

    if (amountInCents <= 0) {
      console.error("Invalid calculated amount");
      // Roll back redemption reservation if any
      if (loyaltyApplied) {
        await supabase
          .from("loyalty_redemptions")
          .update({ status: "active", used_at: null, discount_amount: null, applied_to_product_id: null, applied_to_size_name: null })
          .eq("id", loyaltyApplied.redemption_id);
      }
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
      // Roll back redemption reservation so the customer can try again
      if (loyaltyApplied) {
        await supabase
          .from("loyalty_redemptions")
          .update({
            status: "active",
            used_at: null,
            discount_amount: null,
            applied_to_product_id: null,
            applied_to_size_name: null,
          })
          .eq("id", loyaltyApplied.redemption_id);
      }
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
          loyaltyDiscount,
        },
        loyaltyApplied,
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
