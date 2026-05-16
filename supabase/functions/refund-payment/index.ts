import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error");
    }

    // --- Admin auth check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey || supabaseServiceKey,
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !hasAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Load order ---
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, payment_id, total, refunded_amount, status, payment_status",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!order.payment_id) {
      return new Response(
        JSON.stringify({
          error:
            "This order has no Square payment ID. It was likely a cash order or created manually — refund offline.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const orderTotal = Number(order.total);
    const alreadyRefunded = Number(order.refunded_amount ?? 0);
    const refundCeiling = orderTotal - alreadyRefunded;

    if (refundCeiling <= 0) {
      return new Response(
        JSON.stringify({ error: "Order is already fully refunded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Default to full remaining balance if no amount specified
    const refundAmount = amount != null ? Number(amount) : refundCeiling;

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid refund amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (refundAmount > refundCeiling + 0.001) {
      return new Response(
        JSON.stringify({
          error: `Refund amount $${refundAmount.toFixed(2)} exceeds remaining refundable balance $${refundCeiling.toFixed(2)}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const amountInCents = Math.round(refundAmount * 100);

    // --- Square refund ---
    const { token: squareToken, isSandbox } = await getSquareToken(supabase);
    if (!squareToken) {
      throw new Error("Square access token not configured");
    }

    const squareUrl = isSandbox
      ? "https://connect.squareupsandbox.com/v2/refunds"
      : "https://connect.squareup.com/v2/refunds";

    const payload = {
      idempotency_key: crypto.randomUUID(),
      payment_id: order.payment_id,
      amount_money: { amount: amountInCents, currency: "USD" },
      reason: reason || `Refund for order ${order.order_number}`,
    };

    console.log("Submitting Square refund:", {
      orderId,
      paymentId: order.payment_id,
      amountInCents,
      isSandbox,
    });

    const squareResp = await fetch(squareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${squareToken}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify(payload),
    });

    const squareData = await squareResp.json();

    if (!squareResp.ok) {
      console.error("Square refund error:", JSON.stringify(squareData));
      const msg =
        squareData.errors?.[0]?.detail || "Square refund failed";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const refundId = squareData.refund?.id as string | undefined;
    const refundStatus = squareData.refund?.status as string | undefined;

    // --- Update order ---
    const newRefundedAmount = Number((alreadyRefunded + refundAmount).toFixed(2));
    const isFullRefund = Math.abs(newRefundedAmount - orderTotal) < 0.005;
    const newStatus = isFullRefund ? "refunded" : "partially_refunded";
    const newPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        refunded_amount: newRefundedAmount,
        refunded_at: new Date().toISOString(),
        refund_id: refundId ?? null,
        refund_reason: reason ?? null,
        status: newStatus,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Failed to update order after refund:", updateErr);
      // Refund succeeded at Square — surface so admin knows money moved
      return new Response(
        JSON.stringify({
          success: true,
          warning:
            "Refund issued at Square but order record failed to update — refresh and reconcile manually",
          refundId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId,
        refundStatus,
        refundedAmount: newRefundedAmount,
        isFullRefund,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    console.error("Refund processing error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
