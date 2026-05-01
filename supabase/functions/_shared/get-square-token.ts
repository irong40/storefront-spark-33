import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getSquareToken(
  supabase: SupabaseClient
): Promise<{ token: string; locationId: string; isSandbox: boolean }> {
  const { data, error } = await supabase
    .from("square_merchant_tokens")
    .select("access_token, location_id, is_sandbox")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.warn("Failed to fetch Square token from DB:", error.message);
  }

  // Fallback to env var for backward compatibility
  return {
    token: data?.access_token || Deno.env.get("SQUARE_ACCESS_TOKEN") || "",
    locationId: data?.location_id || Deno.env.get("SQUARE_LOCATION_ID") || "",
    isSandbox: data?.is_sandbox ?? false,
  };
}
