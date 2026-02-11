import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSquareToken } from "../_shared/get-square-token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SquareCatalogItem {
  id: string;
  type: string;
  updated_at: string;
  item_data?: {
    name: string;
    description?: string;
    category_id?: string;
    variations?: Array<{
      id: string;
      item_variation_data: {
        name: string;
        sku?: string;
        price_money?: {
          amount: number;
          currency: string;
        };
      };
    }>;
    image_ids?: string[];
  };
  category_data?: {
    name: string;
  };
  image_data?: {
    url: string;
  };
}

interface SyncResult {
  categories: { created: number; updated: number; removed: number };
  products: { created: number; updated: number; removed: number };
  errors: string[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Square credentials from DB (with env var fallback)
    const { token: squareAccessToken, locationId: squareLocationId } = await getSquareToken(supabase);

    if (!squareAccessToken) {
      throw new Error('No Square access token available');
    }

    // Verify admin authorization
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
    }

    console.log('Starting Square catalog sync...');
    
    const result: SyncResult = {
      categories: { created: 0, updated: 0, removed: 0 },
      products: { created: 0, updated: 0, removed: 0 },
      errors: [],
    };

    // Fetch all catalog objects from Square
    const catalogResponse = await fetch(
      'https://connect.squareup.com/v2/catalog/list?types=ITEM,CATEGORY,IMAGE',
      {
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${squareAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!catalogResponse.ok) {
      const errorText = await catalogResponse.text();
      console.error('Square API error:', errorText);
      throw new Error(`Square API error: ${catalogResponse.status} - ${errorText}`);
    }

    const catalogData = await catalogResponse.json();
    const objects: SquareCatalogItem[] = catalogData.objects || [];
    
    console.log(`Fetched ${objects.length} catalog objects from Square`);

    // Separate by type
    const categories = objects.filter(o => o.type === 'CATEGORY');
    const items = objects.filter(o => o.type === 'ITEM');
    const images = objects.filter(o => o.type === 'IMAGE');

    // Create image lookup map
    const imageMap = new Map<string, string>();
    images.forEach(img => {
      if (img.image_data?.url) {
        imageMap.set(img.id, img.image_data.url);
      }
    });

    console.log(`Found ${categories.length} categories, ${items.length} items, ${images.length} images`);

    // Get existing categories from database
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, square_category_id, slug');

    const existingCategoryMap = new Map(
      existingCategories?.map(c => [c.square_category_id, c]) || []
    );

    // Sync categories
    const syncedCategoryIds = new Set<string>();
    const categoryIdMap = new Map<string, string>(); // Square ID -> DB ID

    for (const cat of categories) {
      const categoryName = cat.category_data?.name || 'Unnamed Category';
      const slug = generateSlug(categoryName);
      
      syncedCategoryIds.add(cat.id);
      
      const existing = existingCategoryMap.get(cat.id);
      
      if (existing) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryName,
            updated_at: new Date().toISOString(),
          })
          .eq('square_category_id', cat.id);

        if (error) {
          result.errors.push(`Failed to update category ${categoryName}: ${error.message}`);
        } else {
          result.categories.updated++;
          categoryIdMap.set(cat.id, existing.id);
        }
      } else {
        // Create new category
        const { data: newCat, error } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            slug: slug,
            square_category_id: cat.id,
            active: true,
          })
          .select('id')
          .single();

        if (error) {
          result.errors.push(`Failed to create category ${categoryName}: ${error.message}`);
        } else {
          result.categories.created++;
          categoryIdMap.set(cat.id, newCat.id);
        }
      }
    }

    // Deactivate categories no longer in Square
    for (const [squareId, existing] of existingCategoryMap) {
      if (squareId && !syncedCategoryIds.has(squareId)) {
        await supabase
          .from('categories')
          .update({ active: false })
          .eq('square_category_id', squareId);
        result.categories.removed++;
      }
    }

    // Get existing products from database
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, square_catalog_id, slug');

    const existingProductMap = new Map(
      existingProducts?.map(p => [p.square_catalog_id, p]) || []
    );

    // Sync products
    const syncedProductIds = new Set<string>();

    for (const item of items) {
      const itemData = item.item_data;
      if (!itemData) continue;

      syncedProductIds.add(item.id);

      // Get first variation for pricing
      const variation = itemData.variations?.[0];
      const variationData = variation?.item_variation_data;
      
      // Convert cents to dollars
      const priceInCents = variationData?.price_money?.amount || 0;
      const price = priceInCents / 100;

      // Get image URL
      const imageId = itemData.image_ids?.[0];
      const imageUrl = imageId ? imageMap.get(imageId) : null;

      // Get category ID
      const squareCategoryId = itemData.category_id;
      const categoryId = squareCategoryId ? categoryIdMap.get(squareCategoryId) : null;

      const productName = itemData.name || 'Unnamed Product';
      const slug = generateSlug(productName);

      const existing = existingProductMap.get(item.id);

      const productData = {
        name: productName,
        description: itemData.description || null,
        price: price,
        sku: variationData?.sku || null,
        square_variation_id: variation?.id || null,
        category_id: categoryId,
        image_url: imageUrl,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('square_catalog_id', item.id);

        if (error) {
          result.errors.push(`Failed to update product ${productName}: ${error.message}`);
        } else {
          result.products.updated++;
        }
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            slug: slug,
            square_catalog_id: item.id,
            active: true,
            is_available: true,
          });

        if (error) {
          result.errors.push(`Failed to create product ${productName}: ${error.message}`);
        } else {
          result.products.created++;
        }
      }
    }

    // Deactivate products no longer in Square
    for (const [squareId, existing] of existingProductMap) {
      if (squareId && !syncedProductIds.has(squareId)) {
        await supabase
          .from('products')
          .update({ active: false, is_available: false })
          .eq('square_catalog_id', squareId);
        result.products.removed++;
      }
    }

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
