import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://www.impressivejb.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const squareAppId = Deno.env.get("SQUARE_APP_ID")!;
    const squareAppSecret = Deno.env.get("SQUARE_APP_SECRET")!;

    // Only cron callers (shared secret), service-role callers, or admins may trigger a token refresh
    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCronCall =
      !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    const authHeader = req.headers.get("Authorization");
    if (!isCronCall && !authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader?.replace("Bearer ", "") ?? "";
    const isServiceRole = token === supabaseServiceKey;

    if (!isCronCall && !isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Get active token
    const { data: tokenRow, error: fetchError } = await supabase
      .from("square_merchant_tokens")
      .select("*")
      .eq("is_active", true)
      .single();

    if (fetchError || !tokenRow) {
      console.error("No active token found:", fetchError);
      return new Response(
        JSON.stringify({ error: "No active Square token found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token expires within 7 days
    const expiresAt = new Date(tokenRow.expires_at);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (expiresAt > sevenDaysFromNow) {
      return new Response(
        JSON.stringify({
          refreshed: false,
          message: "Token is still valid",
          expires_at: tokenRow.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Token expiring soon, refreshing...");

    const isSandbox: boolean = tokenRow.is_sandbox ?? false;
    const baseUrl = isSandbox
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com";

    // Call Square OAuth refresh endpoint
    const refreshResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        client_id: squareAppId,
        client_secret: squareAppSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok || !refreshData.access_token) {
      console.error("Square refresh failed:", refreshData);
      return new Response(
        JSON.stringify({ error: "Failed to refresh token", details: refreshData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // New token expires in 30 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    // Update the token row
    const { error: updateError } = await supabase
      .from("square_merchant_tokens")
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || tokenRow.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tokenRow.id);

    if (updateError) {
      console.error("Failed to update token in DB:", updateError);
      return new Response(
        JSON.stringify({ error: "Token refreshed but failed to store" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Token refreshed successfully for merchant:", tokenRow.merchant_id);

    return new Response(
      JSON.stringify({
        refreshed: true,
        merchant_id: tokenRow.merchant_id,
        expires_at: newExpiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
