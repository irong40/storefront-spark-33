import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://www.impressivejb.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InventoryCount {
  catalog_object_id: string;
  location_id: string;
  quantity: string;
  state: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Square credentials from DB (with env var fallback)
    const { token: squareAccessToken, locationId: squareLocationId } = await getSquareToken(supabase);

    if (!squareAccessToken) {
      throw new Error('No Square access token available');
    }

    // Check for scheduled job secret (for cron calls)
    const cronHeader = req.headers.get('X-Cron-Secret');
    const isScheduledCall = cronSecret && cronHeader === cronSecret;

    // Verify authorization (unless it's a scheduled call)
    if (!isScheduledCall) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          console.error('Auth error:', authError);
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Starting Square inventory sync... (scheduled: ${isScheduledCall})`);


    // Get all products with Square variation IDs
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, square_variation_id, name')
      .not('square_variation_id', 'is', null);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No products with Square IDs found. Run catalog sync first.',
          updated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${products.length} products with Square variation IDs`);

    // Get catalog object IDs for inventory query
    const catalogObjectIds = products
      .map(p => p.square_variation_id)
      .filter(Boolean);

    // Batch inventory counts (Square API accepts up to 100 IDs)
    const batchSize = 100;
    const allCounts: InventoryCount[] = [];

    for (let i = 0; i < catalogObjectIds.length; i += batchSize) {
      const batch = catalogObjectIds.slice(i, i + batchSize);

      const inventoryResponse = await fetch(
        'https://connect.squareup.com/v2/inventory/counts/batch-retrieve',
        {
          method: 'POST',
          headers: {
            'Square-Version': '2024-01-18',
            'Authorization': `Bearer ${squareAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            catalog_object_ids: batch,
            location_ids: [squareLocationId],
            states: ['IN_STOCK'],
          }),
        }
      );

      if (!inventoryResponse.ok) {
        const errorText = await inventoryResponse.text();
        console.error('Square Inventory API error:', errorText);
        throw new Error(`Square Inventory API error: ${inventoryResponse.status}`);
      }

      const inventoryData = await inventoryResponse.json();
      if (inventoryData.counts) {
        allCounts.push(...inventoryData.counts);
      }
    }

    console.log(`Fetched ${allCounts.length} inventory counts from Square`);

    // Create a map of variation ID to quantity
    const inventoryMap = new Map<string, number>();
    allCounts.forEach(count => {
      const qty = parseInt(count.quantity, 10) || 0;
      inventoryMap.set(count.catalog_object_id, qty);
    });

    // Update products
    let updated = 0;
    const errors: string[] = [];

    for (const product of products) {
      const quantity = inventoryMap.get(product.square_variation_id!) || 0;
      const isAvailable = quantity > 0;

      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: quantity,
          is_available: isAvailable,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (error) {
        errors.push(`Failed to update ${product.name}: ${error.message}`);
      } else {
        updated++;
      }
    }

    console.log(`Inventory sync completed. Updated ${updated} products.`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Inventory sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
