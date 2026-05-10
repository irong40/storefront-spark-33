// Cron-triggered batch sender. Finds active gift cards whose delivery_date
// has arrived but that have not been delivered, and dispatches send-gift-card
// for each. Idempotent — send-gift-card refuses to re-send a delivered card.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (_req: Request): Promise<Response> => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: due, error } = await supabase
      .from("gift_cards")
      .select("id, code, delivery_date")
      .eq("delivered", false)
      .eq("status", "active")
      .lte("delivery_date", new Date().toISOString().slice(0, 10));

    if (error) throw error;

    const dueRows = due ?? [];
    console.log(`process-gift-card-deliveries: ${dueRows.length} gift cards due`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const results = await Promise.allSettled(
      dueRows.map(async (gc) => {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-gift-card`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRole}`,
          },
          body: JSON.stringify({ giftCardId: gc.id }),
        });
        const json = await resp.json();
        if (!resp.ok) {
          throw new Error(`${gc.code}: ${JSON.stringify(json)}`);
        }
        return { code: gc.code, ok: true };
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => String(r.reason));

    return new Response(
      JSON.stringify({ success: true, due: dueRows.length, succeeded, failed, errors }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("process-gift-card-deliveries error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
