import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Package, Mail, ArrowRight, Sparkles } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuth } from "@/contexts/AuthContext";
import { useLoyaltyTransactions } from "@/hooks/use-loyalty";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  email: string;
  customer_name: string | null;
  status: string | null;
  subtotal: number | null;
  tax: number | null;
  shipping: number | null;
  total: number | null;
  fulfillment_type: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  delivery_time_window: string | null;
  created_at: string | null;
  payment_id: string | null;
  payment_status: string | null;
}

export default function OrderConfirmation() {
  useDocumentTitle("Order Confirmation");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: loyaltyTransactions = [] } = useLoyaltyTransactions(50);
  const pointsEarned = user
    ? loyaltyTransactions
        .filter((t) => t.order_id === id && t.type === "earn")
        .reduce((sum, t) => sum + t.points, 0)
    : 0;

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (!orderError && orderData) {
        setOrder(orderData);

        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", id);

        if (itemsData) {
          setItems(itemsData);
        }
      }

      setIsLoading(false);
    }

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-12 max-w-2xl mx-auto">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto mb-8" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this order. Please check your order number.
          </p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-12 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Thank You!
          </h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully.
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-secondary/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-semibold">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{order.status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Confirmation sent to {order.email}</span>
          </div>
        </div>

        {pointsEarned > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">You earned {pointsEarned} points!</p>
              <p className="text-sm text-muted-foreground">
                Keep stacking them. Free juice unlocks at 100 points.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/rewards">View rewards</Link>
            </Button>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </h2>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × $
                    {Number(item.product_price).toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">${Number(item.total).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {Number(order.shipping) === 0
                  ? "Free"
                  : `$${Number(order.shipping).toFixed(2)}`}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        {order.payment_status && (
          <div className="bg-primary/10 rounded-2xl p-6 mb-8 border border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              💳 Payment{" "}
              {order.payment_status === "completed"
                ? "Successful"
                : order.payment_status}
            </h3>
            {order.payment_id && (
              <p className="text-muted-foreground text-sm">
                Payment ID: {order.payment_id}
              </p>
            )}
          </div>
        )}

        {/* Fulfillment Info */}
        <div className="bg-secondary/50 rounded-2xl p-6 mb-8 border border-border">
          <h3 className="font-semibold mb-2">
            {order.fulfillment_type === "pickup" ? "📍 Pickup" : "🚚 Delivery"}
          </h3>
          {order.fulfillment_type === "pickup" &&
          order.pickup_date &&
          order.pickup_time ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(order.pickup_date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{order.pickup_time}</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">
                Please pick up your order at the scheduled time.
              </p>
            </div>
          ) : order.fulfillment_type === "delivery" && order.delivery_time_window ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Preferred window:</span>
                <span className="font-medium">{order.delivery_time_window}</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">
                We'll notify you when your order is on the way.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {order.fulfillment_type === "pickup"
                ? "We'll notify you when your order is ready for pickup at our store."
                : "We'll notify you when your order is on the way."}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link to="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/account/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
