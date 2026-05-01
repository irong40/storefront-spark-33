import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";

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

async function verifySquareSignature(
  signatureKey: string,
  webhookUrl: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signatureKey);
  const msgData = encoder.encode(webhookUrl + rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return expected === signatureHeader;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read raw body BEFORE parsing — needed for signature verification.
    const rawBody = await req.text();

    // Verify Square HMAC-SHA256 signature.
    // Set SQUARE_WEBHOOK_SIGNATURE_KEY in Supabase secrets (from Square Developer Dashboard).
    const signatureKey = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');
    const signatureHeader = req.headers.get('x-square-hmacsha256-signature');

    if (signatureKey) {
      if (!signatureHeader) {
        console.error('Webhook rejected: missing x-square-hmacsha256-signature header');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const webhookUrl = req.url;
      const valid = await verifySquareSignature(signatureKey, webhookUrl, rawBody, signatureHeader);

      if (!valid) {
        console.error('Webhook rejected: signature mismatch');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } else {
      console.warn('SQUARE_WEBHOOK_SIGNATURE_KEY not set — skipping signature verification');
    }

    const payload: SquareWebhookEvent = JSON.parse(rawBody);

    console.log('Received Square webhook:', payload.type, payload.event_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Square credentials from DB (with env var fallback)
    const { locationId: squareLocationId } = await getSquareToken(supabase);

    // Handle different event types
    switch (payload.type) {
      case 'catalog.version.updated': {
        console.log('Catalog updated, triggering sync...');

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
        console.log('Inventory count updated:', payload.data.id);

        const inventoryData = payload.data.object as {
          catalog_object_id?: string;
          location_id?: string;
          quantity?: string;
        };

        if (inventoryData?.catalog_object_id && inventoryData.location_id === squareLocationId) {
          const quantity = parseInt(inventoryData.quantity || '0', 10);

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
