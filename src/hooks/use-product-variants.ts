import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useProductSizes() {
    return useQuery({
        queryKey: ['product-sizes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_sizes')
                .select('*')
                .eq('active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data as ProductSize[];
        },
    });
}

export function useProductAddons() {
    return useQuery({
        queryKey: ['product-addons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_addons')
                .select('*')
                .eq('active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data as ProductAddon[];
        },
    });
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

export function useProductSizeOverrides(productId: string) {
    return useQuery({
        queryKey: ['product-size-overrides', productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_size_overrides')
                .select('*')
                .eq('product_id', productId)
                .eq('active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data as ProductSizeOverride[];
        },
        enabled: !!productId,
    });
}
