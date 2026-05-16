import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { CHECKOUT_CONFIG } from "@/config/checkout";
import { generateOrderNumber } from "@/lib/utils";

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

export interface UseOrdersResult {
  orders: OrderWithItems[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useOrders(
  showArchived: boolean = false,
  limit: number = 100,
  page: number = 1,
  pageSize: number = 50,
) {
  // When a legacy `limit` value other than 100 is passed and no explicit page
  // params are provided the hook honours the old limit-based behaviour for
  // backward compatibility.  When page/pageSize are used the `limit` param is
  // ignored in favour of the range calculation.
  const effectivePageSize = limit !== 100 ? limit : pageSize;
  const from = (page - 1) * effectivePageSize;
  const to = page * effectivePageSize - 1;

  return useQuery({
    queryKey: ["admin-orders", showArchived, page, effectivePageSize],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (showArchived) {
        query = query.or(
          "status.eq.archived_weekly,status.eq.archived_monthly,status.eq.archived_quarterly,status.eq.archived_yearly",
        );
      } else {
        query = query.not(
          "status",
          "in",
          "(archived_weekly,archived_monthly,archived_quarterly,archived_yearly)",
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize));

      return {
        orders: (data ?? []) as OrderWithItems[],
        totalCount,
        page,
        pageSize: effectivePageSize,
        totalPages,
      } satisfies UseOrdersResult;
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

export function useRefundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
      reason,
    }: {
      orderId: string;
      amount?: number;
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("refund-payment", {
        body: { orderId, amount, reason },
      });

      if (error) {
        // Edge function returns JSON error in response body; surface it
        const fnError = (data as { error?: string } | null)?.error;
        throw new Error(fnError || error.message || "Refund failed");
      }
      if ((data as { error?: string } | null)?.error) {
        throw new Error((data as { error: string }).error);
      }

      return data as {
        success: boolean;
        refundId?: string;
        refundStatus?: string;
        refundedAmount: number;
        isFullRefund: boolean;
        warning?: string;
      };
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
      const orderNumber = generateOrderNumber();

      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.product_price * item.quantity,
        0,
      );
      const tax = subtotal * CHECKOUT_CONFIG.TAX_RATE;
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
