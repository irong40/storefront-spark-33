import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export type ArchiveType =
  | "archived_weekly"
  | "archived_monthly"
  | "archived_quarterly"
  | "archived_yearly";

export function useOrders(showArchived: boolean = false) {
  return useQuery({
    queryKey: ["admin-orders", showArchived],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (showArchived) {
        // Show only archived orders
        query = query.or(
          "status.eq.archived_weekly,status.eq.archived_monthly,status.eq.archived_quarterly,status.eq.archived_yearly",
        );
      } else {
        // Show non-archived orders
        query = query.not(
          "status",
          "in",
          "(archived_weekly,archived_monthly,archived_quarterly,archived_yearly)",
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useArchiveOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderIds,
      archiveType,
    }: {
      orderIds: string[];
      archiveType: ArchiveType;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: archiveType, updated_at: new Date().toISOString() })
        .in("id", orderIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useUnarchiveOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds }: { orderIds: string[] }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .in("id", orderIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      customer_name: string;
      email: string;
      phone?: string;
      notes?: string;
      fulfillment_type: string;
      pickup_date?: string;
      pickup_time?: string;
      items: {
        product_id: string;
        product_name: string;
        product_price: number;
        quantity: number;
      }[];
    }) => {
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.product_price * item.quantity,
        0,
      );
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: orderData.customer_name,
          email: orderData.email,
          phone: orderData.phone,
          notes: orderData.notes,
          fulfillment_type: orderData.fulfillment_type,
          pickup_date: orderData.pickup_date,
          pickup_time: orderData.pickup_time,
          subtotal,
          tax,
          total,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        total: item.product_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}
