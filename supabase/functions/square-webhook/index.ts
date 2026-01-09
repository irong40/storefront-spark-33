import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object?: Record<string, unknown>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')!;
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID')!;

    // Parse the webhook payload
    const payload: SquareWebhookEvent = await req.json();
    
    console.log('Received Square webhook:', payload.type, payload.event_id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (payload.type) {
      case 'catalog.version.updated': {
        // Catalog was updated - trigger a full catalog sync
        console.log('Catalog updated, triggering sync...');
        
        // Call the sync-square-catalog function
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/sync-square-catalog`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!syncResponse.ok) {
          console.error('Failed to trigger catalog sync:', await syncResponse.text());
        } else {
          console.log('Catalog sync triggered successfully');
        }
        break;
      }

      case 'inventory.count.updated': {
        // Single inventory item updated
        console.log('Inventory count updated:', payload.data.id);
        
        const inventoryData = payload.data.object as {
          catalog_object_id?: string;
          location_id?: string;
          quantity?: string;
        };

        if (inventoryData?.catalog_object_id && inventoryData.location_id === squareLocationId) {
          const quantity = parseInt(inventoryData.quantity || '0', 10);
          
          // Update the product directly
          const { error } = await supabase
            .from('products')
            .update({
              stock_quantity: quantity,
              is_available: quantity > 0,
              last_synced_at: new Date().toISOString(),
            })
            .eq('square_variation_id', inventoryData.catalog_object_id);

          if (error) {
            console.error('Failed to update product inventory:', error);
          } else {
            console.log(`Updated inventory for variation ${inventoryData.catalog_object_id} to ${quantity}`);
          }
        }
        break;
      }

      case 'catalog.item.created':
      case 'catalog.item.updated':
      case 'catalog.item.deleted': {
        // Individual item change - trigger catalog sync for simplicity
        console.log(`Catalog item ${payload.type}, triggering sync...`);
        
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/sync-square-catalog`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!syncResponse.ok) {
          console.error('Failed to trigger catalog sync:', await syncResponse.text());
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Always return 200 to prevent Square from retrying
    return new Response(
      JSON.stringify({ received: true, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
