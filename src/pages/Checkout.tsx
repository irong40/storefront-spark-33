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
import { Loader2, ShoppingBag, MapPin, Truck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SquarePaymentForm, PaymentResult } from '@/components/checkout/SquarePaymentForm';

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  
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

  const tax = subtotal * 0.08; // 8% tax
  const shipping = fulfillmentType === 'delivery' ? 5.99 : 0;
  const total = subtotal + tax + shipping;
  const totalInCents = Math.round(total * 100);

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

  const createOrder = async (payment: PaymentResult) => {
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
      // Generate order number
      const orderNumber = `IMP-${Date.now().toString(36).toUpperCase()}`;
      
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
          total: total,
          notes: formData.notes || null,
          payment_id: payment.paymentId,
          payment_status: 'completed',
          shipping_address: fulfillmentType === 'delivery' ? {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          } : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
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
          total,
          fulfillmentType,
          paymentStatus: 'completed',
        },
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to send order confirmation email:', error);
        } else {
          console.log('Order confirmation email sent successfully');
        }
      });

      // Clear cart
      await clearCart();

      // Navigate to confirmation
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: 'Error',
        description: 'Payment was successful but order creation failed. Please contact support with your payment ID: ' + payment.paymentId,
        variant: 'destructive',
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
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === 'pickup' 
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
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === 'delivery' 
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

            {/* Payment Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              
              {!isFormValid() ? (
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
                </div>
              ) : (
                <SquarePaymentForm
                  amountInCents={totalInCents}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={isSubmitting}
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
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
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
