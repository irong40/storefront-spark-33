import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";
import {
  type Addon,
  applyGiftCards,
  type CartRow,
  generateOrderNumber,
  giftCardsToIssue,
  priceCart,
} from "./checkout-order.ts";

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
    const {
      sourceId,
      sessionId,
      currency = "USD",
      redemptionId,
      fulfillmentType = "pickup",
      // Present when the checkout page wants the server to create the order
      // (contact + pickup/delivery details only; items and amounts come from the cart).
      // Absent = legacy flow: charge only, the browser inserts the order.
      order: orderInput = null,
      giftCardCodes = [],
    } = await req.json();
    const createOrder = orderInput !== null && typeof orderInput === "object";

    // Only the mode is taken from the client, never an amount. A forged "pickup"
    // simply underpays by the delivery fee — i.e. the pre-fix behavior — so this
    // is a safe widening of the request contract.
    const isDelivery = fulfillmentType === "delivery";

    console.log("Processing payment with server-side validation:", {
      sourceId: sourceId?.substring(0, 20) + "...",
      sessionId,
      currency,
      hasRedemption: !!redemptionId,
      fulfillmentType,
    });

    // sourceId may be absent only for a server-created order fully covered by gift
    // cards; that is checked once the amount due is known.
    if (!sessionId || (!sourceId && !createOrder)) {
      console.error("Missing required parameters");
      throw new Error("Missing sourceId or sessionId");
    }

    if (createOrder) {
      const email = typeof orderInput.email === "string" ? orderInput.email.trim() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return new Response(JSON.stringify({ error: "A valid email address is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
      return new Response(
        JSON.stringify({ error: "Your cart session was not found. Please refresh the page and re-add your items." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Expire by last cart ACTIVITY, not cart creation — returning customers
    // keep one cart row per session for weeks, so judging age by created_at
    // permanently locked them out of checkout ("Cart session expired" on
    // every attempt once the row was >24h old).
    const { data: latestItem } = await supabase
      .from('cart_items')
      .select('created_at')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActivity = latestItem?.created_at ?? cart.created_at;
    const cartAge = Date.now() - new Date(lastActivity).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (cartAge > TWENTY_FOUR_HOURS) {
      return new Response(
        JSON.stringify({ error: "Your cart has expired. Please re-add your items and try again." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
        product:products(name, price, slug, category:categories(slug)),
        size:product_sizes(price, name, size_oz),
        size_override:product_size_overrides(price, size_name, size_oz),
        addon_ids,
        is_subscription,
        selected_flavor_ids,
        gift_card_data,
        dressing
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error("Cart items lookup error:", itemsError);
      throw new Error("Failed to fetch cart items");
    }

    if (!cartItems || cartItems.length === 0) {
      console.error("Cart is empty");
      return new Response(
        JSON.stringify({ error: "Your cart is empty. Please re-add your items and try again." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Read tax rate and delivery pricing from business_settings (single source of truth).
    // The delivery fee is derived here, never accepted from the client — that is the
    // whole point of taking a sessionId instead of an amount.
    const { data: bizSettings } = await supabase
      .from("business_settings")
      .select("tax_rate, delivery_fee, delivery_free_threshold")
      .single();
    const TAX_RATE: number = bizSettings?.tax_rate ?? 0.08;
    const DELIVERY_FEE: number = Number(bizSettings?.delivery_fee ?? 8);
    const DELIVERY_FREE_THRESHOLD: number = Number(
      bizSettings?.delivery_free_threshold ?? 50,
    );

    // Fetch addon prices separately (since addon_ids is an array)
    const allAddonIds = cartItems.flatMap(item => (item.addon_ids as string[]) || []);
    let addonsMap = new Map<string, Addon>();

    if (allAddonIds.length > 0) {
      const { data: addons } = await supabase
        .from('product_addons')
        .select('id, display_name, price')
        .in('id', allAddonIds);

      if (addons) {
        addonsMap = new Map(addons.map(a => [a.id, { id: a.id, display_name: a.display_name, price: Number(a.price) }]));
      }
    }

    // Flavor names are only needed for the order rows (flavors are products).
    const allFlavorIds = cartItems.flatMap(item => (item.selected_flavor_ids as string[]) || []);
    let flavorsMap = new Map<string, string>();
    if (createOrder && allFlavorIds.length > 0) {
      const { data: flavors } = await supabase
        .from('products')
        .select('id, name')
        .in('id', allFlavorIds);
      if (flavors) {
        flavorsMap = new Map(flavors.map(f => [f.id, f.name]));
      }
    }

    // Calculate server-side total: size_override price > juice size price > product price, plus addons
    const { lines, subtotal } = priceCart(cartItems as unknown as CartRow[], addonsMap, flavorsMap);

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
        freeShipping = true; // surfaces as loyaltyApplied.free_shipping, which zeroes the delivery fee below
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

    // Delivery fee — mirrors the client's math in Checkout.tsx so the amount
    // charged matches the amount displayed. Shipping stays outside the tax base
    // on both sides.
    const shipping =
      isDelivery &&
      !loyaltyApplied?.free_shipping &&
      subtotal < DELIVERY_FREE_THRESHOLD
        ? DELIVERY_FEE
        : 0;

    const total = Math.max(0, subtotal + tax + shipping - loyaltyDiscount);

    const restoreLoyalty = async () => {
      if (!loyaltyApplied) return;
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
    };

    // --- Gift cards (server-created orders only) ---
    // Balances are read here, never trusted from the browser, and the applied
    // amounts are debited before Square is charged (released if the charge fails).
    let giftCardUsage: { code: string; amount: number }[] = [];
    let giftCardDiscount = 0;
    if (createOrder && Array.isArray(giftCardCodes) && giftCardCodes.length > 0) {
      const codes = [...new Set(
        giftCardCodes
          .filter((c: unknown): c is string => typeof c === "string")
          .map((c: string) => c.trim().toUpperCase()),
      )].slice(0, 5);
      const { data: cards, error: cardsErr } = await supabase
        .from("gift_cards")
        .select("code, balance, status, expires_at")
        .in("code", codes);
      if (cardsErr) {
        console.error("Gift card lookup failed:", cardsErr);
        await restoreLoyalty();
        throw new Error("Could not verify gift cards — try again");
      }
      const usable = codes
        .map((code: string) => (cards ?? []).find((c) => c.code === code))
        .filter((c): c is NonNullable<typeof c> =>
          !!c && c.status === "active" && Number(c.balance) > 0 &&
          (!c.expires_at || new Date(c.expires_at).getTime() > Date.now())
        )
        .map((c) => ({ code: c.code, balance: Number(c.balance) }));
      if (usable.length !== codes.length) {
        await restoreLoyalty();
        return new Response(
          JSON.stringify({ error: "A gift card on this order is no longer valid. Remove it and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const applied = applyGiftCards(usable, total);
      giftCardUsage = applied.usage;
      giftCardDiscount = applied.applied;
    }

    const amountDue = Math.max(0, total - giftCardDiscount);

    // Convert to cents for Square API
    const amountInCents = Math.round(amountDue * 100);

    console.log("Calculated payment amount:", {
      subtotal,
      shipping,
      tax,
      loyaltyDiscount,
      giftCardDiscount,
      total,
      amountInCents,
      itemCount: cartItems.length
    });

    // A zero charge is only valid when gift cards cover the order.
    const coveredByGiftCards = createOrder && amountInCents === 0 && giftCardDiscount > 0;
    if (amountInCents <= 0 && !coveredByGiftCards) {
      console.error("Invalid calculated amount");
      await restoreLoyalty();
      throw new Error("Invalid order amount");
    }
    if (amountInCents > 0 && !sourceId) {
      await restoreLoyalty();
      throw new Error("Missing sourceId or sessionId");
    }

    if (giftCardUsage.length > 0) {
      const { error: reserveGcErr } = await supabase.rpc("reserve_gift_cards", { p_usage: giftCardUsage });
      if (reserveGcErr) {
        console.error("Gift card reservation failed:", reserveGcErr);
        await restoreLoyalty();
        return new Response(
          JSON.stringify({ error: "A gift card balance changed. Please re-apply your gift card and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }
    const releaseGiftCards = async () => {
      if (giftCardUsage.length === 0) return;
      const { error } = await supabase.rpc("release_gift_cards", { p_usage: giftCardUsage });
      if (error) {
        console.error(JSON.stringify({ event: "gift_card_release_failed", usage: giftCardUsage, error: error.message }));
      }
    };

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    console.log(JSON.stringify({
      event: "payment_attempt",
      sessionId,
      ip: clientIp,
      cartTotal: amountInCents,
      ts: new Date().toISOString(),
    }));

    // deno-lint-ignore no-explicit-any
    let squarePayment: any = null;
    let paymentId: string;

    if (amountInCents > 0) {
      // Get Square credentials from DB (with env var fallback)
      const { token: squareToken, isSandbox } = await getSquareToken(supabase);

      if (!squareToken) {
        console.error("No Square access token available (DB or env)");
        await restoreLoyalty();
        await releaseGiftCards();
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
        // Roll back reservations so the customer can try again
        await restoreLoyalty();
        await releaseGiftCards();
        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      squarePayment = squareData.payment;
      paymentId = squarePayment?.id;
      console.log("Payment successful:", paymentId);

      // Record the charge so the orders INSERT policy can require a real payment
      // (payment_receipt_valid). The customer is already charged at this point, so
      // a failure here must not fail the request: retry once, then log loudly.
      // Without a receipt the client's order insert will be rejected.
      const receipt = {
        payment_id: paymentId,
        amount_cents: squarePayment?.amount_money?.amount ?? amountInCents,
        session_id: sessionId,
        user_id: authenticatedUserId,
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error: receiptErr } = await supabase.from("payment_receipts").insert(receipt);
        if (!receiptErr) break;
        console.error(JSON.stringify({
          event: "payment_receipt_insert_failed",
          attempt,
          paymentId: receipt.payment_id,
          amountCents: receipt.amount_cents,
          sessionId,
          error: receiptErr.message,
        }));
        if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
      }
    } else {
      // Fully covered by gift cards: nothing goes to Square.
      paymentId = `GIFTCARD-${crypto.randomUUID()}`;
      console.log("Order covered by gift cards:", paymentId);
    }

    // --- Server-side order creation ---
    // deno-lint-ignore no-explicit-any
    let createdOrder: any = null;
    if (createOrder) {
      const str = (v: unknown, max = 500) =>
        typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
      const today = new Date().toISOString().slice(0, 10);
      const orderId = crypto.randomUUID();
      const orderNumber = generateOrderNumber();
      const giftCards = giftCardsToIssue(lines, today);
      const addr = isDelivery && orderInput.shippingAddress && typeof orderInput.shippingAddress === "object"
        ? {
          line1: str(orderInput.shippingAddress.line1, 200),
          line2: str(orderInput.shippingAddress.line2, 200),
          city: str(orderInput.shippingAddress.city, 100),
          state: str(orderInput.shippingAddress.state, 50),
          zip: str(orderInput.shippingAddress.zip, 20),
        }
        : null;
      const round2 = (n: number) => Math.round(n * 100) / 100;
      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        user_id: authenticatedUserId,
        email: str(orderInput.email, 254),
        phone: str(orderInput.phone, 40),
        customer_name: str(orderInput.customerName, 200),
        fulfillment_type: isDelivery ? "delivery" : "pickup",
        subtotal: round2(subtotal),
        tax: round2(tax),
        shipping: round2(shipping),
        total: round2(amountDue),
        notes: str(orderInput.notes, 2000),
        admin_notes: giftCardUsage.length > 0
          ? `Gift cards applied: ${giftCardUsage.map((u) => `${u.code} -$${u.amount.toFixed(2)}`).join(", ")}`
          : null,
        payment_id: paymentId,
        pickup_date: isDelivery ? null : str(orderInput.pickupDate, 10),
        pickup_time: isDelivery ? null : str(orderInput.pickupTime, 40),
        delivery_date: isDelivery ? str(orderInput.deliveryDate, 10) : null,
        delivery_time_window: isDelivery ? str(orderInput.deliveryTimeWindow, 100) : null,
        shipping_address: addr,
      };
      const itemRows = lines.map((l) => ({
        product_id: l.product_id,
        product_name: l.product_name,
        product_price: l.unit_price,
        quantity: l.quantity,
        total: l.total,
        size_name: l.size_name,
        size_price: l.size_price,
        is_subscription: l.is_subscription,
        addons: l.addons,
        selected_flavors: l.selected_flavors,
        dressing: l.dressing,
      }));

      const { error: orderErr } = await supabase.rpc("create_checkout_order", {
        p_order: orderRow,
        p_items: itemRows,
        p_gift_cards: giftCards,
        p_redemption_id: loyaltyApplied?.redemption_id ?? null,
      });

      if (orderErr) {
        // The card may already be charged. Put gift card balances back and make
        // the failure impossible to miss; the customer is told to contact the shop.
        console.error(JSON.stringify({
          event: "order_create_failed_after_charge",
          paymentId,
          amountCents: amountInCents,
          sessionId,
          error: orderErr.message,
        }));
        await releaseGiftCards();
        return new Response(
          JSON.stringify({
            error: `Payment was received but the order could not be saved. Please contact us with payment ID ${paymentId}.`,
            paymentId,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      createdOrder = {
        id: orderId,
        orderNumber,
        subtotal: orderRow.subtotal,
        tax: orderRow.tax,
        shipping: orderRow.shipping,
        giftCardDiscount: round2(giftCardDiscount),
        total: orderRow.total,
        items: itemRows.map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          product_price: i.product_price,
          total: i.total,
        })),
        giftCards: giftCards.map((g) => ({ id: g.id, delivery_date: g.delivery_date })),
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: paymentId,
          status: squarePayment?.status ?? "COMPLETED",
          receiptUrl: squarePayment?.receipt_url,
          cardDetails: squarePayment?.card_details ? {
            last4: squarePayment.card_details.card?.last_4,
            brand: squarePayment.card_details.card?.card_brand,
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
        order: createdOrder,
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
