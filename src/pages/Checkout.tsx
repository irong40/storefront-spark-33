import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingBag, MapPin, Truck, CreditCard, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SquarePaymentForm, PaymentResult } from '@/components/checkout/SquarePaymentForm';
import { CHECKOUT_CONFIG } from '@/config/checkout';

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const hasSubscription = items.some(item =>
    item.size_override?.is_subscription || false
    // Add product level check if schema supported it, but relying on size_override for now
  );

  // Promo Code State (Gift Cards + Loyalty Rewards)
  const [promoCode, setPromoCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; amount: number } | null>(null);
  const [appliedReward, setAppliedReward] = useState<{
    redemptionId: string;
    code: string;
    rewardType: string;
    rewardValue: number;
    rewardName: string;
    minOrderAmount: number;
  } | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const [formData, setFormData] = useState({
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    customerName: profile?.full_name || '',
    notes: '',
    // Shipping address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  const tax = subtotal * CHECKOUT_CONFIG.TAX_RATE;
  const shipping = fulfillmentType === 'delivery' ? CHECKOUT_CONFIG.DELIVERY_FEE : 0;
  const orderTotal = subtotal + tax + shipping;

  // Calculate discounts
  const giftCardAmountToUse = appliedGiftCard
    ? Math.min(appliedGiftCard.amount, orderTotal)
    : 0;

  const loyaltyDiscountAmount = appliedReward ? (() => {
    if (appliedReward.rewardType === 'discount_fixed') {
      return Math.min(appliedReward.rewardValue, orderTotal);
    } else if (appliedReward.rewardType === 'discount_percent') {
      return (orderTotal * appliedReward.rewardValue) / 100;
    } else if (appliedReward.rewardType === 'free_shipping') {
      return shipping;
    } else if (appliedReward.rewardType === 'free_shipping') {
      return shipping;
    } else if (appliedReward.rewardType === 'referral_discount') {
      return Math.min(appliedReward.rewardValue, orderTotal);
    }
    return 0;
  })() : 0;

  // Final amount to charge to card
  const finalTotal = Math.max(0, orderTotal - giftCardAmountToUse - loyaltyDiscountAmount);
  const totalInCents = Math.round(finalTotal * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isFormValid = () => {
    if (!formData.email) return false;
    if (fulfillmentType === 'delivery') {
      if (!formData.addressLine1 || !formData.city || !formData.state || !formData.zip) {
        return false;
      }
    }
    return true;
  };

  const checkPromoCode = async () => {
    if (!promoCode) return;
    setIsCheckingCode(true);
    try {
      // First try gift card
      const { data: giftCardData, error: giftCardError } = await supabase.rpc('check_gift_card_balance', {
        code_input: promoCode.trim()
      });

      if (!giftCardError && giftCardData !== null) {
        if (giftCardData <= 0) {
          toast({
            title: 'Zero Balance',
            description: 'This gift card has no remaining balance.',
            variant: 'destructive',
          });
        } else {
          setAppliedGiftCard({
            code: promoCode.trim(),
            amount: giftCardData
          });
          toast({
            title: 'Gift Card Applied!',
            description: `Balance: $${giftCardData.toFixed(2)}`,
          });
        }
        return;
      }

      // If not gift card, try loyalty reward
      const { data: rewardData, error: rewardError } = await supabase.rpc('check_loyalty_code', {
        code_input: promoCode.trim()
      });

      if (rewardError) throw rewardError;

      return;
    }

      // If validation passed but not valid reward, try referral
      if (!rewardData.valid) {
      // Try checking referral code
      const { data: refData, error: refError } = await supabase.rpc('check_referral_code', {
        code_input: promoCode.trim()
      });

      if (refError || !refData.valid) {
        toast({
          title: 'Invalid Code',
          description: refData?.message || rewardData.message || 'Code not found.',
          variant: 'destructive',
        });
        return;
      }

      // Valid Referral Code
      setAppliedReward({
        redemptionId: '', // No redemption ID for referrals
        code: promoCode.trim(),
        rewardType: 'referral_discount',
        rewardValue: refData.discount_amount,
        rewardName: 'Ref Check Discount',
        minOrderAmount: 0
      });

      toast({
        title: 'Referral Applied!',
        description: `$${refData.discount_amount} off your first order!`,
      });
      return;
    }

    // Check minimum order requirement
    if (rewardData.min_order_amount && orderTotal < rewardData.min_order_amount) {
      toast({
        title: 'Minimum Not Met',
        description: `This reward requires a minimum order of $${rewardData.min_order_amount}`,
        variant: 'destructive',
      });
      return;
    }

    setAppliedReward({
      redemptionId: rewardData.redemption_id,
      code: promoCode.trim(),
      rewardType: rewardData.reward_type,
      rewardValue: rewardData.reward_value,
      rewardName: rewardData.reward_name,
      minOrderAmount: rewardData.min_order_amount
    });

    toast({
      title: 'Reward Applied!',
      description: `${rewardData.reward_name} has been added to your order`,
    });

  } catch (error) {
    console.error('Error checking promo code:', error);
    toast({
      title: 'Error',
      description: 'Failed to validate code.',
      variant: 'destructive',
    });
  } finally {
    setIsCheckingCode(false);
  }
};

const removePromoCode = () => {
  setAppliedGiftCard(null);
  setAppliedReward(null);
  setPromoCode('');
};

const handlePaymentSuccess = async (result: PaymentResult) => {
  setPaymentResult(result);
  setPaymentComplete(true);

  // Now create the order with payment info
  await createOrder(result);
};

const handlePaymentError = (message: string) => {
  toast({
    title: 'Payment Failed',
    description: message,
    variant: 'destructive',
  });
};

const createOrder = async (payment: PaymentResult | null) => {
  if (items.length === 0) {
    toast({
      title: 'Cart is empty',
      description: 'Please add items to your cart before checking out.',
      variant: 'destructive',
    });
    return;
  }

  setIsSubmitting(true);

  try {
    // 1. If we have a gift card applied, try to redeem it first
    let redeemedAmount = 0;
    if (appliedGiftCard) {
      // Redundant check on amount, but ensuring we don't try to take more than needed
      const amountToDeduct = Math.min(appliedGiftCard.amount, orderTotal);

      const { data: redemptionResult, error: redemptionError } = await supabase.rpc('redeem_gift_card', {
        code_input: appliedGiftCard.code,
        amount_to_deduct: amountToDeduct
      });

      if (redemptionError || !redemptionResult?.success) {
        throw new Error(redemptionResult?.message || 'Failed to redeem gift card');
      }

      redeemedAmount = amountToDeduct;
    }

    // Generate order number (also handled by database trigger as fallback)
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
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
        total: orderTotal,
        notes: formData.notes || null,
        payment_id: payment?.paymentId || null,
        payment_status: 'completed',
        gift_card_code: appliedGiftCard?.code || null,
        gift_card_amount: redeemedAmount,
        loyalty_redemption_id: appliedReward?.redemptionId || null,
        loyalty_discount_amount: loyaltyDiscountAmount,
        shipping_address: fulfillmentType === 'delivery' ? {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        } : null,
        referral_code_used: appliedReward?.rewardType === 'referral_discount' ? appliedReward.code : null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 1b. If we have a subscription, create it now!
    if (hasSubscription && payment?.cardId && payment?.customerId) {
      // Filter subscription items
      const subscriptionItems = items.filter(item => item.size_override?.is_subscription);

      for (const item of subscriptionItems) {
        // Call create_subscription for each
        const { error: subError } = await supabase.functions.invoke('square-subscription-manager', {
          body: {
            action: 'create_subscription',
            customerId: payment.customerId,
            sourceId: payment.cardId,
            planData: {
              name: item.product.name, // Or variant name
              amount: Math.round(Number(item.size_override?.price || item.product.price) * 100),
              interval: item.size_override?.subscription_interval || 'WEEKLY'
            }
          }
        });

        if (subError) console.error('Failed to create subscription for item:', item.product.name, subError);
      }
    } else if (hasSubscription && !payment?.cardId) {
      // This is a gift card covered order with subscription?
      // We still need a card on file for future renewals!
      // This edge case (Total=0 but hasSubscription) requires "authorize" flow which creates cardId.
      // Updated logic ensures SquarePaymentForm runs if hasSubscription, so we should have cardId.
    } else if (payment?.cardId && finalTotal > 0) {
      // MIXED CART OR SUBSCRIPTION FLOW WHERE WE CHARGE NOW
      // If we came from "Save Card" flow, we haven't charged the one-time amount yet!
      // We must charge the cardId now using process-payment
      // UNLESS SquarePaymentForm already charged it?
      // My implementation of SquarePaymentForm: 
      // If mode=subscription -> IT SAVES CARD ONLY. IT DOES NOT CHARGE.
      // So we MUST charge here if finalTotal > 0.

      const { data: chargeData, error: chargeError } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: payment.cardId,
          amount: totalInCents,
          customerId: payment.customerId
        }
      });

      if (chargeError || chargeData?.error) {
        throw new Error(chargeData?.error || chargeError?.message || 'Failed to charge saved card');
      }

      // Update order with actual payment ID
      await supabase.from('orders').update({ payment_id: chargeData.payment.id }).eq('id', order.id);
    }

    // 2. Mark loyalty redemption as used
    if (appliedReward) {
      const { error: rewardUseError } = await supabase.rpc('use_loyalty_redemption', {
        redemption_id_input: appliedReward.redemptionId,
        order_id_input: order.id
      });

      if (rewardUseError) {
        console.error('Failed to mark reward as used:', rewardUseError);
        // Don't fail the order, just log it
      }
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
      gift_card_data: item.gift_card_data
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Send order confirmation email (non-blocking)
    supabase.functions.invoke('send-order-confirmation', {
      body: {
        email: formData.email,
        customerName: formData.customerName || undefined,
        orderNumber: order.order_number,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          product_price: item.product_price,
          total: item.total,
        })),
        subtotal,
        tax,
        shipping,
        total: orderTotal,
        fulfillmentType,
        paymentStatus: 'completed',
        giftCardUsed: redeemedAmount > 0 ? redeemedAmount : undefined,
      },
    }).then(({ error }) => {
      if (error) {
        console.error('Failed to send order confirmation email:', error);
      }
    });

    // Check for Gift Cards and send delivery emails (non-blocking)
    const hasGiftCards = items.some(item => item.product.slug === 'egift-card');
    if (hasGiftCards) {
      supabase.functions.invoke('send-gift-card', {
        body: { orderId: order.id }
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to trigger gift card emails:', error);
        }
      });
    }

    // Clear cart
    await clearCart();

    // Navigate to confirmation
    navigate(`/order-confirmation/${order.id}`);
  } catch (error: any) {
    console.error('Order creation error:', error);
    toast({
      title: 'Error processing order',
      description: error.message || 'Payment handled but order creation failed. Please contact support.',
      variant: 'destructive',
    });
    // In a real app, if payment succeeded but order failed, we'd trigger an alert system
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
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || paymentComplete}
                />
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
              onValueChange={setFulfillmentType}
              className="grid sm:grid-cols-2 gap-4"
              disabled={isSubmitting || paymentComplete}
            >
              <Label
                htmlFor="pickup"
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${fulfillmentType === 'pickup'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  } ${(isSubmitting || paymentComplete) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RadioGroupItem value="pickup" id="pickup" />
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Pickup</div>
                    <div className="text-sm text-muted-foreground">Free</div>
                  </div>
                </div>
              </Label>
              <Label
                htmlFor="delivery"
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${fulfillmentType === 'delivery'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  } ${(isSubmitting || paymentComplete) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RadioGroupItem value="delivery" id="delivery" />
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Delivery</div>
                    <div className="text-sm text-muted-foreground">$5.99</div>
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Shipping Address */}
          {fulfillmentType === 'delivery' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address *</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting || paymentComplete}
                    placeholder="Street address"
                  />
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
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || paymentComplete}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || paymentComplete}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP *</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || paymentComplete}
                    />
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

          {/* Promo Code (Gift Cards & Loyalty Rewards) */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Promo Code
            </h2>

            {!appliedGiftCard && !appliedReward ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter gift card or reward code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={isCheckingCode || isSubmitting || paymentComplete}
                />
                <Button
                  variant="outline"
                  onClick={checkPromoCode}
                  disabled={!promoCode || isCheckingCode || isSubmitting || paymentComplete}
                >
                  {isCheckingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-primary flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    {appliedGiftCard ? 'Gift Card Applied' : 'Reward Applied'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {appliedGiftCard && (
                      `Code ending in ${appliedGiftCard.code.slice(-4)} • Balance: $${appliedGiftCard.amount.toFixed(2)}`
                    )}
                    {appliedReward && (
                      `${appliedReward.rewardName} • Saves $${loyaltyDiscountAmount.toFixed(2)}`
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={removePromoCode} disabled={isSubmitting || paymentComplete}>
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </h2>

            {hasSubscription && !user ? (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-muted-foreground mb-4">
                  Please sign in to purchase subscriptions.
                </p>
                <Button asChild>
                  <Link to="/auth?redirect=/checkout">Sign In / Create Account</Link>
                </Button>
              </div>
            ) : !isFormValid() ? (
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-muted-foreground text-sm">
                  Please fill in the required fields above to proceed with payment.
                </p>
              </div>
            ) : paymentComplete ? (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Payment Successful
                </div>
                {paymentResult?.cardDetails && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentResult.cardDetails.brand} ending in {paymentResult.cardDetails.last4}
                  </p>
                )}
                {appliedGiftCard && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Gift Card applied: ${giftCardAmountToUse.toFixed(2)}
                  </p>
                )}
              </div>
            ) : (finalTotal === 0 && !hasSubscription) ? (
              <Button
                className="w-full h-12 text-lg"
                onClick={() => createOrder(null)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  'Place Order (Covered by Gift Card)'
                )}
              </Button>
            ) : (
              <SquarePaymentForm
                amountInCents={totalInCents}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={isSubmitting}
                mode={hasSubscription ? 'subscription' : 'payment'}
                customerEmail={formData.email}
                userId={user?.id}
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
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>

              {giftCardAmountToUse > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Gift Card</span>
                  <span>-${giftCardAmountToUse.toFixed(2)}</span>
                </div>
              )}

              {loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Loyalty Reward</span>
                  <span>-${loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-lg font-semibold mb-6">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-primary py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
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
