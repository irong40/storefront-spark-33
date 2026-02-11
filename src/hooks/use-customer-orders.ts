import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  status: string | null;
  total: number;
  subtotal: number;
  created_at: string | null;
  order_items: CustomerOrderItem[];
}

export function useCustomerOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          total,
          subtotal,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            product_price,
            quantity,
            total
          )
        `,
        )
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerOrder[];
    },
    enabled: !!user,
  });
}
