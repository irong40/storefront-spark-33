import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { generateOrderNumber } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/use-document-title";

// ---------------------------------------------------------------------------
// Checkout validation schema — conditional on fulfillment_type
// ---------------------------------------------------------------------------
const checkoutSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    customerName: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
    fulfillment_type: z.enum(["pickup", "delivery"]),
    // delivery fields
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    // pickup fields
    pickupDate: z.string().optional(),
    pickupTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_type === "delivery") {
      if (!data.addressLine1?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addressLine1"],
          message: "Street address is required for delivery",
        });
      }
      if (!data.city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "City is required for delivery",
        });
      }
      if (!data.state?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["state"],
          message: "State is required for delivery",
        });
      }
      if (!data.zip?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["zip"],
          message: "ZIP code is required for delivery",
        });
      } else if (!/^\d{5}(-\d{4})?$/.test(data.zip.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["zip"],
          message: "ZIP code must be 5 digits (or ZIP+4)",
        });
      }
    }

    if (data.fulfillment_type === "pickup") {
      if (!data.pickupDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pickupDate"],
          message: "Pickup date is required",
        });
      }
      if (!data.pickupTime?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pickupTime"],
          message: "Pickup time is required",
        });
      }
    }
  });

type CheckoutFormErrors = Partial<Record<string, string>>;
import {
  Loader2,
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  Gift,
  X,
  Check,
  Clock,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  SquarePaymentForm,
  PaymentResult,
} from "@/components/checkout/SquarePaymentForm";
import {
  CHECKOUT_CONFIG,
  getAvailablePickupDates,
  getAvailableTimeSlots,
} from "@/config/checkout";
import { useGiftCard } from "@/hooks/use-gift-card";

interface AppliedGiftCard {
  code: string;
  amountApplied: number;
  balance: number;
}

export default function Checkout() {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, clearCart, isLoading: cartLoading } = useCart();
  const { user, profile } = useAuth();
  const {
    checkBalance,
    redeemGiftCard,
    isLoading: giftCardLoading,
  } = useGiftCard();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCards, setAppliedGiftCards] = useState<AppliedGiftCard[]>(
    [],
  );
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    customerName: profile?.full_name || "",
    notes: "",
    // Shipping address
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    // Pickup scheduling
    pickupDate: "",
    pickupTime: "",
  });

  // Get available pickup dates and time slots
  const availablePickupDates = useMemo(() => getAvailablePickupDates(), []);
  const availableTimeSlots = useMemo(
    () =>
      formData.pickupDate ? getAvailableTimeSlots(formData.pickupDate) : [],
    [formData.pickupDate],
  );

  // Calculate totals with gift card discount
  const giftCardDiscount = appliedGiftCards.reduce(
    (sum, gc) => sum + gc.amountApplied,
    0,
  );
  const tax = subtotal * CHECKOUT_CONFIG.TAX_RATE;
  const shipping =
    fulfillmentType === "delivery" ? CHECKOUT_CONFIG.DELIVERY_FEE : 0;
  const totalBeforeGiftCard = subtotal + tax + shipping;
  const total = Math.max(0, totalBeforeGiftCard - giftCardDiscount);
  const totalInCents = Math.round(total * 100);

  // Apply gift card handler
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;

    setGiftCardError(null);

    // Check if already applied
    if (
      appliedGiftCards.some(
        (gc) => gc.code.toUpperCase() === giftCardCode.toUpperCase(),
      )
    ) {
      setGiftCardError("This gift card has already been applied");
      return;
    }

    const result = await checkBalance(giftCardCode.trim());

    if (!result) {
      setGiftCardError("Gift card not found or expired");
      return;
    }

    if (result.status !== "active") {
      setGiftCardError("This gift card is no longer active");
      return;
    }

    if (result.balance <= 0) {
      setGiftCardError("This gift card has no remaining balance");
      return;
    }

    // Calculate how much to apply (remaining total after other gift cards)
    const remainingTotal =
      totalBeforeGiftCard -
      appliedGiftCards.reduce((sum, gc) => sum + gc.amountApplied, 0);
    const amountToApply = Math.min(result.balance, remainingTotal);

    if (amountToApply <= 0) {
      setGiftCardError("Order is already fully covered by other gift cards");
      return;
    }

    setAppliedGiftCards((prev) => [
      ...prev,
      {
        code: result.code,
        amountApplied: amountToApply,
        balance: result.balance,
      },
    ]);

    setGiftCardCode("");
    toast({
      title: "Gift Card Applied",
      description: `$${amountToApply.toFixed(2)} will be deducted from your order.`,
    });
  };

  const removeGiftCard = (code: string) => {
    setAppliedGiftCards((prev) => prev.filter((gc) => gc.code !== code));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Reset time when date changes
      if (name === "pickupDate") {
        newData.pickupTime = "";
      }
      return newData;
    });
  };

  const validateForm = (): boolean => {
    const result = checkoutSchema.safeParse({
      ...formData,
      fulfillment_type: fulfillmentType,
    });

    if (!result.success) {
      const fieldErrors: CheckoutFormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const isFormValid = () => {
    // Lightweight synchronous check used to gate the payment UI —
    // full error messages are surfaced via validateForm() on submission.
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (fulfillmentType === "pickup") {
      if (!formData.pickupDate || !formData.pickupTime) return false;
    }
    if (fulfillmentType === "delivery") {
      if (
        !formData.addressLine1 ||
        !formData.city ||
        !formData.state ||
        !formData.zip
      ) {
        return false;
      }
    }
    return true;
  };

  const handlePaymentSuccess = async (result: PaymentResult) => {
    if (!validateForm()) return;
    setPaymentResult(result);
    setPaymentComplete(true);

    // Now create the order with payment info
    await createOrder(result);
  };

  const handlePaymentError = (message: string) => {
    toast({
      title: "Payment Failed",
      description: message,
      variant: "destructive",
    });
  };

  // Handle zero-dollar orders (fully covered by gift cards)
  const handleZeroPaymentOrder = async () => {
    if (!validateForm()) return;
    await createOrder({
      paymentId: `GC-${Date.now()}`, // Gift card payment reference
      status: "COMPLETED",
      cardDetails: undefined,
    });
  };

  // Compute the effective unit price for a cart item, matching CartContext subtotal logic
  const getItemEffectiveUnitPrice = (item: (typeof items)[number]): number => {
    const basePrice = item.size_override?.price ?? item.size?.price ?? item.product.price;
    const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
    return basePrice + addonTotal;
  };

  const createOrder = async (payment: PaymentResult) => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number (also handled by database trigger as fallback)
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          email: formData.email,
          phone: formData.phone || null,
          customer_name: formData.customerName || null,
          fulfillment_type: fulfillmentType,
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          total: total,
          notes: formData.notes || null,
          payment_id: payment.paymentId,
          payment_status: "completed",
          pickup_date:
            fulfillmentType === "pickup" ? formData.pickupDate : null,
          pickup_time:
            fulfillmentType === "pickup" ? formData.pickupTime : null,
          shipping_address:
            fulfillmentType === "delivery"
              ? {
                  line1: formData.addressLine1,
                  line2: formData.addressLine2,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip,
                }
              : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with effective prices (respects size overrides + addons)
      const orderItems = items.map((item) => {
        const effectivePrice = getItemEffectiveUnitPrice(item);
        return {
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product.name,
          product_price: effectivePrice,
          quantity: item.quantity,
          total: effectivePrice * item.quantity,
        };
      });

      // Insert order items with single retry on failure (Fix 19)
      let itemsError: Error | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase
          .from("order_items")
          .insert(orderItems);
        if (!error) {
          itemsError = null;
          break;
        }
        itemsError = error;
        if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
      }
      if (itemsError) throw itemsError;

      // Redeem applied gift cards (non-fatal — order already created)
      for (const gc of appliedGiftCards) {
        try {
          await redeemGiftCard(gc.code, gc.amountApplied, order.id);
        } catch (gcErr) {
          logger.error("Gift card redemption failed (non-fatal):", gcErr);
        }
      }

      // Send order confirmation email (non-blocking)
      supabase.functions
        .invoke("send-order-confirmation", {
          body: {
            email: formData.email,
            customerName: formData.customerName || undefined,
            orderNumber: order.order_number,
            items: orderItems.map((item) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              product_price: item.product_price,
              total: item.total,
            })),
            subtotal,
            tax,
            shipping,
            giftCardDiscount,
            total,
            fulfillmentType,
            pickupDate: formData.pickupDate || undefined,
            pickupTime: formData.pickupTime || undefined,
            paymentStatus: "completed",
          },
        })
        .then(({ error }) => {
          if (error) {
            logger.error("Failed to send order confirmation email:", error);
          }
        });

      // Clear cart
      await clearCart();

      // Navigate to confirmation
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      logger.error("Order creation error:", error);
      toast({
        title: "Error",
        description:
          "Payment was successful but order creation failed. Please contact support with your payment ID: " +
          payment.paymentId,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleChange(e);
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    required
                    disabled={isSubmitting || paymentComplete}
                    aria-invalid={!!formErrors.email}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      disabled={isSubmitting || paymentComplete}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting || paymentComplete}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment Type */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Fulfillment</h2>
              <RadioGroup
                value={fulfillmentType}
                onValueChange={(v) => setFulfillmentType(v as "pickup" | "delivery")}
                className="grid sm:grid-cols-2 gap-4"
                disabled={isSubmitting || paymentComplete}
              >
                <Label
                  htmlFor="pickup"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === "pickup"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isSubmitting || paymentComplete ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-xs text-muted-foreground">
                        Free • Tue-Fri 10-6, Sat 10-5
                      </div>
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="delivery"
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === "delivery"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isSubmitting || paymentComplete ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-xs text-muted-foreground">
                        Free • Mon-Fri
                      </div>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Pickup Scheduling */}
            {fulfillmentType === "pickup" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pickup Details
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupDate">Pickup Date *</Label>
                    <Select
                      value={formData.pickupDate}
                      onValueChange={(value) => {
                        handleSelectChange("pickupDate", value);
                        if (formErrors.pickupDate) setFormErrors((prev) => ({ ...prev, pickupDate: undefined }));
                      }}
                      disabled={isSubmitting || paymentComplete}
                    >
                      <SelectTrigger id="pickupDate" aria-invalid={!!formErrors.pickupDate}>
                        <SelectValue placeholder="Select a date" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePickupDates.map((date) => (
                          <SelectItem key={date.value} value={date.value}>
                            {date.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.pickupDate && (
                      <p className="text-sm text-destructive">{formErrors.pickupDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupTime">Pickup Time *</Label>
                    <Select
                      value={formData.pickupTime}
                      onValueChange={(value) => {
                        handleSelectChange("pickupTime", value);
                        if (formErrors.pickupTime) setFormErrors((prev) => ({ ...prev, pickupTime: undefined }));
                      }}
                      disabled={
                        isSubmitting || paymentComplete || !formData.pickupDate
                      }
                    >
                      <SelectTrigger id="pickupTime" aria-invalid={!!formErrors.pickupTime}>
                        <SelectValue
                          placeholder={
                            formData.pickupDate
                              ? "Select a time"
                              : "Select a date first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.pickupTime && (
                      <p className="text-sm text-destructive">{formErrors.pickupTime}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {fulfillmentType === "delivery" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

                {/* Delivery Info Banner */}
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-4">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Free delivery Monday through Friday
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Delivery times vary based on your location. We'll notify
                      you when your order is on the way.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address *</Label>
                    <Input
                      id="addressLine1"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => {
                        handleChange(e);
                        if (formErrors.addressLine1) setFormErrors((prev) => ({ ...prev, addressLine1: undefined }));
                      }}
                      required
                      disabled={isSubmitting || paymentComplete}
                      placeholder="Street address"
                      aria-invalid={!!formErrors.addressLine1}
                    />
                    {formErrors.addressLine1 && (
                      <p className="text-sm text-destructive">{formErrors.addressLine1}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Apt, Suite, etc.</Label>
                    <Input
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      disabled={isSubmitting || paymentComplete}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={(e) => {
                          handleChange(e);
                          if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: undefined }));
                        }}
                        required
                        disabled={isSubmitting || paymentComplete}
                        aria-invalid={!!formErrors.city}
                      />
                      {formErrors.city && (
                        <p className="text-sm text-destructive">{formErrors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                          handleChange(e);
                          if (formErrors.state) setFormErrors((prev) => ({ ...prev, state: undefined }));
                        }}
                        required
                        disabled={isSubmitting || paymentComplete}
                        aria-invalid={!!formErrors.state}
                      />
                      {formErrors.state && (
                        <p className="text-sm text-destructive">{formErrors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP *</Label>
                      <Input
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={(e) => {
                          handleChange(e);
                          if (formErrors.zip) setFormErrors((prev) => ({ ...prev, zip: undefined }));
                        }}
                        required
                        disabled={isSubmitting || paymentComplete}
                        aria-invalid={!!formErrors.zip}
                      />
                      {formErrors.zip && (
                        <p className="text-sm text-destructive">{formErrors.zip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Order Notes</h2>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting || paymentComplete}
                placeholder="Special instructions or requests..."
                rows={3}
              />
            </div>

            {/* Payment Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>

              {!isFormValid() ? (
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-muted-foreground text-sm">
                    {fulfillmentType === "pickup" &&
                    (!formData.pickupDate || !formData.pickupTime)
                      ? "Please select a pickup date and time to proceed with payment."
                      : "Please fill in the required fields above to proceed with payment."}
                  </p>
                </div>
              ) : paymentComplete ? (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {total === 0 ? "Order Placed" : "Payment Successful"}
                  </div>
                  {paymentResult?.cardDetails && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {paymentResult.cardDetails.brand} ending in{" "}
                      {paymentResult.cardDetails.last4}
                    </p>
                  )}
                  {total === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Fully paid with gift card
                    </p>
                  )}
                </div>
              ) : total === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-olive/10 border border-brand-olive/20 rounded-xl">
                    <div className="flex items-center gap-2 text-brand-olive font-medium">
                      <Gift className="h-5 w-5" />
                      No payment required
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your order is fully covered by gift card(s).
                    </p>
                  </div>
                  <Button
                    onClick={handleZeroPaymentOrder}
                    disabled={isSubmitting || cartLoading}
                    className="w-full bg-brand-berry hover:bg-brand-berry/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </div>
              ) : (
                <SquarePaymentForm
                  amountInCents={totalInCents}
                  sessionId={localStorage.getItem("cart_session_id") || ""}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={isSubmitting || cartLoading}
                />
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-secondary/30 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">🍹</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(getItemEffectiveUnitPrice(item) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Gift Card Section */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-brand-olive" />
                  Gift Card
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter gift card code"
                    value={giftCardCode}
                    onChange={(e) => {
                      setGiftCardCode(e.target.value.toUpperCase());
                      setGiftCardError(null);
                    }}
                    disabled={
                      isSubmitting || paymentComplete || giftCardLoading
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyGiftCard}
                    disabled={
                      !giftCardCode.trim() ||
                      isSubmitting ||
                      paymentComplete ||
                      giftCardLoading
                    }
                    className="shrink-0"
                  >
                    {giftCardLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sr-only">Applying gift card…</span>
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                {giftCardError && (
                  <p className="text-sm text-destructive mt-1">
                    {giftCardError}
                  </p>
                )}

                {/* Applied Gift Cards */}
                {appliedGiftCards.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Balance confirmed at submission</p>
                    {appliedGiftCards.map((gc) => (
                      <div
                        key={gc.code}
                        className="flex items-center justify-between p-2 bg-brand-olive/10 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-brand-olive" />
                          <span className="font-mono">{gc.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-olive font-medium">
                            -${gc.amountApplied.toFixed(2)}
                          </span>
                          {!paymentComplete && (
                            <button
                              type="button"
                              onClick={() => removeGiftCard(gc.code)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove gift card"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({(CHECKOUT_CONFIG.TAX_RATE * 100).toFixed(0)}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                {giftCardDiscount > 0 && (
                  <div className="flex justify-between text-brand-olive">
                    <span>Gift Card</span>
                    <span>-${giftCardDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {isSubmitting && (
                <div
                  className="flex items-center justify-center gap-2 text-primary py-4"
                  role="status"
                >
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Creating your order...</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-4">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
