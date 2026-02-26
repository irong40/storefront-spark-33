import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ProductSize {
  id: string;
  name: string;
  size_oz: number | null;
  price: number;
  sort_order: number;
  active: boolean;
}

export interface ProductAddon {
  id: string;
  name: string;
  display_name: string;
  price: number;
  sort_order: number;
  active: boolean;
}

export interface ProductSizeOverride {
  id: string;
  product_id: string;
  size_name: string;
  size_oz: number | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  sort_order: number;
  active: boolean;
}

export function useProductSizes() {
  return useQuery({
    queryKey: ["product-sizes"],
    queryFn: async (): Promise<ProductSize[]> => {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        logger.error("Error fetching product sizes:", error);
        return [];
      }

      return data as ProductSize[];
    },
  });
}

export function useProductAddons() {
  return useQuery({
    queryKey: ["product-addons"],
    queryFn: async (): Promise<ProductAddon[]> => {
      const { data, error } = await supabase
        .from("product_addons")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        logger.error("Error fetching product addons:", error);
        return [];
      }

      return data as ProductAddon[];
    },
  });
}

export function useProductSizeOverrides(productId: string) {
  return useQuery({
    queryKey: ["product-size-overrides", productId],
    queryFn: async (): Promise<ProductSizeOverride[]> => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("product_size_overrides")
        .select("*")
        .eq("product_id", productId)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        logger.error("Error fetching product size overrides:", error);
        return [];
      }

      return data as ProductSizeOverride[];
    },
    enabled: !!productId,
  });
}

// Helper to get effective sizes for a product (overrides or global)
export function useEffectiveProductSizes(productId: string) {
  const { data: globalSizes, isLoading: globalLoading } = useProductSizes();
  const { data: overrides, isLoading: overridesLoading } =
    useProductSizeOverrides(productId);

  const effectiveSizes =
    overrides && overrides.length > 0
      ? overrides.map((o) => ({
          id: o.id,
          name: o.size_name,
          size_oz: o.size_oz,
          price: o.price,
          sort_order: o.sort_order,
          is_subscription: o.is_subscription,
          subscription_interval: o.subscription_interval,
        }))
      : globalSizes?.map((s) => ({
          id: s.id,
          name: s.name,
          size_oz: s.size_oz,
          price: s.price,
          sort_order: s.sort_order,
          is_subscription: false,
          subscription_interval: null,
        })) || [];

  return {
    sizes: effectiveSizes,
    isLoading: globalLoading || overridesLoading,
    hasOverrides: (overrides?.length || 0) > 0,
  };
}
