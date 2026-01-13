import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ProductVariant {
  id: string;
  size_name: string;
  size_oz: number | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  sort_order: number;
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

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('active', true)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      let filteredData = data || [];
      if (categorySlug && categorySlug !== 'all') {
        filteredData = filteredData.filter(
          (product) => (product.category as { slug: string } | null)?.slug === categorySlug
        );
      }

      // Add empty variants array (table doesn't exist yet)
      const productsWithVariants = filteredData.map(product => ({
        ...product,
        variants: [] as ProductVariant[],
      }));

      return productsWithVariants as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (error) throw error;

      // Add empty variants array (table doesn't exist yet)
      return {
        ...data,
        variants: [] as ProductVariant[],
      } as Product;
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(4);

      if (error) throw error;
      
      // Add empty variants array
      return (data || []).map(p => ({
        ...p,
        variants: [] as ProductVariant[],
      })) as Product[];
    },
  });
}

// Re-export addon types from use-product-variants for backward compatibility
export { useProductAddons as useAddons } from './use-product-variants';
export type { ProductAddon } from './use-product-variants';
