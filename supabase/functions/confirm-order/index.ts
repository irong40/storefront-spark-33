import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function htmlPage(title: string, heading: string, body: string, color: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px;width:90%;">
    <div style="width:72px;height:72px;background:${color};border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:36px;color:#fff;">&#10003;</span>
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">${heading}</h1>
    <p style="margin:0;color:#6b7280;line-height:1.6;">${body}</p>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      htmlPage("Invalid Link", "Invalid Link", "This confirmation link is missing a token.", "#ef4444"),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, owner_acknowledged_at")
    .eq("id", token)
    .single();

  if (error || !order) {
    return new Response(
      htmlPage("Not Found", "Order Not Found", "This confirmation link is invalid or has expired.", "#ef4444"),
      { status: 404, headers: { "Content-Type": "text/html" } },
    );
  }

  if (order.owner_acknowledged_at) {
    return new Response(
      htmlPage(
        "Already Confirmed",
        "Already Confirmed",
        `Order <strong>${order.order_number}</strong> was already confirmed. You're all set!`,
        "#3b82f6",
      ),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ owner_acknowledged_at: new Date().toISOString() })
    .eq("id", token);

  if (updateError) {
    return new Response(
      htmlPage("Error", "Something Went Wrong", "Could not confirm the order. Please check the admin dashboard.", "#ef4444"),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }

  return new Response(
    htmlPage(
      "Order Confirmed",
      "Order Confirmed!",
      `Order <strong>${order.order_number}</strong> has been acknowledged. Start preparing — the customer is on their way!`,
      "#16a34a",
    ),
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
};

serve(handler);
