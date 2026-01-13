// Product variant hooks - stubbed until database tables are created
// TODO: Create product_sizes, product_addons, product_size_overrides tables

import { useQuery } from '@tanstack/react-query';

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

// Stub hooks - return empty data until tables exist

export function useProductSizes() {
  return useQuery({
    queryKey: ['product-sizes'],
    queryFn: async (): Promise<ProductSize[]> => {
      // TODO: Implement when product_sizes table exists
      return [];
    },
  });
}

export function useProductAddons() {
  return useQuery({
    queryKey: ['product-addons'],
    queryFn: async (): Promise<ProductAddon[]> => {
      // TODO: Implement when product_addons table exists
      return [];
    },
  });
}

export function useProductSizeOverrides(productId: string) {
  return useQuery({
    queryKey: ['product-size-overrides', productId],
    queryFn: async (): Promise<ProductSizeOverride[]> => {
      // TODO: Implement when product_size_overrides table exists
      return [];
    },
    enabled: !!productId,
  });
}
