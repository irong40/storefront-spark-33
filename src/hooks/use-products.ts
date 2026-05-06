import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ProductVariant {
  id: string;
  size_name: string;
  size_oz: number | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  sort_order: number;
  image_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  ingredients: string | null;
  nutrition_info: Json | null;
  sku: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_available: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants?: ProductVariant[];
}

export interface UseProductsOptions {
  page?: number;
  pageSize?: number;
}

export interface UseProductsResult {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useProducts(
  categorySlug?: string,
  options: UseProductsOptions = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const isPaginated = options.page !== undefined || options.pageSize !== undefined;

  return useQuery({
    queryKey: ["products", categorySlug, page, pageSize],
    queryFn: async () => {
      let baseQuery = supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug)
        `,
          { count: "exact" },
        )
        .eq("active", true)
        .eq("is_available", true)
        .order("sort_order", { foreignTable: "categories", ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      // Apply server-side category filter when not doing client-side filtering
      // and when a specific (non-"all") slug is provided.
      if (categorySlug && categorySlug !== "all") {
        // Client-side filter applied after fetch (existing behaviour preserved)
      }

      // Apply range only when explicit pagination options are passed so that
      // existing consumers that rely on fetching all products are unaffected.
      if (isPaginated) {
        baseQuery = baseQuery.range(from, to);
      }

      const { data, error, count } = await baseQuery;

      if (error) throw error;

      let filteredData = data || [];
      if (categorySlug && categorySlug !== "all") {
        filteredData = filteredData.filter(
          (product) =>
            (product.category as { slug: string } | null)?.slug ===
            categorySlug,
        );
      }

      // Add empty variants array (variants loaded separately in useProduct())
      const productsWithVariants = filteredData.map((product) => ({
        ...product,
        variants: [] as ProductVariant[],
      })) as Product[];

      const totalCount = count ?? productsWithVariants.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      return {
        products: productsWithVariants,
        totalCount,
        page,
        pageSize,
        totalPages,
      } satisfies UseProductsResult;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug)
        `,
        )
        .eq("slug", slug)
        .eq("active", true)
        .single();

      if (error) throw error;

      // Fetch product size overrides (variants) for this product
      const { data: overrides, error: overridesError } = await supabase
        .from("product_size_overrides")
        .select("*")
        .eq("product_id", data.id)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (overridesError) throw overridesError;

      // Map overrides to variant format
      const variants: ProductVariant[] = (overrides || []).map((o) => ({
        id: o.id,
        size_name: o.size_name,
        size_oz: o.size_oz,
        price: Number(o.price),
        is_subscription: o.is_subscription,
        subscription_interval: o.subscription_interval,
        sort_order: o.sort_order,
        image_url: (o as { image_url?: string | null }).image_url ?? null,
      }));

      return {
        ...data,
        variants,
      } as Product;
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug)
        `,
        )
        .eq("active", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (error) throw error;

      // Add empty variants array
      return (data || []).map((p) => ({
        ...p,
        variants: [] as ProductVariant[],
      })) as Product[];
    },
  });
}

// Re-export addon types from use-product-variants for backward compatibility
export { useProductAddons as useAddons } from "./use-product-variants";
export type { ProductAddon } from "./use-product-variants";
